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
        <el-dropdown trigger="click" @command="handleDropdownCommand">
          <el-button type="danger">
            <el-icon><Plus /></el-icon>
            发布
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="exam">
                <el-icon><Document /></el-icon>
                发布考试
              </el-dropdown-item>
              <el-dropdown-item command="homework" disabled>
                <el-icon><Notebook /></el-icon>
                发布作业（暂未开放）
              </el-dropdown-item>
              <el-dropdown-item command="notice" disabled>
                <el-icon><Bell /></el-icon>
                发布公告（暂未开放）
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button link @click="showMembers = !showMembers" style="margin-left: 8px">
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
            <div class="message-bubble">
              <p class="message-text">{{ msg.content }}</p>
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
          />
          <el-button 
            type="danger" 
            @click="sendMessage"
            :disabled="!inputMessage.trim()"
          >
            发送
          </el-button>
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
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, User, Close, Plus, Document, Notebook, Bell } from '@element-plus/icons-vue'
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
const messageList = ref(null)

const handleDropdownCommand = (command) => {
  if (command === 'exam') {
    router.push({ path: '/teacher/exam/manage', query: { classId: classId.value } })
  } else if (command === 'homework') {
    ElMessage.info('作业功能暂未开放')
  } else if (command === 'notice') {
    ElMessage.info('公告功能暂未开放')
  }
}

const isSelfMessage = (senderId) => {
  const userId = userStore.userInfo?.userId || localStorage.getItem('userId')
  return String(senderId) === String(userId)
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
  if (!inputMessage.value.trim()) return
  
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

const scrollToBottom = () => {
  nextTick(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  })
}

const getSenderName = (senderId) => {
  const member = members.value.find(m => m.userId == senderId)
  return member ? member.realName : '未知用户'
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
  router.push('/teacher/my-classes')
}

onMounted(() => {
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
  margin-left: 200px;
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
  max-width: 1200px;
  margin: 0 auto;
}

.members-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
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
