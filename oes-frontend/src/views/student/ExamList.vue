<template>
  <div class="exam-list">
    <div class="page-header">
      <h2>考试列表</h2>
      <p>查看并参加待进行的考试</p>
    </div>

    <el-row :gutter="24">
      <el-col :span="8" v-for="exam in tableData" :key="exam.id">
        <div class="exam-card">
          <div class="exam-header">
            <h3>{{ exam.title }}</h3>
            <el-tag :type="exam.status === 'ONGOING' ? 'success' : 'warning'">
              {{ exam.status === 'ONGOING' ? '进行中' : '即将开始' }}
            </el-tag>
          </div>
          <div class="exam-info">
            <div class="info-item">
              <el-icon><Clock /></el-icon>
              <span>考试时长：{{ exam.duration }} 分钟</span>
            </div>
            <div class="info-item">
              <el-icon><Timer /></el-icon>
              <span>总分：{{ exam.totalScore }}</span>
            </div>
            <div class="info-item">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatTime(exam.startTime) }}</span>
            </div>
          </div>
          <div class="exam-actions">
            <el-button type="primary" @click="handleJoin(exam)" :disabled="exam.status !== 'ONGOING'">
              {{ exam.status === 'ONGOING' ? '进入考试' : '等待开始' }}
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-empty v-if="tableData.length === 0" description="暂无考试" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { examApi } from '../../utils/api'

const router = useRouter()
const tableData = ref([])

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const handleJoin = (exam) => {
  router.push(`/student/examing/${exam.id}`)
}

const loadData = async () => {
  try {
    const res = await examApi.studentPage({ current: 1, size: 20 })
    if (res.code === 200) {
      tableData.value = res.data.records
    }
  } catch (e) { console.error(e) }
}

onMounted(() => { loadData() })
</script>

<style lang="scss" scoped>
.exam-list { max-width: 1200px; }

.exam-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
  margin-bottom: 24px;
  transition: all 0.2s;
}

.exam-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(99, 102, 241, 0.15);
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.exam-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.exam-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 14px;
}

.info-item .el-icon {
  color: #94a3b8;
}

.exam-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
