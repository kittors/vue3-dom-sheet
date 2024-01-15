<template>
  <div
    class="table-col-header-item middle-center"
    v-if="totalColWidth && currentTableWidth && columnConfig && scale"
    :style="{
      width: props.itemConfig.width * scale + 'px',
      height: columnHeaderHeight + 'px',
      borderBottom: columnHeaderBottomBorder,
      borderRight:
        totalColWidth + defaultRowWidth > currentTableWidth
          ? 'none'
          : props.itemConfig.indexNum + 1 == columnConfig.length
          ? `1px var(--table-border)`
          : 'none',
    }"
  >
    {{ props.itemConfig.indexContent }}
  </div>
</template>

<script setup lang="ts">
import { defineProps, inject } from "vue";
import type { ColumnConfig } from "./type";

const props = defineProps<{ itemConfig: ColumnConfig }>();
const columnConfig = inject<ColumnConfig[]>("columnConfig");
const defaultRowWidth = inject<number>("defaultRowWidth", 0);
const totalColWidth = inject<number>("totalColWidth");
const currentTableWidth = inject<number>("currentTableWidth");
const scale = inject<number>("scale");
const columnHeaderHeight = inject<number>("columnHeaderHeight");
const columnHeaderBottomBorder = inject<number>("columnHeaderBottomBorder");
</script>

<style scoped lang="less">
.table-col-header-item {
  flex-shrink: 0;
  flex-grow: 0;
  box-sizing: border-box;
  border-top: 1px var(--table-border);
  border-left: 1px var(--table-border);
  background-color: var(--table-header-color);
  color: var(--table-header-font-color);
  font-size: var(--table-header-font-size);
}
</style>
