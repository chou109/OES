<template>
  <view class="manage-page">
    <view class="page-header">
      <text class="title">日志管理</text>
    </view>
    
    <!-- 日志列表 -->
    <view class="log-list">
      <view class="log-item" v-for="log in logList" :key="log.id">
        <view class="log-header">
          <text class="log-operator">{{ log.username || '-' }}</text>
          <text class="log-time">{{ formatTime(log.createTime) }}</text>
        </view>
        <view class="log-body">
          <text class="log-action">{{ log.operation || '-' }}</text>
          <text class="log-target">{{ log.params || '-' }}</text>
        </view>
      </view>
      
      <view class="empty" v-if="logList.length === 0">
        <text class="empty-text">暂无日志数据</text>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, onMounted } from 'vue'
import { logApi } from '../../utils/api'

export default {
  setup() {
    const logList = ref([])
    
    const formatTime = (time) => {
      if (!time) return '-'
      const date = new Date(time)
      return date.toLocaleString('zh-CN')
    }
    
    const loadData = async () => {
      try {
        uni.showLoading({ title: '加载中...' })
        const res = await logApi.page({ current: 1, size: 50 })
        if (res.code === 200) {
          logList.value = res.data.records
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
      logList,
      formatTime
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

.log-list {
  background: #fff;
  border-radius: 16rpx;
  
  .log-item {
    padding: 24rpx;
    border-bottom: 1rpx solid #e5e5e5;
    
    .log-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12rpx;
      
      .log-operator {
        font-size: 28rpx;
        color: #333;
        font-weight: 500;
      }
      
      .log-time {
        font-size: 24rpx;
        color: #999;
      }
    }
    
    .log-body {
      .log-action {
        font-size: 26rpx;
        color: #666;
        margin-bottom: 8rpx;
      }
      
      .log-target {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}

.empty {
  padding: 60rpx;
  text-align: center;
  
  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}
</style>