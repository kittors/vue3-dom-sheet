<template>
  <div class="base-container" ref="baseContainer">
    <el-row class="mb-4" style="margin-bottom: 10px; padding-top: 10px">
      <el-button type="primary" @click="getTableDate1">数据1</el-button>
      <el-button type="info" @click="getTableDate2">数据2</el-button>
    </el-row>
    <tableContainer
      :table-config="tableConfig"
      v-loading="isShowTableLoading"
      :height="500"
      :width="700"
      :cache="3"
      ref="tableContainerRef"
    >
    </tableContainer>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import tableContainer from "../tableContainer";
import generateTableDate from "../tableContainer/tableConfig";
import { TableConfig } from "../tableContainer/type";

const tableConfig = ref<TableConfig | null>(null);
const isShowTableLoading = ref<boolean>(false);

const tableContainerRef = ref(null);
const baseContainer = ref(null);

const getTableDate1 = () => {
  isShowTableLoading.value = true;
  tableConfig.value = null;
  generateTableDate("233", 40, 100)
    .then((res) => {
      console.log(res);
      tableConfig.value = res;
      isShowTableLoading.value = false;
    })
    .catch((err) => {
      console.log(err);
    });
};
const getTableDate2 = () => {
  isShowTableLoading.value = true;
  tableConfig.value = null;
  generateTableDate("", 5, 20)
    .then((res) => {
      console.log(res);
      tableConfig.value = res;
      isShowTableLoading.value = false;
    })
    .catch((err) => {
      console.log(err);
    });
};
</script>

<style lang="less">
#app {
  height: 100vh;
  width: 100vw;
}
.base-container {
  margin: 0px 10px 0;
  height: 100%;
}
</style>
