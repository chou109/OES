<template>
  <view class="exam-container" v-if="examInfo">
    <view class="exam-header">
      <view class="header-top">
        <text class="exam-title">{{ examInfo.title }}</text>
        <view class="exam-status" :class="examStatusClass">
          <text>{{ examStatusText }}</text>
        </view>
      </view>

      <view class="header-bottom">
        <view v-if="isViewMode" class="view-mode-info">
          <text class="score-text">得分：{{ studentScore }} / {{ examInfo.totalScore }}</text>
          <view class="tag" :class="canViewPaper ? 'tag-success' : 'tag-warning'">
            <text>{{ canViewPaper ? '已出分' : '待评分' }}</text>
          </view>
        </view>
        <view v-else class="timer-row">
          <view class="timer" :class="{ warning: remainingTime < 300 }">
            <uni-icons type="clock" size="16" color="#fff" />
            <text>{{ formatTime(remainingTime) }}</text>
          </view>
          <button class="save-btn" @click="handleManualSave" :loading="saving">保存</button>
          <button class="submit-btn" @click="handleSubmit" :loading="submitting">交卷</button>
        </view>
      </view>
    </view>

    <view class="exam-body" v-if="!(isViewMode && (!canViewPaper || hasSubjectiveUngraded))">
      <!-- 题目导航按钮 -->
      <view class="nav-toggle" @click="showNav = true">
        <uni-icons type="list" size="20" color="#fff" />
        <text>答题卡</text>
      </view>

      <!-- 当前题目 -->
      <view v-if="currentQuestion" class="question-card">
        <view class="question-header">
          <view class="question-tag">
            <view class="tag tag-info">
              <text>{{ currentTypeName }}</text>
            </view>
            <text class="question-score">{{ currentQuestion.score }}分</text>
          </view>
          <text class="question-number">第 {{ currentQuestionNumber }} / {{ totalQuestions }} 题</text>
        </view>

        <view class="question-content-text">{{ currentQuestion.content }}</view>

        <!-- 选择题选项 -->
        <view v-if="['SINGLE_CHOICE', 'JUDGMENT'].includes(currentQuestion.type)" class="question-options">
          <view
            v-for="(item, index) in currentShuffledOptions"
            :key="item.key"
            class="option-item"
            :class="{
              selected: answers[currentQuestion.id] === item.key,
              correct: isViewMode && canViewPaper && item.key === getQuestionCorrectAnswer(currentQuestion.id),
              wrong: isViewMode && canViewPaper && answers[currentQuestion.id] === item.key && item.key !== getQuestionCorrectAnswer(currentQuestion.id)
            }"
            @click="handleSelect(item.key)"
          >
            <view class="option-key">{{ item.key }}</view>
            <text class="option-text">{{ item.label }}</text>
          </view>
        </view>

        <!-- 多选题 -->
        <view v-else-if="currentQuestion.type === 'MULTIPLE_CHOICE'" class="question-options">
          <view
            v-for="(item, index) in currentShuffledOptions"
            :key="item.key"
            class="option-item"
            :class="{
              selected: multiAnswers[currentQuestion.id]?.includes(item.key),
              correct: isViewMode && canViewPaper && getQuestionCorrectAnswer(currentQuestion.id)?.split(',').includes(item.key),
              wrong: isViewMode && canViewPaper && multiAnswers[currentQuestion.id]?.includes(item.key) && !getQuestionCorrectAnswer(currentQuestion.id)?.split(',').includes(item.key)
            }"
            @click="handleMultiSelect(item.key)"
          >
            <view class="option-key">{{ item.key }}</view>
            <text class="option-text">{{ item.label }}</text>
          </view>
        </view>

        <!-- 填空题和简答题 -->
        <view v-else class="question-input">
          <textarea
            v-model="answers[currentQuestion.id]"
            :placeholder="currentQuestion.type === 'FILL_BLANK' ? '请输入答案' : '请输入答案内容'"
            :maxlength="currentQuestion.type === 'FILL_BLANK' ? 500 : 2000"
            :disabled="isViewMode"
            @blur="saveAnswer"
          />

          <!-- 查看模式显示答案对比 -->
          <view v-if="isViewMode && canViewPaper" class="answer-comparison">
            <view class="answer-row">
              <text class="label">你的答案：</text>
              <text class="value">{{ answers[currentQuestion.id] || '未答' }}</text>
            </view>
            <view v-if="currentQuestion.type === 'FILL_BLANK'" class="answer-row">
              <text class="label">正确答案：</text>
              <text class="value correct">{{ currentQuestion.answer }}</text>
            </view>
          </view>
        </view>

        <!-- 题目操作按钮 -->
        <view class="question-actions">
          <button class="action-btn" @click="prevQuestion" :disabled="isFirstQuestion">上一题</button>
          <button class="action-btn" @click="nextQuestion" :disabled="isLastQuestion">下一题</button>
        </view>
      </view>

      <view v-else class="no-question">
        <text>加载中...</text>
      </view>
    </view>

    <!-- 锁定提示 -->
    <view v-else class="paper-locked">
      <uni-icons type="locked" size="120" color="#999" />
      <text class="locked-text">教师已关闭考后查看试卷权限，无法查看试卷内容</text>
    </view>

    <!-- 答题卡抽屉 -->
    <view v-if="showNav" class="nav-drawer" @click="showNav = false">
      <view class="nav-content" @click.stop>
        <view class="nav-header">
          <text class="nav-title">答题卡</text>
          <view class="nav-close" @click="showNav = false">
            <uni-icons type="close" size="24" color="#333" />
          </view>
        </view>

        <scroll-view class="nav-body" scroll-y>
          <view v-for="section in questionSections" :key="section.type" class="nav-section">
            <view class="section-title">{{ section.typeName }} ({{ section.questions.length }}题)</view>
            <view class="question-grid">
              <view
                v-for="(q, qIndex) in section.questions"
                :key="q.id"
                class="question-item"
                :class="{
                  current: currentQuestion?.id === q.id,
                  answered: isAnswered(q.id),
                  correct: isViewMode && getQuestionResult(q.id) === true,
                  wrong: isViewMode && getQuestionResult(q.id) === false
                }"
                @click="jumpToQuestion(q.id)"
              >
                <text>{{ section.startIndex + qIndex + 1 }}</text>
              </view>
            </view>
          </view>
        </scroll-view>

        <view class="nav-legend">
          <view v-if="isViewMode" class="legend-row">
            <view class="legend-item"><view class="dot correct"></view><text>正确</text></view>
            <view class="legend-item"><view class="dot wrong"></view><text>错误</text></view>
          </view>
          <view v-else class="legend-row">
            <view class="legend-item"><view class="dot current"></view><text>当前</text></view>
            <view class="legend-item"><view class="dot answered"></view><text>已答</text></view>
            <view class="legend-item"><view class="dot unanswered"></view><text>未答</text></view>
          </view>
        </view>
      </view>
    </view>
  </view>

  <view v-else class="loading-container">
    <text>加载考试信息...</text>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '../../store/index.js'
