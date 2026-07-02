<template>
  <view class="class-chat">
    <view class="chat-header">
      <view class="header-left">
        <view class="back-btn" @click="goBack">
          <uni-icons type="back" size="20" color="#333" />
        </view>
        <view class="header-info">
          <text class="class-name">{{ className }}</text>
          <text class="member-count">{{ memberCount }} 名成员</text>
        </view>
      </view>
      <view class="header-right">
        <view class="member-btn" @click="showMembers = true">
          <uni-icons type="person" size="20" color="#666" />
        </view>
        <view class="more-btn" @click="showActions = true">
          <uni-icons type="bars" size="20" color="#666" />
        </view>
      </view>
    </view>

    <scroll-view class="chat-body" scroll-y :scroll-top="scrollTop">
      <view class="message-list">
        <view
          v-for="msg in messages"
          :key="msg.id"
          class="message-item"
          :class="{ 'is-self': isSelfMessage(msg.senderId) }"
        >
          <view class="message-avatar">
            <image :src="getSenderAvatar(msg.senderId)" mode="aspectFill" />
          </view>
          <view class="message-content-wrapper">
            <text class="message-sender">{{ getSenderName(msg.senderId) }}</text>
            <view class="message-bubble" v-if="!isExamNotice(msg)">
              <text class="message-text">{{ msg.content }}</text>
            </view>
            <view class="exam-notice" v-else>
              <view class="notice-header">
                <text class="notice-icon">{{ iconRocket }}</text>
                <text class="notice-title">{{ getNoticeTitle(msg.content) }}</text>
                <view class="notice-badge">
                  <text>考试通知</text>
                </view>
              </view>
              <view class="notice-info">
                <view class="info-item">
                  <text class="info-icon">{{ iconCalendar }}</text>
                  <text>{{ getNoticeStartTime(msg.content) }}</text>
                </view>
                <view class="info-item">
                  <text class="info-icon">{{ iconTimer }}</text>
                  <text>{{ getNoticeDuration(msg.content) }}分钟</text>
                </view>
              </view>
            </view>
            <text class="message-time">{{ formatTime(msg.createTime) }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="chat-input-wrapper">
      <view class="chat-input">
        <input
          v-model="inputMessage"
          placeholder="输入消息..."
          @confirm="sendMessage"
        />
        <button class="send-btn" @click="sendMessage" :disabled="!inputMessage.trim()">发送</button>
      </view>
    </view>

    <!-- 成员列表弹窗 -->
    <view v-if="showMembers" class="modal" @click="showMembers = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">班级成员</text>
          <view class="modal-close" @click="showMembers = false">
            <uni-icons type="close" size="24" color="#333" />
          </view>
        </view>
        <scroll-view class="members-list" scroll-y>
          <view class="member-item" v-for="member in members" :key="member.userId">
            <view class="member-info">
              <text class="member-name">{{ member.realName }}</text>
              <view class="member-role" :class="'role-' + member.role.toLowerCase()">
                <text>{{ getRoleText(member.role) }}</text>
              </view>
            </view>
            <view v-if="member.muteUntil" class="mute-status">
              <text>已禁言</text>
            </view>
            <view v-if="canManageMember" class="member-actions">
              <button v-if="!member.muteUntil" class="mute-btn" @click="handleMute(member)">禁言</button>
              <button v-else class="unmute-btn" @click="handleUnmute(member)">解禁</button>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 操作面板 -->
    <view v-if="showActions" class="modal" @click="showActions = false">
      <view class="action-panel" @click.stop>
        <view class="action-item" @click="handleSendExamNotice">
          <uni-icons type="flag" size="24" color="#409eff" />
          <text>发送考试通知</text>
        </view>
        <view class="action-item" @click="handleInvite">
          <uni-icons type="personadd" size="24" color="#67c23a" />
          <text>邀请成员</text>
        </view>
        <view class="action-item danger" @click="showActions = false">
          <text>取消</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '../../store/index.js'
import { classApi } from '../../utils/api.js'

const userStore = useUserStore()
const classId = ref('')
const className = ref('')
const memberCount = ref(0)
const messages = ref([])
const members = ref([])
const inputMessage = ref('')
const showMembers = ref(false)
const showActions = ref(false)
const scrollTop = ref(0)
const canManageMember = ref(false)
const currentRole = ref('')

const iconRocket = '🚀'
const iconCalendar = '📅'
const iconTimer = '⏱'

const getRoleText = (role) => {
  return {
    CREATOR: '创建者',
    TEACHER: '教师',
    STUDENT: '学生'
  }[role] || role
}

const isSelfMessage = (senderId) => {
  const userId = userStore.userInfo?.userId
  return String(senderId) === String(userId)
}

const isExamNotice = (msg) => {
  return msg.content?.startsWith('EXAM_NOTICE|')
}

const parseExamNotice = (content) => {
  if (!content?.startsWith('EXAM_NOTICE|')) return null
  const parts = content.split('|')
  return {
    noticeType: parts[1],
    title: parts[2],
    startTime: parts[3],
    endTime: parts[4],
    duration: parts[5],
    examId: parts[6]
  }
}

const getNoticeTitle = (content) => {
  const notice = parseExamNotice(content)
  return notice ? notice.title : ''
}

const getNoticeStartTime = (content) => {
  const notice = parseExamNotice(content)
  return notice ? notice.startTime : ''
}

const getNoticeDuration = (content) => {
  const notice = parseExamNotice(content)
  return notice ? notice.duration : ''
}

const getSenderName = (senderId) => {
  const member = members.value.find(m => m.userId === senderId)
  return member?.realName || '未知用户'
}

const getSenderAvatar = (senderId) => {
  const member = members.value.find(m => m.userId === senderId)
  return member?.avatar || '/static/default-avatar.png'
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return date.toLocaleDateString('zh-CN')
}

const goBack = () => {
  uni.navigateBack()
}

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return

  try {
    const userId = userStore.userInfo?.userId
    const res = await classApi.sendMessage(classId.value, userId, inputMessage.value)
    if (res.code === 200) {
      inputMessage.value = ''
      loadMessages()
    } else {
      uni.showToast({ title: res.message || '发送失败', icon: 'none' })
    }
  } catch (e) {
    console.error(e)
    uni.showToast({ title: '网络错误', icon: 'none' })
  }
}

