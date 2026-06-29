<template>
  <div class="login-container">
    <div class="login-left">
      <div class="brand">
        <div class="logo">
          <img src="../assets/images/Logo.png" alt="ExamPro Logo" />
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
        <!-- 学生/教师登录 -->
        <div v-if="!showAdminLogin && !showRegister">
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
              <el-button type="danger" size="large" :loading="loading" native-type="submit" class="login-btn">
                {{ loginType === 'student' ? '学生登录' : '教师登录' }}
              </el-button>
            </el-form-item>
          </el-form>
          
          <div class="action-buttons">
            <el-button type="danger" plain @click="showAdminLogin = true">管理员登录</el-button>
            <el-button type="primary" plain @click="openRegister">去注册</el-button>
          </div>
        </div>
        
        <!-- 管理员登录 -->
        <div v-else-if="showAdminLogin && !showRegister">
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
              <el-button type="danger" size="large" :loading="loading" native-type="submit" class="login-btn">
                管理员登录
              </el-button>
            </el-form-item>
          </el-form>
          
          <div class="action-buttons single">
            <el-button type="danger" plain @click="showAdminLogin = false">回到学生/教师端</el-button>
          </div>
        </div>
        
        <!-- 注册界面 -->
        <div v-else-if="showRegister">
          <h2>创建账号</h2>
          <p class="subtitle">请选择身份并填写注册信息</p>
          
          <div class="login-tabs">
            <div 
              class="login-tab" 
              :class="{ active: registerForm.role === 'STUDENT' }"
              @click="registerForm.role = 'STUDENT'"
            >
              <el-icon><User /></el-icon>
              <span>学生</span>
            </div>
            <div 
              class="login-tab" 
              :class="{ active: registerForm.role === 'TEACHER' }"
              @click="registerForm.role = 'TEACHER'"
            >
              <el-icon><UserFilled /></el-icon>
              <span>教师</span>
            </div>
          </div>
          
          <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" @submit.prevent="handleRegister">
            <el-form-item prop="username">
              <el-input
                v-model="registerForm.username"
                placeholder="请输入用户名"
                size="large"
                :prefix-icon="User"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="请确认密码"
                size="large"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <el-form-item prop="departmentId">
              <el-select
                v-model="registerForm.departmentId"
                placeholder="请选择学院"
                size="large"
              >
                <el-option
                  v-for="dept in departments"
                  :key="dept.id"
                  :label="dept.name"
                  :value="dept.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="danger" size="large" :loading="registerLoading" native-type="submit" class="login-btn">
                注册
              </el-button>
            </el-form-item>
          </el-form>
          
          <div class="action-buttons single">
            <el-button type="primary" plain @click="backToLogin">去登录</el-button>
          </div>
        </div>
        
        <div class="demo-accounts">
          <p>演示账号：</p>
          <el-tag v-if="!showAdminLogin && !showRegister && loginType === 'student'">学生: s / stu</el-tag>
          <el-tag v-if="!showAdminLogin && !showRegister && loginType === 'teacher'">教师: t / tchr</el-tag>
          <el-tag v-if="showAdminLogin && !showRegister">管理员: a / admin</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, UserFilled, Lock, Check } from '@element-plus/icons-vue'
import { useUserStore } from '../store'
import { authApi, departmentApi } from '../utils/api'

const router = useRouter()
const formRef = ref()
const registerFormRef = ref()
const loading = ref(false)
const registerLoading = ref(false)
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  role: 'STUDENT',
  departmentId: ''
})

const loginType = ref('student')
const showAdminLogin = ref(false)
const showRegister = ref(false)
const departments = ref([])

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应为3-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应为6-20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const result = await userStore.login(form)
    
    // 验证登录类型是否匹配
    if (showAdminLogin.value) {
      // 管理员登录界面只允许 ADMIN 角色登录
      if (result.role !== 'ADMIN') {
        throw new Error('不存在此管理员账号')
      }
    } else {
      // 学生/教师登录界面只允许对应角色登录
      const expectedRole = loginType.value === 'student' ? 'STUDENT' : 'TEACHER'
      if (result.role !== expectedRole) {
        throw new Error(loginType.value === 'student' ? '不存在此学生账号' : '不存在此教师账号')
      }
    }
    
    ElMessage({
      message: '登录成功',
      type: 'success',
      customClass: 'custom-success-message'
    })
    router.push('/dashboard')
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}

const loadDepartments = async () => {
  try {
    const res = await departmentApi.list()
    if (res.code === 200) {
      departments.value = res.data
    }
  } catch (e) {
    console.error(e)
  }
}

