<template>
  <div class="layout-container">
    <div class="main-container">
      <aside class="sidebar" :class="{ 'sidebar-collapsed': isMobile }">
        <div class="user-profile" @click="navigateToAccount">
          <el-avatar :size="50" :src="userInfo.avatar || ''" class="user-avatar">
            {{ displayName?.charAt(0) }}
          </el-avatar>
          <div class="user-name">{{ displayName }}</div>
          <div class="user-role">{{ roleName }}</div>
        </div>
        <el-menu :default-active="activeMenu" @select="handleSidebarSelect" class="sidebar-menu">
          <template v-for="item in currentMenus" :key="item.path">
            <el-menu-item :index="item.path">
              <el-icon><component :is="iconMap[item.icon]" /></el-icon>
              <span>{{ item.title }}</span>
            </el-menu-item>
          </template>
        </el-menu>
      </aside>
      <div class="content-wrapper">
        <header class="top-bar">
          <div class="top-bar-left">
            <div class="logo-container">
              <img src="../assets/images/Logo.png" alt="ExamPro Logo" class="top-logo" />
              <span class="logo-text">ExamPro</span>
            </div>
            <span class="top-bar-title">{{ currentPageTitle }}</span>
          </div>
          <div class="top-bar-right">
            <span class="nav-link" @click="navigateToDashboard">进入空间</span>
            <span class="nav-divider">|</span>
            <span class="nav-link">消息</span>
            <span class="nav-divider">|</span>
            <el-avatar :size="28" :src="userInfo.avatar || ''" class="top-avatar">
              {{ displayName?.charAt(0) }}
            </el-avatar>
            <span class="user-name-top">{{ displayName }}</span>
            <el-button type="danger" size="small" plain @click="handleLogout" class="logout-btn">退出</el-button>
          </div>
        </header>
        <main class="content">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { 
  User, OfficeBuilding, Document, Folder, Calendar, Plus,
  Close, Check, Edit, Clock, CircleCheck, CircleClose, DataAnalysis
} from '@element-plus/icons-vue'
import { useUserStore } from '../store'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const userInfo = computed(() => userStore.userInfo || {})

const displayName = computed(() => {
  const name = userInfo.value.realName
  const username = userInfo.value.username
  return name && name.trim() ? name : username
})

const roleName = computed(() => {
  const map = { ADMIN: '管理员', TEACHER: '教师', STUDENT: '学生' }
  return map[userInfo.value.role] || ''
})

const adminMenus = [
  { path: '/dashboard', title: '首页概览', icon: 'DataBoard' },
  { path: '/users', title: '用户管理', icon: 'User' },
  { path: '/departments', title: '院系管理', icon: 'OfficeBuilding' },
  { path: '/classes', title: '班级管理', icon: 'Collection' },
  { path: '/statistics', title: '数据统计', icon: 'BarChart' },
  { path: '/logs', title: '系统日志', icon: 'Document' }
]

const teacherMenus = [
  { path: '/dashboard', title: '首页概览', icon: 'DataBoard' },
  { path: '/teacher/my-classes', title: '我的班级', icon: 'UserFilled' },
  { path: '/classes', title: '班级管理', icon: 'Collection' },
  { path: '/subjects', title: '科目管理', icon: 'Books' },
  { path: '/questions', title: '题库管理', icon: 'Memo' },
  { path: '/papers', title: '试卷管理', icon: 'Files' },
  { path: '/exams', title: '考试管理', icon: 'Calendar' },
  { path: '/exam-records', title: '考试记录', icon: 'Tickets' },
  { path: '/account', title: '账号管理', icon: 'User' }
]

const studentMenus = [
  { path: '/dashboard', title: '首页概览', icon: 'DataBoard' },
  { path: '/student/my-classes', title: '我的班级', icon: 'UserFilled' },
  { path: '/student/exams', title: '考试列表', icon: 'Calendar' },
  { path: '/student/history', title: '考试历史', icon: 'Clock' },
  { path: '/student/statistics', title: '成绩分析', icon: 'DataAnalysis' },
  { path: '/student/wrong', title: '错题本', icon: 'WarnTriangleFilled' },
  { path: '/account', title: '账号管理', icon: 'User' }
]

const iconMap = {
  DataBoard: Document,
  User,
  OfficeBuilding,
  Document,
  Collection: Folder,
  Books: Document,
  Memo: Document,
  Files: Folder,
  Calendar,
  Tickets: Check,
  UserFilled: User,
  Clock,
  DataAnalysis,
  WarnTriangleFilled: CircleClose,
  BarChart: DataAnalysis
}

const menuMap = {
  ADMIN: adminMenus,
  TEACHER: teacherMenus,
  STUDENT: studentMenus
}

const currentMenus = computed(() => {
  const role = userInfo.value.role
  return menuMap[role] || []
})

const activeMenu = computed(() => {
  const path = route.path
  // 处理考试记录路径
  if (path === '/exam-records') return '/exam-records'
  return path
})

const currentPageTitle = computed(() => {
  const path = route.path
  const allMenus = [...adminMenus, ...teacherMenus, ...studentMenus]
  const menu = allMenus.find(item => item.path === path)
  return menu?.title || '在线考试系统'
})

const handleSidebarSelect = (index) => {
  router.push(index)
}

const handleLogout = async () => {
  await ElMessageBox.confirm('确定要退出登录吗？', '提示')
  userStore.logout()
  router.push('/login')
}

const navigateToDashboard = () => {
  router.push('/dashboard')
}

