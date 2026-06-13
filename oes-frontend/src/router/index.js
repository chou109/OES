import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    component: () => import('../layout/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '首页概览' }
      },
      {
        path: 'users',
        name: 'UserManage',
        component: () => import('../views/admin/UserManage.vue'),
        meta: { title: '用户管理', roles: ['ADMIN'] }
      },
      {
        path: 'departments',
        name: 'DepartmentManage',
        component: () => import('../views/admin/DepartmentManage.vue'),
        meta: { title: '院系管理', roles: ['ADMIN'] }
      },
      {
        path: 'classes',
        name: 'ClassManage',
        component: () => import('../views/admin/ClassManage.vue'),
        meta: { title: '班级管理', roles: ['ADMIN', 'TEACHER'] }
      },
      {
        path: 'logs',
        name: 'LogManage',
        component: () => import('../views/admin/LogManage.vue'),
        meta: { title: '系统日志', roles: ['ADMIN'] }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('../views/admin/Statistics.vue'),
        meta: { title: '数据统计', roles: ['ADMIN'] }
      },
      {
        path: 'subjects',
        name: 'SubjectManage',
        component: () => import('../views/teacher/SubjectManage.vue'),
        meta: { title: '科目管理', roles: ['ADMIN', 'TEACHER'] }
      },
      {
        path: 'questions',
        name: 'QuestionManage',
        component: () => import('../views/teacher/QuestionManage.vue'),
        meta: { title: '题库管理', roles: ['ADMIN', 'TEACHER'] }
      },
      {
        path: 'papers',
        name: 'PaperManage',
        component: () => import('../views/teacher/PaperManage.vue'),
        meta: { title: '试卷管理', roles: ['ADMIN', 'TEACHER'] }
      },
      {
        path: 'exams',
        name: 'ExamManage',
        component: () => import('../views/teacher/ExamManage.vue'),
        meta: { title: '考试管理', roles: ['ADMIN', 'TEACHER'] }
      },
      {
        path: 'exam-records',
        name: 'ExamRecordManage',
        component: () => import('../views/teacher/ExamRecordManage.vue'),
        meta: { title: '考试记录', roles: ['ADMIN', 'TEACHER'] }
      },
      {
        path: 'account',
        name: 'Account',
        component: () => import('../views/Account.vue'),
        meta: { title: '账号管理', roles: ['STUDENT', 'TEACHER'] }
      },
      {
        path: 'student/exams',
        name: 'StudentExamList',
        component: () => import('../views/student/ExamList.vue'),
        meta: { title: '考试列表', roles: ['STUDENT'] }
      },
      {
        path: 'student/examing/:id',
        name: 'StudentExam',
        component: () => import('../views/student/ExamTake.vue'),
        meta: { title: '在线考试', roles: ['STUDENT'] }
      },
      {
        path: 'student/history',
        name: 'StudentHistory',
        component: () => import('../views/student/History.vue'),
        meta: { title: '考试历史', roles: ['STUDENT'] }
      },
      {
        path: 'student/wrong',
        name: 'StudentWrong',
        component: () => import('../views/student/WrongQuestions.vue'),
        meta: { title: '错题本', roles: ['STUDENT'] }
      },
      {
        path: 'student/statistics',
        name: 'StudentStatistics',
        component: () => import('../views/student/Statistics.vue'),
        meta: { title: '成绩分析', roles: ['STUDENT'] }
      },
      {
        path: 'student/my-classes',
        name: 'StudentMyClasses',
        component: () => import('../views/student/MyClasses.vue'),
        meta: { title: '我的班级', roles: ['STUDENT'] }
      },
      {
        path: 'student/class/:id',
        name: 'StudentClassChat',
        component: () => import('../views/student/ClassChat.vue'),
        meta: { title: '班级聊天', roles: ['STUDENT'] }
      },
      {
        path: 'teacher/my-classes',
        name: 'TeacherMyClasses',
        component: () => import('../views/teacher/MyClasses.vue'),
        meta: { title: '我的班级', roles: ['TEACHER'] }
      },
      {
        path: 'teacher/class/:id',
        name: 'TeacherClassChat',
        component: () => import('../views/teacher/ClassChat.vue'),
        meta: { title: '班级聊天', roles: ['TEACHER'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

let isVerifying = false
let verificationPromise = null

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  if (to.path === '/login') {
    if (userStore.token && userStore.isLoginVerified && userStore.userInfo) {
      next('/dashboard')
    } else {
      next()
    }
    return
  }

  if (!userStore.token) {
    next('/login')
    return
  }

  if (!userStore.isLoginVerified) {
    if (!verificationPromise) {
      verificationPromise = userStore.verifyLoginState().finally(() => {
        verificationPromise = null
      })
    }
    const isValid = await verificationPromise
    if (!isValid) {
      next('/login')
      return
    }
  }

  if (userStore.userInfo && userStore.userInfo.role) {
    if (to.meta.roles && !to.meta.roles.includes(userStore.userInfo.role)) {
      next('/dashboard')
    } else {
      next()
    }
  } else {
    next('/login')
  }
})

export default router
