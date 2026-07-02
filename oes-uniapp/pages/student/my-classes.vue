<template>
  <view class="my-classes">
    <view class="page-header">
      <text class="title">我的班级</text>
      <text class="subtitle">查看和管理您加入的班级</text>
    </view>

    <!-- 加入班级 -->
    <view class="join-card">
      <view class="join-form">
        <view class="join-input">
          <uni-icons type="personadd" size="20" color="#999" />
          <input
            type="text"
            v-model="inviteCode"
            placeholder="请输入班级群号"
            @confirm="handleJoin"
          />
        </view>
        <button class="join-btn" @click="handleJoin">加入班级</button>
      </view>
    </view>

    <!-- 班级列表 -->
    <view class="class-list">
      <view class="class-card" v-for="item in classList" :key="item.class.id" @click="enterClass(item.class.id)">
        <view class="class-info">
          <text class="class-name">{{ item.class.className }}</text>
          <view class="class-meta">
            <view class="meta-item">
              <uni-icons type="info" size="16" color="#666" />
              <text class="meta-text">群号：{{ item.class.inviteCode }}</text>
            </view>
            <view class="meta-item">
              <uni-icons type="person" size="16" color="#666" />
              <text class="meta-text">角色：{{ getRoleText(item.role) }}</text>
            </view>
          </view>
        </view>
        <view class="class-actions">
          <button class="enter-btn">进入班级</button>
        </view>
      </view>
    </view>

    <view v-if="classList.length === 0" class="empty">
      <uni-icons type="info" size="80" color="#999" />
      <text class="empty-text">暂无班级，输入群号加入班级吧</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../../store/index.js'
import { classApi } from '../../utils/api.js'

const userStore = useUserStore()
const inviteCode = ref('')
const classList = ref([])

const getRoleText = (role) => {
  return {
    CREATOR: '创建者',
    TEACHER: '教师',
    STUDENT: '学生'
  }[role] || role
}

const handleJoin = async () => {
  if (!inviteCode.value.trim()) {
    uni.showToast({
      title: '请输入班级群号',
      icon: 'none'
    })
    return
  }

  try {
    const userId = userStore.userInfo?.userId
    if (!userId) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    const res = await classApi.joinByCode(inviteCode.value, userId)
    if (res.code === 200) {
      uni.showToast({
        title: '加入班级成功',
        icon: 'success'
      })
      inviteCode.value = ''
      loadClasses()
    } else {
      uni.showToast({
        title: res.message || '加入班级失败',
        icon: 'none'
      })
    }
  } catch (e) {
    console.error(e)
    uni.showToast({
      title: '网络错误',
      icon: 'none'
    })
  }
}

const enterClass = (classId) => {
  uni.navigateTo({
    url: `/pages/student/class-chat?id=${classId}`
  })
}

const loadClasses = async () => {
  try {
    const userId = userStore.userInfo?.userId
    if (!userId) return

    const res = await classApi.getMyClasses(userId)
    if (res.code === 200) {
      classList.value = res.data
    }
  } catch (e) {
    console.error(e)
    uni.showToast({
      title: '加载班级列表失败',
      icon: 'none'
    })
  }
}

onMounted(() => {
  loadClasses()
})
</script>

<style scoped>
.my-classes {
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

.join-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.join-form {
  display: flex;
  gap: 20rpx;
}

.join-input {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
}

.join-input input {
  flex: 1;
  margin-left: 12rpx;
  font-size: 28rpx;
}

.join-btn {
  width: 200rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: #f56c6c;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.class-list {
  margin-top: 24rpx;
}

.class-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.class-info {
  margin-bottom: 20rpx;
}

.class-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
  display: block;
}

.class-meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-text {
  margin-left: 12rpx;
  font-size: 28rpx;
  color: #666;
}

.class-actions {
  display: flex;
  justify-content: flex-end;
}

.enter-btn {
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