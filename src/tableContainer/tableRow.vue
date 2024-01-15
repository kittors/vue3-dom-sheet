<template>
  <div
    class="table-row"

   
  >
    <TableRowHeaderItem :item-config="rowItem" />
    <template v-for="colItem in renderColArr" :key="colItem.indexContent">
      <TableCellItem
        :height="props.rowItem.height"
        :width="colItem.width"
        :rows="rowItem.indexNum"
        :cols="colItem.indexNum"
        :colConfig="colItem"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { defineProps, inject } from "vue";
import TableCellItem from "./tableCellItem.vue";
import TableRowHeaderItem from "./tableRowHeaderItem.vue";
import type { ColumnConfig, RowConfig } from "./type";
const props = defineProps<{ rowItem: RowConfig }>();
const renderColArr = inject<ColumnConfig[] | undefined>("renderColArr");

</script>

<style scoped lang="less">
.table-row {
  display: flex;
  flex-wrap: nowrap; /* 防止子元素换行 */
  position: relative;
  box-sizing: border-box;
}
</style>
