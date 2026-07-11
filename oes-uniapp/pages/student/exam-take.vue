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
            <text>⏱</text>
            <text>{{ formatTime(remainingTime) }}</text>
          </view>
          <button class="save-btn" @click="handleManualSave" :loading="saving">保存</button>
          <button class="submit-btn" @click="handleSubmit" :loading="submitting">交卷</button>
        </view>
      </view>
    </view>

    <view class="exam-body" v-if="!(isViewMode && !canViewPaper)">
      <view class="nav-toggle" @click="showNav = true">
        <text>📋</text>
        <text>答题卡</text>
      </view>

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

        <view v-if="isSingleChoiceOrJudgment(currentQuestion.type)" class="question-options">
          <view
            v-for="(item, index) in currentShuffledOptions"
            :key="item.key"
            class="option-item"
            :class="{
              selected: answers[currentQuestion.id] === item.key,
              correct: isViewMode && canViewPaper && isCorrectAnswer(currentQuestion.id, item.key),
              wrong: isViewMode && canViewPaper && answers[currentQuestion.id] === item.key && !isCorrectAnswer(currentQuestion.id, item.key)
            }"
            @click="handleSelect(item.key)"
          >
            <view class="option-key">{{ item.key }}</view>
            <text class="option-text">{{ item.label }}</text>
          </view>
        </view>

        <view v-else-if="currentQuestion.type === 'MULTIPLE_CHOICE'" class="question-options">
          <view
            v-for="(item, index) in currentShuffledOptions"
            :key="item.key"
            class="option-item"
            :class="{
              selected: isMultiSelected(currentQuestion.id, item.key),
              correct: isViewMode && canViewPaper && isCorrectAnswer(currentQuestion.id, item.key),
              wrong: isViewMode && canViewPaper && isMultiSelected(currentQuestion.id, item.key) && !isCorrectAnswer(currentQuestion.id, item.key)
            }"
            @click="handleMultiSelect(item.key)"
          >
            <view class="option-key">{{ item.key }}</view>
            <text class="option-text">{{ item.label }}</text>
          </view>
        </view>

        <view v-else class="question-input">
          <textarea
            v-model="answers[currentQuestion.id]"
            :placeholder="currentQuestion.type === 'FILL_BLANK' ? '请输入答案' : '请输入答案内容'"
            :maxlength="currentQuestion.type === 'FILL_BLANK' ? 500 : 2000"
            :disabled="isViewMode"
            @blur="saveAnswer"
          />

          <view v-if="isViewMode && canViewPaper" class="answer-comparison">
            <view class="answer-row">
              <text class="label">你的答案：</text>
              <text class="value">{{ answers[currentQuestion.id] || '未答' }}</text>
            </view>
            <view v-if="currentQuestion.type === 'FILL_BLANK'" class="answer-row">
              <text class="label">正确答案：</text>
              <text class="value correct">{{ currentQuestion.correctAnswer }}</text>
            </view>
          </view>
        </view>

        <view class="question-actions">
          <button class="action-btn" @click="prevQuestion" :disabled="isFirstQuestion">上一题</button>
          <button class="action-btn" @click="nextQuestion" :disabled="isLastQuestion">下一题</button>
        </view>
      </view>

      <view v-else class="no-question">
        <text>加载中...</text>
      </view>
    </view>

    <view v-else class="paper-locked">
      <text>🔒</text>
      <text class="locked-text">教师已关闭考后查看试卷权限，无法查看试卷内容</text>
    </view>

    <view v-if="showNav" class="nav-drawer" @click="showNav = false">
      <view class="nav-content" @click.stop>
        <view class="nav-header">
          <text class="nav-title">答题卡</text>
          <view class="nav-close" @click="showNav = false">
            <text>×</text>
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
                  current: isCurrentQuestion(q.id),
                  answered: isAnswered(q.id),
                  correct: isViewMode && canViewPaper && getQuestionResult(q.id) === true,
                  wrong: isViewMode && canViewPaper && getQuestionResult(q.id) === false
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
            <view class="legend-item"><view class="dot unanswered"></view><text>未答</text></view>
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { onLoad, onShow, onHide, onUnload } from '@dcloudio/uni-app'
import { examRecordApi, examApi } from '../../utils/api.js'

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
const isViewMode = ref(false)
const needShowLeaveWarning = ref(false)
const answerMap = ref({})
const canViewPaper = ref(false)
const studentScore = ref(0)
const showNav = ref(false)
const examStartTime = ref(0)
const examDuration = ref(0)

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