import { examApi, examRecordApi } from '../../utils/api.js'

const userStore = useUserStore()

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
const isViewMode = ref(false)
const answerMap = ref({})
const canViewPaper = ref(false)
const studentScore = ref(0)
const hasSubjectiveUngraded = ref(false)
const showNav = ref(false)

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
      options = shuffleArray([...options])
    }
    shuffledOptionsMap[questionId] = options
  }
  return shuffledOptionsMap[questionId]
})

const examStatusText = computed(() => {
  return {
    PENDING: '待开始',
    ONGOING: '进行中',
    FINISHED: '已结束'
  }[examInfo.value?.status] || ''
})

const examStatusLower = computed(() => {
  return (examInfo.value?.status || '').toLowerCase()
})

const examStatusClass = computed(() => {
  return 'status-' + examStatusLower.value
})

const isFirstQuestion = computed(() => currentQuestionNumber.value === 1)
const isLastQuestion = computed(() => currentQuestionNumber.value === totalQuestions.value)

const isAnswered = (questionId) => {
  const answer = answers[questionId]
  const multiAnswer = multiAnswers[questionId]
  if (Array.isArray(multiAnswer) && multiAnswer.length > 0) return true
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
  showNav.value = false
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

const handleSelect = (key) => {
  if (isViewMode.value) return
  answers[currentQuestion.value.id] = key
  saveAnswer()
}

const handleMultiSelect = (key) => {
  if (isViewMode.value) return
  if (!multiAnswers[currentQuestion.value.id]) {
    multiAnswers[currentQuestion.value.id] = []
  }
  const index = multiAnswers[currentQuestion.value.id].indexOf(key)
  if (index > -1) {
    multiAnswers[currentQuestion.value.id].splice(index, 1)
  } else {
    multiAnswers[currentQuestion.value.id].push(key)
  }
  answers[currentQuestion.value.id] = multiAnswers[currentQuestion.value.id].join(',')
  saveAnswer()
}

const saveAnswer = async () => {
  if (!recordId.value) return
  try {
    const allAnswers = { ...answers }
    for (const [qId, value] of Object.entries(multiAnswers)) {
      if (Array.isArray(value) && value.length > 0) {
        allAnswers[qId] = value.join(',')
      }
    }
    await examRecordApi.autoSave({
      recordId: recordId.value,
      answers: allAnswers
    })
  } catch (e) {
    console.error(e)
  }
}

const handleManualSave = async () => {
  saving.value = true
  try {
    await saveAnswer()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

const handleSubmit = async () => {
  uni.showModal({
    title: '提示',
    content: '确定要交卷吗？交卷后无法修改答案',
    success: async (res) => {
      if (res.confirm) {
        submitting.value = true
        try {
          const result = await examRecordApi.submit(recordId.value)
          if (result.code === 200) {
            const examId = currentQuestion.value?.examId
            uni.removeStorageSync(`exam_end_time_${examId}`)
            uni.showToast({ title: '交卷成功', icon: 'success' })
            isViewMode.value = true
            leaveDetectionEnabled.value = false
            setTimeout(() => {
              uni.redirectTo({ url: '/pages/student/history' })
            }, 1000)
          } else {
            uni.showToast({ title: result.message || '交卷失败', icon: 'none' })
          }
        } catch (e) {
          uni.showToast({ title: e.message || '交卷失败', icon: 'none' })
        } finally {
          submitting.value = false
        }
      }
    }
  })
}

const handleTimeUp = async () => {
  if (isViewMode.value) return
  uni.showToast({ title: '考试时间到，已自动交卷', icon: 'none', duration: 2000 })
  try {
    await examRecordApi.autoSubmit(recordId.value)
    uni.redirectTo({ url: '/pages/student/history' })
  } catch (e) {
    uni.redirectTo({ url: '/pages/student/history' })
  }
}

onLoad((options) => {
  const examId = options.id
  if (examId) {
    loadExamData(examId)
  }
})

const loadExamData = async (examId) => {
  try {
    const res = await examRecordApi.getStudentExamRecord(examId)
    if (res.code === 200) {
      examInfo.value = res.data.exam
      questions.value = res.data.questions
      recordId.value = res.data.recordId
      isViewMode.value = res.data.isViewMode || false
      answerMap.value = res.data.answerMap || {}
      canViewPaper.value = res.data.canViewPaper || false
      studentScore.value = res.data.score || 0
      hasSubjectiveUngraded.value = res.data.hasSubjectiveUngraded || false

      if (res.data.studentAnswers) {
        Object.assign(answers, res.data.studentAnswers)
      }

      if (questions.value.length > 0) {
        currentQuestionId.value = questions.value[0].id
      }

      if (!isViewMode.value && res.data.remainingTime) {
        remainingTime.value = res.data.remainingTime
        startTimer()
        setupLeaveDetection()
        setupAutoSave()
      }
    } else {
      uni.showToast({ title: res.message || '加载失败', icon: 'none' })
    }
  } catch (e) {
    console.error(e)
    uni.showToast({ title: '网络错误', icon: 'none' })
  }
}

const startTimer = () => {
  timer = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
    } else {
      clearInterval(timer)
      handleTimeUp()
    }
  }, 1000)
}

