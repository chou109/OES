<template>
  <view class="manage-page">
    <view class="page-header">
      <text class="title">用户管理</text>
    </view>
    
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input class="search-input" v-model="keyword" placeholder="搜索用户名" />
      <button class="search-btn" @click="loadData">搜索</button>
    </view>
    
    <!-- 用户列表 -->
    <view class="user-list">
      <view class="user-item" v-for="user in userList" :key="user.id">
        <view class="user-info">
          <text class="username">{{ user.username }}</text>
          <text class="role">{{ getRoleText(user.role) }}</text>
        </view>
        <view class="user-actions">
          <text class="action-btn" @click="editUser(user)">编辑</text>
          <text class="action-btn danger" @click="deleteUser(user)">删除</text>
        </view>
      </view>
      
      <view class="empty" v-if="userList.length === 0">
        <text class="empty-text">暂无用户数据</text>
      </view>
    </view>
    
    <!-- 分页 -->
    <view class="pagination">
      <text class="page-info">共 {{ total }} 条</text>
    </view>
    
    <!-- 新增按钮 -->
    <view class="add-btn" @click="addUser">
      <uni-icons type="plus" size="20" color="#fff" />
      <text class="add-text">新增用户</text>
    </view>
  </view>
</template>

<script>
import { ref, onMounted } from 'vue'
import { userApi } from '../../utils/api'

export default {
  setup() {
    const keyword = ref('')
    const userList = ref([])
    const total = ref(0)
    const current = ref(1)
    const size = ref(20)
    
    const getRoleText = (role) => {
      const map = { ADMIN: '管理员', TEACHER: '教师', STUDENT: '学生' }
      return map[role] || role
    }
    
    const loadData = async () => {
      try {
        uni.showLoading({ title: '加载中...' })
        const res = await userApi.page({
          current: current.value,
          size: size.value,
          keyword: keyword.value
        })
        if (res.code === 200) {
          userList.value = res.data.records
          total.value = res.data.total
        }
      } catch (e) {
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
    
    const addUser = () => {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    }
    
    const editUser = (user) => {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    }
    
    const deleteUser = async (user) => {
      uni.showModal({
        title: '提示',
        content: `确定要删除用户 ${user.username} 吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await userApi.delete(user.id)
              if (result.code === 200) {
                uni.showToast({ title: '删除成功', icon: 'success' })
                loadData()
              } else {
                uni.showToast({ title: result.message || '删除失败', icon: 'none' })
              }
            } catch (e) {
              uni.showToast({ title: '删除失败', icon: 'none' })
            }
          }
        }
      })
    }
    
    onMounted(() => {
      loadData()
    })
    
    return {
      keyword,
      userList,
      total,
      getRoleText,
      loadData,
      addUser,
      editUser,
      deleteUser
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
  margin-bottom: 24rpx;
  
  .title {
    font-size: 36rpx;
    font-weight: 700;
    color: #333;
  }
}

.search-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
  
  .search-input {
    flex: 1;
    height: 72rpx;
    background: #fff;
    border-radius: 12rpx;
    padding: 0 20rpx;
    font-size: 28rpx;
  }
  
  .search-btn {
    height: 72rpx;
    padding: 0 32rpx;
    background: #dc2626;
    border-radius: 12rpx;
    color: #fff;
    font-size: 28rpx;
    border: none;
  }
}

.user-list {
  background: #fff;
  border-radius: 16rpx;
  
  .user-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx;
    border-bottom: 1rpx solid #e5e5e5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .user-info {
      .username {
        font-size: 30rpx;
        color: #333;
        margin-bottom: 8rpx;
      }
      
      .role {
        font-size: 24rpx;
        color: #666;
      }
    }
    
    .user-actions {
      display: flex;
      gap: 16rpx;
      
      .action-btn {
        font-size: 26rpx;
        color: #dc2626;
        padding: 8rpx 16rpx;
        
        &.danger {
          color: #ef4444;
        }
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

.pagination {
  margin-top: 16rpx;
  text-align: center;
  
  .page-info {
    font-size: 26rpx;
    color: #666;
  }
}

.add-btn {
  position: fixed;
  bottom: 100rpx;
  right: 32rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx 32rpx;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  border-radius: 24rpx;
  
  .add-text {
    font-size: 28rpx;
    color: #fff;
  }
}
</style>