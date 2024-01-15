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
    <div class="normal-selected-box"></div>
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";
import TableRow from "./tableRow.vue";
import type { RowConfig } from "./type";
const renderRowArr = inject<RowConfig[] | null>("renderRowArr");
const totalRenderWidth = inject<number>("totalRenderWidth");
const placeholderTopHeight = inject<number>("placeholderTopHeight");
const totalColWidth = inject<number>("totalColWidth");
const defaultRowWidth = inject<number>("defaultRowWidth");
const totalRowHeight = inject<number>("totalRowHeight");
const defaultColHeight = inject<number>("defaultColHeight");
</script>

<style scoped lang="less">
.table-body {
  position: relative;
  .normal-selected-box {
    position: absolute;
    width: 80px;
    height: 100px;
    border: 2px solid #1266ec;
    top: 500px;
    left: 240px;
    box-sizing: border-box;
  }
}
</style>
