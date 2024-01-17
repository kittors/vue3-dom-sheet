<template>
  <div
    class="table-body"
    @mouseleave="mouseLeaveTbody"
    v-if="
      defaultRowWidth && totalColWidth && totalRowHeight && defaultColHeight
    "
    :style="{
      width: totalColWidth + defaultRowWidth + 'px',
      height: totalRowHeight + 'px',
    }"
  >
    <div
      class="scroll-size-placeholder-top"
      v-if="totalRenderWidth && placeholderTopHeight"
      :style="{
        width: totalRenderWidth + 'px',
        height: placeholderTopHeight + 'px',
      }"
    ></div>
    <TableRow
      v-for="item in renderRowArr"
      :key="item.indexNum"
      :rowItem="item"
    />
    <div
      class="normal-selected-box"
      :style="{ ...selectedBoxStyle, transition: selectedBoxTransition }"
    ></div>
    <div
      class="edit-box table-cell-item"
      v-if="tableData && startCell.startRow && startCell.startCol"
      :style="{
        ...editBoxStyle,
        fontSize:
          tableData[startCell.startRow][startCell.startCol].fontSize + 'px',
      }"
      :start-col="startCell.startCol"
      :end-col="startCell.endCol"
      :start-row="startCell.startRow"
      :end-row="startCell.endRow"
    >
      <input
        v-show="isTyping"
        class="edit-box-input"
        ref="inputRef"
        :class="{ 'no-cursor': !isTyping }"
        v-model="inputValue"
        @input="startTyping"
        @keydown="handleKeydown"
        @dblclick="handleDoubleClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  inject,
  ref,
  type Ref,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";
import TableRow from "./tableRow.vue";
import throttle from "lodash/throttle";
import { ElScrollbar } from "element-plus";
import type {
  ColumnConfig,
  RowConfig,
  RenderConfig,
  SelectedCell,
  TableCell,
} from "./type";
import { debounce } from "../utils/sheetUtils";
import useTbodyComputed from "./hooks/useTbodyComputed";
const renderRowArr = inject<RowConfig[] | null>("renderRowArr"); //渲染行数组
const totalRenderWidth = inject<number>("totalRenderWidth"); //总渲染宽
const placeholderTopHeight = inject<number>("placeholderTopHeight"); //向上占位容器高
const totalColWidth = inject<number>("totalColWidth"); //总列宽
const defaultRowWidth = inject<Ref<number>>("defaultRowWidth"); //默认行头宽
const totalRowHeight = inject<number>("totalRowHeight"); //总行高
const defaultColHeight = inject<Ref<number>>("defaultColHeight"); //默认列头高
const columnConfig = inject<Ref<ColumnConfig[]>>("columnConfig"); //列配置
const rowConfig = inject<Ref<RowConfig[]>>("rowConfig"); //行配置
const scrollRef = inject<Ref<typeof ElScrollbar | null>>("scrollRef"); //滚动条对象
const renderColConfig = inject<RenderConfig>("renderColConfig"); //渲染列配置
const renderRowConfig = inject<RenderConfig>("renderRowConfig"); //渲染行配置
const scrollLeft = inject<Ref<number>>("scrollLeft"); //滚动条向左距离
const scrollTop = inject<Ref<number>>("scrollTop"); //滚动条向上距离
const updateCurrentTableData = inject("updateCurrentTableData") as (
  rowIndex: number,
  colIndex: number,
  attribute: string,
  value: string | boolean | number | null
) => void;
const tableData = inject<Ref<TableCell[][]>>("tableData");
const selecting = ref<boolean>(false); //框选中
const isShowSelectionBox = ref<boolean>(false); //是否显示选择框
const isShowEditBox = ref<boolean>(false); //是否显示修改框
const initSpeed = ref<number>(0); //水平滚动条初始速度
const isEditing = ref<boolean>(false); //是否正在修改

const inputRef = ref<HTMLInputElement | null>(null); //表格输入框
const isTyping = ref(false); // 跟踪是否开始输入
const inputValue = ref("");