const handleRegister = async () => {
  const valid = await registerFormRef.value.validate().catch(() => false)
  if (!valid) return

  registerLoading.value = true
  try {
    await authApi.register({
      username: registerForm.username,
      password: registerForm.password,
      role: registerForm.role,
      departmentId: registerForm.departmentId ? Number(registerForm.departmentId) : null
    })
    
    ElMessage({
      message: '注册成功，请登录',
      type: 'success',
      customClass: 'custom-success-message'
    })
    
    // 注册成功后返回登录界面
    backToLogin()
  } catch (e) {
    ElMessage.error(e.message || '注册失败')
  } finally {
    registerLoading.value = false
  }
}

const backToLogin = () => {
  showRegister.value = false
  // 重置注册表单
  registerForm.username = ''
  registerForm.password = ''
  registerForm.confirmPassword = ''
  registerForm.role = 'STUDENT'
  registerForm.departmentId = ''
}

const openRegister = () => {
  showRegister.value = true
  loadDepartments()
}

</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  position: relative;
  width: 100%;
}

.login-left {
  flex: 1;
  min-width: 0;
  background: linear-gradient(135deg, #FF6A6A 0%, #CD5C5C 100%);
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
  flex-wrap: wrap;
}

.logo {
  width: clamp(80px, 15vw, 120px);
  height: clamp(80px, 15vw, 120px);
  border-radius: 20px;
  background: rgba(249, 249, 249, 0.543);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  overflow: hidden;
  flex-shrink: 0;
}

.logo img {
  width: 85%;
  height: 85%;
  object-fit: contain;
}

.brand h1 {
  font-size: clamp(28px, 6vw, 42px);
  font-weight: 800;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #ffffff 0%, #ffe0e0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.slogan {
  font-size: clamp(16px, 3vw, 20px);
  font-weight: 600;
  margin-bottom: 60px;
  background: linear-gradient(135deg, #ffffff 0%, #f19292 50%, #ffffff 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 5s ease-in-out infinite;
  letter-spacing: 3px;
}

@keyframes shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: clamp(14px, 2.5vw, 16px);
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: transform 0.2s ease;
}

.feature:hover {
  transform: translateX(8px);
}

.feature .el-icon {
  font-size: clamp(16px, 3vw, 20px);
  background: rgba(255, 255, 255, 0.2);
  padding: 8px;
  border-radius: 8px;
  flex-shrink: 0;
}

.login-right {
  width: 500px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 360px;
  padding: 40px;
}

.login-card h2 {
  font-size: clamp(22px, 5vw, 28px);
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.subtitle {
  color: #64748b;
  margin-bottom: 32px;
  font-size: 14px;
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
  color: #FF6A6A;
}

.login-tab.active {
  color: #FF6A6A;
  border-bottom-color: #FF6A6A;
  font-weight: 600;
}

.login-tab .el-icon {
  font-size: 18px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.action-buttons.single {
  justify-content: center;
}

.action-buttons .el-button {
  font-size: 14px;
  padding: 8px 16px;
}

/* 自定义成功消息样式 */
:deep(.custom-success-message) {
  background: linear-gradient(135deg, #FF6A6A, #CD5C5C) !important;
  border-color: #FF6A6A !important;
  color: white !important;
  
  .el-message__icon {
    color: white !important;
  }
}

/* 响应式布局 */
@media screen and (max-width: 992px) {
  .login-container {
    flex-direction: column;
  }
  
  .login-left {
    padding: 40px 24px;
    min-height: 300px;
  }
  
  .brand {
    margin-bottom: 24px;
  }
  
  .slogan {
    margin-bottom: 32px;
  }
  
  .features {
    gap: 12px;
  }
  
  .login-right {
    width: 100%;
    padding: 32px 24px;
    min-height: calc(100vh - 300px);
  }
  
  .login-card {
    padding: 32px;
  }
}

@media screen and (max-width: 576px) {
  .login-left {
    padding: 32px 16px;
    min-height: 250px;
  }
  
  .brand {
    justify-content: center;
    text-align: center;
  }
  
  .features {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .feature {
    justify-content: flex-start;
  }
  
  .login-right {
    padding: 24px 16px;
  }
  
  .login-card {
    padding: 24px;
  }
  
  .login-tabs {
    margin-bottom: 24px;
  }
  
  .subtitle {
    margin-bottom: 24px;
  }
  
  .demo-accounts {
    margin-top: 16px;
    padding-top: 16px;
  }
}

@media screen and (max-width: 480px) {
  .features {
    grid-template-columns: 1fr;
  }
  
  .feature {
    font-size: 14px;
  }
}
</style>
