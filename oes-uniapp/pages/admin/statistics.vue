<template>
  <view class="manage-page">
    <view class="page-header">
      <text class="title">数据统计</text>
    </view>
    
    <!-- 统计卡片 -->
    <view class="stats-grid">
      <view class="stat-card">
        <text class="stat-value">{{ stats.totalUsers }}</text>
        <text class="stat-label">总用户数</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ stats.studentCount }}</text>
        <text class="stat-label">学生数</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ stats.teacherCount }}</text>
        <text class="stat-label">教师数</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ stats.departmentCount }}</text>
        <text class="stat-label">院系数</text>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, onMounted } from 'vue'
import { statisticsApi } from '../../utils/api'

export default {
  setup() {
    const stats = ref({
      totalUsers: 0,
      studentCount: 0,
      teacherCount: 0,
      departmentCount: 0
    })
    
    const loadData = async () => {
      try {
        uni.showLoading({ title: '加载中...' })
        const res = await statisticsApi.overview()
        if (res.code === 200) {
          stats.value = res.data
        }
      } catch (e) {
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
    
    onMounted(() => {
      loadData()
    })
    
    return {
      stats
    }
  }
}
</script>

<style lang="scss">
.manage-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}

.page-header {
  .title {
    font-size: 36rpx;
    font-weight: 700;
    color: #333;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  
  .stat-card {
    background: #fff;
    border-radius: 16rpx;
    padding: 32rpx;
    text-align: center;
    
    .stat-value {
      font-size: 48rpx;
      font-weight: 700;
      color: #dc2626;
      margin-bottom: 12rpx;
    }
    
    .stat-label {
      font-size: 26rpx;
      color: #666;
    }
  }
}
</style>