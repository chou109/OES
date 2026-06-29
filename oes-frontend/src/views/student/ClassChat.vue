<template>
  <div class="class-chat">
    <div class="chat-header">
      <div class="header-left">
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h2>{{ className }}</h2>
        <span class="member-count">{{ memberCount }} 名成员</span>
      </div>
      <div class="header-right">
        <el-button link @click="showMembers = !showMembers">
          <el-icon><User /></el-icon>
          成员
        </el-button>
      </div>
    </div>

    <div class="chat-body">
      <div class="message-list" ref="messageList">
        <div 
          v-for="msg in messages" 
          :key="msg.id" 
          class="message-item"
          :class="{ 'is-self': isSelfMessage(msg.senderId) }"
        >
          <div class="message-avatar">
            <el-avatar :size="40" :src="getSenderAvatar(msg.senderId)">
              {{ getSenderName(msg.senderId).charAt(0) }}
            </el-avatar>
          </div>
          <div class="message-content-wrapper">
            <p class="message-sender">{{ getSenderName(msg.senderId) }}</p>
            <div class="message-bubble" v-if="!isExamNotice(msg)">
              <p class="message-text">{{ msg.content }}</p>
            </div>
            <div class="exam-notice" v-else>
              <div class="notice-header">
                <span class="notice-icon">{{ parseExamNotice(msg.content)?.noticeType === 'START' ? '🚀' : '📢' }}</span>
                <span class="notice-title">{{ parseExamNotice(msg.content)?.title }}</span>
                <span class="notice-badge">{{ parseExamNotice(msg.content)?.noticeType === 'START' ? '进行中' : '待开始' }}</span>
              </div>
              <div class="notice-info">
                <div class="info-item">
                  <span class="info-icon">📅</span>
                  <span>开始时间：{{ parseExamNotice(msg.content)?.startTime }}</span>
                </div>
                <div class="info-item">
                  <span class="info-icon">🔚</span>
                  <span>结束时间：{{ parseExamNotice(msg.content)?.endTime }}</span>
                </div>
                <div class="info-item">
                  <span class="info-icon">⏱️</span>
                  <span>考试时长：{{ parseExamNotice(msg.content)?.duration }}分钟</span>
                </div>
              </div>
              <div class="notice-action">
                <el-button type="primary" size="small" @click="goToExamList(msg)">{{ parseExamNotice(msg.content)?.noticeType === 'START' ? '进入考试' : '查看考试' }}</el-button>
              </div>
            </div>
            <p class="message-time">{{ formatTime(msg.createTime) }}</p>
          </div>
        </div>
      </div>

      <div class="chat-input-wrapper">
        <div class="chat-input">
          <el-input 
            v-model="inputMessage" 
            placeholder="输入消息..." 
            style="flex: 1"
            @keyup.enter="sendMessage"
            :disabled="isMuted"
          />
          <el-button 
            type="danger" 
            @click="sendMessage"
            :disabled="!inputMessage.trim() || isMuted"
          >
            发送
          </el-button>
        </div>
        <div v-if="isMuted" class="muted-tip">
          您已被禁言
        </div>
      </div>
    </div>

    <div class="members-panel" v-if="showMembers">
      <div class="panel-header">
        <h3>班级成员</h3>
        <el-button link @click="showMembers = false">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      <div class="members-list">
        <div 
          v-for="member in members" 
          :key="member.userId" 
          class="member-item"
        >
          <div class="member-info">
            <span class="member-name">{{ member.realName }}</span>
            <span :class="'member-role ' + member.role.toLowerCase()">{{ getRoleText(member.role) }}</span>
          </div>
          <span v-if="member.muteUntil" class="mute-status">已禁言</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, User, Close } from '@element-plus/icons-vue'
import { useUserStore } from '../../store'
import { classApi } from '../../utils/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const classId = ref(route.params.id)
const className = ref('')
const memberCount = ref(0)
const messages = ref([])
const members = ref([])
const inputMessage = ref('')
const showMembers = ref(false)
const isMuted = ref(false)
const currentUserId = ref(userStore.userInfo?.userId || localStorage.getItem('userId'))
const messageList = ref(null)

// 判断是否是当前用户发送的消息
const isSelfMessage = (senderId) => {
  const userId = userStore.userInfo?.userId || localStorage.getItem('userId')
  return String(senderId) === String(userId)
}

// 判断是否是考试通知
const isExamNotice = (msg) => {
  return msg.content?.startsWith('EXAM_NOTICE|')
}

// 解析考试通知
const parseExamNotice = (content) => {
  if (!content?.startsWith('EXAM_NOTICE|')) return null
  const parts = content.split('|')
  return {
    title: parts[1] || '',
    startTime: parts[2] || '',
    endTime: parts[3] || '',
    duration: parts[4] || '',
    examId: parts[5] || '',
    noticeType: parts[6] || 'PUBLISH'
  }
}

// 跳转考试列表或考试页面
const goToExamList = (msg) => {
  const examInfo = parseExamNotice(msg.content)
  if (examInfo && examInfo.noticeType === 'START' && examInfo.examId) {
    router.push(`/student/examing/${examInfo.examId}`)
  } else {
    router.push('/student/exams')
  }
}

