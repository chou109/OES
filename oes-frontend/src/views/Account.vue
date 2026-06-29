<template>
  <div class="account-container">
    <div class="account-header">
      <h2>账号管理</h2>
    </div>
    <el-card shadow="hover" class="account-card">
      <el-tabs v-model="activeTab" type="border-card" class="account-tabs">
        <el-tab-pane label="基本资料" name="basic">
          <div class="tab-content">
            <el-form :model="formData" label-width="100px" class="account-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="姓名"> 
                    <el-input v-model="formData.realName" placeholder="请输入姓名" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="性别">
                    <el-radio-group v-model="formData.gender">
                      <el-radio value="男">男</el-radio>
                      <el-radio value="女">女</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="学号/工号">
                    <el-input v-model="formData.username" disabled />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="手机号">
                    <el-input v-model="formData.phone" placeholder="请输入手机号" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="邮箱">
                    <el-input v-model="formData.email" type="email" placeholder="请输入邮箱" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="单位（学校）">
                    <el-input v-model="formData.school" placeholder="请输入学校名称" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item>
                <el-button type="danger" @click="saveBasicInfo">保存修改</el-button>
                <el-button @click="resetForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="我的头像" name="avatar">
          <div class="tab-content avatar-tab">
            <div class="avatar-preview">
              <img v-if="formData.avatar" :src="formData.avatar" class="big-avatar-img">
              <el-avatar v-else :size="150" class="big-avatar">
                {{ formData.realName?.charAt(0) }}
              </el-avatar>
            </div>
            <div class="avatar-upload">
              <el-upload
                class="avatar-uploader"
                action="/api/upload/avatar"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
                :headers="{ Authorization: `Bearer ${userStore.token}` }"
              >
                <el-button type="danger">上传新头像</el-button>
              </el-upload>
              <p class="avatar-tip">支持 JPG、PNG 格式，大小不超过 2MB</p>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="密码管理" name="password">
          <div class="tab-content">
            <div class="password-section">
              <h4>修改密码</h4>
              <el-form :model="passwordForm" label-width="100px" class="account-form">
                <el-form-item label="旧密码">
                  <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入旧密码" show-password />
                </el-form-item>
                <el-form-item label="新密码">
                  <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
                </el-form-item>
                <el-form-item label="确认新密码">
                  <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请确认新密码" show-password />
                </el-form-item>
                <el-form-item>
                  <el-button type="danger" @click="changePassword">修改密码</el-button>
                  <el-button @click="resetPasswordForm">重置</el-button>
                </el-form-item>
              </el-form>
            </div>
            
            <el-divider>
              <span class="divider-text">或者</span>
            </el-divider>
            
            <div class="forgot-password-section">
              <h4>忘记旧密码？通过手机验证重置</h4>
              <el-form :model="verificationForm" label-width="100px" class="account-form">
                <el-form-item label="手机号">
                  <div class="verification-input">
                    <el-input v-model="verificationForm.phone" placeholder="请输入手机号后六位" />
                    <el-button type="danger" @click="sendVerificationCode" :disabled="countdown > 0">
                      {{ countdown > 0 ? `${countdown}秒后重发` : '发送验证码' }}
                    </el-button>
                  </div>
                </el-form-item>
                <el-form-item label="验证码">
                  <el-input v-model="verificationForm.code" placeholder="请输入验证码" />
                </el-form-item>
                <el-form-item>
                  <el-button type="danger" @click="verifyAndResetPassword">验证并重置密码</el-button>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store'
import { userApi, authApi } from '../utils/api'

const userStore = useUserStore()
const activeTab = ref('basic')
const countdown = ref(0)

const formData = reactive({
  realName: '',
  gender: '男',
  username: '',
  phone: '',
  email: '',
  school: '',
  avatar: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const verificationForm = reactive({
  phone: '',
  code: ''
})

const loadUserInfo = () => {
  const userInfo = userStore.userInfo
  if (userInfo) {
    formData.realName = userInfo.realName || ''
    formData.gender = userInfo.gender || '男'
    formData.username = userInfo.username || ''
    formData.phone = userInfo.phone || ''
    formData.email = userInfo.email || ''
    formData.school = userInfo.school || ''
    formData.avatar = userInfo.avatar || ''
  }
}

const saveBasicInfo = () => {
  // 模拟保存操作
  ElMessage.success('基本资料保存成功')
}

const resetForm = () => {
  loadUserInfo()
}

const handleAvatarSuccess = async (response, file) => {
  if (response.code === 200) {
    formData.avatar = response.data
    // 更新用户信息到store
    if (userStore.userInfo) {
      userStore.userInfo.avatar = response.data
    }
    // 调用API更新数据库中的头像
    try {
      const updateData = { id: userStore.userInfo?.userId, avatar: response.data }
      await userApi.update(updateData)
      ElMessage.success('头像上传成功')
    } catch (error) {
      ElMessage.error('头像保存失败：' + error.message)
    }
  } else {
    ElMessage.error('头像上传失败：' + response.message)
  }
}

const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('只能上传 JPG/PNG 格式的图片')
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
  }
  return isJPG && isLt2M
}

