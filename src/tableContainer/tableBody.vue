<template>
  <div
    class="table-body"
    @mousedown="startSelection"
    @mousemove="updateSelection"
    @mouseup="endSelection"
    @mouseleave="endSelection"
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
import { inject, ref, reactive, computed, type Ref } from "vue";
import TableRow from "./tableRow.vue";
import type { ColumnConfig, RowConfig } from "./type";
const renderRowArr = inject<RowConfig[] | null>("renderRowArr");
const totalRenderWidth = inject<number>("totalRenderWidth");
const placeholderTopHeight = inject<number>("placeholderTopHeight");
const totalColWidth = inject<number>("totalColWidth");
const defaultRowWidth = inject<Ref<number>>("defaultRowWidth");
const totalRowHeight = inject<number>("totalRowHeight");
const defaultColHeight = inject<number>("defaultColHeight");
const columnConfig = inject<Ref<ColumnConfig[]>>("columnConfig");
const rowConfig = inject<Ref<RowConfig[]>>("rowConfig");

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

const startSelection = (event: MouseEvent) => {
  // 检查是否是鼠标右键点击（鼠标右键的button值为2）
  if (event.button === 2) {
    return;
  }
  const clickedElement = event.target as HTMLElement;
  const isTableCell = clickedElement.classList.contains("table-cell-item");
  const isMergeCell = clickedElement.classList.contains("merge-cell");
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
};

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

  if (!target || !isTableCell) {
    return { startRow: null, startCol: null, endRow: null, endCol: null }; // 如果没有找到.table-cell-item元素，则返回默认值
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