const handleSendExamNotice = () => {
  showActions.value = false
  uni.showToast({ title: '考试通知功能开发中', icon: 'none' })
}

const handleInvite = () => {
  showActions.value = false
  uni.showModal({
    title: '邀请成员',
    content: `班级群号：${inviteCode}\n将此群号分享给需要加入的成员`,
    showCancel: false
  })
}

const handleMute = async (member) => {
  uni.showModal({
    title: '禁言成员',
    content: `确定要禁言 ${member.realName} 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await classApi.muteMember(classId.value, member.userId, 3600)
          if (result.code === 200) {
            uni.showToast({ title: '已禁言', icon: 'success' })
            loadMembers()
          } else {
            uni.showToast({ title: result.message || '操作失败', icon: 'none' })
          }
        } catch (e) {
          uni.showToast({ title: '网络错误', icon: 'none' })
        }
      }
    }
  })
}

const handleUnmute = async (member) => {
  uni.showModal({
    title: '解禁成员',
    content: `确定要解除 ${member.realName} 的禁言吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await classApi.unmuteMember(classId.value, member.userId)
          if (result.code === 200) {
            uni.showToast({ title: '已解禁', icon: 'success' })
            loadMembers()
          } else {
            uni.showToast({ title: result.message || '操作失败', icon: 'none' })
          }
        } catch (e) {
          uni.showToast({ title: '网络错误', icon: 'none' })
        }
      }
    }
  })
}

const loadMessages = async () => {
  try {
    const res = await classApi.getMessages(classId.value)
    if (res.code === 200) {
      messages.value = res.data
      nextTick(() => {
        scrollTop.value = 999999
      })
    }
  } catch (e) {
    console.error(e)
  }
}

