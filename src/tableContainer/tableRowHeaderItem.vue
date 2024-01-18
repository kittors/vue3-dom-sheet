<template>
  <div
    class="table-row-header-item middle-center"
    v-if="rowInfo"
    :style="{
      width: defaultRowWidth + 'px',
      height: props.itemConfig.height + 'px',
      transform: `translate(0px,0px)`,
    }"
    :class="{ 'active-header': isActive }"
    :data-row="props.itemConfig.indexNum"
  >
    {{ props.itemConfig.indexContent }}
  </div>
</template>

<script setup lang="ts">
import { defineProps, inject, type Ref, computed } from "vue";
import type { RowConfig, RowInfo, SelectedCell } from "./type";
const props = defineProps<{ itemConfig: RowConfig }>();
const rowInfo = inject<RowInfo>("rowInfo");
const defaultRowWidth = inject<number>("defaultRowWidth");
const selectedArea = inject<Ref<SelectedCell>>("selectedArea");
const isActive = computed(() => {
  if (!selectedArea!.value) return false;
  const { startRow, endRow } = selectedArea!.value;
  const currentRow = props.itemConfig.indexNum;
  return currentRow >= startRow! && currentRow <= endRow!;
});
</script>

<style scoped lang="less">
.table-row-header-item {
  flex-shrink: 0;
  flex-grow: 0;
  box-sizing: border-box;
  border-bottom: 1px var(--table-header-border);
  border-left: 1px var(--table-header-border);
  border-right: 1px var(--table-header-border);
  background-color: var(--table-header-color);
  position: sticky;
  left: 0;
  color: var(--table-header-font-color);
  font-size: var(--table-header-font-size);
  z-index: 4;
}
.active-header {
  background-color: var(--table-header-active-color);
}
</style>
