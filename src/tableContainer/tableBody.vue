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
  watch,
  defineEmits,
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
import { debounce, isMac } from "../utils/sheetUtils";
import useTbodyComputed from "./hooks/useTbodyComputed";
const renderRowArr = inject<RowConfig[] | null>("renderRowArr"); //渲染行数组
const totalRenderWidth = inject<number>("totalRenderWidth"); //总渲染宽
const placeholderTopHeight = inject<number>("placeholderTopHeight"); //向上占位容器高
const totalColWidth = inject<Ref<number>>("totalColWidth"); //总列宽
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
const currentTableWidth = inject<Ref<number>>("currentTableWidth");
const currentTableHeight = inject<Ref<number>>("currentTableHeight");
//更新单元格数据输入
const updateCurrentTableData = inject("updateCurrentTableData") as (
  rowIndex: number,
  colIndex: number,
  attribute: string,
  value: string | boolean | number | null
) => void;
//用户行为堆栈记录
const captureUserAction = inject("captureUserAction") as (
  actionType: string,
  details: any
) => void;

const undoAction = inject("undoAction") as () => void;
const redoAction = inject("redoAction") as () => void;

const tableData = inject<Ref<TableCell[][]>>("tableData");
const selecting = ref<boolean>(false); //框选中
const isShowSelectionBox = ref<boolean>(false); //是否显示选择框
const isShowEditBox = ref<boolean>(false); //是否显示修改框
const initSpeed = ref<number>(0); //水平滚动条初始速度
const isEditing = ref<boolean>(false); //是否正在修改

const inputRef = ref<HTMLInputElement | null>(null); //表格输入框
const inputValue = ref("");
const oldValue = ref("");
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
    captureUserAction("cellEdit", {
      rowIndex,
      colIndex,
      newValue: value,
      oldValue: oldValue.value,
    });
  }
}, 100); // 300毫秒的防抖时间

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
const {
  selectedBoxStyle,
  editBoxStyle,
  selectedBoxTransition,
  cellItem,
  selectedArea,
} = useTbodyComputed(
  startCell,
  endCell,
  columnConfig,
  rowConfig,
  defaultRowWidth,
  selecting,
  tableData
);

const emit = defineEmits(["selectedAreaValue"]);

watch(
  () => selectedArea.value,
  (newVal) => {
    emit("selectedAreaValue", newVal);
  }
);

//溢出框选定时器
let scrollOverInterval: number | null = null;

//鼠标离开div.table-body
const mouseLeaveTbody = () => {
  isEditing.value = false;
};

//开始框选点击
const startSelection = (event: MouseEvent) => {
  // 考虑数据不存在的情况
  if (!tableData) {
    return;
  }
  //考虑鼠标右键的情况
  if (event.button === 2) {
    return;
  }
  let target = event.target as HTMLElement;
  //创建临时变量
  let tempTarget_col = event.target as HTMLElement;
  let tempTarget_row = event.target as HTMLElement;
  while (
    tempTarget_col &&
    !tempTarget_col.classList.contains("table-col-header-item")
  ) {
    tempTarget_col = tempTarget_col.parentElement as HTMLElement;
  }
  if (tempTarget_col && rowConfig) {
    const col = Number(tempTarget_col.getAttribute("data-col"));
    startCell.value = {
      startCol: col,
      endCol: col,
      startRow: 0,
      endRow: 0,
    };
    endCell.value = {
      startCol: col,
      startRow: 0,
      endCol: col,
      endRow: rowConfig.value.length - 1,
    };
    selecting.value = true;
    return;
  }
  //向上遍历 避免点拿错标签
  while (
    tempTarget_row &&
    !tempTarget_row.classList.contains("table-row-header-item")
  ) {
    tempTarget_row = tempTarget_row.parentElement as HTMLElement;
  }
  if (tempTarget_row && columnConfig) {
    const row = Number(tempTarget_row.getAttribute("data-row"));
    startCell.value = {
      startCol: 0,
      endCol: 0,
      startRow: row,
      endRow: row,
    };
    endCell.value = {
      startCol: 0,
      startRow: row,
      endCol: columnConfig.value.length - 1,
      endRow: row,
    };
    selecting.value = true;
    return;
  }

  //向上遍历 避免点拿错标签
  while (target && !target.classList.contains("table-cell-item")) {
    target = target.parentElement as HTMLElement;
  }
  //避免崩溃  找不到会返回null
  if (!target) {
    return;
  }

  //是否隐藏输入框
  isInputVisible.value = false;
  //避免从非单元格的元素进行点击
  selecting.value = true;
  const cell = getCellFromMouseEvent(event);
  startCell.value = { ...cell };
  endCell.value = { ...cell };

  isShowSelectionBox.value = true;
  isShowEditBox.value = true;
  inputValue.value = cellItem.value.value;
  oldValue.value = inputValue.value;
  // 设置定时器
  if (scrollOverInterval === null) {
    scrollOverInterval = window.setInterval(() => scrollOverData(event), 20);
  }
};

