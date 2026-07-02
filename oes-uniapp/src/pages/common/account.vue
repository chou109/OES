<template>
  <view class="account-page">
    <!-- 用户信息头部 -->
    <view class="user-header">
      <view class="avatar-box">
        <image class="avatar" src="/static/avatar.png" mode="aspectFill" />
      </view>
      <view class="user-info">
        <text class="username">{{ userInfo.username }}</text>
        <text class="role">{{ roleText }}</text>
      </view>
    </view>
    
    <!-- 功能列表 -->
    <view class="menu-list">
      <!-- 基本信息 -->
      <view class="menu-group">
        <view class="menu-item" @click="showEditInfo">
          <view class="menu-icon">
            <uni-icons type="person" size="22" color="#dc2626" />
          </view>
          <text class="menu-text">基本资料</text>
          <view class="menu-arrow">
            <uni-icons type="right" size="16" color="#999" />
          </view>
        </view>
        
        <view class="menu-item" @click="showChangePassword">
          <view class="menu-icon">
            <uni-icons type="locked" size="22" color="#dc2626" />
          </view>
          <text class="menu-text">修改密码</text>
          <view class="menu-arrow">
            <uni-icons type="right" size="16" color="#999" />
          </view>
        </view>
      </view>
      
      <!-- 其他功能 -->
      <view class="menu-group">
        <view class="menu-item" @click="showAbout">
          <view class="menu-icon">
            <uni-icons type="info" size="22" color="#3b82f6" />
          </view>
          <text class="menu-text">关于系统</text>
          <view class="menu-arrow">
            <uni-icons type="right" size="16" color="#999" />
          </view>
        </view>
        
        <view class="menu-item" @click="clearCache">
          <view class="menu-icon">
            <uni-icons type="trash" size="22" color="#ef4444" />
          </view>
          <text class="menu-text">清除缓存</text>
          <view class="menu-arrow">
            <uni-icons type="right" size="16" color="#999" />
          </view>
        </view>
      </view>
      
      <!-- 退出登录 -->
      <view class="logout-btn" @click="handleLogout">
        <text class="logout-text">退出登录</text>
      </view>
    </view>
    
    <!-- 编辑信息弹窗 -->
    <uni-popup ref="editPopup" type="bottom">
      <view class="popup-content">
        <view class="popup-header">
          <text class="popup-title">编辑基本资料</text>
          <text class="popup-close" @click="closeEditPopup">关闭</text>
        </view>
        
        <view class="form-content">
          <view class="form-item">
            <text class="label">用户名</text>
            <input class="input" type="text" v-model="editForm.username" disabled />
          </view>
          
          <view class="form-item">
            <text class="label">真实姓名</text>
            <input class="input" type="text" v-model="editForm.realName" placeholder="请输入真实姓名" />
          </view>
          
          <view class="form-item">
            <text class="label">邮箱</text>
            <input class="input" type="text" v-model="editForm.email" placeholder="请输入邮箱" />
          </view>
          
          <view class="form-item">
            <text class="label">手机号</text>
            <input class="input" type="text" v-model="editForm.phone" placeholder="请输入手机号" />
          </view>
          
          <button class="save-btn" @click="saveEditInfo">保存修改</button>
        </view>
      </view>
    </uni-popup>
    
    <!-- 修改密码弹窗 -->
    <uni-popup ref="passwordPopup" type="bottom">
      <view class="popup-content">
        <view class="popup-header">
          <text class="popup-title">修改密码</text>
          <text class="popup-close" @click="closePasswordPopup">关闭</text>
        </view>
        
        <view class="form-content">
          <view class="form-item">
            <text class="label">当前密码</text>
            <input class="input" type="password" v-model="passwordForm.oldPassword" placeholder="请输入当前密码" />
          </view>
          
          <view class="form-item">
            <text class="label">新密码</text>
            <input class="input" type="password" v-model="passwordForm.newPassword" placeholder="请输入新密码" />
          </view>
          
          <view class="form-item">
            <text class="label">确认新密码</text>
            <input class="input" type="password" v-model="passwordForm.confirmPassword" placeholder="请确认新密码" />
          </view>
          
          <button class="save-btn" @click="savePassword">保存修改</button>
        </view>
      </view>
    </uni-popup>
    
    <!-- 关于弹窗 -->
    <uni-popup ref="aboutPopup" type="center">
      <view class="about-content">
        <image class="about-logo" src="/static/logo.png" mode="aspectFit" />
        <text class="about-title">ExamPro</text>
        <text class="about-version">版本 1.0.0</text>
        <text class="about-desc">专业的在线考试系统，让学习更高效</text>
        <text class="about-copy">© 2024 ExamPro Team</text>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { useUserStore } from '../../store/index'
import { authApi } from '../../utils/api'