const loadClassInfo = async () => {
  try {
    const res = await classApi.getClassInfo(classId.value)
    if (res.code === 200) {
      className.value = res.data.className
    }
  } catch (e) {
    console.error(e)
  }
}

const loadMembers = async () => {
  try {
    const res = await classApi.getClassMembers(classId.value)
    if (res.code === 200) {
      members.value = res.data
      memberCount.value = res.data.length
    }
  } catch (e) {
    console.error(e)
  }
}

const loadMessages = async () => {
  try {
    const res = await classApi.getMessages(classId.value, 1, 50)
    if (res.code === 200) {
      messages.value = (res.data.records || res.data).reverse()
      scrollToBottom()
    }
  } catch (e) {
    console.error(e)
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isMuted.value) return
  
  try {
    const userId = userStore.userInfo?.userId || localStorage.getItem('userId')
    if (!userId) {
      ElMessage.error('请先登录')
      return
    }
    const res = await classApi.sendMessage(classId.value, inputMessage.value, userId)
    if (res.code === 200) {
      messages.value.push(res.data)
      inputMessage.value = ''
      scrollToBottom()
    } else {
      ElMessage.error(res.message || '发送失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('发送失败')
  }
}

const checkMuted = async () => {
  try {
    const userId = userStore.userInfo?.userId || localStorage.getItem('userId')
    if (!userId) {
      console.warn('用户未登录')
      return
    }
    const res = await classApi.checkMemberRole(classId.value, userId)
    if (res.code === 200) {
      isMuted.value = res.data.isMuted
    }
  } catch (e) {
    console.error(e)
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  })
}

const getSenderName = (senderId) => {
  const member = members.value.find(m => m.userId == senderId)
  if (!member) return '未知用户'
  return member.realName || member.username || '未知用户'
}

const getSenderAvatar = (senderId) => {
  const member = members.value.find(m => m.userId == senderId)
  return member?.avatar || ''
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const getRoleText = (role) => {
  const roleMap = {
    OWNER: '所有者',
    ADMIN: '管理员',
    MEMBER: '成员'
  }
  return roleMap[role] || role
}

const goBack = () => {
  router.push('/student/my-classes')
}

onMounted(() => {
  currentUserId.value = userStore.userInfo?.userId || localStorage.getItem('userId')
  loadClassInfo()
  loadMembers()
  loadMessages()
  checkMuted()
})

watch(() => route.params.id, (newId) => {
  classId.value = newId
  loadClassInfo()
  loadMembers()
  loadMessages()
})
</script>

<style scoped>
.class-chat {
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  font-size: 18px;
}

.member-count {
  color: #999;
  font-size: 14px;
}

.chat-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 100px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 12px;
}

/* 他人消息 - 左侧显示 */
.message-item .message-avatar {
  flex-shrink: 0;
}

.message-item .message-content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 70%;
}

.message-sender {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #999;
}

.message-bubble {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  word-break: break-word;
}

.message-time {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #ccc;
}

.exam-notice {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  border-radius: 12px;
  padding: 16px;
  color: #fff;
  min-width: 280px;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.exam-notice .notice-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.exam-notice .notice-icon {
  font-size: 20px;
}

.exam-notice .notice-title {
  font-size: 16px;
  font-weight: bold;
  flex: 1;
}

.exam-notice .notice-badge {
  background: rgba(255, 255, 255, 0.3);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.exam-notice .notice-info {
  margin-bottom: 12px;
}

.exam-notice .info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 14px;
}

.exam-notice .info-icon {
  font-size: 14px;
}

.exam-notice .notice-action {
  display: flex;
  justify-content: flex-end;
}

.exam-notice .notice-action .el-button {
  background: #fff;
  color: #ff6b6b;
  border: none;
}

.exam-notice .notice-action .el-button:hover {
  background: #f8f9fa;
}

/* 自己发送的消息 - 右侧显示 */
.message-item.is-self {
  flex-direction: row-reverse;
}

.message-item.is-self .message-content-wrapper {
  align-items: flex-end;
}

.message-item.is-self .message-bubble {
  background: #f5222d;
}

.message-item.is-self .message-text {
  color: #fff;
}

/* 固定在底部的输入框 */
.chat-input-wrapper {
  position: fixed;
  bottom: 0;
  left: 200px;
  right: 0;
  background: #fff;
  border-top: 1px solid #eee;
  padding: 16px 24px;
  z-index: 10;
}

.chat-input {
  display: flex;
  gap: 12px;
  width: 100%;
  margin: 0 auto;
}

.muted-tip {
  text-align: center;
  color: #f56c6c;
  font-size: 14px;
  margin-top: 8px;
}

.members-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 300px;
  max-width: 80%;
  width: 300px;
  background: #fff;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  margin: 0;
}

.members-list {
  padding: 16px;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-name {
  font-size: 14px;
}

.member-role {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.member-role.owner {
  background: #f5222d;
  color: #fff;
}

.member-role.admin {
  background: #1890ff;
  color: #fff;
}

.member-role.member {
  background: #f5f5f5;
  color: #666;
}

.mute-status {
  font-size: 12px;
  color: #f5222d;
}
</style>
