<template>
  <div class="log-manage">
    <div class="page-header">
      <h2>系统日志</h2>
      <p>查看系统操作记录</p>
    </div>

    <div class="card">
      <div class="toolbar">
        <el-input v-model="params.username" placeholder="操作用户" style="width: 160px" clearable @change="loadData" />
        <el-input v-model="params.operation" placeholder="操作描述" style="width: 200px" clearable @change="loadData" />
        <el-button type="danger" @click="loadData">搜索</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="username" label="操作用户" width="120" />
        <el-table-column prop="operation" label="操作描述" />
        <el-table-column prop="method" label="请求方法" width="150" />
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="createTime" label="操作时间" width="180" />
      </el-table>

      <el-pagination
        v-model:current-page="current"
        v-model:page-size="size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadData"
        @current-change="loadData"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { logApi } from '../../utils/api'

const loading = ref(false)
const tableData = ref([])
const current = ref(1)
const size = ref(10)
const total = ref(0)
const params = reactive({ username: '', operation: '' })

const loadData = async () => {
  loading.value = true
  try {
    const res = await logApi.page({ current: current.value, size: size.value, ...params })
    if (res.code === 200) { tableData.value = res.data.records; total.value = res.data.total }
  } catch (e) { console.error(e) } finally { loading.value = false }
}

onMounted(() => { loadData() })
</script>

<style lang="scss" scoped>
.log-manage {
  width: 100%;
  max-width: 100%;
  padding: 0 8px;
  box-sizing: border-box;
}

.page-header {
  padding: 0 8px;
  margin-bottom: 20px;
  
  h2 {
    font-size: clamp(20px, 5vw, 28px);
    font-weight: 700;
    color: #0f172a;
    margin: 0;
    line-height: 1.3;
  }
  
  p {
    margin-top: 6px;
    font-size: clamp(13px, 3vw, 14px);
    color: #64748b;
    line-height: 1.5;
  }
}

.card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

/* 响应式布局 */
@media screen and (max-width: 992px) {
  .card {
    padding: 16px;
    overflow-x: auto;
  }
}

@media screen and (max-width: 768px) {
  .log-manage {
    padding: 0 4px;
  }
  
  .page-header {
    padding: 0 4px;
  }
  
  .card {
    padding: 14px;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .toolbar .el-input {
    width: 100%;
  }
}

@media screen and (max-width: 576px) {
  .card {
    padding: 12px;
  }
  
  .toolbar {
    gap: 10px;
  }
}

@media screen and (max-width: 360px) {
  .card {
    padding: 10px;
  }
}
</style>