export default {
  setup() {
    const userStore = useUserStore()
    const userInfo = computed(() => userStore.userInfo || {})
    
    const roleText = computed(() => {
      const map = { ADMIN: '管理员', TEACHER: '教师', STUDENT: '学生' }
      return map[userInfo.value.role] || '用户'
    })
    
    const editPopup = ref(null)
    const passwordPopup = ref(null)
    const aboutPopup = ref(null)
    
    const editForm = reactive({
      username: userInfo.value.username || '',
      realName: userInfo.value.realName || '',
      email: userInfo.value.email || '',
      phone: userInfo.value.phone || ''
    })
    
    const passwordForm = reactive({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    
    const showEditInfo = () => {
      // 同步用户信息到表单
      editForm.username = userInfo.value.username || ''
      editForm.realName = userInfo.value.realName || ''
      editForm.email = userInfo.value.email || ''
      editForm.phone = userInfo.value.phone || ''
      
      editPopup.value.open()
    }
    
    const closeEditPopup = () => {
      editPopup.value.close()
    }
    
    const showChangePassword = () => {
      passwordPopup.value.open()
    }
    
    const closePasswordPopup = () => {
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      passwordPopup.value.close()
    }
    
    const showAbout = () => {
      aboutPopup.value.open()
    }
    
    const saveEditInfo = async () => {
      try {
        // 这里需要调用用户信息更新API
        // 由于原系统可能没有单独的用户信息更新接口，暂时只显示提示
        uni.showToast({
          title: '功能开发中',
          icon: 'none'
        })
      } catch (e) {
        uni.showToast({
          title: e.message || '保存失败',
          icon: 'none'
        })
      }
    }
    
    const savePassword = async () => {
      if (!passwordForm.oldPassword) {
        uni.showToast({ title: '请输入当前密码', icon: 'none' })
        return
      }
      if (!passwordForm.newPassword) {
        uni.showToast({ title: '请输入新密码', icon: 'none' })
        return
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        uni.showToast({ title: '两次密码不一致', icon: 'none' })
        return
      }
      
      try {
        const res = await authApi.changePassword({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
        
        if (res.code === 200) {
          uni.showToast({ title: '密码修改成功', icon: 'success' })
          closePasswordPopup()
        } else {
          uni.showToast({ title: res.message || '修改失败', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: e.message || '修改失败', icon: 'none' })
      }
    }
    
    const clearCache = () => {
      uni.showModal({
        title: '提示',
        content: '确定要清除缓存吗？',
        success: (res) => {
          if (res.confirm) {
            uni.clearStorage()
            uni.showToast({ title: '缓存已清除', icon: 'success' })
          }
        }
      })
    }
    
    const handleLogout = () => {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            userStore.logout()
          }
        }
      })
    }
    
    return {
      userInfo,
      roleText,
      editPopup,
      passwordPopup,
      aboutPopup,
      editForm,
      passwordForm,
      showEditInfo,
      closeEditPopup,
      showChangePassword,
      closePasswordPopup,
      showAbout,
      saveEditInfo,
      savePassword,
      clearCache,
      handleLogout
    }
  }
}
</script>

<style lang="scss">
.account-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.user-header {
  display: flex;
  align-items: center;
  padding: 40rpx 32rpx;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  
  .avatar-box {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
    
    .avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
    }
  }
  
  .user-info {
    .username {
      font-size: 36rpx;
      color: #fff;
      font-weight: 600;
      margin-bottom: 8rpx;
    }
    
    .role {
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.8);
    }
  }
}

.menu-list {
  padding: 24rpx;
}

.menu-group {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  
  .menu-item {
    display: flex;
    align-items: center;
    padding: 28rpx 24rpx;
    border-bottom: 1rpx solid #e5e5e5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .menu-icon {
      width: 44rpx;
      height: 44rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .menu-text {
      flex: 1;
      font-size: 32rpx;
      color: #333;
      margin-left: 16rpx;
    }
    
    .menu-arrow {
      width: 32rpx;
    }
  }
}

.logout-btn {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  text-align: center;
  
  .logout-text {
    font-size: 32rpx;
    color: #dc2626;
  }
}

.popup-content {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx;
  
  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32rpx;
    
    .popup-title {
      font-size: 36rpx;
      font-weight: 600;
      color: #333;
    }
    
    .popup-close {
      font-size: 28rpx;
      color: #666;
    }
  }
}

.form-content {
  .form-item {
    margin-bottom: 24rpx;
    
    .label {
      font-size: 28rpx;
      color: #666;
      margin-bottom: 12rpx;
    }
    
    .input {
      width: 100%;
      height: 80rpx;
      background: #f5f5f5;
      border-radius: 12rpx;
      padding: 0 20rpx;
      font-size: 32rpx;
      color: #333;
    }
  }
  
  .save-btn {
    width: 100%;
    height: 88rpx;
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    border-radius: 12rpx;
    border: none;
    margin-top: 32rpx;
    
    .save-btn-text {
      font-size: 32rpx;
      color: #fff;
    }
  }
}

.about-content {
  width: 500rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  text-align: center;
  
  .about-logo {
    width: 120rpx;
    height: 120rpx;
    margin-bottom: 24rpx;
  }
  
  .about-title {
    font-size: 40rpx;
    font-weight: 700;
    color: #333;
    margin-bottom: 16rpx;
  }
  
  .about-version {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 24rpx;
  }
  
  .about-desc {
    font-size: 28rpx;
    color: #999;
    margin-bottom: 24rpx;
  }
  
  .about-copy {
    font-size: 24rpx;
    color: #999;
  }
}
</style>