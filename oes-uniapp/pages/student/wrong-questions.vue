<template>
  <view class="wrong-questions">
    <view class="page-header">
      <text class="title">错题本</text>
      <text class="subtitle">自动收录所有答错的题目，支持反复练习</text>
    </view>

    <!-- 工具栏 -->
    <view class="toolbar">
      <view class="toolbar-left">
        <picker
          mode="selector"
          :range="subjectOptions"
          range-key="name"
          @change="onSubjectChange"
        >
          <view class="picker">
            <text>{{ currentSubjectText }}</text>
            <uni-icons type="bottom" size="14" color="#666" />
          </view>
        </picker>
        <picker
          mode="selector"
          :range="statusOptions"
          range-key="label"
          @change="onStatusChange"
        >
          <view class="picker">
            <text>{{ currentStatusText }}</text>
            <uni-icons type="bottom" size="14" color="#666" />
          </view>
        </picker>
      </view>
      <button class="search-btn" @click="loadData">搜索</button>
    </view>

    <!-- 题目列表 -->
    <view class="question-list">
      <view class="question-item" v-for="item in tableData" :key="item.id">
        <view class="question-content">
          <text class="question-text">{{ item.content }}</text>
        </view>

        <view class="question-meta">
          <view class="meta-row">
            <view class="tag" :class="getTagClass(item.type)">
              <text>{{ typeText(item.type) }}</text>
            </view>
            <view class="tag" :class="item.mastered === 1 ? 'tag-success' : 'tag-warning'">
              <text>{{ item.mastered === 1 ? '已学会' : '未学会' }}</text>
            </view>
          </view>

          <view class="progress-row">
            <text class="progress-label">通过率：</text>
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: getPassRate(item) + '%' }"></view>
            </view>
            <text class="progress-text">{{ getPassRate(item) }}%</text>
          </view>

          <text class="practice-count">练习次数：{{ item.practicedCount }}</text>
        </view>

        <view class="question-actions">
          <button class="action-btn" @click="handleViewAnswer(item)">查看答案</button>
          <button class="action-btn primary" @click="handlePractice(item)">练习</button>
          <button
            class="action-btn"
            :class="item.mastered === 1 ? 'warning' : 'success'"
            @click="handleToggleMastered(item)"
          >
            {{ item.mastered === 1 ? '标记未学会' : '标记已学会' }}
          </button>
        </view>
      </view>
    </view>

    <uni-load-more :status="loadStatus" />

    <!-- 查看答案弹窗 -->
    <view v-if="answerVisible" class="modal" @click="answerVisible = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">查看答案</text>
          <view class="modal-close" @click="answerVisible = false">
            <uni-icons type="close" size="24" color="#333" />
          </view>
        </view>

        <view v-if="viewingAnswer" class="answer-content">
          <view class="question-type-tag">
            <text>{{ typeText(viewingAnswer.type) }}</text>
          </view>
          <text class="answer-question-text">{{ viewingAnswer.content }}</text>

          <view class="answer-row">
            <text class="label">错误答案：</text>
            <text class="value wrong">{{ viewingAnswer.wrongAnswer || '未记录' }}</text>
          </view>

          <view class="answer-row">
            <text class="label">正确答案：</text>
            <text class="value correct">{{ viewingAnswer.correctAnswer }}</text>
          </view>

          <view v-if="viewingAnswer.analysis" class="analysis">
            <text class="label">解析：</text>
            <text class="value">{{ viewingAnswer.analysis }}</text>
          </view>
        </view>

        <view class="modal-footer">
          <button class="close-btn" @click="answerVisible = false">关闭</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { wrongQuestionApi, subjectApi } from '../../utils/api.js'

const tableData = ref([])
const subjects = ref([])
const params = ref({
  subjectId: '',
  mastered: ''
})
const loadStatus = ref('more')
const current = ref(1)
const size = ref(10)
const answerVisible = ref(false)
const viewingAnswer = ref(null)

const typeMap = {
  SINGLE_CHOICE: '单选题',
  MULTIPLE_CHOICE: '多选题',
  JUDGMENT: '判断题',
  FILL_BLANK: '填空题',
  ESSAY: '简答题',
  PROGRAMMING: '编程题'
}

const subjectOptions = computed(() => {
  return [{ id: '', name: '全部科目' }, ...subjects.value]
})

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: '0', label: '未学会' },
  { value: '1', label: '已学会' }
]

const currentSubjectText = computed(() => {
  const option = subjectOptions.value.find(s => s.id === params.value.subjectId)
  return option ? option.name : '全部科目'
})

const currentStatusText = computed(() => {
  const option = statusOptions.find(s => s.value === params.value.mastered)
  return option ? option.label : '全部状态'
})

const typeText = (type) => typeMap[type] || type

