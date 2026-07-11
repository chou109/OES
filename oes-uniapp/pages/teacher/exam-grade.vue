<template>
  <view class="exam-grade">
    <view class="page-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="title">评分</text>
      <view class="header-right"></view>
    </view>

    <scroll-view class="grade-body" scroll-y>
      <view class="info-card">
        <text class="exam-title">{{ examInfo.title }}</text>
        <view class="student-info">
          <text class="student-name">{{ recordInfo.studentName }}</text>
          <text class="current-score">当前得分：{{ recordInfo.score || 0 }} / {{ examInfo.totalScore }}分</text>
        </view>
      </view>

      <view class="question-list">
        <view class="question-item" v-for="(q, index) in questions" :key="q.id">
          <view class="question-header">
            <view class="question-type">
              <text>{{ getTypeText(q.type) }}</text>
            </view>
            <view class="question-score">
              <text>{{ q.score }}分</text>
            </view>
            <text class="question-number">第{{ index + 1 }}题</text>
          </view>

          <text class="question-content">{{ q.content }}</text>

          <view class="options-list" v-if="q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE'">
            <view :class="['option-item', getOptionClass(q, idx)]" v-for="(opt, idx) in parseOptions(q.options)" :key="idx">
              <text class="option-label">{{ String.fromCharCode(65 + idx) }}.</text>
              <text class="option-text">{{ opt }}</text>
              <text v-if="isCorrectOption(q, idx)" class="correct-mark">✓</text>
              <text v-if="isStudentAnswer(q, idx) && !isCorrectOption(q, idx)" class="wrong-mark">✗</text>
            </view>
          </view>

          <view class="answer-section">
            <view class="answer-row">
              <text class="answer-label">学生答案：</text>
              <text :class="['answer-text', isCorrectAnswer(q) ? 'correct' : 'wrong']">
                {{ getStudentAnswer(q) || '未作答' }}
              </text>
            </view>
            <view class="answer-row">
              <text class="answer-label">正确答案：</text>
              <text class="answer-text correct">{{ formatAnswer(q) }}</text>
            </view>
          </view>

          <view v-if="isSubjective(q.type)" class="grade-section">
            <text class="grade-label">评分（0-{{ q.score }}分）</text>
            <view class="grade-input-row">
              <input class="grade-input" type="number" v-model="grades[q.id]" :max="q.score" placeholder="0" />
              <text class="grade-unit">分</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="grade-footer">
      <button class="submit-btn" @click="submitGrade">提交评分</button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { examRecordApi, examApi, paperApi, subjectApi } from '../../utils/api.js'

const recordId = ref('')
const examId = ref('')

const examInfo = reactive({
  title: '',
  subjectId: '',
  duration: 0,
  totalScore: 0
})

const recordInfo = reactive({
  studentName: '',
  score: 0,
  submitTime: '',
  duration: 0,
  status: ''
})

const subjects = ref([])
const questions = ref([])
const studentAnswers = ref({})
const grades = reactive({})