const navigateToAccount = () => {
  const role = userInfo.value.role
  if (role !== 'ADMIN') {
    router.push('/account')
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
  width: 100%;
}

.main-container {
  display: flex;
  flex: 1;
  min-height: calc(100vh - 55px);
}

.sidebar {
  width: 220px;
  min-width: 220px;
  max-width: 280px;
  flex-shrink: 0;
  background: #fbf5eb;
  color: #333;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.sidebar.sidebar-collapsed {
  width: 60px;
  min-width: 60px;
  padding: 12px 0;
}

.sidebar.sidebar-collapsed .user-name,
.sidebar.sidebar-collapsed .user-role,
.sidebar.sidebar-collapsed .el-menu-item span {
  display: none;
}

.sidebar.sidebar-collapsed .sidebar .el-menu-item {
  justify-content: center;
  padding: 0;
  border-radius: 12px;
  margin: 4px 8px;
}

.sidebar.sidebar-collapsed .sidebar .el-menu-item .el-icon {
  margin-right: 0;
}

.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  padding: 12px 0;
}

.user-profile:hover {
  background-color: rgba(255, 106, 106, 0.1);
}

.user-avatar {
  margin-bottom: 10px;
  background: linear-gradient(135deg, #FF6A6A, #CD5C5C) !important;
  font-size: 18px;
  font-weight: 600;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-name {
  font-size: 14px;
  text-align: center;
  margin-bottom: 4px;
  color: #333;
  font-weight: 600;
}

.user-role {
  font-size: 12px;
  color: #666;
}

.sidebar-menu {
  flex: 1;
  width: 100%;
  border-right: none;
  background: transparent !important;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.top-bar {
  background-color: #fff;
  padding: 0 16px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
  gap: 12px;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 20px;
  border-right: 1px solid #e0e0e0;
}

.top-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #FF6A6A;
}

.top-bar-title {
  font-size: 17px;
  font-weight: 600;
  color: #2c3e50;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.nav-link {
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 6px 12px;
  border-radius: 6px;
}

.nav-link:hover {
  color: #FF6A6A;
  background-color: rgba(255, 106, 106, 0.1);
}

.nav-divider {
  color: #ddd;
  font-size: 14px;
}

.top-avatar {
  background: linear-gradient(135deg, #FF6A6A, #CD5C5C) !important;
  font-size: 12px;
  font-weight: 500;
}

.user-name-top {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.logout-btn {
  background: linear-gradient(135deg, #FF6A6A, #CD5C5C) !important;
  border: none !important;
  color: #fff !important;
  font-size: 13px;
  padding: 6px 16px !important;
  margin-left: 8px;
}

.logout-btn:hover {
  background: linear-gradient(135deg, #FF5252, #C44040) !important;
}

.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.sidebar .el-menu {
  border-right: none;
  background: transparent !important;
}

.sidebar .el-menu-item {
  height: 52px;
  line-height: 52px;
  margin: 0;
  border-radius: 0 12px 12px 0;
  margin-bottom: 4px;
  padding: 0 24px;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  transition: all 0.2s ease;
}

.sidebar .el-menu-item:hover {
  background-color: rgba(255, 106, 106, 0.1);
  color: #FF6A6A;
}

.sidebar .el-menu-item.is-active {
  background: linear-gradient(90deg, #FF6A6A, #CD5C5C) !important;
  color: #fff !important;
}

.sidebar .el-menu-item .el-icon {
  margin-right: 12px;
  font-size: 18px;
}

.sidebar .el-menu-item span {
  font-size: 14px;
  display: inline;
  margin-top: 0;
}

@media screen and (max-width: 768px) {
  .sidebar,
  .sidebar.sidebar-collapsed {
    width: 55px;
    min-width: 55px;
    max-width: 55px;
    padding: 10px 0;
  }
  
  .sidebar .user-name,
  .sidebar .user-role,
  .sidebar .el-menu-item span,
  .sidebar.sidebar-collapsed .user-name,
  .sidebar.sidebar-collapsed .user-role,
  .sidebar.sidebar-collapsed .el-menu-item span {
    display: none !important;
  }
  
  .sidebar .user-avatar {
    margin-bottom: 6px;
    width: 40px !important;
    height: 40px !important;
    font-size: 14px !important;
  }
  
  .sidebar .el-menu-item {
    justify-content: center !important;
    padding: 0 !important;
    border-radius: 10px;
    margin: 3px 6px !important;
  }
  
  .sidebar .el-menu-item .el-icon {
    margin-right: 0 !important;
  }
  
  .top-bar {
    padding: 8px 12px !important;
    min-height: 50px;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .top-bar-left {
    gap: 10px;
    width: 100%;
    justify-content: space-between;
  }
  
  .logo-container {
    padding-right: 0;
    border-right: none;
  }
  
  .logo-text {
    font-size: 16px;
  }
  
  .top-bar-title {
    font-size: 14px;
  }
  
  .top-bar-right {
    gap: 6px;
    width: 100%;
    justify-content: flex-end;
  }
  
  .nav-link {
    display: none !important;
  }
  
  .nav-divider {
    display: none !important;
  }
  
  .user-name-top {
    display: none;
  }
  
  .top-avatar {
    width: 32px !important;
    height: 32px !important;
    font-size: 12px !important;
  }
  
  .logout-btn {
    padding: 4px 12px !important;
    font-size: 12px !important;
  }
  
  .content {
    padding: 12px;
  }
}

@media screen and (min-width: 769px) and (max-width: 1024px) {
  .sidebar {
    width: 180px;
    min-width: 180px;
  }
  
  .top-bar {
    padding: 0 20px;
  }
  
  .content {
    padding: 20px;
  }
  
  .nav-link:not(:last-of-type),
  .nav-divider {
    display: none;
  }
}

@media screen and (min-width: 1025px) and (max-width: 1200px) {
  .top-bar-right {
    gap: 10px;
  }
  
  .nav-link {
    padding: 6px 10px;
    font-size: 13px;
  }
}
</style>