const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  
  try {
    const res = await authApi.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    
    if (res.code === 200) {
      ElMessage.success('密码修改成功')
      resetPasswordForm()
    } else {
      ElMessage.error(res.message || '密码修改失败')
    }
  } catch (error) {
    ElMessage.error('密码修改失败：' + (error.message || '网络错误'))
  }
}

const resetPasswordForm = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

const sendVerificationCode = () => {
  if (!verificationForm.phone) {
    ElMessage.error('请输入手机号后六位')
    return
  }
  // 模拟发送验证码
  ElMessage.success('验证码发送成功')
  
  // 开始倒计时
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const verifyAndResetPassword = () => {
  if (!verificationForm.phone || !verificationForm.code) {
    ElMessage.error('请填写完整信息')
    return
  }
  // 模拟验证操作
  ElMessage.success('验证成功，密码已重置为初始密码')
  verificationForm.phone = ''
  verificationForm.code = ''
}

onMounted(async () => {
  await userStore.getUserInfo()
  loadUserInfo()
})
</script>

<style lang="scss" scoped>
.account-container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

.account-header {
  margin-bottom: 20px;
  
  h2 {
    font-size: clamp(18px, 3vw, 20px);
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
  }
}

.account-card {
  border-radius: 12px;
  overflow: hidden;
}

.account-tabs {
  border-radius: 12px;
  
  :deep(.el-tabs__header) {
    background: linear-gradient(135deg, #dc2626, #991b1b);
    margin: 0;
    border-radius: 12px 12px 0 0;
    flex-wrap: wrap;
  }
  
  :deep(.el-tabs__nav-wrap) {
    border-radius: 12px 12px 0 0;
    overflow: visible;
    
    &::after {
      display: none;
    }
  }
  
  :deep(.el-tabs__nav) {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  :deep(.el-tabs__item) {
    color: rgba(255, 255, 255, 0.8) !important;
    font-size: 15px;
    font-weight: 500;
    height: 50px;
    line-height: 50px;
    padding: 0 30px;
    border: none;
    background: transparent;
    white-space: nowrap;
    
    &:hover {
      color: #fff !important;
    }
    
    &.is-active {
      color: #fff !important;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.2) !important;
    }
  }
  
  :deep(.el-tabs__content) {
    padding: 30px;
    background: #fff;
  }
  
  :deep(.el-tabs__next),
  :deep(.el-tabs__prev) {
    display: none !important;
  }
}

.tab-content {
  min-height: 300px;
}

.avatar-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
}

.avatar-preview {
  margin-bottom: 30px;
  text-align: center;
  
  .big-avatar-img {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: linear-gradient(135deg, #dc2626, #991b1b);
    font-size: 48px;
    font-weight: 600;
    border: 3px solid #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    object-fit: cover;
  }
}

.big-avatar {
  background: linear-gradient(135deg, #dc2626, #991b1b) !important;
  font-size: 48px;
  font-weight: 600;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-upload {
  text-align: center;
  
  :deep(.el-button) {
    padding: 12px 30px;
    font-size: 15px;
  }
}

.avatar-tip {
  margin-top: 15px;
  font-size: 13px;
  color: #999;
}

.account-form {
  max-width: 600px;
  width: 100%;
  
  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #333;
  }
  
  :deep(.el-input__inner) {
    border-radius: 8px;
  }
  
  :deep(.el-radio__input.is-checked .el-radio__inner) {
    background-color: #dc2626;
    border-color: #dc2626;
  }
  
  :deep(.el-radio__input.is-checked + .el-radio__label) {
    color: #dc2626;
  }
  
  :deep(.el-radio__inner:hover) {
    border-color: #dc2626;
  }
  
  :deep(.el-button--danger) {
    background: linear-gradient(135deg, #dc2626, #991b1b);
    border: none;
    border-radius: 8px;
    padding: 10px 25px;
    color: #fff !important;
    width: 140px;
    
    &:hover {
      background: linear-gradient(135deg, #b91c1c, #7f1d1d);
    }
    
    &:disabled {
      background: #d1d5db;
      color: #9ca3af !important;
    }
  }
  
  :deep(.el-button) {
    border-radius: 8px;
    padding: 10px 25px;
    border-color: #dc2626;
    background: #dc2626;
    color: #fff !important;
    width: 140px;

    &:hover {
      background: rgba(220, 38, 38, 0.15);
      border-color: #dc2626;
      color: #dc2626 !important;
    }

    &:active, &.is-active {
      background: rgba(220, 38, 38, 0.15);
      border-color: #dc2626;
      color: #dc2626 !important;
    }
  }
}

.password-section {
  margin-bottom: 30px;
  
  h4 {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 20px;
    padding-left: 10px;
    border-left: 3px solid #dc2626;
  }
}

.forgot-password-section {
  margin-top: 20px;
  
  h4 {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 20px;
    padding-left: 10px;
    border-left: 3px solid #dc2626;
  }
}

.verification-input {
  display: flex;
  gap: 10px;
  
  :deep(.el-input) {
    flex: 1;
  }
  
  :deep(.el-button) {
    white-space: nowrap;
  }
}

.divider-text {
  color: #999;
  font-size: 14px;
}

:deep(.el-divider) {
  margin: 30px 0;
  background: #f0f0f0;
}

:deep(.el-row) {
  margin-bottom: 5px;
}

/* 响应式布局 */
@media screen and (max-width: 992px) {
  .account-container {
    padding: 0 8px;
    box-sizing: border-box;
  }
  
  .account-card {
    border-radius: 12px;
  }
  
  .account-tabs :deep(.el-tabs__content) {
    padding: 24px;
  }
  
  .account-form {
    max-width: 100% !important;
  }
  
  .account-form :deep(.el-col) {
    width: 100% !important;
    max-width: 100% !important;
    flex: none;
    margin-bottom: 12px;
  }
  
  .account-form :deep(.el-row) {
    display: block;
  }
  
  .account-form :deep(.el-form-item) {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  
  .account-form :deep(.el-form-item__label) {
    width: auto !important;
    padding-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #333;
  }
  
  .account-form :deep(.el-form-item__content) {
    margin-left: 0 !important;
    width: 100%;
  }
  
  .account-form :deep(.el-input) {
    width: 100%;
  }
  
  .account-form :deep(.el-input__inner) {
    width: 100%;
  }
  
  .account-form :deep(.el-radio-group) {
    display: flex;
    gap: 20px;
  }
}

@media screen and (max-width: 768px) {
  .account-container {
    padding: 0 4px;
  }
  
  .account-header {
    margin-bottom: 16px;
    padding: 0 4px;
    
    h2 {
      font-size: clamp(18px, 4vw, 24px);
    }
  }
  
  .account-card {
    border-radius: 10px;
  }
  
  .account-tabs :deep(.el-tabs__header) {
    padding: 0 8px;
  }
  
  .account-tabs :deep(.el-tabs__item) {
    padding: 0 clamp(10px, 4vw, 20px);
    font-size: clamp(12px, 3vw, 14px);
    height: 45px;
    line-height: 45px;
    flex: 1;
    text-align: center;
  }
  
  .account-tabs :deep(.el-tabs__content) {
    padding: 16px;
  }
  
  .tab-content {
    min-height: 260px;
  }
  
  .account-form {
    max-width: 100%;
  }
  
  .account-form :deep(.el-form-item) {
    margin-bottom: 16px;
  }
  
  .account-form :deep(.el-form-item__label) {
    font-size: 13px;
    padding-bottom: 6px;
  }
  
  .account-form :deep(.el-form-item__content) {
    width: 100%;
  }
  
  .account-form :deep(.el-input) {
    width: 100%;
  }
  
  .account-form :deep(.el-radio-group) {
    display: flex;
    gap: 15px;
  }
  
  .avatar-tab {
    padding: 20px 0;
  }
  
  .avatar-preview {
    margin-bottom: 20px;
    
    .big-avatar-img {
      width: 120px;
      height: 120px;
    }
  }
  
  .big-avatar {
    width: 120px !important;
    height: 120px !important;
    font-size: 36px !important;
  }
  
  .verification-input {
    flex-direction: column;
    gap: 12px;
    
    :deep(.el-input) {
      width: 100%;
    }
    
    :deep(.el-button) {
      width: 100%;
    }
  }
  
  .password-section h4,
  .forgot-password-section h4 {
    font-size: 14px;
    margin-bottom: 16px;
  }
}

@media screen and (max-width: 576px) {
  .account-tabs :deep(.el-tabs__content) {
    padding: 14px;
  }
  
  .avatar-preview {
    margin-bottom: 16px;
    
    .big-avatar-img {
      width: 100px;
      height: 100px;
    }
  }
  
  .big-avatar {
    width: 100px !important;
    height: 100px !important;
    font-size: 32px !important;
  }
  
  .account-form :deep(.el-form-item) {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    margin-bottom: 12px;
  }

  .account-form :deep(.el-form-item__content) {
    margin-left: 0 !important;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 8px;
  }
  
  .account-form :deep(.el-button--danger),
  .account-form :deep(.el-button) {
    width: 140px !important;
    margin-bottom: 0;
    margin-left: 0 !important;
  }
  
  .account-form :deep(.el-button + .el-button) {
    margin-left: 0 !important;
  }
}

@media screen and (max-width: 360px) {
  .account-tabs :deep(.el-tabs__header) {
    padding: 0 4px;
  }
  
  .account-tabs :deep(.el-tabs__item) {
    padding: 0 12px;
    font-size: 13px;
  }
  
  .account-tabs :deep(.el-tabs__content) {
    padding: 12px;
  }
  
  .avatar-preview {
    margin-bottom: 14px;
    
    .big-avatar-img {
      width: 80px;
      height: 80px;
    }
  }
  
  .big-avatar {
    width: 80px !important;
    height: 80px !important;
    font-size: 28px !important;
  }
  
  .account-form :deep(.el-form-item__label) {
    width: 70px !important;
    font-size: 12px;
  }
  
  .account-form :deep(.el-col) {
    margin-bottom: 8px;
  }
}
</style>