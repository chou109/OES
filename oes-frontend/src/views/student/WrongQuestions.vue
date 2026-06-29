<template>
  <div class="wrong-questions">
    <div class="page-header">
      <h2>错题本</h2>
      <p>自动收录所有答错的题目，支持反复练习</p>
    </div>

    <div class="card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select v-model="params.subjectId" placeholder="选择科目" class="subject-select" clearable @change="loadData">
            <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-select v-model="params.mastered" placeholder="选择状态" class="status-select" clearable @change="loadData">
            <el-option :value="0" label="未学会" />
            <el-option :value="1" label="已学会" />
          </el-select>
        </div>
        <el-button type="danger" @click="loadData">搜索</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="content" label="题目内容" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="mastered" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.mastered === 1 ? 'success' : 'warning'" size="small">
              {{ row.mastered === 1 ? '已学会' : '未学会' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="passRate" label="通过百分比" width="120">
          <template #default="{ row }">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: getPassRate(row) + '%' }"></div>
              <span class="progress-text">{{ getPassRate(row) }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="practicedCount" label="练习次数" width="100" />
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewAnswer(row)">查看答案</el-button>
            <el-button type="danger" link @click="handlePractice(row)">练习</el-button>
            <el-button 
              :type="row.mastered === 1 ? 'warning' : 'success'" 
              link 
              @click="handleToggleMastered(row)"
            >
              {{ row.mastered === 1 ? '标记未学会' : '标记已学会' }}
            </el-button>
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

    <el-dialog v-model="answerVisible" title="查看答案" width="500px">
      <div v-if="viewingAnswer" class="answer-content">
        <div class="question-type">{{ typeText(viewingAnswer.type) }}</div>
        <div class="question-text">{{ viewingAnswer.content }}</div>
        <div class="answer-item">
          <span class="label">错误答案：</span>
          <span class="wrong-text">{{ viewingAnswer.wrongAnswer || '未记录' }}</span>
        </div>
        <div class="answer-item">
          <span class="label">正确答案：</span>
          <span class="correct-text">{{ viewingAnswer.correctAnswer }}</span>
        </div>
        <div class="analysis" v-if="viewingAnswer.analysis">
          <strong>解析：</strong>{{ viewingAnswer.analysis }}
        </div>
      </div>
      <template #footer>
        <el-button @click="answerVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="practiceVisible" title="错题练习" width="600px">
      <div v-if="currentQuestion" class="practice-content">
        <div class="question-type">{{ typeText(currentQuestion.type) }}</div>
        <div class="question-text">{{ currentQuestion.content }}</div>

        <div class="question-options" v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'JUDGMENT'].includes(currentQuestion.type)">
          <el-radio-group v-if="currentQuestion.type === 'SINGLE_CHOICE'" v-model="practiceAnswer">
            <el-radio v-for="(label, key) in parseOptions(currentQuestion.options)" :key="key" :value="key">
              {{ key }}. {{ label }}
            </el-radio>
          </el-radio-group>
          <el-checkbox-group v-else-if="currentQuestion.type === 'MULTIPLE_CHOICE'" v-model="practiceMultiAnswers">
            <el-checkbox v-for="(label, key) in parseOptions(currentQuestion.options)" :key="key" :value="key">
              {{ key }}. {{ label }}
            </el-checkbox>
          </el-checkbox-group>
          <el-radio-group v-else-if="currentQuestion.type === 'JUDGMENT'" v-model="practiceAnswer">
            <el-radio value="A">正确</el-radio>
            <el-radio value="B">错误</el-radio>
          </el-radio-group>
        </div>

        <div class="question-input" v-else>
          <el-input v-model="practiceAnswer" type="textarea" :rows="4" placeholder="请输入答案" />
        </div>

        <div class="result-panel" v-if="showResult">
          <div :class="['result-badge', isCorrect ? 'correct' : 'wrong']">
            {{ isCorrect ? '回答正确' : '回答错误' }}
          </div>
          <div v-if="!isCorrect" class="correct-answer-display">
            <strong>正确答案：</strong>
            <span style="color: #22c55e; font-weight: 500;">{{ currentQuestion.correctAnswer }}</span>
          </div>
          <div class="analysis" v-if="currentQuestion.analysis">
            <strong>解析：</strong>{{ currentQuestion.analysis }}
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="practiceVisible = false">关闭</el-button>
        <el-button type="danger" v-if="!showResult" @click="checkAnswer">提交答案</el-button>
        <el-button type="success" v-else @click="nextQuestion">下一题</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { wrongQuestionApi, subjectApi } from '../../utils/api'

const loading = ref(false)
const tableData = ref([])
const subjects = ref([])
const current = ref(1)
const size = ref(10)
const total = ref(0)
const params = reactive({ subjectId: null, mastered: null })

const practiceVisible = ref(false)
const answerVisible = ref(false)
const currentQuestion = ref(null)
const viewingAnswer = ref(null)
const practiceAnswer = ref('')
const practiceMultiAnswers = ref([])
const showResult = ref(false)
const isCorrect = ref(false)

const typeText = (type) => ({ SINGLE_CHOICE: '单选题', MULTIPLE_CHOICE: '多选题', JUDGMENT: '判断题', FILL_BLANK: '填空题', ESSAY: '简答题', PROGRAMMING: '编程题' }[type] || type)

const parseOptions = (options) => {
  try {
    const parsed = options ? JSON.parse(options) : {}
    if (Array.isArray(parsed)) {
      const result = {}
      parsed.forEach(item => {
        if (item.key && item.content) {
          result[item.key] = item.content
        }
      })
      return result
    }
    return parsed
  } catch { 
    return {} 
  } 
}

const getPassRate = (row) => {
  const practiced = row.practicedCount || 0
  const correct = row.correctCount || 0
  if (practiced === 0) return 0
  return Math.round((correct / practiced) * 100)
}

const loadData = async () => {
  loading.value = true
  try {
    const queryParams = { 
      current: current.value, 
      size: size.value 
    }
    if (params.subjectId !== null && params.subjectId !== undefined) {
      queryParams.subjectId = params.subjectId
    }
    if (params.mastered !== null && params.mastered !== undefined) {
      queryParams.mastered = params.mastered
    }
    const res = await wrongQuestionApi.page(queryParams)
    if (res.code === 200) { 
      tableData.value = res.data.records; 
      total.value = res.data.total 
    }
  } catch (e) { console.error(e) } finally { loading.value = false }
}

const loadSubjects = async () => {
  const res = await subjectApi.list()
  if (res.code === 200) subjects.value = res.data
}

const handleViewAnswer = (row) => {
  viewingAnswer.value = row
  answerVisible.value = true
}

const handlePractice = async (row) => {
  currentQuestion.value = row
  practiceAnswer.value = ''
  practiceMultiAnswers.value = []
  showResult.value = false
  practiceVisible.value = true

  await wrongQuestionApi.practice(row.id)
}

const checkAnswer = () => {
  let answer = practiceAnswer.value
  if (currentQuestion.value.type === 'MULTIPLE_CHOICE') {
    answer = practiceMultiAnswers.value.sort().join(',')
  }

  const answerStr = typeof answer === 'string' ? answer : ''
  const correctAnswerStr = typeof currentQuestion.value.correctAnswer === 'string' ? currentQuestion.value.correctAnswer : ''
  
  isCorrect.value = answerStr.toUpperCase() === correctAnswerStr.toUpperCase()
  showResult.value = true

  if (isCorrect.value) {
    wrongQuestionApi.correct(currentQuestion.value.id)
  }
}

const nextQuestion = () => {
  const currentIndex = tableData.value.findIndex(t => t.id === currentQuestion.value.id)
  if (currentIndex < tableData.value.length - 1) {
    handlePractice(tableData.value[currentIndex + 1])
  } else {
    ElMessage.success('已完成所有错题练习')
    practiceVisible.value = false
    loadData()
  }
}

const handleToggleMastered = async (row) => {
  const newStatus = row.mastered === 1 ? 0 : 1
  const res = await wrongQuestionApi.updateMastered(row.id, newStatus)
  if (res.code === 200) {
    row.mastered = newStatus
    ElMessage.success(`已${newStatus === 1 ? '标记为已学会' : '标记为未学会'}`)
  }
}

onMounted(() => { 
  loadData()
  loadSubjects()
})
</script>

<style lang="scss" scoped>
.wrong-questions {
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
  position: sticky;
  top: 24px;
  z-index: 100;
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  
  .toolbar-left {
    display: flex;
    gap: 12px;
    flex: 1;
    min-width: 0;
    align-items: center;
  }
  
  .subject-select {
    flex: 1;
    min-width: 0;
    width: auto;
  }
  
  .status-select {
    width: 140px;
    flex: 0 0 auto;
  }
  
  .el-button {
    flex: 0 0 auto;
    white-space: nowrap;
  }
}

.progress-bar {
  position: relative;
  height: 20px;
  background: #f1f5f9;
  border-radius: 10px;
  overflow: hidden;
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #22c55e, #16a34a);
    transition: width 0.3s ease;
  }
  
  .progress-text {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 12px;
    line-height: 20px;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }
}

.answer-content { 
  padding: 20px 0; 
}

.question-type { 
  background: #f1f5f9; 
  padding: 4px 12px; 
  border-radius: 6px; 
  font-size: clamp(12px, 2.5vw, 13px); 
  color: #64748b; 
  display: inline-block; 
  margin-bottom: 16px; 
}

.question-text { 
  font-size: clamp(14px, 3vw, 16px); 
  line-height: 1.8; 
  color: #1e293b; 
  margin-bottom: 24px; 
}

.answer-item { 
  margin-bottom: 12px; 
  font-size: clamp(13px, 2.8vw, 14px); 
}

.answer-item .label { 
  color: #64748b; 
}

.answer-item .wrong-text { 
  color: #dc2626; 
  font-weight: 500; 
}

.answer-item .correct-text { 
  color: #22c55e; 
  font-weight: 500; 
}

.practice-content { 
  padding: 20px 0; 
}

.question-options { 
  display: flex; 
  flex-direction: column; 
  gap: 12px; 
}

.question-options :deep(.el-radio), 
.question-options :deep(.el-checkbox) { 
  padding: 12px 16px; 
  border: 1px solid #e2e8f0; 
  border-radius: 10px; 
  width: 100%; 
  margin-right: 0; 
}

.question-input { 
  margin-bottom: 20px; 
}

.result-panel { 
  margin-top: 20px; 
  padding: 16px; 
  background: #f8fafc; 
  border-radius: 12px; 
}

.result-badge { 
  display: inline-block; 
  padding: 4px 12px; 
  border-radius: 6px; 
  font-size: clamp(13px, 3vw, 14px); 
  font-weight: 600; 
  margin-bottom: 12px; 
}

.result-badge.correct { 
  background: #dcfce7; 
  color: #16a34a; 
}

.result-badge.wrong { 
  background: #fee2e2; 
  color: #dc2626; 
}

.correct-answer-display { 
  margin-bottom: 12px; 
  font-size: clamp(13px, 2.8vw, 14px); 
}

.analysis { 
  font-size: clamp(13px, 2.8vw, 14px); 
  color: #475569; 
  line-height: 1.6; 
}

@media screen and (max-width: 992px) {
  .card {
    padding: 16px;
  }
  
  .toolbar {
    gap: 10px;
  }
  
  }

@media screen and (max-width: 768px) {
  .wrong-questions {
    padding: 0 4px;
  }
  
  .page-header {
    padding: 0 4px;
  }
  
  .card {
    padding: 14px;
    overflow-x: auto;
  }
  
  .toolbar {
    gap: 8px;
    margin-bottom: 16px;
  }
  
  .toolbar .toolbar-left {
    gap: 8px;
  }
  
  .toolbar .subject-select {
    flex: 1;
    min-width: 0;
  }
  
  .toolbar .status-select {
    width: auto;
    min-width: 100px;
  }
  
  .toolbar .el-button {
    white-space: nowrap;
  }
  
  .progress-bar {
    height: 18px;
    
    .progress-text {
      font-size: 11px;
      line-height: 18px;
    }
  }
  
  .question-options :deep(.el-radio), 
  .question-options :deep(.el-checkbox) { 
    padding: 10px 12px; 
  }
}

@media screen and (max-width: 576px) {
  .card {
    padding: 12px;
  }
  
  .question-options :deep(.el-radio), 
  .question-options :deep(.el-checkbox) { 
    padding: 8px 10px; 
    font-size: 13px;
  }
  
  .result-panel {
    padding: 12px;
  }
}

@media screen and (max-width: 360px) {
  .card {
    padding: 10px;
  }
  
  .question-text {
    margin-bottom: 16px;
    line-height: 1.6;
  }
  
  .answer-item {
    margin-bottom: 10px;
  }
  
  .result-panel {
    padding: 10px;
  }
}
</style>
