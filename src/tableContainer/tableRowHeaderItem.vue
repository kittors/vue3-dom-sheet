<template>
  <div
    class="table-row-header-item middle-center"
    v-if="rowInfo"
    :style="{
      width: defaultRowWidth + 'px',
      height: props.itemConfig.height + 'px',
      transform: `translate(0px,0px)`,
    }"
    :data-row="props.itemConfig.indexNum"
  >
    {{ props.itemConfig.indexContent }}
  </div>
</template>

<script setup lang="ts">
import { defineProps, inject } from "vue";
import type { RowConfig, RowInfo } from "./type";
const props = defineProps<{ itemConfig: RowConfig }>();
const rowInfo = inject<RowInfo>("rowInfo");
const defaultRowWidth = inject<number>("defaultRowWidth");
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
</style>
