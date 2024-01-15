<template>
  <div
    class="table-cell-item"
    v-if="
      defaultRowWidth &&
      totalColWidth &&
      currentTableWidth &&
      columnConfig &&
      scale
    "
    :style="{
      height: props.height * scale + 'px',
      width: props.width * scale + 'px',
      transform: `translateX(${(fixTranslaceRightWidth as number)}px)`,
    }"
    :data-row="rows"
    :data-col="cols"
  ></div>
</template>

<script setup lang="ts">
import { defineProps, inject } from "vue";
import type { ColumnConfig } from "./type";
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
const fixTranslaceRightWidth = inject<number>("fixTranslaceRightWidth");
const scale = inject<number>("scale");
</script>

<style scoped lang="less">
.table-cell-item {
  border-left: 1px var(--table-border);
  border-top: 1px var(--table-border);
  box-sizing: border-box;
  flex-shrink: 0;
  flex-grow: 0;
}
</style>
