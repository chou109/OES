<template>
  <div class="exam-record-manage">
    <div class="page-header">
      <h2>考试记录</h2>
      <p>查看和管理考试记录，进行成绩分析</p>
    </div>

    <div class="card">
      <div class="toolbar">
        <el-select v-model="params.examId" placeholder="选择考试" style="width: 200px" clearable @change="loadData">
          <el-option v-for="e in exams" :key="e.id" :label="e.title" :value="e.id" />
        </el-select>
        <el-select v-model="params.status" placeholder="状态" style="width: 120px" clearable @change="loadData">
          <el-option label="未开始" value="NOT_STARTED" />
          <el-option label="进行中" value="ONGOING" />
          <el-option label="已交卷" value="SUBMITTED" />
        </el-select>
        <el-button type="danger" @click="loadData">搜索</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="studentName" label="学生姓名" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="得分" width="100" />
        <el-table-column prop="screenSwitchCount" label="切屏次数" width="100" />
        <el-table-column prop="isSuspicious" label="可疑" width="80">
          <template #default="{ row }">
            <el-tag type="warning" v-if="row.isSuspicious">可疑</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column prop="submitTime" label="交卷时间" width="180" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="danger" link @click="handleDetail(row)">详情</el-button>
          </template>
        </el-table-column>
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
import { ElMessage } from 'element-plus'
import { examRecordApi, examApi } from '../../utils/api'

const loading = ref(false)
const tableData = ref([])
const exams = ref([])
const current = ref(1)
const size = ref(10)
const total = ref(0)
const params = reactive({ examId: null, status: '' })

const statusType = (s) => ({ NOT_STARTED: 'info', ONGOING: 'warning', SUBMITTED: 'success' }[s])
const statusText = (s) => ({ NOT_STARTED: '未开始', ONGOING: '进行中', SUBMITTED: '已交卷' }[s])

const loadData = async () => {
  loading.value = true
  try {
    const res = await examRecordApi.page({ current: current.value, size: size.value, ...params })
    if (res.code === 200) { tableData.value = res.data.records; total.value = res.data.total }
  } catch (e) { console.error(e) } finally { loading.value = false }
}

const loadExams = async () => {
  const res = await examApi.page({ current: 1, size: 100 })
  if (res.code === 200) exams.value = res.data.records
}

const handleDetail = (row) => {
  ElMessage.info('查看详情功能开发中')
}

onMounted(() => { loadData(); loadExams() })
</script>

<style lang="scss" scoped>
.exam-record-manage { max-width: 1400px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 20px; }
</style>
