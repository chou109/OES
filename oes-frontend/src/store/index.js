import { defineStore } from 'pinia'
import { authApi } from '../utils/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    token: localStorage.getItem('token') || ''
  }),
  actions: {
    async login(userInfo) {
      const res = await authApi.login(userInfo)
      if (res.code === 200) {
        this.token = res.data.token
        this.userInfo = res.data
        localStorage.setItem('token', res.data.token)
        return res.data
      }
      throw new Error(res.message)
    },
    async getUserInfo() {
      if (!this.token) return null
      try {
        const res = await authApi.getUserInfo()
        if (res.code === 200) {
          this.userInfo = res.data
          return res.data
        }
      } catch (e) {
        console.error(e)
      }
      return null
    },
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
    }
  }
})

export default useUserStore
