<template>
  <view class="history">
    <view class="page-header">
      <text class="title">考试历史</text>
      <text class="subtitle">查看已完成考试的成绩和答卷详情</text>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input">
        <uni-icons type="search" size="18" color="#999" />
        <input type="text" v-model="keyword" placeholder="搜索考试名称" @confirm="handleSearch" />
      </view>
      <button class="search-btn" @click="handleSearch">搜索</button>
    </view>

    <!-- 卡片列表 -->
    <view class="card-list">
      <view class="card-item" v-for="item in tableData" :key="item.id">
        <view class="card-header">
          <text class="card-title">{{ item.examTitle }}</text>
          <view class="score-badge" :class="item.score >= 60 ? 'pass' : 'fail'">
            <text>{{ item.score }}分</text>
          </view>
        </view>

        <view class="card-info">
          <view class="info-row">
            <uni-icons type="clock" size="16" color="#666" />
            <text class="info-text">交卷时间：{{ item.submitTime }}</text>
          </view>
        </view>

        <view class="card-actions">
          <button class="detail-btn" @click="handleDetail(item)">查看详情</button>
        </view>
      </view>
    </view>

    <uni-load-more :status="loadStatus" />

    <view v-if="!loading && tableData.length === 0" class="empty">
      <uni-icons type="info" size="80" color="#999" />
      <text class="empty-text">暂无考试记录</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { examRecordApi } from '../../utils/api.js'

const tableData = ref([])
const keyword = ref('')
const loading = ref(false)
const current = ref(1)
const size = ref(10)
const loadStatus = ref('more')

const handleSearch = () => {
  current.value = 1
  tableData.value = []
  loadStatus.value = 'more'
  loadData()
}

const handleDetail = (item) => {
  uni.navigateTo({
    url: `/pages/student/exam-take?id=${item.examId}`
  })
}

const loadData = async () => {
  if (loadStatus.value === 'loading') return
  loadStatus.value = 'loading'

  try {
    const params = {
      current: current.value,
      size: size.value,
      keyword: keyword.value
    }
    const res = await examRecordApi.getStudentHistory(params)
    if (res.code === 200) {
      const data = res.data.records
      tableData.value = [...tableData.value, ...data]
      loadStatus.value = data.length >= size.value ? 'more' : 'noMore'
      current.value++
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
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.history {
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
  display: flex;
  gap: 20rpx;
}

.search-input {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
}

.search-input input {
  flex: 1;
  margin-left: 12rpx;
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

.card-list {
  margin-top: 24rpx;
}

.card-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.card-title {
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

.card-info {
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

.card-actions {
  display: flex;
  justify-content: flex-end;
}

.detail-btn {
  width: 200rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: #409eff;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 48rpx;
}

.empty-text {
  margin-top: 24rpx;
  font-size: 28rpx;
  color: #999;
}
</style>