// 用户开始键入时触发
const startTyping = (event: Event) => {
  isTyping.value = true; // 用户开始键入，显示光标

  // 将事件对象转换为 InputEvent
  const inputEvent = event as InputEvent;
  const value = (inputEvent.target as HTMLInputElement).value;
  debouncedInputHandler(value);
};

const handleKeydown = (event: KeyboardEvent) => {
  // 检查是否按下的是左键或右键
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    isTyping.value = true;
  }
};

// 防抖处理的输入变化函数
const debouncedInputHandler = debounce((value: string) => {
  // 获取当前编辑的单元格行列索引
  const rowIndex = startCell.value?.startRow;
  const colIndex = startCell.value?.startCol;
  const attribute = "value"; // 这里应该是你想要更新的属性名称

  // 调用 updateCurrentTableData 函数
  if (rowIndex !== null && colIndex !== null) {
    updateCurrentTableData(rowIndex, colIndex, attribute, value);
  }
}, 300); // 300毫秒的防抖时间

//框选开始的位置
const startCell = ref<SelectedCell>({
  startRow: null,
  startCol: null,
  endRow: null,
  endCol: null,
});

//框选结束的位置
const endCell = ref<SelectedCell>({
  startRow: null,
  startCol: null,
  endRow: null,
  endCol: null,
});

//计算属性hooks
const { selectedBoxStyle, editBoxStyle, selectedBoxTransition } =
  useTbodyComputed(
    startCell,
    endCell,
    columnConfig,
    rowConfig,
    defaultRowWidth,
    selecting
  );

//溢出框选定时器
let scrollOverInterval: number | null = null;

//双击执行
const handleDoubleClick = (event: MouseEvent) => {
  // 仅在左键双击时处理
  if (event.button === 0) {
    isTyping.value = true;
  }
};

//鼠标离开div.table-body
const mouseLeaveTbody = () => {
  isEditing.value = false;
};

//开始框选点击
const startSelection = (event: MouseEvent) => {
  // 检查是否是鼠标右键点击（鼠标右键的button值为2）
  if (!tableData) {
    return;
  }
  if (event.button === 2) {
    return;
  }
  const clickedElement = event.target as HTMLElement;
  const isTableCell = clickedElement.classList.contains("table-cell-item");
  const isMergeCell = clickedElement.classList.contains("merge-cell");
  //避免从非单元格的元素进行点击
  if (!isMergeCell && !isTableCell) {
    return;
  }

  selecting.value = true;
  const cell = getCellFromMouseEvent(event);
  startCell.value = cell;
  endCell.value = cell;
  isShowSelectionBox.value = true;
  isShowEditBox.value = true;
  inputValue.value =
    tableData.value[startCell.value.startRow!][startCell.value.startCol!].value;
  // 设置定时器
  if (scrollOverInterval === null) {
    scrollOverInterval = window.setInterval(() => scrollOverData(event), 250);
  }

  nextTick(() => {
    setTimeout(() => {
      if (inputRef.value) {
        inputRef.value.focus();
        console.log(inputRef.value);
      }
    }, 80);
  });
};

//更新框选信息
const updateSelection: (event: MouseEvent) => void = (event) => {
  // 检查是否是鼠标右键点击（鼠标右键的button值为2）
  if (event.button === 2) {
    return;
  }

  if (!selecting.value) return; //非开始选择 不执行

  const cell = getCellFromMouseEvent(event);

  //检查是否是相同的单元格，相同则不重复更新数据
  if (isCellDifferent(cell as SelectedCell, endCell.value as SelectedCell)) {
    endCell.value = cell;
    isShowSelectionBox.value = true;
    isShowEditBox.value = true;
  }
  // 更新用于打印超出数据的事件对象
  if (scrollOverInterval !== null) {
    clearInterval(scrollOverInterval);
    scrollOverInterval = window.setInterval(() => scrollOverData(event), 80);
  }
};

//节流控制
const updateSelectionThrottled = throttle(updateSelection, 80);

