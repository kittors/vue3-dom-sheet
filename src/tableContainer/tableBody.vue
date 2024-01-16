<template>
  <div
    class="table-body"
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
  </div>
</template>

<script setup lang="ts">
import {
  inject,
  ref,
  reactive,
  computed,
  type Ref,
  onMounted,
  onBeforeUnmount,
} from "vue";
import TableRow from "./tableRow.vue";
import throttle from "lodash/throttle";
import { ElScrollbar } from "element-plus";
import type { ColumnConfig, RowConfig, RenderConfig } from "./type";
const renderRowArr = inject<RowConfig[] | null>("renderRowArr");
const totalRenderWidth = inject<number>("totalRenderWidth");
const placeholderTopHeight = inject<number>("placeholderTopHeight");
const totalColWidth = inject<number>("totalColWidth");
const defaultRowWidth = inject<Ref<number>>("defaultRowWidth");
const totalRowHeight = inject<number>("totalRowHeight");
const defaultColHeight = inject<Ref<number>>("defaultColHeight");
const columnConfig = inject<Ref<ColumnConfig[]>>("columnConfig");
const rowConfig = inject<Ref<RowConfig[]>>("rowConfig");
const scrollRef = inject<Ref<typeof ElScrollbar | null>>("scrollRef");
const renderColConfig = inject<RenderConfig>("renderColConfig");
const renderRowConfig = inject<RenderConfig>("renderRowConfig");
const scrollLeft = inject<Ref<number>>("scrollLeft");
const scrollTop = inject<Ref<number>>("scrollTop");
interface SelectedCell {
  startRow: number | null;
  startCol: number | null;
  endRow: number | null;
  endCol: number | null;
  position?: string;
}

const selecting = ref<boolean>(false); //框选中
const isShowSelectionBox = ref<boolean>(false); //是否显示选择框
const isShowEditBox = ref<boolean>(false); //是否显示修改框

const initSpeed = ref<number>(0); //水平滚动条初始速度

const startCell = ref<SelectedCell>({
  startRow: null,
  startCol: null,
  endRow: null,
  endCol: null,
});
const endCell = ref<SelectedCell>({
  startRow: null,
  startCol: null,
  endRow: null,
  endCol: null,
});

//开始点击的容器
const startclickedStyle = reactive<SelectedCell>({
  startRow: null,
  startCol: null,
  endRow: null,
  endCol: null,
  position: "",
});

let printInterval: number | null = null;

const startSelection = (event: MouseEvent) => {
  // 检查是否是鼠标右键点击（鼠标右键的button值为2）
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

  //非合并单元格
  if (!isMergeCell && isTableCell) {
    const cols = Number(clickedElement.getAttribute("data-col"));
    const rows = Number(clickedElement.getAttribute("data-row"));
    startclickedStyle.startCol = cols;
    startclickedStyle.endCol = cols;
    startclickedStyle.startRow = rows;
    startclickedStyle.endRow = rows;
  }

  selecting.value = true;
  const cell = getCellFromMouseEvent(event);
  startCell.value = cell;
  endCell.value = cell;
  isShowSelectionBox.value = true;
  isShowEditBox.value = true;

  // 设置定时器
  if (printInterval === null) {
    printInterval = window.setInterval(() => scrollOverData(event), 250);
  }
};

const updateSelection: (event: MouseEvent) => void = (event) => {
  // 检查是否是鼠标右键点击（鼠标右键的button值为2）
  if (event.button === 2) {
    return;
  }

  if (!selecting.value) return; //非开始选择 不执行

  const cell = getCellFromMouseEvent(event);

  if (isCellDifferent(cell as SelectedCell, endCell.value as SelectedCell)) {
    endCell.value = cell;
    isShowSelectionBox.value = true;
    isShowEditBox.value = true;
  }
  // 更新用于打印超出数据的事件对象
  if (printInterval !== null) {
    clearInterval(printInterval);
    printInterval = window.setInterval(() => scrollOverData(event), 80);
  }
};

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

