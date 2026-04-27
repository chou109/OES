<template>
  <div class="dashboard">
    <div class="page-header">
      <h2>欢迎回来，{{ userInfo.realName }}</h2>
    </div>

    <!-- 班级列表 - 仅对学生和教师显示 -->
    <el-row :gutter="24" v-if="classes.length > 0 && userInfo.role !== 'ADMIN'">
      <el-col :span="24">
        <div class="card">
          <div class="card-header">
            <div class="card-header-icon">
              <el-icon><Collection /></el-icon>
            </div>
            <h3>{{ userInfo.role === 'TEACHER' ? '我的班级' : '我的班级' }}</h3>
            <el-button v-if="userInfo.role === 'TEACHER'" type="danger" link @click="$router.push('/classes')">
              管理班级
            </el-button>
          </div>
          <div class="class-list">
            <div class="class-card" v-for="cls in classes" :key="cls.id" @click="goToClass(cls.id)">
              <div class="class-info">
                <h4>{{ cls.className }}</h4>
                <p class="class-department">{{ cls.departmentName }}</p>
                <p class="class-students">学生人数: {{ cls.studentCount || 0 }}</p>
              </div>
              <div class="class-actions">
                <el-button type="danger" size="small">查看</el-button>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="24" style="margin-top: 24px;">
      <el-col :span="16">
        <div class="card">
          <div class="card-header">
            <div class="card-header-icon">
              <el-icon><Calendar /></el-icon>
            </div>
            <h3>最近考试</h3>
          </div>
          <el-table :data="recentExams" stripe>
            <el-table-column prop="title" label="考试名称" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="startTime" label="开始时间" width="180" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="danger" link @click="goToExam(row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card">
          <div class="card-header">
            <div class="card-header-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <h3>快捷操作</h3>
          </div>
          <div class="quick-actions">
            <!-- 管理员快捷操作 -->
            <div class="quick-action" v-if="userInfo.role === 'ADMIN'" @click="$router.push('/users')">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </div>
            <div class="quick-action" v-if="userInfo.role === 'ADMIN'" @click="$router.push('/departments')">
              <el-icon><OfficeBuilding /></el-icon>
              <span>院系管理</span>
            </div>
            <div class="quick-action" v-if="userInfo.role === 'ADMIN'" @click="$router.push('/logs')">
              <el-icon><Document /></el-icon>
              <span>系统日志</span>
            </div>
            <!-- 教师快捷操作 -->
            <div class="quick-action" v-if="userInfo.role === 'TEACHER'" @click="$router.push('/classes')">
              <el-icon><Collection /></el-icon>
              <span>班级管理</span>
            </div>
            <div class="quick-action" v-if="userInfo.role === 'TEACHER'" @click="$router.push('/questions')">
              <el-icon><Memo /></el-icon>
              <span>题库管理</span>
            </div>
            <div class="quick-action" v-if="userInfo.role === 'TEACHER'" @click="$router.push('/papers')">
              <el-icon><Files /></el-icon>
              <span>试卷管理</span>
            </div>
            <div class="quick-action" v-if="userInfo.role === 'TEACHER'" @click="$router.push('/exams')">
              <el-icon><Calendar /></el-icon>
              <span>考试管理</span>
            </div>
            <div class="quick-action" v-if="userInfo.role === 'TEACHER'" @click="$router.push('/exam-records')">
              <el-icon><Tickets /></el-icon>
              <span>考试记录</span>
            </div>
            <!-- 学生快捷操作 -->
            <div class="quick-action" v-if="userInfo.role === 'STUDENT'" @click="$router.push('/student/exams')">
              <el-icon><Calendar /></el-icon>
              <span>考试列表</span>
            </div>
            <div class="quick-action" v-if="userInfo.role === 'STUDENT'" @click="$router.push('/student/history')">
              <el-icon><Clock /></el-icon>
              <span>考试历史</span>
            </div>
            <div class="quick-action" v-if="userInfo.role === 'STUDENT'" @click="$router.push('/student/wrong')">
              <el-icon><WarnTriangleFilled /></el-icon>
              <span>错题本</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { examApi, classApi } from '../utils/api'
import { useUserStore } from '../store'

const router = useRouter()
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo || {})

const recentExams = ref([])
const classes = ref([])

const statusType = (status) => {
  const map = { PENDING: 'warning', ONGOING: 'success', FINISHED: 'info' }
  return map[status] || ''
}

const statusText = (status) => {
  const map = { PENDING: '待开始', ONGOING: '进行中', FINISHED: '已结束' }
  return map[status] || status
}

const goToExam = (exam) => {
  router.push(`/exams?id=${exam.id}`)
}

const goToClass = (classId) => {
  router.push(`/classes?id=${classId}`)
}

const loadRecentExams = async () => {
  try {
    const res = await examApi.page({ current: 1, size: 5 })
    if (res.code === 200) {
      recentExams.value = res.data.records
    }
  } catch (e) {
    console.error(e)
  }
}

const loadClasses = async () => {
  try {
    const res = await classApi.list()
    if (res.code === 200) {
      classes.value = res.data
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadRecentExams()
  if (userInfo.value.role !== 'ADMIN') {
    loadClasses()
  }
})
</script>

<style lang="scss" scoped>
.dashboard {
  max-width: 1400px;
}



.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-action:hover {
  background: #f1f5f9;
  transform: translateY(-2px);
}

.quick-action .el-icon {
  font-size: 32px;
  color: #FF6A6A;
}

.quick-action span {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
}

.class-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.class-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.class-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.class-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.class-department {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
}

.class-students {
  font-size: 14px;
  color: #94a3b8;
}

.class-actions {
  display: flex;
  gap: 10px;
}
</style>
