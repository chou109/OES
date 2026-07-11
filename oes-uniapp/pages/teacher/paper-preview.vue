<template>
  <view class="paper-preview">
    <view class="page-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="title">试卷预览</text>
      <view class="header-right"></view>
    </view>

    <view class="exam-header">
      <text class="exam-title">{{ paper.title }}</text>
      <view class="exam-meta">
        <view class="meta-item">
          <text class="meta-icon">📚</text>
          <text>{{ getSubjectName(paper.subjectId) }}</text>
        </view>
        <view class="meta-item">
          <text class="meta-icon">⏱</text>
          <text>{{ paper.duration }}分钟</text>
        </view>
        <view class="meta-item">
          <text class="meta-icon">📝</text>
          <text>{{ questions.length }}道题</text>
        </view>
        <view class="meta-item">
          <text class="meta-icon">🏆</text>
          <text>{{ paper.totalScore }}分</text>
        </view>
      </view>
    </view>

    <scroll-view class="question-area" scroll-y v-if="currentQuestion">
      <view class="question-card">
        <view class="question-header">
          <view class="question-type">
            <text>{{ getTypeText(currentQuestion.type) }}</text>
          </view>
          <view class="question-score">
            <text>{{ currentQuestion.score }}分</text>
          </view>
        </view>
        
        <view class="question-content">
          <text class="question-number">{{ currentIndex + 1 }}.</text>
          <text class="content-text">{{ currentQuestion.content }}</text>
        </view>

        <view class="options-list" v-if="currentQuestion.type !== 'FILL_BLANK' && currentQuestion.type !== 'ESSAY'">
          <view class="option-item" v-for="(opt, idx) in parseOptions(currentQuestion.options)" :key="idx">
            <text class="option-label">{{ String.fromCharCode(65 + idx) }}.</text>
            <text class="option-text">{{ opt }}</text>
          </view>
        </view>

        <view class="answer-section">
          <text class="answer-label">正确答案：</text>
          <text class="answer-text correct">{{ formatAnswer(currentQuestion) }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="nav-footer">
      <button :class="['nav-btn', currentIndex === 0 ? 'disabled' : '']" @click="prevQuestion" :disabled="currentIndex === 0">
        <text>上一题</text>
      </button>
      
      <view class="question-indicator">
        <text>{{ currentIndex + 1 }} / {{ questions.length }}</text>
      </view>
      
      <button :class="['nav-btn', currentIndex === questions.length - 1 ? 'disabled' : '']" @click="nextQuestion" :disabled="currentIndex === questions.length - 1">
        <text>下一题</text>
      </button>
    </view>

    <view class="answer-card-btn" @click="showAnswerCard = !showAnswerCard">
      <text class="answer-card-icon">📋</text>
      <text class="answer-card-text">答题卡</text>
    </view>

    <view class="answer-card-modal" v-if="showAnswerCard" @click="showAnswerCard = false">
    <view class="answer-card-content" @click.stop>
      <view class="card-header">
        <text class="card-title">答题卡</text>
        <view class="close-btn" @click="showAnswerCard = false">
          <text class="close-icon">×</text>
        </view>
      </view>
      
      <scroll-view class="card-body" scroll-y>
        <view class="question-section" v-if="singleQuestions.length > 0">
          <view class="section-title">单选题 ({{ singleQuestions.length }}题)</view>
          <view class="question-grid">
            <view 
              :class="['question-item', getQuestionIndex(q) === currentIndex ? 'current' : '']" 
              v-for="q in singleQuestions" 
              :key="q.id"
              @click="jumpToQuestion(getQuestionIndex(q))"
            >
              <text>{{ getQuestionIndex(q) + 1 }}</text>
            </view>
          </view>
        </view>

        <view class="question-section" v-if="multiQuestions.length > 0">
          <view class="section-title">多选题 ({{ multiQuestions.length }}题)</view>
          <view class="question-grid">
            <view 
              :class="['question-item', getQuestionIndex(q) === currentIndex ? 'current' : '']" 
              v-for="q in multiQuestions" 
              :key="q.id"
              @click="jumpToQuestion(getQuestionIndex(q))"
            >
              <text>{{ getQuestionIndex(q) + 1 }}</text>
            </view>
          </view>
        </view>

        <view class="question-section" v-if="judgeQuestions.length > 0">
          <view class="section-title">判断题 ({{ judgeQuestions.length }}题)</view>
          <view class="question-grid">
            <view 
              :class="['question-item', getQuestionIndex(q) === currentIndex ? 'current' : '']" 
              v-for="q in judgeQuestions" 
              :key="q.id"
              @click="jumpToQuestion(getQuestionIndex(q))"
            >
              <text>{{ getQuestionIndex(q) + 1 }}</text>
            </view>
          </view>
        </view>

        <view class="question-section" v-if="fillQuestions.length > 0">
          <view class="section-title">填空题 ({{ fillQuestions.length }}题)</view>
          <view class="question-grid">
            <view 
              :class="['question-item', getQuestionIndex(q) === currentIndex ? 'current' : '']" 
              v-for="q in fillQuestions" 
              :key="q.id"
              @click="jumpToQuestion(getQuestionIndex(q))"
            >
              <text>{{ getQuestionIndex(q) + 1 }}</text>
            </view>
          </view>
        </view>

        <view class="question-section" v-if="essayQuestions.length > 0">
          <view class="section-title">简答题 ({{ essayQuestions.length }}题)</view>
          <view class="question-grid">
            <view 
              :class="['question-item', getQuestionIndex(q) === currentIndex ? 'current' : '']" 
              v-for="q in essayQuestions" 
              :key="q.id"
              @click="jumpToQuestion(getQuestionIndex(q))"
            >
              <text>{{ getQuestionIndex(q) + 1 }}</text>
            </view>
          </view>
        </view>
      </scroll-view>

      <view class="card-legend">
        <view class="legend-row">
          <view class="legend-item">
            <view class="dot current"></view>
            <text>当前</text>
          </view>
          <view class="legend-item">
            <view class="dot unanswered"></view>
            <text>未答</text>
          </view>
        </view>
      </view>
    </view>
  </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { paperApi, subjectApi } from '../../utils/api.js'

const paperId = ref('')
const paper = reactive({
  title: '',
  subjectId: '',
  duration: 0,
  totalScore: 0,
  description: ''
})

const subjects = ref([])
const questions = ref([])
const currentIndex = ref(0)
const showAnswerCard = ref(false)

const goBack = () => {
  uni.navigateBack()
}

const getSubjectName = (subjectId) => {
  const subject = subjects.value.find(s => s.id === subjectId)
  return subject ? subject.name : '未知科目'
}

const getTypeText = (type) => {
  return {
    SINGLE_CHOICE: '单选题',
    MULTIPLE_CHOICE: '多选题',
    JUDGMENT: '判断题',
    FILL_BLANK: '填空题',
    ESSAY: '简答题'
  }[type] || type
}

const parseOptions = (options) => {
  if (!options) return []
  if (Array.isArray(options)) {
    return options.map(opt => {
      if (typeof opt === 'object') {
        return opt.text || opt.content || JSON.stringify(opt)
      }
      return String(opt)
    })
  }
  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options)
      if (Array.isArray(parsed)) {
        return parsed.map(opt => {
          if (typeof opt === 'object') {
            return opt.text || opt.content || JSON.stringify(opt)
          }
          return String(opt)
        })
      }
    } catch (e) {
      return options.split('|').filter(o => o.trim())
    }
  }
  return []
}

