<template>
  <div class="layout-container">
    <div class="main-container">
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo" @click="$router.push('/dashboard')">
            <div class="logo-icon">
              <el-icon><School /></el-icon>
            </div>
            <span class="logo-text">ExamPro</span>
          </div>
          <div class="user-info">
            <el-dropdown @command="handleCommand">
              <div class="user-profile">
                <el-avatar :size="32" :src="userInfo.avatar || ''">
                  {{ userInfo.realName?.charAt(0) }}
                </el-avatar>
                <div class="user-detail">
                  <span class="username">{{ userInfo.realName }}</span>
                  <span class="role">{{ roleName }}</span>
                </div>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="password">修改密码</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        <el-menu :default-active="activeMenu" @select="handleSidebarSelect" class="sidebar-menu">
          <template v-for="item in currentMenus" :key="item.path">
            <el-menu-item :index="item.path">
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.title }}</span>
            </el-menu-item>
          </template>
        </el-menu>
        <div class="student-menu" v-if="userInfo.role === 'STUDENT'">
          <el-menu :default-active="activeMenu" @select="handleSidebarSelect">
            <template v-for="item in studentMenus" :key="item.path">
              <el-menu-item :index="item.path">
                <el-icon><component :is="item.icon" /></el-icon>
                <span>{{ item.title }}</span>
              </el-menu-item>
            </template>
          </el-menu>
        </div>
      </aside>
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { School, ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '../store'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const userInfo = computed(() => userStore.userInfo || {})

const roleName = computed(() => {
  const map = { ADMIN: '管理员', TEACHER: '教师', STUDENT: '学生' }
  return map[userInfo.value.role] || ''
})

const adminMenus = [
  { path: '/dashboard', title: '首页概览', icon: 'DataBoard' },
  { path: '/users', title: '用户管理', icon: 'User' },
  { path: '/departments', title: '院系管理', icon: 'OfficeBuilding' },
  { path: '/logs', title: '系统日志', icon: 'Document' }
]

const teacherMenus = [
  { path: '/dashboard', title: '首页概览', icon: 'DataBoard' },
  { path: '/classes', title: '班级管理', icon: 'Collection' },
  { path: '/subjects', title: '科目管理', icon: 'Books' },
  { path: '/questions', title: '题库管理', icon: 'Memo' },
  { path: '/papers', title: '试卷管理', icon: 'Files' },
  { path: '/exams', title: '考试管理', icon: 'Calendar' },
  { path: '/exam-records', title: '考试记录', icon: 'Tickets' }
]

const studentMenus = [
  { path: '/dashboard', title: '首页概览', icon: 'DataBoard' },
  { path: '/student/exams', title: '考试列表', icon: 'Calendar' },
  { path: '/student/history', title: '考试历史', icon: 'Clock' },
  { path: '/student/wrong', title: '错题本', icon: 'WarnTriangleFilled' }
]

const menuMap = {
  ADMIN: adminMenus,
  TEACHER: teacherMenus,
  STUDENT: studentMenus
}

const currentMenus = computed(() => {
  const role = userInfo.value.role
  if (role === 'STUDENT') return []
  return menuMap[role] || []
})

const activeMenu = computed(() => route.path)

const handleSidebarSelect = (index) => {
  router.push(index)
}

const handleCommand = async (command) => {
  if (command === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示')
    userStore.logout()
    router.push('/login')
  } else if (command === 'password') {
    router.push('/password')
  }
}

onMounted(() => {
  userStore.getUserInfo()
})
</script>

<style lang="scss" scoped>
.layout-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-container {
  display: flex;
  flex: 1;
  height: 100vh;
}

.sidebar {
  width: 240px;
  background: #f8fafc;
  border-right: 1px solid rgba(148, 163, 184, 0.2);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  background: white;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  margin-bottom: 20px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--brand-500), var(--brand-700));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b, #475569);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.user-info {
  margin-top: 10px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 10px;
  transition: background 0.2s;
}

.user-profile:hover {
  background: #f1f5f9;
}

.user-detail {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.username {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.role {
  font-size: 12px;
  color: #64748b;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
}

.student-menu {
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  padding-top: 10px;
}

.student-menu .el-menu {
  border-right: none;
}

.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #f1f5f9;
}

.sidebar .el-menu {
  border-right: none;
  background: transparent;
}

.sidebar .el-menu-item {
  height: 52px;
  line-height: 52px;
  margin: 0 10px;
  border-radius: 8px;
  margin-bottom: 4px;
}

.sidebar .el-menu-item:hover {
  background-color: rgba(148, 163, 184, 0.1);
}

.sidebar .el-menu-item.is-active {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}
</style>
