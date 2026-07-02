<template>
  <view class="exam-record">
    <view class="page-header">
      <text class="title">考试记录</text>
      <text class="subtitle">查看学生考试记录和答卷详情</text>
    </view>

    <!-- 工具栏 -->
    <view class="toolbar">
      <view class="toolbar-left">
        <picker mode="selector" :range="examOptions" range-key="title" @change="onExamChange">
          <view class="picker">{{ currentExamText }}</view>
        </picker>
        <picker mode="selector" :range="statusOptions" range-key="label" @change="onStatusChange">
          <view class="picker">{{ currentStatusText }}</view>
        </picker>
      </view>
      <button class="search-btn" @click="loadData">搜索</button>
    </view>

    <!-- 记录列表 -->
    <view class="record-list">
      <view class="record-item" v-for="item in tableData" :key="item.id">
        <view class="record-header">
          <text class="student-name">{{ item.studentName }}</text>
          <view class="score-badge" :class="item.score >= 60 ? 'pass' : 'fail'">
            <text>{{ item.score }}分</text>
          </view>
        </view>

        <view class="record-info">
          <view class="info-row">
            <uni-icons type="flag" size="16" color="#666" />
            <text class="info-text">考试：{{ item.examTitle }}</text>
          </view>
          <view class="info-row">
            <uni-icons type="clock" size="16" color="#666" />
            <text class="info-text">提交时间：{{ formatDateTime(item.submitTime) }}</text>
          </view>
          <view class="info-row">
            <uni-icons type="timer" size="16" color="#666" />
            <text class="info-text">用时：{{ item.duration }}分钟</text>
          </view>
          <view v-if="item.status === 'AUTO_SUBMITTED'" class="info-row">
            <uni-icons type="info" size="16" color="#f56c6c" />
            <text class="info-text warning">强制收卷</text>
          </view>
        </view>

        <view class="record-actions">
          <button class="action-btn" @click="handleView(item)">查看答卷</button>
          <button v-if="!item.score" class="action-btn primary" @click="handleGrade(item)">评分</button>
        </view>
      </view>
    </view>

    <uni-load-more :status="loadStatus" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { examRecordApi, examApi } from '../../utils/api.js'

const tableData = ref([])
const exams = ref([])
const params = ref({
  examId: '',
  status: ''
})
const loadStatus = ref('more')
const current = ref(1)
const size = ref(10)

const examOptions = computed(() => {
  return [{ id: '', title: '全部考试' }, ...exams.value]
})

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'SUBMITTED', label: '已提交' },
  { value: 'AUTO_SUBMITTED', label: '强制收卷' },
  { value: 'GRADED', label: '已评分' }
]

const currentExamText = computed(() => {
  const option = examOptions.value.find(e => e.id === params.value.examId)
  return option ? option.title : '全部考试'
})

const currentStatusText = computed(() => {
  const option = statusOptions.find(s => s.value === params.value.status)
  return option ? option.label : '全部状态'
})

const formatDateTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const onExamChange = (e) => {
  const index = e.detail.value
  params.value.examId = examOptions.value[index].id
  loadData()
}

const onStatusChange = (e) => {
  const index = e.detail.value
  params.value.status = statusOptions[index].value
  loadData()
}

const handleView = (item) => {
  uni.navigateTo({
    url: `/pages/student/exam-take?id=${item.examId}&recordId=${item.id}`
  })
}

const handleGrade = (item) => {
  uni.showToast({ title: '评分功能开发中', icon: 'none' })
}

const loadExams = async () => {
  try {
    const res = await examApi.list()
    if (res.code === 200) {
      exams.value = res.data
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
    const res = await examRecordApi.page({
      current: current.value,
      size: size.value,
      examId: params.value.examId,
      status: params.value.status
    })
    if (res.code === 200) {
      tableData.value = res.data.records
      loadStatus.value = res.data.records.length >= size.value ? 'more' : 'noMore'
    } else {
      uni.showToast({ title: res.message || '加载失败', icon: 'none' })
      loadStatus.value = 'more'
    }
  } catch (e) {
    console.error(e)
    uni.showToast({ title: '网络错误', icon: 'none' })
    loadStatus.value = 'more'
  }
}

onMounted(() => {
  loadExams()
  loadData()
})
</script>

<style scoped>
.exam-record {
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
  padding: 16rpx 24rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #666;
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

.record-list {
  margin-top: 24rpx;
}

.record-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.student-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.score-badge {
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  font-weight: bold;
}

.score-badge.pass {
  background: #f0f9ff;
  color: #67c23a;
}

.score-badge.fail {
  background: #fef0f0;
  color: #f56c6c;
}

.record-info {
  margin-bottom: 20rpx;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.info-text {
  margin-left: 12rpx;
  font-size: 28rpx;
  color: #666;
}

.info-text.warning {
  color: #f56c6c;
}

.record-actions {
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
</style>