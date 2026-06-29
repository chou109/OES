<template>
  <div class="exam-container" v-if="examInfo">
    <header class="exam-header">
      <div class="header-left">
        <h2>{{ examInfo.title }}</h2>
        <el-tag :type="examStatusType">考试{{ examStatusText }}</el-tag>
      </div>
      <div class="header-right">
        <div class="view-mode-info" v-if="isViewMode">
          <span class="score-display">得分：{{ studentScore }} / {{ examInfo.totalScore }}</span>
          <el-tag v-if="canViewPaper" type="success">已出分</el-tag>
          <el-tag v-else type="warning">待评分</el-tag>
        </div>
        <div class="timer" v-if="!isViewMode">
          <el-icon><Timer /></el-icon>
          <span :class="{ warning: remainingTime < 300 }">{{ formatTime(remainingTime) }}</span>
        </div>
        <el-button type="primary" @click="handleManualSave" :loading="saving" v-if="!isViewMode" style="margin-right: 10px;">保存</el-button>
        <el-button type="danger" @click="handleSubmit" :loading="submitting" v-if="!isViewMode">交卷</el-button>
      </div>
    </header>

    <div class="exam-body">
      <aside class="question-nav" v-if="!(isViewMode && (!canViewPaper || hasSubjectiveUngraded))">
        <div class="nav-section" v-for="section in questionSections" :key="section.type">
          <div class="section-title">{{ section.typeName }} ({{ section.questions.length }}题)</div>
          <div class="question-grid">
            <div
              v-for="(q, qIndex) in section.questions"
              :key="q.id"
              :class="['question-item', {
                current: currentQuestion?.id === q.id,
                answered: isAnswered(q.id),
                correct: isViewMode && getQuestionResult(q.id) === true,
                wrong: isViewMode && getQuestionResult(q.id) === false
              }]"
              @click="jumpToQuestion(q.id)"
            >
              {{ section.startIndex + qIndex + 1 }}
            </div>
          </div>
        </div>
        <div class="nav-legend" v-if="isViewMode">
          <div class="legend-item"><span class="dot correct"></span>正确</div>
          <div class="legend-item"><span class="dot wrong"></span>错误</div>
        </div>
        <div class="nav-legend" v-else>
          <div class="legend-item"><span class="dot current"></span>当前</div>
          <div class="legend-item"><span class="dot answered"></span>已答</div>
          <div class="legend-item"><span class="dot unanswered"></span>未答</div>
        </div>
      </aside>

      <main class="question-content">
        <!-- 不允许查看试卷或有主观题未评分时，显示锁定提示 -->
        <div v-if="isViewMode && (!canViewPaper || hasSubjectiveUngraded)" class="paper-locked">
          <el-empty description="教师已关闭考后查看试卷权限，无法查看试卷内容">
            <template #image>
              <el-icon size="120"><Lock /></el-icon>
            </template>
          </el-empty>
        </div>
        
        <!-- 允许查看试卷时，显示题目 -->
        <div v-else-if="currentQuestion" class="question-card">
          <div class="question-header">
            <div class="question-info">
              <el-tag type="info">{{ currentTypeName }}</el-tag>
              <span class="question-score">{{ currentQuestion.score }}分</span>
              <el-tag v-if="isViewMode && !canViewPaper" type="warning">待评分</el-tag>
              <el-tag v-else-if="isViewMode && canViewPaper" :type="getQuestionResult(currentQuestion.id) ? 'success' : 'danger'">
                {{ getQuestionResult(currentQuestion.id) ? '正确' : '错误' }}
              </el-tag>
              <span v-if="isViewMode && canViewPaper" class="question-score">得分：{{ getQuestionScore(currentQuestion.id) }}</span>
            </div>
            <div class="question-number">第 {{ currentQuestionNumber }} 题</div>
          </div>

          <div class="question-text">{{ currentQuestion.content }}</div>

          <div class="question-options" v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'JUDGMENT'].includes(currentQuestion.type)">
            <el-radio-group v-if="currentQuestion.type === 'SINGLE_CHOICE'" v-model="answers[currentQuestion.id]" :disabled="isViewMode" @change="saveAnswer">
              <el-radio v-for="(item, index) in currentShuffledOptions" :key="item.key" :value="item.key">
                {{ item.key }}. {{ item.label }}
              </el-radio>
            </el-radio-group>

            <el-checkbox-group v-else-if="currentQuestion.type === 'MULTIPLE_CHOICE'" v-model="multiAnswers[currentQuestion.id]" :disabled="isViewMode" @change="handleMultiChange">
              <el-checkbox v-for="(item, index) in currentShuffledOptions" :key="item.key" :value="item.key">
                {{ item.key }}. {{ item.label }}
              </el-checkbox>
            </el-checkbox-group>

            <el-radio-group v-else-if="currentQuestion.type === 'JUDGMENT'" v-model="answers[currentQuestion.id]" :disabled="isViewMode" @change="saveAnswer">
              <el-radio v-for="(item, index) in currentShuffledOptions" :key="item.key" :value="item.key">
                {{ item.label }}
              </el-radio>
            </el-radio-group>

            <div v-if="isViewMode && canViewPaper && !getQuestionResult(currentQuestion.id)" class="answer-comparison">
              <div class="your-answer">
                <span class="label">你的答案：</span>
                <span class="value wrong">{{ answers[currentQuestion.id] || multiAnswers[currentQuestion.id]?.join(',') || '未答' }}</span>
              </div>
              <div class="correct-answer">
                <span class="label">正确答案：</span>
                <span class="value correct">{{ getQuestionCorrectAnswer(currentQuestion.id) }}</span>
              </div>
            </div>
          </div>

          <div class="question-input" v-else-if="currentQuestion.type === 'FILL_BLANK'">
            <el-input
              v-model="answers[currentQuestion.id]"
              type="textarea"
              :rows="4"
              placeholder="请输入答案"
              :disabled="isViewMode"
              @blur="saveAnswer"
            />
            <div v-if="isViewMode && canViewPaper" class="answer-comparison">
              <div class="your-answer">
                <span class="label">你的答案：</span>
                <span class="value">{{ answers[currentQuestion.id] || '未答' }}</span>
              </div>
              <div class="correct-answer">
                <span class="label">正确答案：</span>
                <span class="value">{{ currentQuestion.answer }}</span>
              </div>
            </div>
          </div>

          <div class="question-input" v-else>
            <el-input
              v-model="answers[currentQuestion.id]"
              type="textarea"
              :rows="8"
              placeholder="请输入答案"
              :disabled="isViewMode"
              @blur="saveAnswer"
            />
            <div v-if="isViewMode && canViewPaper" class="answer-comparison">
              <div class="your-answer">
                <span class="label">你的答案：</span>
                <span class="value">{{ answers[currentQuestion.id] || '未答' }}</span>
              </div>
            </div>
          </div>

          <div class="question-actions">
            <el-button @click="prevQuestion" :disabled="isFirstQuestion">上一题</el-button>
            <span class="progress-text">{{ currentQuestionNumber }} / {{ totalQuestions }}</span>
            <el-button @click="nextQuestion" :disabled="isLastQuestion">下一题</el-button>
          </div>
        </div>

        <div v-else class="no-question">
          <el-empty description="加载中..." />
        </div>
      </main>
    </div>

    <el-dialog v-model="leaveWarningVisible" title="警告" width="400px" :close-on-click-modal="false" :show-close="false">
      <div class="leave-warning">
        <el-icon class="warning-icon" color="#ef4444" size="48"><WarningFilled /></el-icon>
        <p>您已离开考试页面！</p>
        <p class="leave-count">离开次数：<span class="red">{{ leaveCount }}</span> / {{ maxLeaveCount }}</p>
        <p v-if="maxLeaveCount - leaveCount > 0" class="remaining">剩余 <span class="red">{{ maxLeaveCount - leaveCount }}</span> 次机会，超出将自动交卷</p>
        <p v-else class="remaining red">已达到上限，即将自动交卷</p>
      </div>
      <template #footer>
        <el-button type="danger" @click="continueExam">继续作答</el-button>
      </template>
    </el-dialog>
  </div>
  <div v-else class="loading-container">
    <el-icon class="is-loading"><Loading /></el-icon>
    <p>加载考试信息...</p>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Timer, Loading, WarningFilled } from '@element-plus/icons-vue'