//辅助函数 判断是否和之前的单元格是否相同  在单一单元格进行鼠标移动不收集重复数据
function isCellDifferent(cell1: SelectedCell, cell2: SelectedCell) {
  return (
    cell1.startRow !== cell2.startRow ||
    cell1.endRow !== cell2.endRow ||
    cell1.startCol !== cell2.startCol ||
    cell1.endCol !== cell2.endCol
  );
}

//结束框选
const endSelection = (event: MouseEvent) => {
  // 检查是否是鼠标右键点击（鼠标右键的button值为2）
  if (event.button === 2) {
    return;
  }
  selecting.value = false;
  // 清除定时器
  if (scrollOverInterval !== null) {
    clearInterval(scrollOverInterval);
    scrollOverInterval = null;
  }
  stopScroll();
};

//获取框选的单元格信息 用来更新框选范围
const getCellFromMouseEvent = (
  event: MouseEvent
): {
  startRow: number | null;
  startCol: number | null;
  endRow: number | null;
  endCol: number | null;
} => {
  let target = event.target as HTMLElement;
  const isTableCell = target.classList.contains("table-cell-item");
  // 如果点击的不是 .table-cell-item 元素，向上遍历 DOM 树直到找到 .table-cell-item 元素
  while (target && !isTableCell) {
    target = target.parentElement as HTMLElement;
  }

  //未点击单元格的情况
  if (!target || !isTableCell) {
    return {
      startRow: endCell.value.startRow,
      startCol: endCell.value.startCol,
      endRow: endCell.value.endRow,
      endCol: endCell.value.endCol,
    }; // 如果没有找到.table-cell-item元素，则返回默认值
  }

  let startRow, startCol, endRow, endCol;

  //合并单元格和编辑框或许是有开始和结束的行列位置 所以非data-row和data-col能标识完
  if (isTableCell) {
    startRow =
      target.getAttribute("data-row") || target.getAttribute("start-row");
    startCol =
      target.getAttribute("data-col") || target.getAttribute("start-col");
    endRow = target.getAttribute("data-row") || target.getAttribute("end-row");
    endCol = target.getAttribute("data-col") || target.getAttribute("end-col");
  }
  return {
    startRow: startRow ? parseInt(startRow, 10) : null,
    startCol: startCol ? parseInt(startCol, 10) : null,
    endRow: endRow ? parseInt(endRow, 10) : null,
    endCol: endCol ? parseInt(endCol, 10) : null,
  };
};

//溢出滚动方法
function scrollOverData(event: MouseEvent) {
  const scrollbar = scrollRef?.value?.$el as HTMLElement;
  if (!scrollbar) return;

  const scrollbarRect = scrollbar.getBoundingClientRect();
  // 上边界超出25像素，左边界超出80像素
  const overTop =
    event.clientY < scrollbarRect.top + defaultColHeight?.value!
      ? scrollbarRect.top + defaultColHeight?.value! - event.clientY
      : 0;
  const overLeft =
    event.clientX < scrollbarRect.left + defaultRowWidth?.value!
      ? scrollbarRect.left + defaultRowWidth?.value! - event.clientX
      : 0;
  const overBottom = Math.max(event.clientY - scrollbarRect.bottom, 0);
  const overRight = Math.max(event.clientX - scrollbarRect.right, 0);
  if (overRight > 0) {
    initSpeed.value = calculateScrollSpeed(overRight);
    startHorizontalScroll();
    let addNum = 2;
    if (overRight > 20) {
      // 第一个阈值
      addNum = 3;
    }
    endCell.value.endCol = (renderColConfig?.endIndex as number) + addNum;
  } else if (overLeft > 0) {
    initSpeed.value = calculateScrollSpeed(overLeft, true); // 计算向左滚动的速度
    startHorizontalScroll(); // 现在应该正确处理向左滚动
    let addNum = 2;
    if (overLeft > 20) {
      // 第一个阈值
      addNum = 3;
    }
    endCell.value.startCol = Math.max(
      (renderColConfig?.startIndex as number) - addNum,
      0
    );
  } else if (overBottom > 0) {
    initSpeed.value = calculateScrollSpeed(overBottom, false);
    startVerticalScroll();
    let addNum = 2;
    if (overBottom > 20) {
      addNum = 3;
    }
    endCell.value.endRow = (renderRowConfig?.endIndex as number) + addNum;
  } else if (overTop > 0) {
    initSpeed.value = calculateScrollSpeed(overBottom, true);
    startVerticalScroll();
    let addNum = 2;
    if (overTop > 20) {
      addNum = 3;
    }
    endCell.value.startRow = Math.max(
      (renderRowConfig?.startIndex as number) - addNum,
      0
    );
  } else {
    stopScroll();
  }
}