const setupLeaveDetection = () => {
  leaveDetectionEnabled.value = true
  uni.onAppHide(() => {
    handleLeaveDetection()
  })
}

const handleLeaveDetection = async () => {
  if (!leaveDetectionEnabled.value || !recordId.value || examInfo.value?.status !== 'ONGOING') return

  leaveCount.value++

  if (leaveCount.value >= maxLeaveCount.value) {
    uni.showToast({ title: '离开次数过多，已自动交卷', icon: 'none', duration: 2000 })
    try {
      await examRecordApi.autoSubmit(recordId.value)
      uni.redirectTo({ url: '/pages/student/history' })
    } catch (e) {
      uni.redirectTo({ url: '/pages/student/history' })
    }
    return
  }

  uni.showModal({
    title: '警告',
    content: `您已离开考试页面！\n离开次数：${leaveCount.value} / ${maxLeaveCount.value}\n剩余 ${maxLeaveCount.value - leaveCount.value} 次机会，超出将自动交卷`,
    showCancel: false,
    confirmText: '继续作答'
  })

  try {
    await examRecordApi.reportLeave({
      recordId: recordId.value,
      leaveCount: leaveCount.value
    })
  } catch (e) {
    console.error(e)
  }
}

const setupAutoSave = () => {
  autoSaveTimer = setInterval(() => {
    saveAnswer()
  }, 30000)
}

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
})
</script>