import { examApi, examRecordApi } from '../../utils/api'

const router = useRouter()
const route = useRoute()

const examInfo = ref(null)
const questions = ref([])
const recordId = ref(null)
const currentQuestionId = ref(null)
const answers = reactive({})
const multiAnswers = reactive({})
const submitting = ref(false)
const saving = ref(false)
const remainingTime = ref(0)
const leaveCount = ref(0)
const maxLeaveCount = ref(3)
const leaveDetectionEnabled = ref(false)
const leaveWarningVisible = ref(false)
const isViewMode = ref(false)
const answerMap = ref({})
const canViewPaper = ref(false)
const studentScore = ref(0)
const hasSubjectiveUngraded = ref(false)
let timer = null
let autoSaveTimer = null

const typeMap = {
  SINGLE_CHOICE: { name: '单选题', start: '一' },
  MULTIPLE_CHOICE: { name: '多选题', start: '二' },
  JUDGMENT: { name: '判断题', start: '三' },
  FILL_BLANK: { name: '填空题', start: '四' },
  ESSAY: { name: '简答题', start: '五' },
  PROGRAMMING: { name: '编程题', start: '六' }
}

const shuffledOptionsMap = reactive({})

const questionSections = computed(() => {
  const sections = []
  const typeOrder = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'JUDGMENT', 'FILL_BLANK', 'ESSAY', 'PROGRAMMING']
  let globalIndex = 0

  for (const type of typeOrder) {
    const typeQuestions = questions.value.filter(q => q.type === type)
    if (typeQuestions.length > 0) {
      sections.push({
        type,
        typeName: typeMap[type]?.name || type,
        startName: typeMap[type]?.start || '',
        questions: typeQuestions,
        startIndex: globalIndex
      })
      globalIndex += typeQuestions.length
    }
  }
  return sections
})

