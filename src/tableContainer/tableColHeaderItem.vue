<template>
  <div
    class="table-col-header-item middle-center"
    v-if="totalColWidth && currentTableWidth && columnConfig && scale"
    :style="{
      width: props.itemConfig.width * scale + 'px',
      height: defaultColHeight + 'px',
    }"
    :class="{ 'active-header': isActive }"
    :data-col="props.itemConfig.indexNum"
  >
    {{ props.itemConfig.indexContent }}
  </div>
</template>

<script setup lang="ts">
import { defineProps, inject, type Ref, computed } from "vue";
import type { ColumnConfig, SelectedCell } from "./type";

const props = defineProps<{ itemConfig: ColumnConfig }>();
const columnConfig = inject<ColumnConfig[]>("columnConfig");
const totalColWidth = inject<number>("totalColWidth");
const currentTableWidth = inject<number>("currentTableWidth");
const scale = inject<number>("scale");
const defaultColHeight = inject<number>("defaultColHeight");
const selectedArea = inject<Ref<SelectedCell>>("selectedArea");
// 创建一个计算属性来检查当前列是否在选中区域内
const isActive = computed(() => {
  if (!selectedArea!.value) return false;
  const { startCol, endCol } = selectedArea!.value;
  const currentCol = props.itemConfig.indexNum;
  return currentCol >= startCol! && currentCol <= endCol!;
});
</script>

<style scoped lang="less">
.table-col-header-item {
  flex-shrink: 0;
  flex-grow: 0;
  box-sizing: border-box;
  border-top: 1px var(--table-header-border);
  border-bottom: 1px var(--table-header-border);
  border-right: 1px var(--table-header-border);
  background-color: var(--table-header-color);
  color: var(--table-header-font-color);
  font-size: var(--table-header-font-size);
}
.active-header {
  background-color: var(--table-header-active-color);
}
</style>