//滚动定时器 用于考虑非线形滚动速度
let scrollInterval: number | null = null;

// 计算滚动速度，考虑向左滚动
const calculateScrollSpeed = (
  overDistance: number,
  isLeftOrTop: boolean = false
) => {
  const baseSpeed = 20; // 基本滚动速度
  const speedIncrement = 0.8; // 每个单位overDistance增加的速度
  let speed = baseSpeed + Math.floor(overDistance * speedIncrement);

  return isLeftOrTop ? -speed : speed; // 向左滚动时返回负速度
};

// 在startHorizontalScroll中处理负速度  开始水平滚动
const startHorizontalScroll = () => {
  if (scrollInterval !== null) return;
  scrollInterval = window.setInterval(() => {
    if (scrollRef?.value) {
      const newScrollLeft = scrollLeft?.value! + initSpeed.value;
      scrollRef.value.setScrollLeft(newScrollLeft);

      // 检查是否达到滚动极限
      if (scrollLeft?.value === newScrollLeft && scrollInterval) {
        console.log("Reached scroll limit, stopping");
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
    }
  }, 80);
};

//开始垂直滚动
const startVerticalScroll = () => {
  if (scrollInterval !== null) return;
  scrollInterval = window.setInterval(() => {
    if (scrollRef?.value) {
      const newScrollTop = scrollTop?.value! + initSpeed.value;
      scrollRef.value.setScrollTop(newScrollTop);
      // 检查是否达到滚动极限
      if (scrollTop?.value === newScrollTop && scrollInterval) {
        console.log("Reached scroll limit, stopping");
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
    }
  }, 80);
};

//停止滚动
const stopScroll = () => {
  if (scrollInterval !== null) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
};

//生命周期钩子函数
onMounted(() => {
  window.addEventListener("mousedown", startSelection);
  window.addEventListener("mousemove", updateSelectionThrottled);
  window.addEventListener("mouseup", endSelection);
  window.addEventListener("dblclick", handleDoubleClick);
});
onBeforeUnmount(() => {
  window.removeEventListener("mousedown", startSelection);
  window.removeEventListener("mousemove", updateSelectionThrottled);
  window.removeEventListener("mouseup", endSelection);
  window.removeEventListener("dblclick", handleDoubleClick);
});
</script>

<style scoped lang="less">
.table-body {
  position: relative;
  .normal-selected-box {
    position: absolute;
    border: 2px solid #1266ec;
    box-sizing: border-box;
    pointer-events: none;
    z-index: 2;
    background-color: rgba(#1266ec, 0.1);
  }
  .edit-box {
    position: absolute;
    z-index: 3;
    background-color: #fff;
    box-sizing: border-box;
    border: 2px solid #1266ec;
    .edit-box-input {
      width: 100%;
      height: 100%;
      background: none; /* 移除背景 */
      border: none; /* 移除边框 */
      outline: none; /* 移除轮廓 */
      padding: 0; /* 移除内边距 */
      margin: 0; /* 移除外边距 */
      font-family: inherit; /* 继承字体样式 */
      font-size: inherit; /* 继承字体大小 */
      color: inherit; /* 继承文字颜色 */
      line-height: inherit; /* 继承行高 */
    }
    .edit-box-input.no-cursor {
      caret-color: transparent; /* 隐藏光标 */
    }
  }
}
</style>