const totalQuestions = computed(() => questions.value.length)

const currentQuestion = computed(() => {
  return questions.value.find(q => q.id === currentQuestionId.value)
})

const currentQuestionNumber = computed(() => {
  const index = questions.value.findIndex(q => q.id === currentQuestionId.value)
  return index + 1
})

const currentTypeName = computed(() => {
  if (!currentQuestion.value) return ''
  return typeMap[currentQuestion.value.type]?.name || currentQuestion.value.type
})

const currentShuffledOptions = computed(() => {
  if (!currentQuestion.value || !currentQuestion.value.options) return []
  const questionId = currentQuestion.value.id
  if (!shuffledOptionsMap[questionId]) {
    const original = parseOptions(currentQuestion.value.options)
    let options = Object.entries(original).map(([key, label]) => ({ key, label }))
    const examConfig = examInfo.value?.config || {}
    if (examConfig.shuffleOptions && !isViewMode.value) {
      if (currentQuestion.value.type === 'JUDGMENT') {
        options = shuffleArray([...options])
      } else {
        options = shuffleArray([...options])
      }
    }
    shuffledOptionsMap[questionId] = options
  }
  return shuffledOptionsMap[questionId]
})

const examStatusType = computed(() => ({
  PENDING: 'warning',
  ONGOING: 'success',
  FINISHED: 'info'
}[examInfo.value?.status]))

const examStatusText = computed(() => ({
  PENDING: '待开始',
  ONGOING: '进行中',
  FINISHED: '已结束'
}[examInfo.value?.status]))

const isFirstQuestion = computed(() => currentQuestionNumber.value === 1)
const isLastQuestion = computed(() => currentQuestionNumber.value === totalQuestions.value)

const isAnswered = (questionId) => {
  const answer = answers[questionId]
  const multiAnswer = multiAnswers[questionId]
  // 检查多选答案（数组且有内容）
  if (Array.isArray(multiAnswer) && multiAnswer.length > 0) return true
  // 检查单选/判断/填空/简答答案
  if (answer && answer.trim() !== '') return true
  return false
}

const getQuestionResult = (questionId) => {
  if (!answerMap.value) return null
  const key = String(questionId)
  if (!answerMap.value[key]) return null
  return answerMap.value[key].isCorrect === 1
}

const getQuestionScore = (questionId) => {
  if (!answerMap.value) return 0
  const key = String(questionId)
  if (!answerMap.value[key]) return 0
  return answerMap.value[key].score || 0
}

