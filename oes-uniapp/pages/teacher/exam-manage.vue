<template>
  <view class="exam-manage">
    <view class="page-header">
      <text class="title">考试管理</text>
      <text class="subtitle">发布和管理考试，监控考生状态</text>
    </view>

    <!-- 工具栏 -->
    <view class="toolbar">
      <view class="toolbar-left">
        <picker mode="selector" :range="subjectOptions" range-key="name" @change="onSubjectChange">
          <view class="picker">{{ currentSubjectText }}</view>
        </picker>
        <picker mode="selector" :range="statusOptions" range-key="label" @change="onStatusChange">
          <view class="picker">{{ currentStatusText }}</view>
        </picker>
      </view>
      <button class="create-btn" @click="handleCreate">发布考试</button>
    </view>

    <!-- 考试列表 -->
    <view class="exam-list">
      <view class="exam-item" v-for="item in tableData" :key="item.id">
        <view class="exam-header">
          <text class="exam-title">{{ item.title }}</text>
          <view class="exam-status" :class="'status-' + item.status.toLowerCase()">
            <text>{{ statusText(item.status) }}</text>
          </view>
        </view>

        <view class="exam-info">
          <view class="info-row">
            <uni-icons type="flag" size="16" color="#666" />
            <text class="info-text">科目：{{ getSubjectName(item.subjectId) }}</text>
          </view>
          <view class="info-row">
            <uni-icons type="clock" size="16" color="#666" />
            <text class="info-text">时长：{{ item.duration }}分钟</text>
          </view>
          <view class="info-row">
            <uni-icons type="calendar" size="16" color="#666" />
            <text class="info-text">开始：{{ formatDateTime(item.startTime) }}</text>
          </view>
          <view class="info-row">
            <uni-icons type="medal" size="16" color="#666" />
            <text class="info-text">总分：{{ item.totalScore }}分</text>
          </view>
        </view>

        <view class="exam-actions">
          <button class="action-btn" @click="handleMonitor(item)">监控</button>
          <button class="action-btn" @click="handleEdit(item)">修改</button>
          <button v-if="item.status === 'PENDING'" class="action-btn success" @click="handleStart(item)">开始</button>
          <button v-if="item.status === 'ONGOING'" class="action-btn warning" @click="handleFinish(item)">结束</button>
          <button class="action-btn primary" @click="handleStats(item)">统计</button>
        </view>
      </view>
    </view>

    <uni-load-more :status="loadStatus" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { examApi, subjectApi } from '../../utils/api.js'

const tableData = ref([])
const subjects = ref([])
const params = ref({
  subjectId: '',
  status: '',
  keyword: ''
})
const loadStatus = ref('more')
const current = ref(1)
const size = ref(10)

const subjectOptions = computed(() => {
  return [{ id: '', name: '全部科目' }, ...subjects.value]
})

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'PENDING', label: '待开始' },
  { value: 'ONGOING', label: '进行中' },
  { value: 'FINISHED', label: '已结束' }
]

const currentSubjectText = computed(() => {
  const option = subjectOptions.value.find(s => s.id === params.value.subjectId)
  return option ? option.name : '全部科目'
})

const currentStatusText = computed(() => {
  const option = statusOptions.find(s => s.value === params.value.status)
  return option ? option.label : '全部状态'
})

const statusText = (status) => {
  return {
    PENDING: '待开始',
    ONGOING: '进行中',
    FINISHED: '已结束'
  }[status] || status
}

const getSubjectName = (subjectId) => {
  const subject = subjects.value.find(s => s.id === subjectId)
  return subject ? subject.name : '未知科目'
}

const formatDateTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const onSubjectChange = (e) => {
  const index = e.detail.value
  params.value.subjectId = subjectOptions.value[index].id
  loadData()
}

const onStatusChange = (e) => {
  const index = e.detail.value
  params.value.status = statusOptions[index].value
  loadData()
}

const handleCreate = () => {
  uni.showToast({ title: '考试创建功能开发中', icon: 'none' })
}

const handleMonitor = (item) => {
  uni.showToast({ title: '监控功能开发中', icon: 'none' })
}

const handleEdit = (item) => {
  uni.showToast({ title: '修改功能开发中', icon: 'none' })
}

const handleStart = async (item) => {
  uni.showModal({
    title: '提示',
    content: '确定要开始考试吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await examApi.startExam(item.id)
          if (result.code === 200) {
            uni.showToast({ title: '考试已开始', icon: 'success' })
            loadData()
          } else {
            uni.showToast({ title: result.message || '操作失败', icon: 'none' })
          }
        } catch (e) {
          uni.showToast({ title: '网络错误', icon: 'none' })
        }
      }
    }
  })
}

const handleFinish = async (item) => {
  uni.showModal({
    title: '提示',
    content: '确定要结束考试吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await examApi.finishExam(item.id)
          if (result.code === 200) {
            uni.showToast({ title: '考试已结束', icon: 'success' })
            loadData()
          } else {
            uni.showToast({ title: result.message || '操作失败', icon: 'none' })
          }
        } catch (e) {
          uni.showToast({ title: '网络错误', icon: 'none' })
        }
      }
    }
  })
}

const handleStats = (item) => {
  uni.navigateTo({
    url: `/pages/admin/statistics?examId=${item.id}`
  })
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
    const res = await examApi.page({
      current: current.value,
      size: size.value,
      subjectId: params.value.subjectId,
      status: params.value.status,
      keyword: params.value.keyword
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
  loadSubjects()
  loadData()
})
</script>

<style scoped>
.exam-manage {
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

.create-btn {
  width: 200rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: #f56c6c;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.exam-list {
  margin-top: 24rpx;
}

.exam-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.exam-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.exam-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.exam-status {
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.status-pending {
  background: #fdf6ec;
  color: #e6a23c;
}

.status-ongoing {
  background: #f0f9ff;
  color: #67c23a;
}

.status-finished {
  background: #f4f4f5;
  color: #909399;
}

.exam-info {
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

.exam-actions {
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
</style>