<style scoped>
.exam-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.exam-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 32rpx;
  color: #fff;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.exam-title {
  font-size: 36rpx;
  font-weight: bold;
  flex: 1;
  margin-right: 20rpx;
}

.exam-status {
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.status-pending {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.status-ongoing {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.status-finished {
  background: rgba(144, 147, 153, 0.2);
  color: #909399;
}

.header-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.view-mode-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.score-text {
  font-size: 32rpx;
  font-weight: bold;
}

.tag {
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.tag-success {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.tag-warning {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.timer-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.timer {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 20rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12rpx;
  font-size: 28rpx;
}

.timer.warning {
  background: rgba(245, 108, 108, 0.8);
}

.save-btn, .submit-btn {
  padding: 10rpx 28rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
}

.save-btn {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.submit-btn {
  background: #f56c6c;
  color: #fff;
}

.exam-body {
  padding: 24rpx;
  padding-bottom: 180rpx;
}

.nav-toggle {
  position: fixed;
  right: 32rpx;
  bottom: 180rpx;
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.4);
  z-index: 100;
}

.nav-toggle text {
  font-size: 20rpx;
  color: #fff;
}

.question-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.question-tag {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.question-score {
  font-size: 28rpx;
  color: #666;
}

.question-number {
  font-size: 28rpx;
  color: #666;
}

.question-content-text {
  font-size: 32rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 32rpx;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 24rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s;
}

.option-item.selected {
  background: #ecf5ff;
  border-color: #409eff;
}

.option-item.correct {
  background: #f0f9ff;
  border-color: #67c23a;
}

.option-item.wrong {
  background: #fef0f0;
  border-color: #f56c6c;
}

.option-key {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #fff;
  border: 2rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.option-item.selected .option-key {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}

.option-item.correct .option-key {
  background: #67c23a;
  border-color: #67c23a;
  color: #fff;
}

.option-item.wrong .option-key {
  background: #f56c6c;
  border-color: #f56c6c;
  color: #fff;
}

.option-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
}

.question-input textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 24rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  font-size: 28rpx;
  line-height: 1.5;
}

.answer-comparison {
  margin-top: 24rpx;
  padding: 24rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
}

.answer-row {
  display: flex;
  margin-bottom: 16rpx;
}

.answer-row:last-child {
  margin-bottom: 0;
}

.answer-row .label {
  font-size: 28rpx;
  color: #666;
  margin-right: 16rpx;
}

.answer-row .value {
  font-size: 28rpx;
  color: #333;
}

.answer-row .value.correct {
  color: #67c23a;
}

.question-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 32rpx;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  background: #409eff;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
}

.action-btn:disabled {
  background: #f5f5f5;
  color: #999;
}

.no-question, .paper-locked {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 48rpx;
}

.locked-text {
  margin-top: 24rpx;
  font-size: 28rpx;
  color: #999;
  text-align: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

/* 答题卡抽屉 */
.nav-drawer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.nav-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 70vh;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #eee;
}

.nav-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.nav-close {
  padding: 8rpx;
}

.nav-body {
  flex: 1;
  padding: 32rpx;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.question-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.question-item {
  width: 64rpx;
  height: 64rpx;
  border-radius: 8rpx;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #333;
  border: 2rpx solid transparent;
}

.question-item.current {
  background: #409eff;
  color: #fff;
}

.question-item.answered {
  background: #67c23a;
  color: #fff;
}

.question-item.correct {
  background: #67c23a;
  color: #fff;
}

.question-item.wrong {
  background: #f56c6c;
  color: #fff;
}

.nav-legend {
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #eee;
}

.legend-row {
  display: flex;
  justify-content: center;
  gap: 40rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #666;
}

.dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 4rpx;
}

.dot.current {
  background: #409eff;
}

.dot.answered {
  background: #67c23a;
}

.dot.unanswered {
  background: #f5f5f5;
  border: 1rpx solid #ddd;
}

.dot.correct {
  background: #67c23a;
}

.dot.wrong {
  background: #f56c6c;
}
</style>