const formatAnswer = (q) => {
  const answer = q.answer || q.correctAnswer
  if (!answer) return ''
  if (q.type === 'JUDGMENT') {
    return answer === 'A' || answer === '正确' ? '正确' : '错误'
  }
  return answer
}

const currentQuestion = computed(() => questions.value[currentIndex.value])

const singleQuestions = computed(() => questions.value.filter(q => q.type === 'SINGLE_CHOICE'))
const multiQuestions = computed(() => questions.value.filter(q => q.type === 'MULTIPLE_CHOICE'))
const judgeQuestions = computed(() => questions.value.filter(q => q.type === 'JUDGMENT'))
const fillQuestions = computed(() => questions.value.filter(q => q.type === 'FILL_BLANK'))
const essayQuestions = computed(() => questions.value.filter(q => q.type === 'ESSAY'))

const getQuestionIndex = (q) => {
  return questions.value.findIndex(item => item.id === q.id)
}

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const nextQuestion = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
  }
}

const jumpToQuestion = (index) => {
  currentIndex.value = index
  showAnswerCard.value = false
}

const loadPaperInfo = async () => {
  try {
    const res = await paperApi.getById(paperId.value)
    if (res.code === 200) {
      Object.assign(paper, res.data)
    }
  } catch (e) {
    console.error('加载试卷信息失败:', e)
  }
}

