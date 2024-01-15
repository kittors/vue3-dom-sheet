<template>
  <div
    class="table-row-header-item middle-center"
    v-if="rowInfo && scale"
    :style="{
      width: rowHeaderWidth + 'px',
      height: props.itemConfig.height * scale + 'px',
      borderRight: rowHeaderRightBorder,
      transform: `translate(0px,0px)`,
    }"
  >
    {{ props.itemConfig.indexContent }}
  </div>
</template>

<script setup lang="ts">
import { defineProps, inject } from "vue";
import type { RowConfig, RowInfo } from "./type";
const props = defineProps<{ itemConfig: RowConfig }>();
const rowInfo = inject<RowInfo>("rowInfo");
const scale = inject<number>("scale");
const rowHeaderRightBorder = inject<string>("rowHeaderRightBorder");
const rowHeaderWidth = inject<number>("rowHeaderWidth");
</script>

<style scoped lang="less">
.table-row-header-item {
  flex-shrink: 0;
  flex-grow: 0;
  box-sizing: border-box;
  border-top: 1px var(--table-border);
  border-left: 1px var(--table-border);
  background-color: var(--table-header-color);
  position: sticky;
  left: 0;
  color: var(--table-header-font-color);
  font-size: var(--table-header-font-size);
  z-index: 2;
}
</style>