const getTagClass = (type) => {
  return {
    'tag-info': true
  }
}

const getPassRate = (item) => {
  if (!item.practicedCount || item.practicedCount === 0) return 0
  return Math.round((item.correctCount / item.practicedCount) * 100)
}

const onSubjectChange = (e) => {
  const index = e.detail.value
  params.value.subjectId = subjectOptions.value[index].id
  loadData()
}

const onStatusChange = (e) => {
  const index = e.detail.value
  params.value.mastered = statusOptions[index].value
  loadData()
}

const handleViewAnswer = (item) => {
  viewingAnswer.value = item
  answerVisible.value = true
}

const handlePractice = (item) => {
  uni.showToast({
    title: '练习功能开发中',
    icon: 'none'
  })
}

const handleToggleMastered = async (item) => {
  try {
    const newMastered = item.mastered === 1 ? 0 : 1
    const res = await wrongQuestionApi.updateMastered(item.id, newMastered)
    if (res.code === 200) {
      uni.showToast({
        title: '标记成功',
        icon: 'success'
      })
      item.mastered = newMastered
    } else {
      uni.showToast({
        title: res.message || '操作失败',
        icon: 'none'
      })
    }
  } catch (e) {
    uni.showToast({
      title: '网络错误',
      icon: 'none'
    })
  }
}

const loadSubjects = async () => {
  try {
    const res = await subjectApi.list()
    if (res.code === 200) {
      subjects.value = res.data
    }
  } catch (e) {
    console.error(e)
  }
}

const loadData = async () => {
  if (loadStatus.value === 'loading') return
  loadStatus.value = 'loading'
  current.value = 1
  tableData.value = []

  try {
    const res = await wrongQuestionApi.page({
      current: current.value,
      size: size.value,
      subjectId: params.value.subjectId,
      mastered: params.value.mastered
    })
    if (res.code === 200) {
      tableData.value = res.data.records
      loadStatus.value = res.data.records.length >= size.value ? 'more' : 'noMore'
    } else {
      uni.showToast({
        title: res.message || '加载失败',
        icon: 'none'
      })
      loadStatus.value = 'more'
    }
  } catch (e) {
    console.error(e)
    uni.showToast({
      title: '网络错误',
      icon: 'none'
    })
    loadStatus.value = 'more'
  }
}

onMounted(() => {
  loadSubjects()
  loadData()
})
</script>

<style scoped>
.wrong-questions {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24rpx;
}

.page-header {
  margin-bottom: 32rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.toolbar {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  display: flex;
  gap: 20rpx;
  flex: 1;
}

.picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 24rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.search-btn {
  width: 160rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: #f56c6c;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.question-list {
  margin-top: 24rpx;
}

.question-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.question-content {
  margin-bottom: 16rpx;
}

.question-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
}

.question-meta {
  margin-bottom: 20rpx;
}

.meta-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.tag {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.tag-info {
  background: #f4f4f5;
  color: #909399;
}

.tag-success {
  background: #f0f9ff;
  color: #67c23a;
}

.tag-warning {
  background: #fdf6ec;
  color: #e6a23c;
}

.progress-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.progress-label {
  font-size: 28rpx;
  color: #666;
}

.progress-bar {
  flex: 1;
  height: 12rpx;
  background: #f5f5f5;
  border-radius: 6rpx;
  margin: 0 12rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #409eff;
  transition: width 0.3s;
}

.progress-text {
  font-size: 28rpx;
  color: #409eff;
  font-weight: bold;
}

.practice-count {
  font-size: 28rpx;
  color: #666;
}

.question-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 20rpx;
}

.action-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: #f5f5f5;
  color: #666;
}

.action-btn.primary {
  background: #409eff;
  color: #fff;
}

.action-btn.success {
  background: #67c23a;
  color: #fff;
}

.action-btn.warning {
  background: #e6a23c;
  color: #fff;
}

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 90%;
  max-width: 600rpx;
  background: #fff;
  border-radius: 16rpx;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #eee;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  padding: 8rpx;
}

.answer-content {
  padding: 32rpx;
}

.question-type-tag {
  display: inline-block;
  padding: 8rpx 16rpx;
  background: #f4f4f5;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #909399;
  margin-bottom: 16rpx;
}

.answer-question-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
  margin-bottom: 24rpx;
  display: block;
}

.answer-row {
  margin-bottom: 16rpx;
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

.answer-row .value.wrong {
  color: #f56c6c;
}

.answer-row .value.correct {
  color: #67c23a;
}

.analysis {
  margin-top: 24rpx;
  padding: 16rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
}

.analysis .label {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.analysis .value {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
}

.modal-footer {
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #eee;
}

.close-btn {
  width: 100%;
  height: 72rpx;
  line-height: 72rpx;
  background: #409eff;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
}
</style>