const getQuestionCorrectAnswer = (questionId) => {
  if (!answerMap.value) return ''
  const key = String(questionId)
  if (!answerMap.value[key]) return ''
  return answerMap.value[key].correctAnswer || ''
}

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const parseOptions = (options) => {
  try {
    const parsed = JSON.parse(options)
    // 如果是数组格式，转换为对象格式
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

const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const jumpToQuestion = (questionId) => {
  currentQuestionId.value = questionId
}

const prevQuestion = () => {
  const currentIndex = questions.value.findIndex(q => q.id === currentQuestionId.value)
  if (currentIndex > 0) {
    currentQuestionId.value = questions.value[currentIndex - 1].id
  }
}

const nextQuestion = () => {
  const currentIndex = questions.value.findIndex(q => q.id === currentQuestionId.value)
  if (currentIndex < questions.value.length - 1) {
    currentQuestionId.value = questions.value[currentIndex + 1].id
  }
}

const handleMultiChange = (value) => {
  answers[currentQuestion.value.id] = value.join(',')
  saveAnswer()
}

const saveAnswer = async () => {
  if (!recordId.value) return
  try {
    // 创建一个包含所有答案的对象
    const allAnswers = { ...answers }
    // 确保多选题答案也被包含
    for (const [qId, value] of Object.entries(multiAnswers)) {
      if (Array.isArray(value) && value.length > 0) {
        allAnswers[qId] = value.join(',')
      }
    }
    await examRecordApi.autoSave({
      recordId: recordId.value,
      answers: allAnswers
    })
  } catch (e) { console.error(e) }
}

const handleManualSave = async () => {
  saving.value = true
  try {
    await saveAnswer()
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败: ' + e.message)
  } finally {
    saving.value = false
  }
}

const handleSubmit = async () => {
  await ElMessageBox.confirm('确定要交卷吗？交卷后无法修改答案', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
  submitting.value = true
  try {
    const res = await examRecordApi.submit(recordId.value)
    if (res.code === 200) {
      // 清理 localStorage 中的计时器
      const examId = route.params.id
      localStorage.removeItem(`exam_end_time_${examId}`)
      ElMessage.success('交卷成功')
      // 设置为查看模式，防止再次交卷
      isViewMode.value = true
      leaveDetectionEnabled.value = false
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.push('/student/history')
      }, 1000)
    } else {
      ElMessage.error(res.message || '交卷失败')
    }
  } catch (e) {
    ElMessage.error(e.message || '交卷失败')
  } finally {
    submitting.value = false
  }
}

const continueExam = () => {
  leaveWarningVisible.value = false
  if (leaveDetectionEnabled.value && leaveCount.value >= maxLeaveCount.value) {
    autoSubmit()
  }
}

const autoSubmit = async () => {
  ElMessage.error('离开次数过多，已自动交卷')
  try {
    await examRecordApi.autoSubmit(recordId.value)
    router.push('/student/history')
  } catch (e) {
    router.push('/student/history')
  }
}

const handleTimeUp = async () => {
  if (isViewMode.value) return
  
  try {
    const res = await examRecordApi.getById(recordId.value)
    if (res && res.data && res.data.leaveCount > 0) {
      autoSubmit()
    } else {
      handleSubmit()
    }
  } catch (e) {
    handleSubmit()
  }
}

const handleVisibilityChange = () => {
  if (document.hidden) {
    handleLeaveDetection()
  }
}

const handleWindowBlur = () => {
  handleLeaveDetection()
}

const handleLeaveDetection = async () => {
  if (!leaveDetectionEnabled.value || !recordId.value || examInfo.value?.status !== 'ONGOING') return

  leaveCount.value++

  if (leaveCount.value >= maxLeaveCount.value) {
    leaveWarningVisible.value = false
    autoSubmit()
    return
  }

  leaveWarningVisible.value = true

  try {
    await examRecordApi.reportLeave({
      recordId: recordId.value,
      leaveCount: leaveCount.value
    })
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
    const examConfig = data.examConfig ? JSON.parse(data.examConfig) : {}
    leaveDetectionEnabled.value = examConfig.leaveDetection || false
    maxLeaveCount.value = examConfig.maxLeaveCount || 3
    leaveCount.value = data.leaveCount || 0

    // 如果离开次数已经达到上限，直接跳转到历史页面
    if (leaveDetectionEnabled.value && leaveCount.value >= maxLeaveCount.value) {
      ElMessage.error('离开次数过多，已自动交卷')
      router.push('/student/history')
      return
    }

    // 判断是否为查看模式（已交卷，包括主动提交和强制收卷）
    if (data.record && (data.record.status === 'SUBMITTED' || data.record.status === 'AUTO_SUBMITTED')) {
      isViewMode.value = true
      canViewPaper.value = data.canViewPaper || false
      studentScore.value = data.studentScore || 0
      hasSubjectiveUngraded.value = data.hasSubjectiveUngraded || false
      answerMap.value = data.answerMap || {}
      // 查看模式下禁用离开监测
      leaveDetectionEnabled.value = false
    } else {
      // 非查看模式下也要设置 answerMap，用于恢复答题进度
      answerMap.value = data.answerMap || {}
    }

    let loadedQuestions = data.questions || []

    if (examConfig.shuffleQuestions && !isViewMode.value) {
      const typeOrder = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'JUDGMENT', 'FILL_BLANK', 'ESSAY', 'PROGRAMMING']
      const grouped = {}
      const groupedIndices = {}

      typeOrder.forEach(type => {
        grouped[type] = []
        groupedIndices[type] = []
      })

      loadedQuestions.forEach((q, index) => {
        if (grouped[q.type]) {
          grouped[q.type].push(q)
          groupedIndices[q.type].push(index)
        }
      })

      const shuffledQuestions = []
      const finalOrder = []

      typeOrder.forEach(type => {
        if (grouped[type].length > 0) {
          const shuffledGroup = shuffleArray([...grouped[type]])
          shuffledGroup.forEach(q => {
            shuffledQuestions.push(q)
            finalOrder.push({ id: q.id, type: q.type })
          })
        }
      })

      loadedQuestions = shuffledQuestions
    }

    questions.value = loadedQuestions

    // 获取考试信息（需要在时间判断前获取）
    examInfo.value = (await examApi.getById(examId)).data
    examInfo.value.config = examConfig

    // 修复计时器刷新重置问题：从localStorage读取剩余时间
    if (!isViewMode.value) {
      const savedEndTime = localStorage.getItem(`exam_end_time_${examId}`)
      if (savedEndTime) {
        const endTime = parseInt(savedEndTime)
        const now = Date.now()
        remainingTime.value = Math.max(0, Math.floor((endTime - now) / 1000))
        // 如果本地存储的时间已过期，但考试还在进行中，重新计算剩余时间
        if (remainingTime.value <= 0) {
          // 检查考试是否还在进行中
          if (examInfo.value && examInfo.value.status === 'ONGOING') {
            // 考试还在进行，重新计算剩余时间
            const examEndTime = new Date(examInfo.value.endTime).getTime()
            remainingTime.value = Math.max(0, Math.floor((examEndTime - now) / 1000))
            localStorage.setItem(`exam_end_time_${examId}`, examEndTime.toString())
          } else {
            ElMessage.warning('考试时间已到')
            router.push('/student/exams')
            return
          }
        }
      } else {
        remainingTime.value = data.duration * 60
        localStorage.setItem(`exam_end_time_${examId}`, (Date.now() + data.duration * 60 * 1000).toString())
      }
    }

    // 恢复答题进度（所有模式下都需要）
    if (answerMap.value) {
      for (const [qId, info] of Object.entries(answerMap.value)) {
        const questionId = parseInt(qId)
        if (info.answer) {
          // 检查是否为多选题答案（包含逗号的字符串）
          if (typeof info.answer === 'string' && info.answer.includes(',')) {
            multiAnswers[questionId] = info.answer.split(',')
          } else if (Array.isArray(info.answer)) {
            multiAnswers[questionId] = info.answer
          } else {
            answers[questionId] = info.answer
          }
        }
      }
    }

    if (questions.value.length > 0) {
      currentQuestionId.value = questions.value[0].id
    }
  } catch (e) {
    ElMessage.error('加载考试失败')
    router.push('/student/exams')
  }
}

