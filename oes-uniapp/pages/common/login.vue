<template>
  <view class="login-container">
    <!-- Logo和标题 -->
    <view class="login-header">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <text class="title">ExamPro</text>
      <text class="subtitle">专业的在线考试系统</text>
    </view>

    <!-- 登录表单 -->
    <view class="login-form">
      <!-- 登录类型选择 -->
      <view class="login-tabs">
        <view
          class="login-tab"
          :class="{ active: loginType === 'student' && !showAdminLogin }"
          @click="switchLoginType('student')"
        >
          <text class="tab-text">学生</text>
        </view>
        <view
          class="login-tab"
          :class="{ active: loginType === 'teacher' && !showAdminLogin }"
          @click="switchLoginType('teacher')"
        >
          <text class="tab-text">教师</text>
        </view>
        <view
          class="login-tab"
          :class="{ active: showAdminLogin }"
          @click="switchLoginType('admin')"
        >
          <text class="tab-text">管理员</text>
        </view>
      </view>

      <!-- 登录输入 -->
      <view class="form-content">
        <view class="input-group">
          <text class="icon">👤</text>
          <input
            class="input"
            type="text"
            v-model="form.username"
            placeholder="请输入用户名"
            placeholder-class="placeholder"
          />
        </view>

        <view class="input-group">
          <text class="icon">🔒</text>
          <input
            class="input"
            type="password"
            v-model="form.password"
            placeholder="请输入密码"
            placeholder-class="placeholder"
          />
        </view>

        <button class="login-btn" :disabled="loading" @click="handleLogin">
          <text class="btn-text">{{ loading ? '登录中...' : '登录' }}</text>
        </button>
      </view>

      <!-- 其他操作 -->
      <view class="action-buttons">
        <text class="action-link" @click="goToRegister">注册账号</text>
      </view>

      <!-- 演示账号提示 -->
      <view class="demo-tip">
        <text class="tip-text">演示账号：学生 s/stu | 教师 t/tchr | 管理员 a/admin</text>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, reactive } from 'vue'
import { authApi } from '../../utils/api'

export default {
  setup() {
    const loginType = ref('student')
    const showAdminLogin = ref(false)
    const loading = ref(false)

    const form = reactive({
      username: '',
      password: ''
    })

    const switchLoginType = (type) => {
      if (type === 'admin') {
        showAdminLogin.value = true
      } else {
        showAdminLogin.value = false
        loginType.value = type
      }
    }

    const handleLogin = async () => {
      if (!form.username || !form.password) {
        uni.showToast({
          title: '请输入用户名和密码',
          icon: 'none'
        })
        return
      }

      loading.value = true

      try {
        console.log('开始登录，用户名:', form.username)

        // 直接调用后端 API 登录
        const response = await authApi.login(form)
        console.log('登录成功:', response)

        // 解构响应数据（后端返回 {code, message, data} 结构）
        const result = response.data || response
        console.log('用户信息:', result)

        // 验证登录类型
        if (showAdminLogin.value && result.role !== 'ADMIN') {
          uni.showToast({
            title: '不存在此管理员账号',
            icon: 'none'
          })
          return
        }

        if (!showAdminLogin.value) {
          const expectedRole = loginType.value === 'student' ? 'STUDENT' : 'TEACHER'
          if (result.role !== expectedRole) {
            uni.showToast({
              title: loginType.value === 'student' ? '不存在此学生账号' : '不存在此教师账号',
              icon: 'none'
            })
            return
          }
        }

        // 存储登录信息到本地
        uni.setStorageSync('token', result.token)
        uni.setStorageSync('userInfo', result)

        uni.showToast({
          title: '登录成功',
          icon: 'success'
        })

        setTimeout(() => {
          uni.switchTab({
            url: '/pages/common/dashboard'
          })
        }, 1500)

      } catch (error) {
        console.error('登录失败详情:', error)
        let errorMsg = '登录失败'

        if (error.errMsg && error.errMsg.includes('fail')) {
          errorMsg = '网络连接失败，请检查服务器是否启动'
        } else if (error.message) {
          errorMsg = error.message
        } else if (error.data && error.data.message) {
          errorMsg = error.data.message
        }

        uni.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 3000
        })
      } finally {
        loading.value = false
      }
    }

    const goToRegister = () => {
      uni.navigateTo({
        url: '/pages/common/register'
      })
    }

    return {
      loginType,
      showAdminLogin,
      loading,
      form,
      switchLoginType,
      handleLogin,
      goToRegister
    }
  }
}
</script>

<style lang="scss">
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FF6A6A 0%, #CD5C5C 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx;
}

.login-header {
  text-align: center;
  margin-bottom: 60rpx;

  .logo {
    width: 120rpx;
    height: 120rpx;
    margin-bottom: 24rpx;
  }

  .title {
    font-size: 48rpx;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 4rpx;
    margin-bottom: 16rpx;
  }

  .subtitle {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.9);
  }
}

.login-form {
  width: 100%;
  max-width: 600rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
}

.login-tabs {
  display: flex;
  margin-bottom: 40rpx;
  border-bottom: 2rpx solid #e5e5e5;

  .login-tab {
    flex: 1;
    text-align: center;
    padding: 24rpx 0;
    position: relative;

    .tab-text {
      font-size: 32rpx;
      color: #666;
    }

    &.active {
      .tab-text {
        color: #dc2626;
        font-weight: 600;
      }

      &:after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60rpx;
        height: 4rpx;
        background: #dc2626;
        border-radius: 2rpx;
      }
    }
  }
}

.form-content {
  .input-group {
    display: flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: 12rpx;
    padding: 24rpx 20rpx;
    margin-bottom: 24rpx;

    .icon {
      font-size: 36rpx;
      margin-right: 16rpx;
    }

    .input {
      flex: 1;
      font-size: 32rpx;
      color: #333;
    }
  }

  .placeholder {
    color: #999;
    font-size: 32rpx;
  }

  .login-btn {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    border-radius: 12rpx;
    border: none;
    margin-top: 32rpx;

    .btn-text {
      font-size: 36rpx;
      color: #ffffff;
      font-weight: 600;
    }

    &[disabled] {
      background: #cccccc;
    }
  }
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 32rpx;

  .action-link {
    font-size: 28rpx;
    color: #dc2626;
  }
}

.demo-tip {
  margin-top: 40rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #e5e5e5;

  .tip-text {
    font-size: 24rpx;
    color: #999;
    text-align: center;
  }
}
</style>