const getExamConfig = () => {
  try {
    const configStr = examInfo.value?.antiCheatConfig || examInfo.value?.config || '{}'
    return typeof configStr === 'string' ? JSON.parse(configStr) : configStr
  } catch (e) {
    return {}
  }
}

const currentShuffledOptions = computed(() => {
  if (!currentQuestion.value || !currentQuestion.value.options) return []
  const questionId = currentQuestion.value.id
  if (!shuffledOptionsMap[questionId]) {
    const original = parseOptions(currentQuestion.value.options)
    let options = Object.entries(original).map(([key, label]) => ({ key, label }))
    const examConfig = getExamConfig()
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

const isCorrectAnswer = (questionId, key) => {
  const question = questions.value.find(q => q.id === questionId)
  if (!question || !question.correctAnswer) return false
  const correctKeys = question.correctAnswer.split(',').map(k => k.trim())
  return correctKeys.indexOf(key) > -1
}

const isMultiSelected = (questionId, key) => {
  const answer = multiAnswers[questionId]
  if (!answer || !Array.isArray(answer)) return false
  return answer.indexOf(key) > -1
}

const isSingleChoiceOrJudgment = (type) => {
  return type === 'SINGLE_CHOICE' || type === 'JUDGMENT'
}

const isCurrentQuestion = (questionId) => {
  return currentQuestionId.value === questionId
}

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const parseOptions = (options) => {
  if (!options) return {}
  if (Array.isArray(options)) {
    const result = {}
    options.forEach((item, idx) => {
      const key = String.fromCharCode(65 + idx)
      if (typeof item === 'object') {
        result[key] = item.content || item.text || ''
      } else {
        result[key] = String(item)
      }
    })
    return result
  }
  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options)
      if (Array.isArray(parsed)) {
        const result = {}
        parsed.forEach((item, idx) => {
          const key = String.fromCharCode(65 + idx)
          if (typeof item === 'object') {
            result[key] = item.content || item.text || ''
          } else {
            result[key] = String(item)
          }
        })
        return result
      }
    } catch (e) {
      const parts = options.split('|').filter(o => o.trim())
      const result = {}
      parts.forEach((part, idx) => {
        const key = String.fromCharCode(65 + idx)
        result[key] = part.trim()
      })
      return result
    }
  }
  return {}
}

const seededRandom = (seed) => {
  const x = Math.sin(seed++) * 10000
  return x - Math.floor(x)
}

const shuffleArray = (array, seed = Date.now()) => {
  const shuffled = [...array]
  let random = seededRandom.bind(null, seed)
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const shuffleQuestionsByType = (questions) => {
  const typeOrder = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'JUDGMENT', 'FILL_BLANK', 'ESSAY', 'PROGRAMMING']
  const result = []
  
  for (const type of typeOrder) {
    const typeQuestions = questions.filter(q => q.type === type)
    if (typeQuestions.length > 0) {
      result.push(...shuffleArray(typeQuestions))
    }
  }
  
  return result
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
  if (isViewMode.value) return
  if (!recordId.value) {
    console.error('保存答案失败: recordId为空')
    return
  }
  try {
    const allAnswers = {}
    for (const [qId, value] of Object.entries(answers)) {
      if (value && value.trim() !== '') {
        allAnswers[String(qId)] = String(value)
      }
    }
    for (const [qId, value] of Object.entries(multiAnswers)) {
      if (Array.isArray(value) && value.length > 0) {
        allAnswers[String(qId)] = value.join(',')
      }
    }
    if (Object.keys(allAnswers).length === 0) return
    const saveResult = await examRecordApi.autoSave({
      recordId: Number(recordId.value),
      answers: allAnswers
    })
    console.log('保存答案结果:', saveResult)
  } catch (e) {
    console.error('保存答案失败:', e)
  }
}

