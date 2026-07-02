<script>
export default {
  onLaunch: function() {
    console.log('App Launch')
    // 初始化登录状态，自动获取用户信息
    const token = uni.getStorageSync('token')
    if (token) {
      // 延迟初始化，确保 Pinia 已就绪
      setTimeout(() => {
        try {
          const { proxy } = getCurrentInstance()
          const userStore = proxy.$pinia._s.get('user')
          if (userStore) {
            userStore.initLoginState()
            userStore.getUserInfo()
          }
        } catch (e) {
          console.error('初始化用户信息失败:', e)
        }
      }, 500)
    }
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  }
}
</script>

<style lang="scss">
/* 全局样式 */
@import './uni.scss';

/* App公用样式 */
view, text, scroll-view {
  box-sizing: border-box;
}

page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 状态栏填充 */
.status-bar {
  height: var(--status-bar-height);
  background-color: #dc2626;
}

/* 安全区域底部填充 */
.safe-area-bottom {
  height: var(--safe-area-inset-bottom);
}

/* 主题颜色变量 */
$primary-color: #dc2626;
$primary-light: #f87171;
$primary-dark: #b91c1c;
$success-color: #22c55e;
$warning-color: #f59e0b;
$danger-color: #ef4444;
$info-color: #3b82f6;
$text-color: #333333;
$text-secondary: #666666;
$text-muted: #999999;
$border-color: #e5e5e5;
$bg-color: #ffffff;
$bg-secondary: #f5f5f5;

/* 常用样式类 */
.text-primary {
  color: $primary-color;
}

.text-success {
  color: $success-color;
}

.text-warning {
  color: $warning-color;
}

.text-danger {
  color: $danger-color;
}

.bg-primary {
  background-color: $primary-color;
}

.bg-white {
  background-color: $bg-color;
}

/* 卡片样式 */
.card {
  background-color: $bg-color;
  border-radius: 16rpx;
  padding: 20rpx;
  margin: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

/* 页面头部 */
.page-header {
  padding: 20rpx;
  
  .title {
    font-size: 32rpx;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 8rpx;
  }
  
  .subtitle {
    font-size: 24rpx;
    color: #64748b;
  }
}

/* 工具栏 */
.toolbar {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  margin: 16rpx;
  flex-wrap: wrap;
}

/* 搜索行 */
.search-row {
  display: flex;
  flex-direction: row;
  gap: 12rpx;
  padding: 16rpx;
  background-color: $bg-color;
  border-radius: 12rpx;
  margin: 16rpx;
  
  .search-input {
    flex: 1;
  }
  
  .search-btn {
    flex-shrink: 0;
  }
}

/* 按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, #f25858 0%, #f85151 100%);
  color: #fff;
  border-radius: 8rpx;
  
  &:active {
    background: linear-gradient(135deg, #f25858 0%, #dc2626 100%);
  }
}

.btn-default {
  background-color: $bg-color;
  color: $text-color;
  border: 1rpx solid $border-color;
  border-radius: 8rpx;
}

/* 表格样式 */
.data-table {
  width: 100%;
  
  .table-header {
    display: flex;
    background-color: $bg-secondary;
    padding: 16rpx;
    font-weight: 600;
  }
  
  .table-row {
    display: flex;
    padding: 16rpx;
    border-bottom: 1rpx solid $border-color;
  }
  
  .table-cell {
    flex: 1;
    text-align: center;
  }
}

/* 列表样式 */
.list-item {
  display: flex;
  flex-direction: row;
  padding: 20rpx;
  background-color: $bg-color;
  border-bottom: 1rpx solid $border-color;
  
  &:active {
    background-color: $bg-secondary;
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 40rpx;
  
  .empty-icon {
    width: 120rpx;
    height: 120rpx;
    margin-bottom: 24rpx;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: $text-muted;
  }
}
</style>