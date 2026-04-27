<template>
  <div class="history">
    <div class="page-header">
      <h2>考试历史</h2>
      <p>查看已完成考试的成绩和答卷详情</p>
    </div>

    <div class="card">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="examTitle" label="考试名称" />
        <el-table-column prop="score" label="得分" width="100">
          <template #default="{ row }">
            <span :class="{ pass: row.score >= 60, fail: row.score < 60 }">{{ row.score }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="交卷时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="danger" link @click="handleDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="current"
        v-model:page-size="size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadData"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </div>

    <el-dialog v-model="detailVisible" title="成绩详情" width="800px">
      <div class="score-summary">
        <div class="score-item">
          <span class="label">得分</span>
          <span class="value">{{ currentRecord?.score }}</span>
        </div>
        <div class="score-item">
          <span class="label">总分</span>
          <span class="value">{{ currentRecord?.totalScore }}</span>
        </div>
        <div class="score-item">
          <span class="label">及格</span>
          <span class="value">{{ currentRecord?.score >= 60 ? '是' : '否' }}</span>
        </div>
      </div>

      <el-divider>答题详情</el-divider>

      <div class="answer-list">
        <div v-for="(item, index) in answerDetails" :key="item.id" class="answer-item">
          <div class="answer-header">
            <span class="question-num">{{ index + 1 }}</span>
            <span class="question-type">{{ typeText(item.type) }}</span>
            <el-tag :type="item.isCorrect === 1 ? 'success' : 'danger'" size="small">
              {{ item.isCorrect === 1 ? '正确' : '错误' }}
            </el-tag>
          </div>
          <div class="question-content">{{ item.content }}</div>
          <div class="answer-info">
            <div>你的答案：<span :class="{ wrong: item.isCorrect !== 1 }">{{ item.answer || '未答' }}</span></div>
            <div>正确答案：<span class="correct">{{ item.correctAnswer }}</span></div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { examRecordApi } from '../../utils/api'

const loading = ref(false)
const tableData = ref([])
const current = ref(1)
const size = ref(10)
const total = ref(0)
const detailVisible = ref(false)
const currentRecord = ref(null)
const answerDetails = ref([])

const typeText = (type) => ({ SINGLE_CHOICE: '单选题', MULTIPLE_CHOICE: '多选题', JUDGMENT: '判断题', FILL_BLANK: '填空题', ESSAY: '简答题', PROGRAMMING: '编程题' }[type] || type)

const loadData = async () => {
  loading.value = true
  try {
    const res = await examRecordApi.getStudentHistory({ current: current.value, size: size.value })
    if (res.code === 200) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (e) { console.error(e) } finally { loading.value = false }
}

const handleDetail = async (row) => {
  currentRecord.value = row
  try {
    const res = await examRecordApi.getAnswers(row.id)
    if (res.code === 200) {
      answerDetails.value = res.data
    }
  } catch (e) { console.error(e) }
  detailVisible.value = true
}

onMounted(() => { loadData() })
</script>

<style lang="scss" scoped>
.history { max-width: 1200px; }

.pass { color: #22c55e; font-weight: 600; }
.fail { color: #ef4444; font-weight: 600; }

.score-summary {
  display: flex;
  gap: 32px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 20px;
}

.score-item {
  text-align: center;
}

.score-item .label {
  display: block;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}

.score-item .value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.answer-list {
  max-height: 400px;
  overflow-y: auto;
}

.answer-item {
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 12px;
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.question-num {
  width: 24px;
  height: 24px;
  background: var(--brand-100);
  color: var(--brand-600);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.question-type {
  font-size: 13px;
  color: #64748b;
}

.question-content {
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 12px;
}

.answer-info {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: #64748b;
}

.answer-info .wrong { color: #ef4444; }
.answer-info .correct { color: #22c55e; font-weight: 500; }
</style>