const handleManualSave = async () => {
  if (isViewMode.value) return
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
  if (isViewMode.value) return
  uni.showModal({
    title: '提示',
    content: '确定要交卷吗？交卷后无法修改答案',
    success: async (res) => {
      if (res.confirm) {
        submitting.value = true
        try {
          const result = await examRecordApi.submit(recordId.value)
          if (result.code === 200) {
            uni.showToast({ title: '交卷成功', icon: 'success' })
            isViewMode.value = true
            setTimeout(() => {
              uni.redirectTo({ url: '/pages/student/history' })
            }, 1500)
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
  } catch (e) {
    console.error(e)
  }
  setTimeout(() => {
    uni.redirectTo({ url: '/pages/student/history' })
  }, 2000)
}

const recalculateRemainingTime = () => {
  if (!examStartTime.value || isViewMode.value) return
  const totalSeconds = examDuration.value * 60
  const elapsedSeconds = Math.floor((Date.now() - examStartTime.value) / 1000)
  remainingTime.value = Math.max(0, totalSeconds - elapsedSeconds)
}

const startTimer = () => {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    recalculateRemainingTime()
    if (remainingTime.value <= 0) {
      clearInterval(timer)
      handleTimeUp()
    }
  }, 1000)
}

const setupAutoSave = () => {
  if (autoSaveTimer) clearInterval(autoSaveTimer)
  autoSaveTimer = setInterval(() => {
    saveAnswer()
  }, 30000)
}

const handleLeaveDetection = async () => {
  if (!recordId.value || isViewMode.value) return
  
  const examConfig = getExamConfig()
  if (!examConfig.leaveDetection) return

  leaveCount.value++
  console.log('检测到离开，当前离开次数:', leaveCount.value)

  if (examConfig.maxLeaveCount !== undefined) {
    maxLeaveCount.value = examConfig.maxLeaveCount
  }

  uni.setStorageSync(`leaveWarning_${recordId.value}`, {
    needShow: true,
    leaveCount: leaveCount.value,
    maxLeaveCount: maxLeaveCount.value
  })

  if (leaveCount.value >= maxLeaveCount.value) {
    uni.showModal({
      title: '警告',
      content: `您已离开考试页面${leaveCount.value}次，已达到上限！\n系统将自动交卷。`,
      showCancel: false,
      confirmText: '确定',
      success: async () => {
        try {
          await examRecordApi.autoSubmit(recordId.value)
        } catch (e) {
          console.error(e)
        }
        uni.redirectTo({ url: '/pages/student/history' })
      }
    })
    return
  }

  uni.showModal({
    title: '警告',
    content: `您已离开考试页面${leaveCount.value}次！\n再离开${maxLeaveCount.value - leaveCount.value}次将被强制收卷。`,
    showCancel: false,
    confirmText: '知道了'
  })

  try {
    await examRecordApi.reportLeave({
      recordId: recordId.value,
      leaveCount: leaveCount.value
    })
  } catch (e) {
    console.error('上报离开失败:', e)
  }
}

const loadExamData = async (examId, reviewRecordId, isReview) => {
  try {
    if (isReview && reviewRecordId) {
      isViewMode.value = true
      
      const res = await examRecordApi.getById(reviewRecordId)
      if (res.code === 200) {
        examInfo.value = res.data.exam
        questions.value = res.data.questions || []
        recordId.value = res.data.id
        answerMap.value = res.data.answerMap || {}
        studentScore.value = res.data.score || 0
        try {
              const examConfig = typeof res.data.exam?.antiCheatConfig === 'string' ? JSON.parse(res.data.exam?.antiCheatConfig) : (res.data.exam?.antiCheatConfig || {})
              canViewPaper.value = res.data.exam?.allowViewAfterExam !== 0 && examConfig.viewPaperAfterExam !== false
            } catch (e) {
              canViewPaper.value = res.data.exam?.allowViewAfterExam !== 0
            }

        if (res.data.studentAnswers) {
          Object.assign(answers, typeof res.data.studentAnswers === 'string' ? JSON.parse(res.data.studentAnswers) : res.data.studentAnswers)
        }

        if (questions.value.length > 0) {
          currentQuestionId.value = questions.value[0].id
        }
      } else {
        uni.showToast({ title: res.message || '加载失败', icon: 'none' })
      }
    } else {
      const examRes = await examApi.getById(examId)
      if (examRes.code === 200) {
        examInfo.value = examRes.data
        
        const isExamFinished = examInfo.value.status === 'FINISHED'
        if (isExamFinished) {
          isViewMode.value = true
          
          const recRes = await examRecordApi.page({ examId: Number(examId) })
          if (recRes.code === 200 && recRes.data.records.length > 0) {
            const record = recRes.data.records[0]
            recordId.value = record.id
            studentScore.value = record.score || 0
            answerMap.value = record.answerMap || {}
            try {
              const examConfig = typeof examInfo.value?.antiCheatConfig === 'string' ? JSON.parse(examInfo.value?.antiCheatConfig) : (examInfo.value?.antiCheatConfig || {})
              canViewPaper.value = examInfo.value?.allowViewAfterExam !== 0 && examConfig.viewPaperAfterExam !== false
            } catch (e) {
              canViewPaper.value = examInfo.value?.allowViewAfterExam !== 0
            }
            
            if (record.studentAnswers || record.answers) {
              Object.assign(answers, typeof (record.studentAnswers || record.answers) === 'string' ? JSON.parse(record.studentAnswers || record.answers) : (record.studentAnswers || record.answers))
            }
          }
        }
        
        let existingRecord = null
        if (examInfo.value.paperId) {
          const qRes = await examRecordApi.page({ examId: Number(examId) })
          if (qRes.code === 200 && qRes.data.records.length > 0) {
            existingRecord = qRes.data.records.find(r => r.status === 'ONGOING')
          }
        }
        
        const startRes = await examRecordApi.start({ examId: Number(examId) })
        console.log('start接口返回:', JSON.stringify(startRes))
        if (startRes.code === 200) {
          console.log('questions原始数据长度:', (startRes.data.questions || []).length)
          questions.value = startRes.data.questions || []
          console.log('questions设置后长度:', questions.value.length)
          
          if (!recordId.value) {
            recordId.value = startRes.data.recordId
          }
          
          const recordStatus = startRes.data.record?.status
          console.log('record状态:', recordStatus)
          
          if (recordStatus === 'SUBMITTED' || recordStatus === 'AUTO_SUBMITTED') {
            isViewMode.value = true
            studentScore.value = startRes.data.record?.score || 0
          }
          
          try {
              const examConfig = typeof examInfo.value?.antiCheatConfig === 'string' ? JSON.parse(examInfo.value?.antiCheatConfig) : (examInfo.value?.antiCheatConfig || {})
              canViewPaper.value = examInfo.value?.allowViewAfterExam !== 0 && examConfig.viewPaperAfterExam !== false
            } catch (e) {
              canViewPaper.value = examInfo.value?.allowViewAfterExam !== 0
            }
          answerMap.value = startRes.data.answerMap || {}
          
          if (startRes.data.studentAnswers) {
            console.log('恢复已保存答案:', startRes.data.studentAnswers)
            Object.assign(answers, typeof startRes.data.studentAnswers === 'string' ? JSON.parse(startRes.data.studentAnswers) : startRes.data.studentAnswers)
          }
          console.log('恢复后answers:', answers)
          
          if (startRes.data.leaveCount !== undefined) {
            leaveCount.value = startRes.data.leaveCount
          }

          const examConfig = getExamConfig()
          if (examConfig.shuffleQuestions && !isViewMode.value) {
            questions.value = shuffleQuestionsByType(questions.value)
          }

          if (questions.value.length > 0) {
            currentQuestionId.value = questions.value[0].id
          }

          if (!isViewMode.value) {
            examDuration.value = examInfo.value.duration || 0
            
            if (!examStartTime.value) {
              if (startRes.data.startTime) {
                console.log('使用后端返回的startTime:', startRes.data.startTime)
                examStartTime.value = new Date(startRes.data.startTime).getTime()
              } else if (startRes.data.record?.submitTime && examDuration.value > 0) {
                console.log('startTime为空，使用submitTime倒推')
                examStartTime.value = new Date(startRes.data.record.submitTime).getTime() - examDuration.value * 60 * 1000
              } else {
                console.log('使用当前时间作为startTime')
                examStartTime.value = Date.now()
              }
            }
            console.log('examStartTime:', examStartTime.value, ', examDuration:', examDuration.value)
            
            recalculateRemainingTime()
            console.log('剩余时间:', remainingTime.value)
            startTimer()
            setupAutoSave()
          }
        }
      } else {
        uni.showToast({ title: examRes.message || '加载失败', icon: 'none' })
      }
    }
  } catch (e) {
    console.error('加载失败:', e)
    uni.showToast({ title: '网络错误', icon: 'none' })
  }
}

onLoad((options) => {
  const examId = options.id
  const reviewRecordId = options.recordId
  const isReview = options.review === '1'
  if (examId) {
    loadExamData(examId, reviewRecordId, isReview)
  }
})

onShow(() => {
  console.log('onShow触发')
  if (!isViewMode.value && examStartTime.value) {
    recalculateRemainingTime()
  }
  
  const warningData = uni.getStorageSync(`leaveWarning_${recordId.value}`)
  if (warningData && warningData.needShow) {
    console.log('显示离开警告弹窗')
    uni.removeStorageSync(`leaveWarning_${recordId.value}`)
    uni.showModal({
      title: '警告',
      content: `您已离开考试页面！\n离开次数：${warningData.leaveCount} / ${warningData.maxLeaveCount}\n剩余 ${warningData.maxLeaveCount - warningData.leaveCount} 次机会，超出将自动交卷`,
      showCancel: false,
      confirmText: '继续作答'
    })
  }
})

onHide(() => {
  console.log('onHide触发')
  handleLeaveDetection()
})

onMounted(() => {
  uni.onAppHide(() => {
    console.log('AppHide触发')
    handleLeaveDetection()
  })
  
  uni.onAppShow(() => {
    if (!isViewMode.value && examStartTime.value) {
      recalculateRemainingTime()
    }
  })
})

onUnload(() => {
  console.log('onUnload触发')
  handleLeaveDetection()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
  uni.offAppHide()
  uni.offAppShow()
})
</script>

<style scoped>
.exam-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.exam-header {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
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
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  box-shadow: 0 4rpx 16rpx rgba(220, 38, 38, 0.4);
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
  background: #fef2f2;
  border-color: #dc2626;
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
  background: #dc2626;
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

.no-question text, .paper-locked text {
  font-size: 48rpx;
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
  font-size: 48rpx;
  color: #999;
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
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16rpx;
}

.question-item {
  height: 80rpx;
  border-radius: 12rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
  color: #666;
  border: 3rpx solid #e8e8e8;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.question-item:active {
  transform: scale(0.96);
}

.question-item.current {
  background: linear-gradient(135deg, #409eff 0%, #3b82f6 100%);
  color: #fff;
  border-color: #409eff;
  box-shadow: 0 4rpx 16rpx rgba(64, 158, 255, 0.4);
}

.question-item.answered {
  background: linear-gradient(135deg, #67c23a 0%, #52c41a 100%);
  color: #fff;
  border-color: #67c23a;
  box-shadow: 0 4rpx 16rpx rgba(103, 196, 58, 0.4);
}

.question-item.correct {
  background: linear-gradient(135deg, #67c23a 0%, #52c41a 100%);
  color: #fff;
  border-color: #67c23a;
  box-shadow: 0 4rpx 16rpx rgba(103, 196, 58, 0.4);
}

.question-item.wrong {
  background: #fff;
  border-color: #f56c6c;
  color: #f56c6c;
  box-shadow: 0 4rpx 16rpx rgba(245, 108, 108, 0.3);
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
  background: #f5f5f5;
  border: 1rpx solid #ddd;
}
</style>
