/**
 * UniApp状态管理
 * 使用Pinia（UniApp也支持）
 */
import { defineStore } from 'pinia'
import { authApi } from '../utils/api'

// 用户状态Store
export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    token: uni.getStorageSync('token') || '',
    isLoginVerified: false
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token && !!state.userInfo,
    role: (state) => state.userInfo?.role || '',
    userId: (state) => state.userInfo?.userId || ''
  },
  
  actions: {
    /**
     * 登录
     * @param {Object} loginData - 登录数据
     */
    async login(loginData) {
      try {
        const res = await authApi.login(loginData)
        if (res.code === 200) {
          this.token = res.data.token
          this.userInfo = res.data
          this.isLoginVerified = true
          // 存储token到本地
          uni.setStorageSync('token', res.data.token)
          return res.data
        }
        throw new Error(res.message)
      } catch (error) {
        uni.showToast({
          title: error.message || '登录失败',
          icon: 'none'
        })
        throw error
      }
    },
    
    /**
     * 获取用户信息
     */
    async getUserInfo() {
      if (!this.token) return null
      
      try {
        const res = await authApi.getUserInfo()
        if (res.code === 200) {
          this.userInfo = res.data
          this.isLoginVerified = true
          return res.data
        } else {
          this.clearLoginState()
          return null
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.clearLoginState()
        return null
      }
    },
    
    /**
     * 验证登录状态
     */
    async verifyLoginState() {
      if (!this.token) {
        this.clearLoginState()
        return false
      }
      
      try {
        const res = await authApi.getUserInfo()
        if (res.code === 200) {
          this.userInfo = res.data
          this.isLoginVerified = true
          return true
        } else {
          this.clearLoginState()
          return false
        }
      } catch (error) {
        console.error('登录状态验证失败:', error)
        this.clearLoginState()
        return false
      }
    },
    
    /**
     * 清除登录状态
     */
    clearLoginState() {
      this.token = ''
      this.userInfo = null
      this.isLoginVerified = false
      uni.removeStorageSync('token')
    },
    
    /**
     * 登出
     */
    logout() {
      this.clearLoginState()
      uni.reLaunch({
        url: '/pages/common/login'
      })
    },
    
    /**
     * 初始化登录状态
     */
    initLoginState() {
      const savedToken = uni.getStorageSync('token')
      if (savedToken) {
        this.token = savedToken
      }
    }
  }
})

// 导出默认store
export default useUserStore