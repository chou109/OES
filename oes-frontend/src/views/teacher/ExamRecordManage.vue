<template>
  <div class="exam-record-manage">
    <div class="page-header">
      <h2>阅卷与成绩管理</h2>
      <p>查看考试成绩统计，进行错题分析</p>
    </div>

    <div class="card">
      <div class="toolbar">
        <el-select v-model="params.examId" placeholder="选择考试" style="width: 200px" clearable @change="handleExamChange">
          <el-option v-for="e in exams" :key="e.id" :label="e.title" :value="e.id" />
        </el-select>
        <el-select v-model="params.status" placeholder="状态" style="width: 120px" clearable @change="loadData">
          <el-option label="未开始" value="NOT_STARTED" />
          <el-option label="进行中" value="ONGOING" />
          <el-option label="已交卷" value="SUBMITTED" />
        </el-select>
        <el-button type="danger" @click="loadData">搜索</el-button>
        <el-button type="primary" @click="handleExport" v-if="params.examId">导出成绩</el-button>
      </div>

      <!-- 成绩统计卡片 -->
      <div v-if="examStats" class="stats-section">
        <h3>成绩统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon highest">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">最高分</span>
              <span class="stat-value">{{ examStats.highestScore }}</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon lowest">
              <el-icon><ArrowDown /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">最低分</span>
              <span class="stat-value">{{ examStats.lowestScore }}</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon average">
              <el-icon><Tickets /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">平均分</span>
              <span class="stat-value">{{ examStats.averageScore }}</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon pass">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">及格率</span>
              <span class="stat-value">{{ examStats.passRate }}%</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon total">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">参考人数</span>
              <span class="stat-value">{{ examStats.totalStudents }}</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon pass-count">
              <el-icon><Tickets /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">及格人数</span>
              <span class="stat-value">{{ examStats.passCount }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 错题分析 -->
      <div v-if="questionAnalysis.length > 0" class="analysis-section">
        <h3>错题分析</h3>
        <el-table :data="questionAnalysis" v-loading="analysisLoading" stripe>
          <el-table-column prop="questionId" label="题目ID" width="100" />
          <el-table-column prop="questionContent" label="题目内容" min-width="200">
            <template #default="{ row }">
              <span :title="row.questionContent">{{ row.questionContent.length > 50 ? row.questionContent.substring(0, 50) + '...' : row.questionContent }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="questionType" label="题型" width="100">
            <template #default="{ row }">
              {{ typeText(row.questionType) }}
            </template>
          </el-table-column>
          <el-table-column prop="score" label="分值" width="80" />
          <el-table-column prop="totalAnswered" label="答题人数" width="100" />
          <el-table-column prop="correctCount" label="正确人数" width="100" />
          <el-table-column prop="correctRate" label="正确率" width="120">
            <template #default="{ row }">
              <div class="rate-wrapper">
                <el-progress :percentage="row.correctRate" :show-text="false" :stroke-width="8" />
                <span class="rate-text">{{ row.correctRate }}%</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 学生成绩列表 -->
      <div class="records-section">
        <h3>学生成绩列表</h3>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { TrendCharts, ArrowDown, UserFilled, Tickets } from '@element-plus/icons-vue'
import { examRecordApi, examApi } from '../../utils/api'

const loading = ref(false)
const analysisLoading = ref(false)
const tableData = ref([])
const exams = ref([])
const current = ref(1)
const size = ref(10)
const total = ref(0)
const params = reactive({ examId: null, status: '' })
const examStats = ref(null)
const questionAnalysis = ref([])

const statusType = (s) => ({ NOT_STARTED: 'info', ONGOING: 'warning', SUBMITTED: 'success' }[s])
const statusText = (s) => ({ NOT_STARTED: '未开始', ONGOING: '进行中', SUBMITTED: '已交卷' }[s])
const typeText = (t) => ({
  SINGLE_CHOICE: '单选题',
  MULTIPLE_CHOICE: '多选题',
  JUDGMENT: '判断题',
  FILL_BLANK: '填空题',
  ESSAY: '问答题',
  PROGRAMMING: '编程题'
}[t] || t)

const loadData = async () => {
  loading.value = true
  try {
    const res = await examRecordApi.page({ current: current.value, size: size.value, ...params })
    if (res.code === 200) { 
      tableData.value = res.data.records; 
      total.value = res.data.total 
    }
  } catch (e) { console.error(e) } finally { loading.value = false }
}

const loadExams = async () => {
  const res = await examApi.page({ current: 1, size: 100 })
  if (res.code === 200) exams.value = res.data.records
}

const loadExamStats = async (examId) => {
  if (!examId) {
    examStats.value = null
    return
  }
  try {
    const res = await examRecordApi.getExamStats(examId)
    if (res.code === 200) {
      examStats.value = res.data
    }
  } catch (e) {
    console.error(e)
  }
}

const loadQuestionAnalysis = async (examId) => {
  if (!examId) {
    questionAnalysis.value = []
    return
  }
  analysisLoading.value = true
  try {
    const res = await examRecordApi.getQuestionAnalysis(examId)
    if (res.code === 200) {
      questionAnalysis.value = res.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    analysisLoading.value = false
  }
}

const handleExamChange = async () => {
  current.value = 1
  await loadData()
  await loadExamStats(params.examId)
  await loadQuestionAnalysis(params.examId)
}

const handleDetail = (row) => {
  ElMessage.info('查看详情功能开发中')
}

const handleExport = async () => {
  try {
    const res = await examRecordApi.exportExamScores(params.examId)
    if (res.code === 200) {
      const data = res.data
      let csv = '学生ID,成绩,交卷时间,状态\n'
      data.data.forEach(item => {
        csv += `${item.studentId},${item.score || ''},${item.submitTime || ''},${item.status || ''}\n`
      })
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${data.examTitle}_成绩.csv`
      link.click()
      URL.revokeObjectURL(link.href)
      
      ElMessage.success('导出成功')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('导出失败')
  }
}

onMounted(() => { 
  loadData() 
  loadExams() 
})
</script>

<style lang="scss" scoped>
.exam-record-manage {
  width: 100%;
  max-width: 100%;
  padding: 0 8px;
  box-sizing: border-box;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
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

.stats-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
  
  h3 {
    font-size: clamp(14px, 3vw, 16px);
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 16px 0;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 14px;
  }
  
  .stat-item {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    
    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
      
      &.highest {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white;
      }
      
      &.lowest {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
      }
      
      &.average {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
      }
      
      &.pass {
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        color: white;
      }
      
      &.total {
        background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        color: white;
      }
      
      &.pass-count {
        background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
        color: white;
      }
    }
    
    .stat-info {
      flex: 1;
      min-width: 0;
      
      .stat-label {
        display: block;
        font-size: clamp(11px, 2.5vw, 12px);
        color: #64748b;
        margin-bottom: 4px;
      }
      
      .stat-value {
        font-size: clamp(18px, 4vw, 24px);
        font-weight: 700;
        color: #1e293b;
        line-height: 1.2;
      }
    }
  }
}

.analysis-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
  
  h3 {
    font-size: clamp(14px, 3vw, 16px);
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 16px 0;
  }
  
  .rate-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .rate-text {
      font-weight: 600;
      color: #1e293b;
      min-width: 36px;
      font-size: clamp(12px, 2.5vw, 13px);
    }
  }
}

.records-section {
  h3 {
    font-size: clamp(14px, 3vw, 16px);
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 16px 0;
  }
}

/* 响应式布局 */
@media screen and (max-width: 1200px) {
  .stats-section .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  
  .stat-item {
    padding: 14px;
    gap: 10px;
    
    .stat-icon {
      width: 40px;
      height: 40px;
      font-size: 16px;
    }
  }
}

@media screen and (max-width: 992px) {
  .card {
    padding: 16px;
    overflow-x: auto;
  }
  
  .toolbar {
    gap: 10px;
  }
}

@media screen and (max-width: 768px) {
  .exam-record-manage {
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
  
  .toolbar .el-select,
  .toolbar .el-input,
  .toolbar .el-button {
    width: 100%;
  }
  
  .stats-section {
    margin-bottom: 20px;
    padding-bottom: 16px;
  }
  
  .stats-section .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .stat-item {
    padding: 12px;
    gap: 8px;
    
    .stat-icon {
      width: 36px;
      height: 36px;
      font-size: 14px;
    }
    
    .stat-info .stat-value {
      font-size: 16px;
    }
  }
  
  .analysis-section {
    margin-bottom: 20px;
    padding-bottom: 16px;
  }
}

@media screen and (max-width: 576px) {
  .card {
    padding: 12px;
  }
  
  .stats-section .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .stat-item {
    padding: 10px;
    gap: 8px;
    
    .stat-icon {
      width: 32px;
      height: 32px;
      font-size: 13px;
    }
  }
}

@media screen and (max-width: 360px) {
  .card {
    padding: 10px;
  }
  
  .stats-section .stats-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .stat-item {
    flex-direction: row;
    
    .stat-info {
      text-align: left;
    }
  }
}
</style>