<template>
  <div class="login-container">
    <div class="login-left">
      <div class="brand">
        <div class="logo">
          <el-icon><Edit /></el-icon>
        </div>
        <h1>ExamPro</h1>
      </div>
      <p class="slogan">专业的在线考试系统，让学习更高效</p>
      <div class="features">
        <div class="feature">
          <el-icon><Check /></el-icon>
          <span>丰富的题型支持</span>
        </div>
        <div class="feature">
          <el-icon><Check /></el-icon>
          <span>智能防作弊机制</span>
        </div>
        <div class="feature">
          <el-icon><Check /></el-icon>
          <span>自动评分系统</span>
        </div>
        <div class="feature">
          <el-icon><Check /></el-icon>
          <span>全面的数据分析</span>
        </div>
      </div>
    </div>
    <div class="login-right">
      <div class="login-card">
        <!-- 学生/教师登录切换 -->
        <div v-if="!showAdminLogin">
          <h2>欢迎回来</h2>
          <p class="subtitle">请选择登录身份</p>
          
          <div class="login-tabs">
            <div 
              class="login-tab" 
              :class="{ active: loginType === 'student' }"
              @click="loginType = 'student'"
            >
              <el-icon><User /></el-icon>
              <span>学生登录</span>
            </div>
            <div 
              class="login-tab" 
              :class="{ active: loginType === 'teacher' }"
              @click="loginType = 'teacher'"
            >
              <el-icon><UserFilled /></el-icon>
              <span>教师登录</span>
            </div>
          </div>
          
          <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
            <el-form-item prop="username">
              <el-input
                v-model="form.username"
                :placeholder="loginType === 'student' ? '请输入学生用户名' : '请输入教师用户名'"
                size="large"
                :prefix-icon="User"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" :loading="loading" native-type="submit" class="login-btn">
                {{ loginType === 'student' ? '学生登录' : '教师登录' }}
              </el-button>
            </el-form-item>
          </el-form>
          
          <div class="admin-login-btn">
            <el-button type="info" @click="showAdminLogin = true">管理员登录</el-button>
          </div>
        </div>
        
        <!-- 管理员登录 -->
        <div v-else>
          <h2>管理员登录</h2>
          <p class="subtitle">请输入管理员账号</p>
          
          <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
            <el-form-item prop="username">
              <el-input
                v-model="form.username"
                placeholder="请输入管理员用户名"
                size="large"
                :prefix-icon="User"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" :loading="loading" native-type="submit" class="login-btn">
                管理员登录
              </el-button>
            </el-form-item>
          </el-form>
          
          <div class="back-btn">
            <el-button type="info" @click="showAdminLogin = false">回到学生/教师端</el-button>
          </div>
        </div>
        
        <div class="demo-accounts">
          <p>演示账号：</p>
          <el-tag v-if="!showAdminLogin && loginType === 'student'">学生: student1 / admin123</el-tag>
          <el-tag v-if="!showAdminLogin && loginType === 'teacher'">教师: teacher1 / admin123</el-tag>
          <el-tag v-if="showAdminLogin">管理员: admin / admin123</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, UserFilled, Lock, Check, Edit } from '@element-plus/icons-vue'
import { useUserStore } from '../store'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: ''
})

const loginType = ref('student') // student 或 teacher
const showAdminLogin = ref(false)

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const result = await userStore.login(form)
    
    // 验证登录类型是否匹配
    if (!showAdminLogin.value) {
      const expectedRole = loginType.value === 'student' ? 'STUDENT' : 'TEACHER'
      if (result.role !== expectedRole) {
        throw new Error(loginType.value === 'student' ? '不存在此学生账号' : '不存在此教师账号')
      }
    }
    
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  min-height: 100vh;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: white;
}

.brand {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;
}

.logo {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.brand h1 {
  font-size: 36px;
  font-weight: 700;
}

.slogan {
  font-size: 20px;
  opacity: 0.9;
  margin-bottom: 60px;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
}

.feature .el-icon {
  font-size: 20px;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px;
  border-radius: 8px;
}

.login-right {
  width: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.login-card {
  width: 360px;
  padding: 40px;
}

.login-card h2 {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.subtitle {
  color: #64748b;
  margin-bottom: 32px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.demo-accounts {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.demo-accounts p {
  color: #64748b;
  font-size: 13px;
  margin-bottom: 12px;
}

.demo-accounts .el-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.login-tabs {
  display: flex;
  margin-bottom: 32px;
  border-bottom: 1px solid #e2e8f0;
}

.login-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 0;
  cursor: pointer;
  font-size: 16px;
  color: #64748b;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.login-tab:hover {
  color: #3b82f6;
}

.login-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  font-weight: 600;
}

.login-tab .el-icon {
  font-size: 18px;
}

.admin-login-btn,
.back-btn {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.admin-login-btn .el-button,
.back-btn .el-button {
  font-size: 14px;
  padding: 8px 16px;
}
</style>
