<template>
  <!-- 表格容器 -->
  <div
    class="table-container"
    :style="tableContainerStyle"
    ref="tableContainerRef"
  >
    <div
      class="table-corner"
      v-if="defaultColHeight && defaultRowWidth"
      :style="{
        height: defaultColHeight + 'px',
        width: defaultRowWidth + 'px',
      }"
    ></div>
    <div
      class="scrollbar-bottom-container"
      :style="{
        width: currentTableWidth - 1 + 'px',
        height: `16px`,
        bottom: `-15px`,
      }"
      v-if="
        defaultRowWidth &&
        (totalColWidth + defaultRowWidth) * scale > currentTableWidth
      "
    ></div>
    <div
      class="scrollbar-right-container"
      :style="{ height: currentTableHeight + 'px' }"
      v-if="totalRowHeight * scale > currentTableHeight - 15"
    ></div>
    <!-- element滚动条 -->
    <el-scrollbar
      :height="
        currentTableHeight - 15 > totalRowHeight*scale
          ? (totalRowHeight + (defaultColHeight as number)+2)*scale
          : currentTableHeight - 15 + 'px'
      "
      always
      ref="scrollRef"
      @scroll="listerScroll"
      v-if="currentTableConfig && defaultRowWidth"
    >
      <div class="table-cointainer-base">
        <div
          class="scroll-size-placeholder"
          ref="placeholderBox"
          :style="{
            width: totalWidth * scale + 'px',
            height: totalHeight * scale + 'px',
          }"
        ></div>
        <!-- 表列名 -->
        <TableColHeader />
        <!-- 表体 -->
        <TableBody />
      </div>
    </el-scrollbar>

    <!-- 空白状态 -->
    <el-empty v-else description="暂无内容" />
  </div>
</template>

<script setup lang="ts">
import TableBody from "./tableBody.vue";
import useTableStore from "../store/modules/table";
import TableColHeader from "./tableColHeader.vue";
import {
  defineProps,
  provide,
  ref,
  onMounted,
  onUnmounted,
  nextTick,
} from "vue";
import useTableComputed from "./hooks/useTableComputed";
import { TableConfig } from "./type";
import { ElScrollbar } from "element-plus";
import handleKeydown from "./event/keyDownEvent";

const tableContainerRef = ref<HTMLElement | null>(null);

const currentTableHeight = ref<number>(0);
const currentTableWidth = ref<number>(0);
const scrollRef = ref<typeof ElScrollbar | null>(null);

const tableStore = useTableStore();
// 创建一个 ResizeObserver 实例
const resizeObserver = new ResizeObserver((entries) => {
  for (let entry of entries) {
    // 获取父元素的高度
    const parentHeight = entry.contentRect.height;
    const parrentWidth = entry.contentRect.width;

    // 计算 table-container 到父元素顶部的距离
    const offsetTop = tableContainerRef.value?.offsetTop || 0;
    const offsetLeft = tableContainerRef.value?.offsetLeft || 0;

    // 计算 table-container 的新高度
    const newHeight = parentHeight - offsetTop;
    const newWidth = parrentWidth - offsetLeft;
    currentTableHeight.value = newHeight - 30;

    // if (currentTableHeight.value > (totalColWidth.value as number)) {
    //   currentTableHeight.value = totalColWidth.value;
    // }
    currentTableWidth.value = newWidth;
    nextTick(() => {
      if (
        scrollRef.value &&
        scrollRef.value.wrapRef &&
        scrollRef.value.wrapRef.parentNode
      ) {
        updateHorizontalScrollbarVisibility(
          totalColWidth.value * scale.value,
          (defaultRowWidth.value as number) * scale.value,
          currentTableWidth.value,
          scrollRef.value.wrapRef
        );

        // 原有代码位置
        updateVerticalScrollbarVisibility(
          totalRowHeight.value * scale.value,
          (defaultColHeight.value as number) * scale.value,
          currentTableHeight.value,
          scrollRef.value.wrapRef
        );
      }
      fixResizeIssue();
    });
  }
});

//获取props
const props = defineProps<{
  tableConfig: TableConfig | null;
  height: number;
  width: number;
  cache: number;
}>();

