<template>
  <div
    class="table-col-header"
    v-if="defaultRowWidth && scale && totalColWidth"
    :style="{
      width: totalColWidth * scale + 'px',
      transform: `translate(${defaultRowWidth}px,0px)`,
    }"
  >
    <TableColHeaderItem
      v-for="item in columnConfig"
      :key="item.indexNum"
      :itemConfig="item"
    />
  </div>
</template>

<script setup lang="ts">
import TableColHeaderItem from "./tableColHeaderItem.vue";
import { inject } from "vue";
import type { ColumnConfig } from "./type";

const columnConfig = inject<ColumnConfig[]>("columnConfig");
const totalColWidth = inject<number>("totalColWidth");
const defaultRowWidth = inject<number>("defaultRowWidth");
const scale = inject<number>("scale");
</script>

<style scoped lang="less">
.table-col-header {
  display: flex;
  box-sizing: border-box;
  flex-wrap: nowrap;
  position: sticky;
  top: 0px;
  box-sizing: border-box;
  z-index: 2;
}
</style>
