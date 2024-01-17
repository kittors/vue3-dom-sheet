<template>
  <div
    class="table-cell-item"
    v-if="
      defaultRowWidth &&
      totalColWidth &&
      currentTableWidth &&
      columnConfig &&
      scale &&
      tableData
    "
    :style="{
      height: props.height * scale + 'px',
      width: props.width * scale + 'px',
      transform: `translateX(${(translaceRightWidth as number)}px)`,
      fontSize:tableData[rows][cols].fontSize+'px'
    }"
    :data-row="rows"
    :data-col="cols"
  >
    {{ tableData[rows][cols].value }}
  </div>
</template>

<script setup lang="ts">
import { defineProps, inject } from "vue";
import type { ColumnConfig, TableCell } from "./type";
const props = defineProps<{
  height: number;
  width: number;
  rows: number;
  cols: number;
  colConfig: ColumnConfig;
}>();
const columnConfig = inject<ColumnConfig[]>("columnConfig");
const totalColWidth = inject<number>("totalColWidth");
const currentTableWidth = inject<number>("currentTableWidth");
const defaultRowWidth = inject<number>("defaultRowWidth");
const translaceRightWidth = inject<number>("translaceRightWidth");
const tableData = inject<TableCell[][]>("tableData");
const scale = inject<number>("scale");
</script>

<style scoped lang="less">
.table-cell-item {
  border-right: 1px var(--table-border);
  border-bottom: 1px var(--table-border);
  box-sizing: border-box;
  flex-shrink: 0;
  flex-grow: 0;
  overflow: hidden;
}
</style>