const {
  currentTableConfig,
  tableContainerStyle,
  rowConfig,
  totalRowHeight,
  totalColWidth,
  tableData,
  defaultColHeight,
  defaultRowWidth,
  computedHeight,
  computedWidth,
  columnConfig,
  columnInfo,
  rowInfo,
  scrollTop,
  scrollLeft,
  listerScroll,
  updateHorizontalScrollbarVisibility,
  updateVerticalScrollbarVisibility,
  fixedHorizontalValue,
  renderRowArr,
  placeholderTopHeight,
  totalHeight,
  totalWidth,
  totalRenderWidth,
  renderColArr,
  translaceRightWidth,
  scale,
  fixResizeIssue,
  columnHeaderHeight,
  columnHeaderBottomBorder,
  rowHeaderRightBorder,
  rowHeaderWidth,
  fixTranslaceRightWidth,
  renderColConfig,
  renderRowConfig,
} = useTableComputed(
  props,
  currentTableHeight,
  currentTableWidth,
  scrollRef,
  tableStore
);

//抛出由子组件调用
provide("renderRowArr", renderRowArr);
provide("rowConfig", rowConfig);
provide("columnConfig", columnConfig);
provide("tableData", tableData);
provide("columnInfo", columnInfo);
provide("rowInfo", rowInfo);
provide("scrollTop", scrollTop);
provide("scrollLeft", scrollLeft);
provide("totalRowHeight", totalRowHeight);
provide("height", computedHeight);
provide("width", computedWidth);
provide("defaultColHeight", defaultColHeight);
provide("defaultRowWidth", defaultRowWidth);
provide("totalColWidth", totalColWidth);
provide("currentTableWidth", currentTableWidth);
provide("currentTableHeight", currentTableHeight);
provide("fixedHorizontalValue", fixedHorizontalValue);
provide("placeholderTopHeight", placeholderTopHeight);
provide("totalHeight", totalHeight);
provide("totalWidth", totalWidth);
provide("totalRenderWidth", totalRenderWidth);
provide("renderColArr", renderColArr);
provide("translaceRightWidth", translaceRightWidth);
provide("scale", scale);
provide("columnHeaderHeight", columnHeaderHeight);
provide("columnHeaderBottomBorder", columnHeaderBottomBorder);
provide("rowHeaderRightBorder", rowHeaderRightBorder);
provide("rowHeaderWidth", rowHeaderWidth);
provide("fixTranslaceRightWidth", fixTranslaceRightWidth);
provide("tableContainerRef", tableContainerRef);
provide("scrollRef", scrollRef);
provide("renderColConfig", renderColConfig);
provide("renderRowConfig", renderRowConfig);

onMounted(() => {
  // 获取 table-container 的父元素并开始观察
  const parentElement = tableContainerRef.value?.parentNode as Element | null;
  if (parentElement) {
    resizeObserver.observe(parentElement);
  }
  window.addEventListener("keydown", (event) =>
    handleKeydown(event, tableStore)
  );
});

onUnmounted(() => {
  // 停止观察
  resizeObserver.disconnect();
  window.addEventListener("keydown", (event) =>
    handleKeydown(event, tableStore)
  );
});
</script>

<style scoped lang="less">
.table-container {
  user-select: none;
  border: 1px var(--table-border);
  position: relative;
  .table-cointainer-base {
    position: relative;
    .scroll-size-placeholder {
      position: absolute;
      top: 0;
      left: 0;
      z-index: -1; /* 确保它不会影响实际的表格内容 */
      visibility: hidden; /* 使其不可见，但仍占用空间 */
    }
  }
  .table-corner {
    border: 1px var(--table-header-border);
    position: absolute;
    left: 0px;
    top: 0px;
    box-sizing: border-box;
    z-index: 5;
    background-color: var(--table-header-color);
  }
  .scrollbar-bottom-container {
    position: absolute;
    border: 1px var(--table-border);
    box-sizing: border-box;
    z-index: 9;
    background-color: var(--table-scroll-background);
  }
  .scrollbar-right-container {
    position: absolute;
    width: 16px;
    right: -15px;
    border: 1px var(--table-border);
    box-sizing: border-box;
    z-index: 10;
    background-color: var(--table-scroll-background);
  }
}
:deep(.el-scrollbar) {
  overflow: visible;
}
:deep(.el-scrollbar__wrap) {
  overflow: visible;
}
:deep(.el-scrollbar__bar.is-vertical) {
  right: -10px;
  top: 4px;
  z-index: 11;
}
:deep(.el-scrollbar__bar.is-horizontal) {
  bottom: -10px;
  z-index: 11;
}
</style>