const endSelection = (event: MouseEvent) => {
  // 检查是否是鼠标右键点击（鼠标右键的button值为2）
  if (event.button === 2) {
    return;
  }
  selecting.value = false;
  // 清除定时器
  if (printInterval !== null) {
    clearInterval(printInterval);
    printInterval = null;
  }
  stopScroll();
};

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
  const isMergeCell = target.classList.contains("merge-cell");
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
  if (!isMergeCell) {
    startRow = target.getAttribute("data-row");
    startCol = target.getAttribute("data-col");
    endRow = target.getAttribute("data-row");
    endCol = target.getAttribute("data-col");
  }

  return {
    startRow: startRow ? parseInt(startRow, 10) : null,
    startCol: startCol ? parseInt(startCol, 10) : null,
    endRow: endRow ? parseInt(endRow, 10) : null,
    endCol: endCol ? parseInt(endCol, 10) : null,
  };
};

const isCellValid = (cell: SelectedCell): boolean => {
  return (
    cell.startRow !== null &&
    cell.endRow !== null &&
    cell.startCol !== null &&
    cell.endCol !== null
  );
};

// 框选区域
const selectedArea = computed(() => {
  if (isCellValid(startCell.value) && isCellValid(endCell.value)) {
    // 确保startRow, endRow, startCol, endCol不为null
    const startRow = Math.min(
      startCell.value.startRow!,
      endCell.value.startRow!
    );
    const endRow = Math.max(startCell.value.endRow!, endCell.value.endRow!);
    const startCol = Math.min(
      startCell.value.startCol!,
      endCell.value.startCol!
    );
    const endCol = Math.max(startCell.value.endCol!, endCell.value.endCol!);

    return {
      startRow,
      endRow,
      startCol,
      endCol,
    };
  }
  return null;
});

const selectedBoxWidth = computed(() => {
  if (!selectedArea.value || !columnConfig?.value) {
    return 0;
  }
  return columnConfig.value
    .slice(selectedArea.value.startCol, selectedArea.value.endCol + 1)
    .reduce((total, config) => {
      return total + config.width;
    }, -1);
});
const selectedBoxHeight = computed(() => {
  if (!selectedArea.value) {
    return 0;
  }
  return rowConfig?.value
    .slice(selectedArea.value.startRow, selectedArea.value.endRow + 1)
    .reduce((total, config) => {
      return total + config.height;
    }, -1);
});

const selectedLeft = computed(() => {
  if (!selectedArea.value || !columnConfig?.value || !defaultRowWidth?.value) {
    return 0;
  }
  return columnConfig.value
    .slice(0, selectedArea.value.startCol)
    .reduce((total, config) => {
      return total + config.width;
    }, defaultRowWidth.value);
});

const selectedTop = computed(() => {
  if (!selectedArea.value || !rowConfig?.value) {
    return 0;
  }
  return rowConfig.value
    .slice(0, selectedArea.value.startRow)
    .reduce((total, config) => {
      return total + config.height;
    }, 0);
});

const selectedBoxStyle = computed(() => {
  return {
    width: selectedBoxWidth.value + "px",
    height: selectedBoxHeight.value + "px",
    left: selectedLeft.value + "px",
    top: selectedTop.value + "px",
  };
});

const longPressTransitionStyle =
  "width 80ms linear 0s, height 80ms linear 0s, right 80ms linear 0s, left 80ms linear 0s, bottom 80ms linear 0s, top 80ms linear 0s";

const selectedBoxTransition = computed(() => {
  return selecting.value ? longPressTransitionStyle : "none 0s ease 0s";
});

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

// 在startHorizontalScroll中处理负速度
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

const stopScroll = () => {
  if (scrollInterval !== null) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
};

onMounted(() => {
  window.addEventListener("mousedown", startSelection);
  window.addEventListener("mousemove", updateSelectionThrottled);
  window.addEventListener("mouseup", endSelection);
});
onBeforeUnmount(() => {
  window.removeEventListener("mousedown", startSelection);
  window.removeEventListener("mousemove", updateSelectionThrottled);
  window.removeEventListener("mouseup", endSelection);
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
  }
}
</style>