const loadQuestions = async () => {
  try {
    const res = await paperApi.getQuestions(paperId.value)
    if (res.code === 200) {
      questions.value = res.data || []
    }
  } catch (e) {
    console.error('加载题目失败:', e)
  }
}

const loadSubjects = async () => {
  try {
    const res = await subjectApi.list()
    if (res.code === 200) {
      subjects.value = res.data
    }
  } catch (e) {
    console.error('加载科目失败:', e)
  }
}

onLoad((options) => {
  paperId.value = options.id
  loadSubjects()
  loadPaperInfo()
  loadQuestions()
})
</script>

<style scoped>
.paper-preview {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: #fff;
  border-bottom: 1rpx solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  padding: 8rpx;
  .back-icon {
    font-size: 48rpx;
    color: #333;
    font-weight: bold;
  }
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.exam-header {
  background: #fff;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.exam-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  text-align: center;
  margin-bottom: 24rpx;
}

.exam-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  justify-content: center;
  .meta-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 26rpx;
    color: #666;
    .meta-icon {
      font-size: 28rpx;
    }
  }
}

.question-area {
  flex: 1;
  padding: 24rpx;
}

.question-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  
  .question-type {
    padding: 8rpx 20rpx;
    background: #f0f9ff;
    border-radius: 8rpx;
    font-size: 26rpx;
    color: #409eff;
  }
  
  .question-score {
    font-size: 28rpx;
    color: #dc2626;
    font-weight: bold;
  }
}

.question-content {
  margin-bottom: 24rpx;
  
  .question-number {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-right: 8rpx;
  }
  
  .content-text {
    font-size: 32rpx;
    color: #333;
    line-height: 1.6;
  }
}

.options-list {
  padding-left: 24rpx;
  margin-bottom: 24rpx;
  
  .option-item {
    display: flex;
    align-items: flex-start;
    padding: 16rpx 0;
    
    .option-label {
      font-size: 30rpx;
      color: #666;
      width: 48rpx;
    }
    
    .option-text {
      font-size: 30rpx;
      color: #333;
      flex: 1;
      line-height: 1.5;
    }
  }
}

.answer-section {
  padding-top: 20rpx;
  border-top: 1rpx dashed #eee;
  
  .answer-label {
    font-size: 28rpx;
    color: #999;
  }
  
  .answer-text {
    font-size: 28rpx;
    font-weight: bold;
    
    &.correct {
      color: #67c23a;
    }
  }
}

.nav-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: #fff;
  border-top: 1rpx solid #eee;
  
  .nav-btn {
    width: 180rpx;
    height: 80rpx;
    line-height: 80rpx;
    background: #f5f5f5;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #333;
    border: none;
    
    &.disabled {
      opacity: 0.5;
      pointer-events: none;
    }
  }
  
  .question-indicator {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }
}

.answer-card-btn {
  position: fixed;
  right: 32rpx;
  bottom: 180rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  background: #dc2626;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(220, 38, 38, 0.3);
  
  .answer-card-icon {
    font-size: 40rpx;
  }
  
  .answer-card-text {
    font-size: 24rpx;
    color: #fff;
    margin-top: 8rpx;
  }
}

.answer-card-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.answer-card-content {
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

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #eee;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.close-btn {
  padding: 8rpx;
}

.close-icon {
  font-size: 48rpx;
  color: #999;
}

.card-body {
  flex: 1;
  padding: 32rpx;
  overflow-y: auto;
}

.question-section {
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

.card-legend {
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

.dot.unanswered {
  background: #f5f5f5;
  border: 1rpx solid #ddd;
}
</style>