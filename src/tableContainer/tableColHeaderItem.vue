<template>
  <div
    class="table-col-header-item middle-center"
    v-if="totalColWidth && currentTableWidth && columnConfig && scale"
    :style="{
      width: props.itemConfig.width * scale + 'px',
      height: defaultColHeight + 'px',
    }"
    :data-col="props.itemConfig.indexNum"
  >
    {{ props.itemConfig.indexContent }}
  </div>
</template>

<script setup lang="ts">
import { defineProps, inject } from "vue";
import type { ColumnConfig } from "./type";

const props = defineProps<{ itemConfig: ColumnConfig }>();
const columnConfig = inject<ColumnConfig[]>("columnConfig");
const totalColWidth = inject<number>("totalColWidth");
const currentTableWidth = inject<number>("currentTableWidth");
const scale = inject<number>("scale");
const defaultColHeight = inject<number>("defaultColHeight");
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
</style>
