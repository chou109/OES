import App from './App'
import { createPinia } from 'pinia'

// UniApp中使用Pinia
const pinia = createPinia()

// #ifndef VUE3
import Vue from 'vue'
Vue.use(pinia)
const app = new Vue({
  ...App,
  pinia
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  app.use(pinia)
  
  uni.onError((error) => {
    console.error('全局错误:', error)
  })
  
  uni.onNetworkStatusChange((res) => {
    console.log('网络状态变化:', res.isConnected, res.networkType)
  })
  
  return {
    app,
    pinia
  }
}
// #endif