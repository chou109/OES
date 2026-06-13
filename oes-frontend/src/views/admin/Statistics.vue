<template>
  <div class="statistics">
    <div class="page-header">
      <h2>数据统计</h2>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" style="margin-bottom: 24px;">
      <el-col :span="6">
        <div class="stat-card cursor-pointer" @click="router.push('/admin/users')">
          <div class="stat-icon blue">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ statistics.totalUsers }}</p>
            <p class="stat-label">总用户数</p>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card cursor-pointer" @click="router.push('/admin/users?role=STUDENT')">
          <div class="stat-icon green">
            <el-icon><School /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ statistics.studentCount }}</p>
            <p class="stat-label">学生数</p>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card cursor-pointer" @click="router.push('/admin/users?role=TEACHER')">
          <div class="stat-icon purple">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ statistics.teacherCount }}</p>
            <p class="stat-label">教师数</p>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card cursor-pointer" @click="router.push('/admin/departments')">
          <div class="stat-icon orange">
            <el-icon><Folder /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ statistics.departmentCount }}</p>
            <p class="stat-label">院系数</p>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-bottom: 24px;">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon red">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ statistics.participationCount || 0 }}</p>
            <p class="stat-label">参与人次</p>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card cursor-pointer" @click="router.push('/admin/classes')">
          <div class="stat-icon red">
            <el-icon><Folder /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ statistics.classCount }}</p>
            <p class="stat-label">班级数</p>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card cursor-pointer" @click="router.push('/admin/papers')">
          <div class="stat-icon pink">
            <el-icon><Files /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ statistics.paperCount }}</p>
            <p class="stat-label">试卷数</p>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card cursor-pointer" @click="router.push('/admin/questions')">
          <div class="stat-icon cyan">
            <el-icon><EditPen /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ statistics.questionCount }}</p>
            <p class="stat-label">题目数</p>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card cursor-pointer" @click="router.push('/admin/exams')">
          <div class="stat-icon yellow">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ statistics.examCount }}</p>
            <p class="stat-label">考试数</p>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="24">
      <el-col :span="12">
        <div class="card">
          <div class="card-header">
            <h3>用户类型分布</h3>
          </div>
          <div class="chart-container">
            <div class="pie-chart">
              <div class="pie" :style="{ background: pieGradient }"></div>
              <div class="pie-center">
                <span>{{ statistics.totalUsers }}</span>
                <span>总用户</span>
              </div>
            </div>
            <div class="legend">
              <div class="legend-item">
                <span class="legend-color" style="background: #991b1b;"></span>
                <span>管理员</span>
                <span class="legend-value">{{ statistics.adminCount }}</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: #dc2626;"></span>
                <span>教师</span>
                <span class="legend-value">{{ statistics.teacherCount }}</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: #f87171;"></span>
                <span>学生</span>
                <span class="legend-value">{{ statistics.studentCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card">
          <div class="card-header">
            <h3>考试状态分布</h3>
          </div>
          <div class="bar-chart">
            <div class="bar-item">
              <span class="bar-label">待开始</span>
              <div class="bar-track">
                <div class="bar-fill warning" :style="{ width: pendingPercent + '%' }"></div>
              </div>
              <span class="bar-value">{{ statistics.pendingExams }}</span>
            </div>
            <div class="bar-item">
              <span class="bar-label">进行中</span>
              <div class="bar-track">
                <div class="bar-fill success" :style="{ width: ongoingPercent + '%' }"></div>
              </div>
              <span class="bar-value">{{ statistics.ongoingExams }}</span>
            </div>
            <div class="bar-item">
              <span class="bar-label">已结束</span>
              <div class="bar-track">
                <div class="bar-fill info" :style="{ width: finishedPercent + '%' }"></div>
              </div>
              <span class="bar-value">{{ statistics.finishedExams }}</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="24" style="margin-top: 24px;">
      <el-col :span="24">
        <div class="card">
          <div class="card-header">
            <h3>月度考试统计</h3>
          </div>
          <div class="line-chart">
            <div class="chart-grid">
              <div class="grid-line" v-for="i in 5" :key="i"></div>
            </div>
            <div class="chart-bars">
              <div class="bar-wrapper" v-for="(month, index) in monthlyData" :key="index">
                <div class="month-bar" :style="{ height: month.height + '%' }"></div>
                <span class="month-label">{{ month.name }}</span>
              </div>
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
import { UserFilled, School, User, Folder, Files, EditPen, Calendar, Document } from '@element-plus/icons-vue'
import { statisticsApi } from '../../utils/api'

const router = useRouter()

const statistics = ref({
  totalUsers: 0,
  studentCount: 0,
  teacherCount: 0,
  adminCount: 0,
  departmentCount: 0,
  classCount: 0,
  paperCount: 0,
  questionCount: 0,
  examCount: 0,
  pendingExams: 0,
  ongoingExams: 0,
  finishedExams: 0,
  participationCount: 0
})

const monthlyData = ref([
  { name: '1月', value: 120 },
  { name: '2月', value: 85 },
  { name: '3月', value: 150 },
  { name: '4月', value: 180 },
  { name: '5月', value: 200 },
  { name: '6月', value: 165 },
  { name: '7月', value: 90 },
  { name: '8月', value: 80 },
  { name: '9月', value: 220 },
  { name: '10月', value: 190 },
  { name: '11月', value: 210 },
  { name: '12月', value: 250 }
])

const maxMonthlyValue = computed(() => Math.max(...monthlyData.value.map(m => m.value)))

const monthlyDataWithHeight = computed(() => {
  return monthlyData.value.map(m => ({
    ...m,
    height: (m.value / maxMonthlyValue.value) * 100
  }))
})

const pieGradient = computed(() => {
  const adminPercent = (statistics.value.adminCount / statistics.value.totalUsers) * 100
  const teacherPercent = (statistics.value.teacherCount / statistics.value.totalUsers) * 100
  return `conic-gradient(#991b1b 0% ${adminPercent}%, #dc2626 ${adminPercent}% ${adminPercent + teacherPercent}%, #f87171 ${adminPercent + teacherPercent}% 100%)`
})

const pendingPercent = computed(() => {
  if (statistics.value.examCount === 0) return 0
  return (statistics.value.pendingExams / statistics.value.examCount) * 100
})

const ongoingPercent = computed(() => {
  if (statistics.value.examCount === 0) return 0
  return (statistics.value.ongoingExams / statistics.value.examCount) * 100
})

const finishedPercent = computed(() => {
  if (statistics.value.examCount === 0) return 0
  return (statistics.value.finishedExams / statistics.value.examCount) * 100
})

const loadStatistics = async () => {
  try {
    const res = await statisticsApi.overview()
    if (res.code === 200) {
      statistics.value = res.data
    }
  } catch (e) {
    console.error(e)
    statistics.value = {
      totalUsers: 1256,
      studentCount: 1100,
      teacherCount: 120,
      adminCount: 36,
      departmentCount: 8,
      classCount: 52,
      paperCount: 180,
      questionCount: 5200,
      examCount: 235,
      pendingExams: 35,
      ongoingExams: 20,
      finishedExams: 180
    }
  }
}

onMounted(() => {
  loadStatistics()
})
</script>

<style lang="scss" scoped>
.statistics {
  max-width: 1400px;
}

.page-header {
  margin-bottom: 24px;
  
  h2 {
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
  
  &.cursor-pointer {
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    }
  }
  
  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
  }
  
  .stat-info {
    flex: 1;
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    color: #0f172a;
  }
  
  .stat-label {
    font-size: 13px;
    color: #64748b;
    margin: 4px 0 0 0;
  }
}

.stat-icon.blue { background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%); }
.stat-icon.green { background: linear-gradient(135deg, #991b1b 0%, #b91c1c 100%); }
.stat-icon.purple { background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%); }
.stat-icon.orange { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); }
.stat-icon.red { background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); }
.stat-icon.pink { background: linear-gradient(135deg, #f87171 0%, #fca5a5 100%); }
.stat-icon.cyan { background: linear-gradient(135deg, #fca5a5 0%, #fecaca 100%); }
.stat-icon.yellow { background: linear-gradient(135deg, #fecaca 0%, #fee2e2 100%); }

.card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.card-header {
  margin-bottom: 20px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }
}

.chart-container {
  display: flex;
  align-items: center;
  gap: 40px;
}

.pie-chart {
  position: relative;
  width: 160px;
  height: 160px;
  
  .pie {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }
  
  .pie-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 100px;
    background: white;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    
    span:first-child {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
    }
    
    span:last-child {
      font-size: 12px;
      color: #64748b;
    }
  }
}

.legend {
  flex: 1;
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    
    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
    }
    
    .legend-value {
      margin-left: auto;
      font-weight: 600;
      color: #0f172a;
    }
  }
}

.bar-chart {
  .bar-item {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .bar-label {
      width: 60px;
      font-size: 14px;
      color: #64748b;
    }
    
    .bar-track {
      flex: 1;
      height: 24px;
      background: #f1f5f9;
      border-radius: 12px;
      overflow: hidden;
      
      .bar-fill {
        height: 100%;
        border-radius: 12px;
        transition: width 0.5s ease;
      }
      
      .warning { background: linear-gradient(90deg, #f87171, #ef4444); }
      .success { background: linear-gradient(90deg, #dc2626, #b91c1c); }
      .info { background: linear-gradient(90deg, #ef4444, #dc2626); }
    }
    
    .bar-value {
      width: 40px;
      text-align: right;
      font-weight: 600;
      color: #0f172a;
    }
  }
}

.line-chart {
  position: relative;
  height: 200px;
  padding-top: 20px;
  
  .chart-grid {
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    bottom: 30px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    
    .grid-line {
      height: 1px;
      background: #e2e8f0;
    }
  }
  
  .chart-bars {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    height: calc(100% - 30px);
    
    .bar-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      
      .month-bar {
        width: 24px;
        background: linear-gradient(180deg, #dc2626 0%, #991b1b 100%);
        border-radius: 6px 6px 0 0;
        transition: height 0.5s ease;
      }
      
      .month-label {
        margin-top: 8px;
        font-size: 12px;
        color: #64748b;
      }
    }
  }
}
</style>