//更新框选信息
const updateSelection: (event: MouseEvent) => void = (event) => {
  // 检查是否是鼠标右键点击（鼠标右键的button值为2）
  if (event.button === 2) {
    return;
  }

  if (!selecting.value) return; //非开始选择 不执行
  // let target = event.target as HTMLElement;
  if (mouseMovedOutOfTable(event)) {
    calculateNewEndCellBasedOnMousePosition(event);
    // 更新用于打印超出数据的事件对象
    if (scrollOverInterval !== null) {
      clearInterval(scrollOverInterval);
      scrollOverInterval = window.setInterval(() => scrollOverData(event), 20);
    }
    return;
  }
  const cell = getCellFromMouseEvent(event);
  if (
    cell.startCol === null ||
    cell.startRow === null ||
    cell.endRow === null ||
    cell.endCol === null
  ) {
    // 更新用于打印超出数据的事件对象
    if (scrollOverInterval !== null) {
      clearInterval(scrollOverInterval);
      scrollOverInterval = window.setInterval(() => scrollOverData(event), 20);
    }
    return;
  }
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

function mouseMovedOutOfTable(event: MouseEvent): boolean {
  // 假设 scrollRef 是表格滚动容器的引用
  const scrollContainer = scrollRef?.value?.$el as HTMLElement;
  if (!scrollContainer || !defaultRowWidth || !defaultColHeight) return true; // 如果没有找到滚动容器，假设鼠标已经移出

  const rect = scrollContainer.getBoundingClientRect();
  const mouseX = event.clientX;
  const mouseY = event.clientY;

  // 检查鼠标坐标是否在滚动容器范围内
  const isMouseOutOfTable =
    mouseX < rect.left + defaultRowWidth.value ||
    mouseX > rect.right ||
    mouseY < rect.top + defaultColHeight.value ||
    mouseY > rect.bottom;

  return isMouseOutOfTable;
}

function calculateNewEndCellBasedOnMousePosition(event: MouseEvent) {
  // 获取表格滚动容器的引用
  const scrollContainer = scrollRef?.value?.$el as HTMLElement;
  if (
    !scrollContainer ||
    !currentTableWidth ||
    !currentTableHeight ||
    !defaultRowWidth ||
    !defaultColHeight ||
    !columnConfig ||
    !rowConfig
  )
    return { startRow: null, startCol: null, endRow: null, endCol: null };

  // 获取表格容器的位置和尺寸
  const rect = scrollContainer.getBoundingClientRect();
  // 鼠标位置相对于表格的位置
  const mouseX = event.clientX - rect.left - defaultRowWidth.value;
  const mouseY = event.clientY - rect.top - defaultColHeight.value;
  //鼠标在容器的上方或者下方 其中的16是下方滚动条的高度
  if (
    (mouseX > 0 && mouseY < 0) ||
    (mouseY > currentTableHeight.value - defaultColHeight.value - 16 &&
      mouseX > 0)
  ) {
    const columnIndex = getColumnIndexUnderMouse(
      mouseX,
      scrollLeft?.value || 0,
      columnConfig.value
    );
    if (columnIndex! > startCell.value.startCol!) {
      endCell.value.endCol = columnIndex;
      endCell.value.startCol = startCell.value.startCol!;
    } else {
      endCell.value.startCol = columnIndex;
      endCell.value.endCol = startCell.value.startCol!;
    }
  }

  //鼠标在容器的左方   //鼠标在容器的右方
  if (
    (mouseX < 0 && mouseY > 0) ||
    (mouseX > currentTableWidth.value - defaultRowWidth.value && mouseY > 0)
  ) {
    const rowIndex = getRowIndexUnderMouse(
      mouseY,
      scrollTop?.value || 0,
      rowConfig?.value
    );
    if (rowIndex! > startCell.value.startRow!) {
      endCell.value.endRow = rowIndex;
      endCell.value.startRow = startCell.value.startRow;
    } else {
      endCell.value.startRow = rowIndex;
      endCell.value.endRow = startCell.value.startRow;
    }
  }
}

const getColumnIndexUnderMouse = (
  mouseX: number,
  scrollLeft: number,
  columnConfigs: ColumnConfig[]
): number | null => {
  let accumulatedWidth = 0;

  for (const column of columnConfigs) {
    accumulatedWidth += column.width;

    // 当累加的列宽超过滚动距离加上鼠标的X坐标时，返回当前列的indexNum
    if (accumulatedWidth > scrollLeft + mouseX) {
      return column.indexNum;
    }
  }
  // 如果没有找到对应的列，则返回null
  return null;
};

const getRowIndexUnderMouse = (
  mouseY: number,
  scrollTop: number,
  rowConfig: RowConfig[]
): number | null => {
  let accumulatedHeight = 0;
  for (const row of rowConfig) {
    accumulatedHeight += row.height;
    if (accumulatedHeight > scrollTop + mouseY) {
      return row.indexNum;
    }
  }
  return null;
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
  let startRow, startCol, endRow, endCol;
  //合并单元格和编辑框或许是有开始和结束的行列位置 所以非data-row和data-col能标识完
  if (target) {
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

  //实际有八个方向的处理，暂只处理四个方向
  if (overRight > 0 && overTop === 0 && overLeft === 0 && overBottom === 0) {
    handleScroll(
      "horizontalScroll",
      overRight,
      false,
      "endCol",
      renderColConfig!
    );
  } else if (
    overLeft > 0 &&
    overTop === 0 &&
    overRight === 0 &&
    overBottom === 0
  ) {
    handleScroll(
      "horizontalScroll",
      overLeft,
      true,
      "startCol",
      renderColConfig!
    );
  } else if (
    overBottom > 0 &&
    overTop === 0 &&
    overRight === 0 &&
    overLeft === 0
  ) {
    handleScroll(
      "verticalScroll",
      overBottom,
      false,
      "endRow",
      renderRowConfig!
    );
  } else if (
    overTop > 0 &&
    overBottom === 0 &&
    overRight === 0 &&
    overLeft === 0
  ) {
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
  const speedIncrement = 1; // 每个单位overDistance增加的速度
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

//框选服务初始化
const initSelectedArea = () => {
  const defaultCell = {
    startRow: null,
    startCol: null,
    endRow: null,
    endCol: null,
  };
  startCell.value = { ...defaultCell };
  endCell.value = { ...defaultCell };
};

//处理键盘按下事件
const handleKeyPress = (event: KeyboardEvent) => {
  const ctrlOrCmd = isMac() ? event.metaKey : event.ctrlKey;
  if (ctrlOrCmd && (event.key === "z" || event.key === "Z")) {
    initSelectedArea();
    if (event.shiftKey) {
      tempRedoAction();
    } else {
      tempUndoAction();
    }
    event.preventDefault();
  }
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

// 撤销操作的函数
function tempUndoAction() {
  // 撤销操作的逻辑
  undoAction();
}

// 恢复操作的函数
function tempRedoAction() {
  // 恢复操作的逻辑
  redoAction();
}

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