const goBack = () => {
  uni.navigateBack()
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

const isSubjective = (type) => {
  return type === 'FILL_BLANK' || type === 'ESSAY'
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

const getStudentAnswer = (q) => {
  return studentAnswers.value[q.id]
}

const isCorrectAnswer = (q) => {
  const studentAnswer = studentAnswers.value[q.id]
  if (!studentAnswer) return false
  return studentAnswer === q.correctAnswer
}

const isCorrectOption = (q, idx) => {
  if (!q.correctAnswer) return false
  const optionLetter = String.fromCharCode(65 + idx)
  return q.correctAnswer.includes(optionLetter)
}

const isStudentAnswer = (q, idx) => {
  const studentAnswer = studentAnswers.value[q.id]
  if (!studentAnswer) return false
  const optionLetter = String.fromCharCode(65 + idx)
  return studentAnswer.includes(optionLetter)
}

const getOptionClass = (q, idx) => {
  const classes = []
  if (isCorrectOption(q, idx)) {
    classes.push('correct')
  }
  if (isStudentAnswer(q, idx)) {
    if (isCorrectOption(q, idx)) {
      classes.push('selected')
    } else {
      classes.push('selected wrong')
    }
  }
  return classes.join(' ')
}

const loadRecord = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    
    const res = await examRecordApi.getById(recordId.value)
    if (res.code === 200) {
      const data = res.data
      recordInfo.studentName = data.studentName
      recordInfo.score = data.score || 0
      recordInfo.submitTime = data.submitTime
      recordInfo.duration = data.duration
      recordInfo.status = data.status
      
      if (data.answers) {
        try {
          studentAnswers.value = typeof data.answers === 'string' ? JSON.parse(data.answers) : data.answers
        } catch (e) {
          console.error('解析答案失败:', e)
        }
      }
      
      if (data.exam) {
        Object.assign(examInfo, data.exam)
        
        if (data.questions) {
          questions.value = data.questions || []
          questions.value.forEach(q => {
            if (isSubjective(q.type)) {
              grades[q.id] = ''
            }
          })
        }
      }
    }
    
    if (!examInfo.title) {
      const examRes = await examApi.getById(examId.value)
      if (examRes.code === 200) {
        Object.assign(examInfo, examRes.data)
        
        if (examRes.data.paperId && questions.value.length === 0) {
          const qRes = await paperApi.getQuestions(examRes.data.paperId)
          if (qRes.code === 200) {
            questions.value = qRes.data || []
            questions.value.forEach(q => {
              if (isSubjective(q.type)) {
                grades[q.id] = ''
              }
            })
          }
        }
      }
    }
  } catch (e) {
    console.error('加载失败:', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const submitGrade = async () => {
  try {
    uni.showLoading({ title: '评分中...' })
    
    const gradeData = {}
    let hasGrade = false
    
    questions.value.forEach(q => {
      if (isSubjective(q.type) && grades[q.id] !== '') {
        const score = parseInt(grades[q.id])
        if (!isNaN(score) && score >= 0 && score <= q.score) {
          gradeData[q.id] = score
          hasGrade = true
        }
      }
    })
    
    if (!hasGrade) {
      uni.showToast({ title: '请至少给一道题评分', icon: 'none' })
      return
    }
    
    const res = await examRecordApi.grade(recordId.value, { grades: gradeData })
    if (res.code === 200) {
      uni.showToast({ title: '评分成功', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      uni.showToast({ title: res.message || '评分失败', icon: 'none' })
    }
  } catch (e) {
    console.error('评分失败:', e)
    uni.showToast({ title: '评分失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

onLoad((options) => {
  recordId.value = options.recordId
  examId.value = options.examId
  loadRecord()
})
</script>

<style scoped>
.exam-grade {
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

.grade-body {
  flex: 1;
  padding: 24rpx;
}

.info-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.exam-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  text-align: center;
  margin-bottom: 20rpx;
}

.student-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .student-name {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }
  
  .current-score {
    font-size: 28rpx;
    color: #dc2626;
    font-weight: bold;
  }
}

.question-list {
  .question-item {
    background: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 24rpx;
    
    .question-header {
      display: flex;
      align-items: center;
      margin-bottom: 16rpx;
      
      .question-type {
        padding: 8rpx 20rpx;
        background: #f0f9ff;
        border-radius: 8rpx;
        font-size: 26rpx;
        color: #409eff;
        margin-right: 16rpx;
      }
      
      .question-score {
        font-size: 28rpx;
        color: #dc2626;
        font-weight: bold;
        margin-right: auto;
      }
      
      .question-number {
        font-size: 26rpx;
        color: #999;
      }
    }
    
    .question-content {
      font-size: 30rpx;
      color: #333;
      line-height: 1.6;
      display: block;
      margin-bottom: 16rpx;
    }
    
    .options-list {
      padding-left: 24rpx;
      margin-bottom: 16rpx;
      
      .option-item {
        display: flex;
        align-items: center;
        padding: 12rpx 16rpx;
        margin-bottom: 8rpx;
        border-radius: 8rpx;
        
        &.correct {
          background: rgba(103, 194, 58, 0.1);
        }
        
        &.selected {
          background: rgba(64, 158, 255, 0.1);
        }
        
        &.wrong {
          background: rgba(245, 108, 108, 0.1);
        }
        
        .option-label {
          font-size: 28rpx;
          color: #666;
          width: 40rpx;
        }
        
        .option-text {
          font-size: 28rpx;
          color: #333;
          flex: 1;
        }
        
        .correct-mark {
          font-size: 28rpx;
          color: #67c23a;
          font-weight: bold;
        }
        
        .wrong-mark {
          font-size: 28rpx;
          color: #f56c6c;
          font-weight: bold;
        }
      }
    }
    
    .answer-section {
      padding-left: 24rpx;
      margin-bottom: 16rpx;
      
      .answer-row {
        display: flex;
        margin-bottom: 8rpx;
        
        .answer-label {
          font-size: 26rpx;
          color: #999;
          width: 140rpx;
        }
        
        .answer-text {
          font-size: 26rpx;
          font-weight: bold;
          
          &.correct {
            color: #67c23a;
          }
          
          &.wrong {
            color: #f56c6c;
          }
        }
      }
    }
    
    .grade-section {
      padding-top: 20rpx;
      border-top: 1rpx dashed #eee;
      
      .grade-label {
        font-size: 28rpx;
        color: #666;
        display: block;
        margin-bottom: 12rpx;
      }
      
      .grade-input-row {
        display: flex;
        align-items: center;
        
        .grade-input {
          width: 200rpx;
          height: 80rpx;
          background: #f5f5f5;
          border-radius: 12rpx;
          padding: 0 20rpx;
          font-size: 32rpx;
          color: #333;
        }
        
        .grade-unit {
          font-size: 28rpx;
          color: #666;
          margin-left: 12rpx;
        }
      }
    }
  }
}

.grade-footer {
  padding: 24rpx;
  background: #fff;
  border-top: 1rpx solid #eee;
  
  .submit-btn {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    background: #dc2626;
    color: #fff;
    border-radius: 12rpx;
    font-size: 32rpx;
  }
}
</style>