<template>
  <div class="exam-container" v-if="examInfo">
    <header class="exam-header">
      <div class="header-left">
        <h2>{{ examInfo.title }}</h2>
        <el-tag type="success">考试中</el-tag>
      </div>
      <div class="header-right">
        <div class="timer">
          <el-icon><Timer /></el-icon>
          <span :class="{ warning: remainingTime < 300 }">{{ formatTime(remainingTime) }}</span>
        </div>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">交卷</el-button>
      </div>
    </header>

    <div class="exam-body">
      <aside class="question-nav">
        <div class="nav-title">题目导航</div>
        <div class="question-grid">
          <div
            v-for="(q, index) in questions"
            :key="q.id"
            :class="['question-item', { current: currentIndex === index, answered: answers[q.id] }]"
            @click="currentIndex = index"
          >
            {{ index + 1 }}
          </div>
        </div>
        <div class="nav-legend">
          <div class="legend-item"><span class="dot current"></span>当前</div>
          <div class="legend-item"><span class="dot answered"></span>已答</div>
          <div class="legend-item"><span class="dot unanswered"></span>未答</div>
        </div>
      </aside>

      <main class="question-content">
        <div class="question-header">
          <span class="question-type">{{ typeText(questions[currentIndex]?.type) }}</span>
          <span class="question-score">{{ questions[currentIndex]?.score }}分</span>
        </div>
        <div class="question-text">{{ questions[currentIndex]?.content }}</div>

        <div class="question-options" v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'JUDGMENT'].includes(questions[currentIndex]?.type)">
          <el-radio-group v-if="questions[currentIndex]?.type === 'SINGLE_CHOICE'" v-model="answers[questions[currentIndex].id]" @change="saveAnswer">
            <el-radio v-for="(label, key) in parseOptions(questions[currentIndex]?.options)" :key="key" :value="key">
              {{ key }}. {{ label }}
            </el-radio>
          </el-radio-group>

          <el-checkbox-group v-else-if="questions[currentIndex]?.type === 'MULTIPLE_CHOICE'" v-model="multiAnswers[questions[currentIndex].id]" @change="handleMultiChange">
            <el-checkbox v-for="(label, key) in parseOptions(questions[currentIndex]?.options)" :key="key" :value="key">
              {{ key }}. {{ label }}
            </el-checkbox>
          </el-checkbox-group>

          <el-radio-group v-else-if="questions[currentIndex]?.type === 'JUDGMENT'" v-model="answers[questions[currentIndex].id]" @change="saveAnswer">
            <el-radio value="A">正确</el-radio>
            <el-radio value="B">错误</el-radio>
          </el-radio-group>
        </div>

        <div class="question-input" v-else>
          <el-input
            v-model="answers[questions[currentIndex]?.id]"
            type="textarea"
            :rows="6"
            placeholder="请输入答案"
            @blur="saveAnswer"
          />
        </div>

        <div class="question-actions">
          <el-button :disabled="currentIndex === 0" @click="currentIndex--">上一题</el-button>
          <el-button :disabled="currentIndex === questions.length - 1" @click="currentIndex++">下一题</el-button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { examApi, examRecordApi } from '../../utils/api'

const router = useRouter()
const route = useRoute()

const examInfo = ref(null)
const questions = ref([])
const recordId = ref(null)
const currentIndex = ref(0)
const answers = reactive({})
const multiAnswers = reactive({})
const submitting = ref(false)
const remainingTime = ref(0)
let timer = null
let autoSaveTimer = null

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const typeText = (type) => ({ SINGLE_CHOICE: '单选题', MULTIPLE_CHOICE: '多选题', JUDGMENT: '判断题', FILL_BLANK: '填空题', ESSAY: '简答题', PROGRAMMING: '编程题' }[type] || type)

const parseOptions = (options) => {
  try { return options ? JSON.parse(options) : {} } catch { return {} }
}

const handleMultiChange = (value) => {
  answers[questions.value[currentIndex.value].id] = value.join(',')
  saveAnswer()
}

const saveAnswer = async () => {
  if (!recordId.value) return
  try {
    await examRecordApi.autoSave({
      recordId: recordId.value,
      answers: { [questions.value[currentIndex.value].id]: answers[questions.value[currentIndex.value].id] || '' }
    })
  } catch (e) { console.error(e) }
}

const handleSubmit = async () => {
  await ElMessageBox.confirm('确定要交卷吗？交卷后无法修改答案', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
  submitting.value = true
  try {
    await examRecordApi.submit(recordId.value)
    ElMessage.success('交卷成功')
    router.push('/student/history')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    submitting.value = false
  }
}

const handleScreenSwitch = async () => {
  if (!recordId.value) return
  try {
    const res = await examRecordApi.screenSwitch({ recordId: recordId.value })
    if (res.code !== 200) {
      ElMessage.warning('检测到切屏，请专注考试')
    }
    if (res.message?.includes('自动交卷')) {
      ElMessage.error('切屏次数过多，已自动交卷')
      router.push('/student/history')
    }
  } catch (e) { console.error(e) }
}

const loadExam = async () => {
  const examId = route.params.id
  try {
    const startRes = await examRecordApi.start({ examId })
    if (startRes.code !== 200) {
      ElMessage.error(startRes.message || '无法开始考试')
      router.push('/student/exams')
      return
    }

    const data = startRes.data
    recordId.value = data.recordId
    questions.value = data.questions
    remainingTime.value = data.duration * 60
    examInfo.value = (await examApi.getById(examId)).data

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) handleScreenSwitch()
    })
  } catch (e) {
    ElMessage.error('加载考试失败')
    router.push('/student/exams')
  }
}

onMounted(() => {
  loadExam()
  timer = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
      if (remainingTime.value === 0) {
        ElMessage.warning('考试时间到，已自动交卷')
        handleSubmit()
      }
    }
  }, 1000)

  autoSaveTimer = setInterval(saveAnswer, 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (autoSaveTimer) clearInterval(autoSaveTimer)
})
</script>

<style lang="scss" scoped>
.exam-container {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

.exam-header {
  height: 64px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  font-size: 18px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.timer .warning {
  color: #ef4444;
}

.exam-body {
  display: flex;
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  gap: 24px;
  width: 100%;
}

.question-nav {
  width: 200px;
  background: white;
  border-radius: 16px;
  padding: 20px;
  height: fit-content;
  position: sticky;
  top: 88px;
}

.nav-title {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 16px;
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}

.question-item {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: #f1f5f9;
  color: #64748b;
  transition: all 0.2s;
}

.question-item.current {
  background: var(--brand-600);
  color: white;
}

.question-item.answered {
  background: #dcfce7;
  color: #16a34a;
}

.nav-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 4px;
}

.dot.current { background: var(--brand-600); }
.dot.answered { background: #dcfce7; }
.dot.unanswered { background: #f1f5f9; }

.question-content {
  flex: 1;
  background: white;
  border-radius: 16px;
  padding: 32px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.question-type {
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #64748b;
}

.question-score {
  color: #ef4444;
  font-weight: 600;
}

.question-text {
  font-size: 16px;
  line-height: 1.8;
  color: #1e293b;
  margin-bottom: 24px;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-options :deep(.el-radio),
.question-options :deep(.el-checkbox) {
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  width: 100%;
  margin-right: 0;
}

.question-options :deep(.el-radio.is-checked),
.question-options :deep(.el-checkbox.is-checked) {
  background: #eef2ff;
  border-color: var(--brand-500);
}

.question-input {
  margin-bottom: 24px;
}

.question-actions {
  display: flex;
  justify-content: space-between;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
}
</style>
