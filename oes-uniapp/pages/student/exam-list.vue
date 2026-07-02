<template>
  <view class="exam-list">
    <view class="page-header">
      <text class="title">考试列表</text>
      <text class="subtitle">查看并参加待进行的考试</text>
    </view>

    <!-- 搜索和筛选区域 -->
    <view class="search-bar">
      <view class="search-input">
        <uni-icons type="search" size="18" color="#999" />
        <input
          type="text"
          v-model="searchForm.keyword"
          placeholder="搜索考试名称"
          @confirm="handleSearch"
        />
      </view>
      <view class="filter-row">
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
        <button class="search-btn" @click="handleSearch">搜索</button>
      </view>
    </view>

    <!-- 考试列表 -->
    <view class="exam-grid">
      <view class="exam-card" v-for="item in tableData" :key="item.exam.id">
        <view class="exam-header">
          <text class="exam-title">{{ item.exam.title }}</text>
          <view class="exam-status" :class="'status-' + getStatusClass(item)">
            <text>{{ getExamStatusText(item) }}</text>
          </view>
        </view>

        <view class="exam-info">
          <view class="info-item">
            <uni-icons type="clock" size="16" color="#666" />
            <text>{{ item.exam.duration }} 分钟</text>
          </view>
          <view class="info-item">
            <uni-icons type="flag" size="16" color="#666" />
            <text>总分 {{ item.exam.totalScore }}</text>
          </view>
          <view class="info-item">
            <uni-icons type="calendar" size="16" color="#666" />
            <text>{{ formatTime(item.exam.startTime) }}</text>
          </view>
        </view>

        <view class="exam-actions">
          <button
            class="join-btn"
            :class="getButtonClass(item)"
            :disabled="!canJoin(item) && !canView(item)"
            @click="handleJoin(item.exam)"
          >
            <text>{{ getButtonText(item) }}</text>
          </button>
        </view>
      </view>
    </view>

    <uni-load-more :status="loadStatus" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../../store/index.js'
import { examApi } from '../../utils/api.js'

const userStore = useUserStore()
const tableData = ref([])
const searchForm = ref({
  keyword: '',
  status: ''
})

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待开始', value: 'PENDING' },
  { label: '进行中', value: 'ONGOING' },
  { label: '已结束', value: 'FINISHED' }
]

const currentStatusText = computed(() => {
  const option = statusOptions.find(o => o.value === searchForm.value.status)
  return option ? option.label : '全部'
})

const loadStatus = ref('more')

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

const getStatusClass = (item) => {
  if (item.studentStatus === 'AUTO_SUBMITTED') return 'danger'
  if (item.studentStatus === 'SUBMITTED') return 'success'
  if (item.exam.status === 'ONGOING') return 'warning'
  return 'info'
}

const getExamStatusText = (item) => {
  if (item.studentStatus === 'AUTO_SUBMITTED') return '强制收卷'
  if (item.studentStatus === 'SUBMITTED') return '已完成'
  if (item.exam.status === 'ONGOING') return '进行中'
  return '即将开始'
}

const canJoin = (item) => {
  return item.exam.status === 'ONGOING' &&
    item.studentStatus !== 'SUBMITTED' &&
    item.studentStatus !== 'AUTO_SUBMITTED'
}

const canView = (item) => {
  return item.studentStatus === 'SUBMITTED' || item.studentStatus === 'AUTO_SUBMITTED'
}

const getButtonText = (item) => {
  if (item.studentStatus === 'SUBMITTED' || item.studentStatus === 'AUTO_SUBMITTED') {
    return '查看详情'
  }
  if (item.exam.status === 'ONGOING') return '进入考试'
  return '等待开始'
}

const getButtonClass = (item) => {
  if (item.studentStatus === 'SUBMITTED' || item.studentStatus === 'AUTO_SUBMITTED') {
    return 'btn-success'
  }
  if (item.exam.status === 'ONGOING') return 'btn-danger'
  return 'btn-disabled'
}

const onStatusChange = (e) => {
  const index = e.detail.value
  searchForm.value.status = statusOptions[index].value
  handleSearch()
}

const handleJoin = (exam) => {
  uni.navigateTo({
    url: `/pages/student/exam-take?id=${exam.id}`
  })
}

const handleSearch = () => {
  loadStatus.value = 'more'
  loadData()
}

const loadData = async () => {
  if (loadStatus.value === 'loading') return
  loadStatus.value = 'loading'

  try {
    const params = {
      current: 1,
      size: 20,
      keyword: searchForm.value.keyword,
      status: searchForm.value.status
    }
    const res = await examApi.studentPage(params)
    if (res.code === 200) {
      tableData.value = res.data.records
      loadStatus.value = res.data.records.length >= 20 ? 'more' : 'noMore'
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
  loadData()
})
</script>

<style scoped>
.exam-list {
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

.search-bar {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.search-input {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  margin-bottom: 20rpx;
}

.search-input input {
  flex: 1;
  margin-left: 12rpx;
  font-size: 28rpx;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.picker {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 24rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.search-btn {
  flex-shrink: 0;
  width: 160rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: #f56c6c;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.exam-grid {
  margin-top: 24rpx;
}

.exam-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.exam-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.exam-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
  margin-right: 16rpx;
}

.exam-status {
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  flex-shrink: 0;
}

.status-success {
  background: #f0f9ff;
  color: #67c23a;
}

.status-warning {
  background: #fdf6ec;
  color: #e6a23c;
}

.status-danger {
  background: #fef0f0;
  color: #f56c6c;
}

.status-info {
  background: #f4f4f5;
  color: #909399;
}

.exam-info {
  margin-bottom: 24rpx;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
  font-size: 28rpx;
  color: #666;
}

.info-item uni-icons {
  margin-right: 12rpx;
}

.exam-actions {
  display: flex;
  justify-content: flex-end;
}

.join-btn {
  width: 200rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  text-align: center;
}

.btn-danger {
  background: #f56c6c;
  color: #fff;
}

.btn-success {
  background: #67c23a;
  color: #fff;
}

.btn-disabled {
  background: #f5f5f5;
  color: #999;
}
</style>