watch(currentQuestionId, () => {
  if (currentQuestion.value && Array.isArray(multiAnswers[currentQuestion.value.id])) {
  } else if (currentQuestion.value && !multiAnswers[currentQuestion.value.id]) {
    multiAnswers[currentQuestion.value.id] = []
  }
})

onMounted(() => {
  loadExam()
  timer = setInterval(() => {
    if (isViewMode.value) return
    
    if (remainingTime.value > 0) {
      remainingTime.value--
      if (remainingTime.value === 0) {
        ElMessage.warning('考试时间到，已自动交卷')
        if (timer) {
          clearInterval(timer)
          timer = null
        }
        handleTimeUp()
      }
    }
  }, 1000)

  autoSaveTimer = setInterval(() => {
    if (!isViewMode.value) {
      saveAnswer()
    }
  }, 30000)

  document.addEventListener('mouseleave', handleLeaveDetection)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('blur', handleWindowBlur)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (autoSaveTimer) clearInterval(autoSaveTimer)
  document.removeEventListener('mouseleave', handleLeaveDetection)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('blur', handleWindowBlur)
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
  width: 100%;
  margin: 0 auto;
  padding: 24px;
  gap: 24px;
  flex-wrap: wrap;
}

.question-nav {
  width: 280px;
  min-width: 200px;
  max-width: 300px;
  flex-shrink: 0;
  background: white;
  border-radius: 16px;
  padding: 20px;
  height: fit-content;
  position: sticky;
  top: 88px;
  max-height: calc(100vh - 112px);
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 10px;
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  margin-bottom: 4px;
}

.question-item {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: #f1f5f9;
  color: #64748b;
  transition: all 0.2s;
}

.question-item:hover {
  background: #e2e8f0;
}

.question-item.current {
  background: #ef4444;
  color: white;
}

.question-item.answered {
  background: #22c55e;
  color: white;
}

.question-item.answered.current {
  background: #ef4444;
  color: white;
}

.nav-legend {
  display: flex;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #cbd5e1;
}

.dot.current {
  background: #ef4444;
}

.dot.answered {
  background: #22c55e;
}

.question-content {
  flex: 1;
  min-width: 0;
}

.paper-locked {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.question-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.question-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.question-score {
  font-size: 14px;
  color: #ef4444;
  font-weight: 600;
}

.question-number {
  font-size: 14px;
  color: #64748b;
}

.question-text {
  font-size: 16px;
  line-height: 1.8;
  color: #1e293b;
  margin-bottom: 24px;
}

.question-options {
  margin-bottom: 24px;
}

.question-options :deep(.el-radio-group) {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-options :deep(.el-radio) {
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-right: 0;
  transition: all 0.2s;
}

.question-options :deep(.el-radio:hover) {
  border-color: #ef4444;
}

.question-options :deep(.el-radio.is-checked) {
  border-color: #ef4444;
  background: #fef2f2;
}

.question-options :deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-options :deep(.el-checkbox) {
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-right: 0;
  transition: all 0.2s;
}

.question-options :deep(.el-checkbox:hover) {
  border-color: #ef4444;
}

.question-options :deep(.el-checkbox.is-checked) {
  border-color: #ef4444;
  background: #fef2f2;
}

.question-input {
  margin-bottom: 24px;
}

.question-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 32px;
}

.progress-text {
  font-size: 14px;
  color: #64748b;
}

.no-question {
  background: white;
  border-radius: 16px;
  padding: 64px;
  text-align: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;
  color: #64748b;
}

.loading-container .el-icon {
  font-size: 48px;
  color: #ef4444;
}

.leave-warning {
  text-align: center;
  padding: 20px;
}

.leave-warning p {
  margin: 12px 0;
  font-size: 16px;
  color: #1e293b;
}

.leave-warning .warning-icon {
  margin-bottom: 16px;
}

.leave-count {
  font-size: 18px;
  font-weight: 600;
}

.remaining {
  font-size: 14px;
  color: #64748b;
}

.red {
  color: #ef4444;
  font-weight: 700;
}

.view-mode-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-display {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.question-item.correct {
  background: #22c55e;
  color: white;
}

.question-item.wrong {
  background: #ef4444;
  color: white;
}

.dot.correct {
  background: #22c55e;
}

.dot.wrong {
  background: #ef4444;
}

.answer-comparison {
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.answer-comparison .your-answer,
.answer-comparison .correct-answer {
  margin-bottom: 8px;
}

.answer-comparison .label {
  font-weight: 600;
  color: #475569;
}

.answer-comparison .value {
  margin-left: 8px;
  color: #1e293b;
}

.answer-comparison .value.wrong {
  color: #ef4444;
}

.answer-comparison .value.correct {
  color: #22c55e;
}

.view-notice {
  margin-top: 24px;
}
</style>