const loadMembers = async () => {
  try {
    const res = await classApi.getMembers(classId.value)
    if (res.code === 200) {
      members.value = res.data
      memberCount.value = res.data.length

      const userId = userStore.userInfo?.userId
      const currentMember = res.data.find(m => m.userId === userId)
      if (currentMember) {
        currentRole.value = currentMember.role
        canManageMember.value = currentMember.role === 'CREATOR' || currentMember.role === 'TEACHER'
      }
    }
  } catch (e) {
    console.error(e)
  }
}

const loadClassInfo = async () => {
  try {
    const res = await classApi.getById(classId.value)
    if (res.code === 200) {
      className.value = res.data.className
    }
  } catch (e) {
    console.error(e)
  }
}

onLoad((options) => {
  classId.value = options.id
  loadClassInfo()
  loadMessages()
  loadMembers()
})
</script>

<style scoped>
.class-chat {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.chat-header {
  background: #fff;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.back-btn {
  padding: 8rpx;
}

.header-info {
  display: flex;
  flex-direction: column;
}

.class-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.member-count {
  font-size: 24rpx;
  color: #666;
}

.header-right {
  display: flex;
  gap: 16rpx;
}

.member-btn, .more-btn {
  padding: 8rpx;
}

.chat-body {
  flex: 1;
  height: calc(100vh - 180rpx);
}

.message-list {
  padding: 24rpx;
}

.message-item {
  display: flex;
  margin-bottom: 24rpx;
  align-items: flex-start;
}

.message-item.is-self {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.message-avatar image {
  width: 100%;
  height: 100%;
}

.message-content-wrapper {
  max-width: 70%;
  margin-left: 16rpx;
}

.message-item.is-self .message-content-wrapper {
  margin-left: 0;
  margin-right: 16rpx;
}

.message-sender {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
  display: block;
}

.message-item.is-self .message-sender {
  text-align: right;
}

.message-bubble {
  background: #fff;
  padding: 16rpx 20rpx;
  border-radius: 12rpx;
  display: inline-block;
}

.message-item.is-self .message-bubble {
  background: #409eff;
  color: #fff;
}

.message-text {
  font-size: 28rpx;
  line-height: 1.5;
}

.message-time {
  font-size: 20rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.message-item.is-self .message-time {
  text-align: right;
}

.exam-notice {
  background: #fff;
  padding: 24rpx;
  border-radius: 12rpx;
  border: 2rpx solid #409eff;
}

.notice-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.notice-icon {
  font-size: 28rpx;
}

.notice-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.notice-badge {
  padding: 4rpx 12rpx;
  background: #409eff;
  color: #fff;
  border-radius: 8rpx;
  font-size: 20rpx;
}

.notice-info {
  margin-bottom: 16rpx;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
  font-size: 24rpx;
  color: #666;
}

.info-icon {
  margin-right: 8rpx;
}

.chat-input-wrapper {
  background: #fff;
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #eee;
}

.chat-input {
  display: flex;
  gap: 16rpx;
}

.chat-input input {
  flex: 1;
  height: 72rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
}

.send-btn {
  width: 120rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: #409eff;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.send-btn:disabled {
  background: #f5f5f5;
  color: #999;
}

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 90%;
  max-height: 70vh;
  background: #fff;
  border-radius: 16rpx;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #eee;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  padding: 8rpx;
}

.members-list {
  padding: 24rpx;
  max-height: 60vh;
}

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.member-name {
  font-size: 28rpx;
  color: #333;
}

.member-role {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
}

.role-creator {
  background: #f56c6c;
  color: #fff;
}

.role-teacher {
  background: #e6a23c;
  color: #fff;
}

.role-student {
  background: #409eff;
  color: #fff;
}

.mute-status {
  padding: 4rpx 12rpx;
  background: #909399;
  color: #fff;
  border-radius: 8rpx;
  font-size: 20rpx;
}

.member-actions {
  display: flex;
  gap: 8rpx;
}

.mute-btn, .unmute-btn {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.mute-btn {
  background: #f56c6c;
  color: #fff;
}

.unmute-btn {
  background: #67c23a;
  color: #fff;
}

/* 操作面板 */
.action-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
  background: #f5f5f5;
}

.action-item.danger {
  background: #f56c6c;
  color: #fff;
  justify-content: center;
}

.action-item text {
  font-size: 28rpx;
  color: #333;
}
</style>