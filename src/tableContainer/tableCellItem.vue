<template>
  <div
    class="table-cell-item"
    v-if="
      defaultRowWidth &&
      totalColWidth &&
      currentTableWidth &&
      columnConfig &&
      scale &&
      tableData &&
      rowConfig
    "
    :style="{
      height: props.height * scale + 'px',
      width: props.width * scale + 'px',
      transform: `translateX(${(translaceRightWidth as number)}px)`,
      fontSize:tableData[rows][cols].fontSize+'px',
      borderBottom: (rows !== rowConfig.length - 1) ?'1px var(--table-border)' : 'none',
      borderRight:(cols!==columnConfig.length-1)?'1px var(--table-border)':'none'
      
    }"
    :data-row="rows"
    :data-col="cols"
  >
    <div
      class="cell-data"
      :style="{ lineHeight: tableData[rows][cols].fontSize + 'px' }"
    >
      {{ tableData[rows][cols].value }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, inject } from "vue";
import type { ColumnConfig, RowConfig, TableCell } from "./type";
const props = defineProps<{
  height: number;
  width: number;
  rows: number;
  cols: number;
  colConfig: ColumnConfig;
}>();
const columnConfig = inject<ColumnConfig[]>("columnConfig");
const rowConfig = inject<RowConfig[]>("rowConfig");
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
  padding: 2px;
  .cell-data {
    line-height: 14px;
  }
}
</style>
