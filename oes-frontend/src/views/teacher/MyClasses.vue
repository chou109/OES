<template>
  <div class="my-classes">
    <div class="page-header">
      <h2>我的班级</h2>
      <p>查看和管理您创建的班级</p>
    </div>

    <div class="class-list">
      <el-card 
        v-for="item in classList" 
        :key="item.class.id" 
        class="class-card"
        @click="enterClass(item.class.id)"
      >
        <div class="class-info">
          <h3>{{ item.class.className }}</h3>
          <p class="class-code">群号：{{ item.class.inviteCode }}</p>
          <p class="class-role">角色：{{ getRoleText(item.role) }}</p>
        </div>
        <div class="class-actions">
          <el-button type="primary" size="small">进入班级</el-button>
        </div>
      </el-card>
    </div>

    <el-empty v-if="classList.length === 0" description="暂无班级，去创建一个班级吧" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../store'
import { classApi } from '../../utils/api'

const router = useRouter()
const userStore = useUserStore()
const classList = ref([])

const loadClasses = async () => {
  try {
    const userId = userStore.userInfo?.userId || localStorage.getItem('userId')
    if (!userId) {
      ElMessage.error('请先登录')
      return
    }
    const res = await classApi.getMyClasses(userId)
    if (res.code === 200) {
      classList.value = res.data
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('加载班级列表失败')
  }
}

const enterClass = (classId) => {
  router.push(`/teacher/class/${classId}`)
}

const getRoleText = (role) => {
  const roleMap = {
    OWNER: '班级所有者',
    ADMIN: '管理员',
    MEMBER: '普通成员'
  }
  return roleMap[role] || role
}

onMounted(() => {
  loadClasses()
})
</script>

<style scoped>
.my-classes {
  width: 100%;
  max-width: 100%;
  padding: 0 8px;
  box-sizing: border-box;
}

.page-header {
  padding: 0 8px;
  margin-bottom: 20px;
  
  h2 {
    font-size: clamp(20px, 5vw, 28px);
    font-weight: 700;
    color: #0f172a;
    margin: 0;
    line-height: 1.3;
  }
  
  p {
    margin-top: 6px;
    font-size: clamp(13px, 3vw, 14px);
    color: #64748b;
    line-height: 1.5;
  }
}

.class-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.class-card {
  cursor: pointer;
  transition: all 0.3s;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  
  :deep(.el-card__body) {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.class-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.class-info {
  flex: 1;
}

.class-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.class-code, .class-role {
  margin: 4px 0;
  font-size: 14px;
  color: #666;
}

.class-actions {
  display: flex;
  justify-content: flex-end;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .my-classes {
    padding: 0 4px;
  }
  
  .page-header {
    padding: 0 4px;
  }
  
  .class-list {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  
  .class-card :deep(.el-card__body) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .class-info h3 {
    font-size: 16px;
  }
  
  .class-code,
  .class-role {
    font-size: 13px;
  }
  
  .class-actions {
    width: 100%;
  }
  
  .class-actions .el-button {
    width: 100%;
  }
}

@media screen and (max-width: 576px) {
  .class-card :deep(.el-card__body) {
    padding: 14px;
  }
  
  .class-info h3 {
    font-size: 15px;
  }
}

@media screen and (max-width: 360px) {
  .class-card :deep(.el-card__body) {
    padding: 12px;
  }
  
  .class-info h3 {
    font-size: 14px;
  }
  
  .class-code,
  .class-role {
    font-size: 12px;
  }
}
</style>
