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
      v-if="
        selectedBoxStyle.height !== '0px' && selectedBoxStyle.width !== '0px'
      "
      :style="{ ...selectedBoxStyle, transition: selectedBoxTransition }"
    ></div>
    <div
      class="edit-box table-cell-item"
      v-if="
        tableData && startCell.startRow !== null && startCell.startCol !== null
      "
      :style="{
        ...editBoxStyle,
        fontSize: cellItem.fontSize + 'px',
      }"
      :start-col="startCell.startCol"
      :end-col="startCell.endCol"
      :start-row="startCell.startRow"
      :end-row="startCell.endRow"
      @dblclick="handleDoubleClick"
    >
      <div
        class="cell-data"
        v-if="!isInputVisible"
        :style="{
          lineHeight: cellItem.fontSize + 'px',
        }"
      >
        {{ cellItem.value }}
      </div>
      <input
        v-else
        class="edit-box-input"
        ref="inputRef"
        v-model="inputValue"
        @input="debouncedInputHandler(inputValue)"
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
const inputValue = ref("");
// 新增状态，用于控制输入框的显示
const isInputVisible = ref<boolean>(false);

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
const { selectedBoxStyle, editBoxStyle, selectedBoxTransition, cellItem } =
  useTbodyComputed(
    startCell,
    endCell,
    columnConfig,
    rowConfig,
    defaultRowWidth,
    selecting,
    tableData
  );

//溢出框选定时器
let scrollOverInterval: number | null = null;

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
  isInputVisible.value = false;
  //避免从非单元格的元素进行点击
  selecting.value = true;
  const cell = getCellFromMouseEvent(event);
  startCell.value = { ...cell };
  endCell.value = { ...cell };
  console.log(startCell.value);
  isShowSelectionBox.value = true;
  isShowEditBox.value = true;
  inputValue.value = cellItem.value.value;
  // 设置定时器
  if (scrollOverInterval === null) {
    scrollOverInterval = window.setInterval(() => scrollOverData(event), 250);
  }

  nextTick(() => {
    setTimeout(() => {
      if (inputRef.value) {
        inputRef.value.focus();
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
    endCell.value = { ...cell };
    isShowSelectionBox.value = true;
    isShowEditBox.value = true;
  }
  // 更新用于打印超出数据的事件对象
  if (scrollOverInterval !== null) {
    clearInterval(scrollOverInterval);
    scrollOverInterval = window.setInterval(() => scrollOverData(event), 20);
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
  // 如果点击的不是 .table-cell-item 元素，向上遍历 DOM 树直到找到 .table-cell-item 元素
  while (target && !target.classList.contains("table-cell-item")) {
    target = target.parentElement as HTMLElement;
  }
  //未点击单元格的情况
  if (!target) {
    return {
      startRow: endCell.value.startRow,
      startCol: endCell.value.startCol,
      endRow: endCell.value.endRow,
      endCol: endCell.value.endCol,
    }; // 如果没有找到.table-cell-item元素，则返回默认值
  }
  const isTableCell = target.classList.contains("table-cell-item");

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

  const overTop = calculateOverDistance(
    event.clientY,
    scrollbarRect.top,
    defaultColHeight?.value
  );
  const overLeft = calculateOverDistance(
    event.clientX,
    scrollbarRect.left,
    defaultRowWidth?.value
  );
  const overBottom = Math.max(event.clientY - scrollbarRect.bottom, 0);
  const overRight = Math.max(event.clientX - scrollbarRect.right, 0);

  if (overRight > 0) {
    handleScroll(
      "horizontalScroll",
      overRight,
      false,
      "endCol",
      renderColConfig!
    );
  } else if (overLeft > 0) {
    handleScroll(
      "horizontalScroll",
      overLeft,
      true,
      "startCol",
      renderColConfig!
    );
  } else if (overBottom > 0) {
    handleScroll(
      "verticalScroll",
      overBottom,
      false,
      "endRow",
      renderRowConfig!
    );
  } else if (overTop > 0) {
    handleScroll("verticalScroll", overTop, true, "startRow", renderRowConfig!);
  } else {
    stopScroll();
  }
}

function handleScroll(
  scrollDirection: string,
  overDistance: number,
  isLeftOrTop: boolean,
  attribute: string,
  renderConfig: RenderConfig
) {
  handleAutoScroll(
    overDistance,
    isLeftOrTop,
    scrollDirection,
    renderConfig!,
    attribute
  );
}

function calculateOverDistance(
  mousePosition: number,
  edgePosition: number,
  offset: number | undefined
): number {
  return mousePosition < edgePosition + (offset || 0)
    ? edgePosition + (offset || 0) - mousePosition
    : 0;
}

//执行自动滚动
const handleAutoScroll = (
  overDistance: number,
  isLeftOrTop: boolean = false,
  scrollDirection: string = "horizontalScroll",
  renderConfig: RenderConfig,
  attributes: string
) => {
  initSpeed.value = calculateScrollSpeed(overDistance, isLeftOrTop);
  scrollDirection === "horizontalScroll"
    ? startHorizontalScroll()
    : startVerticalScroll();
  //会随着鼠标的偏移距离逐渐提速
  let addNum = Math.ceil(overDistance / 10);
  (endCell.value[attributes as keyof typeof endCell.value] as number) =
    !isLeftOrTop
      ? renderConfig.endIndex + addNum
      : Math.max(renderConfig.startIndex - addNum, 0);
};

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

// 添加一个新的方法来处理键盘按下事件
const handleKeyPress = (event: KeyboardEvent) => {
  // 判断是否有单元格被框选且编辑框可见
  if (isShowSelectionBox.value && isShowEditBox.value) {
    // 检查按下的是否是 Enter 键
    if (event.key === "Enter") {
      // 显示输入框并聚焦
      isInputVisible.value = true;
      nextTick(() => {
        inputRef.value?.focus();
      });
    }
    // 检查按键是否是 Enter，输入框是否聚焦且可见
    if (
      event.key === "Enter" &&
      document.activeElement === inputRef.value &&
      isInputVisible.value
    ) {
      // 更新数据并隐藏输入框
      debouncedInputHandler(inputValue.value);
      isInputVisible.value = false;
    }
  }
};

const handleDoubleClick = () => {
  isInputVisible.value = true;
  nextTick(() => {
    inputRef.value?.focus();
  });
};

//生命周期钩子函数
onMounted(() => {
  window.addEventListener("mousedown", startSelection);
  window.addEventListener("mousemove", updateSelectionThrottled);
  window.addEventListener("mouseup", endSelection);
  window.addEventListener("keydown", handleKeyPress);
});
onBeforeUnmount(() => {
  window.removeEventListener("mousedown", startSelection);
  window.removeEventListener("mousemove", updateSelectionThrottled);
  window.removeEventListener("mouseup", endSelection);
  window.removeEventListener("keydown", handleKeyPress);
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
    z-index: 2;
    background-color: #fff;
    box-sizing: border-box;
    border: 2px solid #1266ec;
    .cell-data {
      overflow: hidden;
      width: 100%;
      height: 100%;
    }
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
  }
}
.hidden-input {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: -1;
  opacity: 0; /* 隐藏输入框 */
}
</style>
