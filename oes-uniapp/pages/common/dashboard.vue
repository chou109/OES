<template>
  <view class="dashboard">
    <!-- 页面头部 -->
    <view class="page-header">
      <text class="title">欢迎回来，{{ displayName }}</text>
      <text class="subtitle">{{ roleText }} | {{ currentDate }}</text>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-grid">
      <!-- 管理员统计 -->
      <template v-if="userInfo.role === 'ADMIN'">
        <view class="stat-card" @click="goTo('/pages/admin/user-manage')">
          <view class="stat-icon admin-icon">
            <text class="emoji">👥</text>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ stats.totalUsers }}</text>
            <text class="stat-label">总用户数</text>
          </view>
          <text class="arrow">›</text>
        </view>
        <view class="stat-card" @click="goTo('/pages/admin/user-manage?role=STUDENT')">
          <view class="stat-icon admin-icon">
            <text class="emoji">👨‍🎓</text>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ stats.studentCount }}</text>
            <text class="stat-label">学生数</text>
          </view>
          <text class="arrow">›</text>
        </view>
        <view class="stat-card" @click="goTo('/pages/admin/user-manage?role=TEACHER')">
          <view class="stat-icon admin-icon">
            <text class="emoji">👨‍🏫</text>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ stats.teacherCount }}</text>
            <text class="stat-label">教师数</text>
          </view>
          <text class="arrow">›</text>
        </view>
        <view class="stat-card" @click="goTo('/pages/admin/department-manage')">
          <view class="stat-icon admin-icon">
            <text class="emoji">🏫</text>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ stats.departmentCount }}</text>
            <text class="stat-label">院系数</text>
          </view>
          <text class="arrow">›</text>
        </view>
      </template>

      <!-- 教师统计 -->
      <template v-else-if="userInfo.role === 'TEACHER'">
        <view class="stat-card" @click="goTo('/pages/teacher/my-classes')">
          <view class="stat-icon teacher-icon">
            <text class="emoji">📚</text>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ stats.classCount }}</text>
            <text class="stat-label">班级数</text>
          </view>
          <text class="arrow">›</text>
        </view>
        <view class="stat-card" @click="goTo('/pages/teacher/paper-manage')">
          <view class="stat-icon teacher-icon">
            <text class="emoji">📄</text>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ stats.paperCount }}</text>
            <text class="stat-label">试卷数</text>
          </view>
          <text class="arrow">›</text>
        </view>
        <view class="stat-card" @click="goTo('/pages/teacher/question-manage')">
          <view class="stat-icon teacher-icon">
            <text class="emoji">❓</text>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ stats.questionCount }}</text>
            <text class="stat-label">题目数</text>
          </view>
          <text class="arrow">›</text>
        </view>
        <view class="stat-card" @click="goTo('/pages/teacher/exam-manage')">
          <view class="stat-icon teacher-icon">
            <text class="emoji">📅</text>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ stats.examCount }}</text>
            <text class="stat-label">考试数</text>
          </view>
          <text class="arrow">›</text>
        </view>
      </template>

      <!-- 学生统计 -->
      <template v-else-if="userInfo.role === 'STUDENT'">
        <view class="stat-card" @click="goTo('/pages/student/exam-list')">
          <view class="stat-icon student-icon">
            <text class="emoji">⏰</text>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ stats.pendingExams }}</text>
            <text class="stat-label">待考考试</text>
          </view>
          <text class="arrow">›</text>
        </view>
        <view class="stat-card" @click="goTo('/pages/student/history')">
          <view class="stat-icon student-icon">
            <text class="emoji">✅</text>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ stats.completedExams }}</text>
            <text class="stat-label">已完成</text>
          </view>
          <text class="arrow">›</text>
        </view>
        <view class="stat-card" @click="goTo('/pages/student/wrong-questions')">
          <view class="stat-icon student-icon">
            <text class="emoji">❌</text>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ stats.wrongCount }}</text>
            <text class="stat-label">错题数</text>
          </view>
          <text class="arrow">›</text>
        </view>
        <view class="stat-card" @click="goTo('/pages/student/statistics')">
          <view class="stat-icon student-icon">
            <text class="emoji">📊</text>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ stats.averageScore }}分</text>
            <text class="stat-label">平均分</text>
          </view>
          <text class="arrow">›</text>
        </view>
      </template>
    </view>

    <!-- 管理员：最近日志 -->
    <template v-if="userInfo.role === 'ADMIN'">
      <view class="card">
        <view class="card-header">
          <view class="card-title">
            <text class="card-emoji">📝</text>
            <text class="title-text">最近操作日志</text>
          </view>
        </view>
        <view class="log-list">
          <view class="log-item" v-for="(log, index) in recentLogs" :key="index">
            <view class="log-operator">{{ log.operator }}</view>
            <view class="log-action">{{ log.action }}</view>
            <view class="log-time">{{ log.createTime }}</view>
          </view>
          <view class="empty" v-if="recentLogs.length === 0">
            <text class="empty-text">暂无日志</text>
          </view>
        </view>
      </view>
    </template>

    <!-- 教师：最近考试 -->
    <template v-if="userInfo.role === 'TEACHER'">
      <view class="card">
        <view class="card-header">
          <view class="card-title">
            <text class="card-emoji">📅</text>
            <text class="title-text">最近考试</text>
          </view>
          <text class="card-link" @click="goTo('/pages/teacher/exam-manage')">管理考试</text>
        </view>
        <view class="exam-list">
          <view class="exam-item" v-for="exam in recentExams" :key="exam.id" @click="goToExam(exam)">
            <view class="exam-info">
              <text class="exam-title">{{ exam.title }}</text>
              <text class="exam-meta">{{ exam.className }} | {{ exam.startTime }}</text>
            </view>
            <view class="exam-status">
              <view :class="['status-tag', statusClass(exam.status)]">
                <text class="status-text">{{ statusText(exam.status) }}</text>
              </view>
            </view>
          </view>
          <view class="empty" v-if="recentExams.length === 0">
            <text class="empty-text">暂无考试</text>
          </view>
        </view>
      </view>
    </template>

    <!-- 学生：待考考试 -->
    <template v-if="userInfo.role === 'STUDENT'">
      <view class="card">
        <view class="card-header">
          <view class="card-title">
            <text class="card-emoji">⏰</text>
            <text class="title-text">待考考试</text>
          </view>
          <text class="card-link" @click="goTo('/pages/student/exam-list')">全部考试</text>
        </view>
        <view class="exam-list">
          <view class="exam-item" v-for="exam in pendingExams" :key="exam.id">
            <view class="exam-info">
              <text class="exam-title">{{ exam.title }}</text>
              <text class="exam-meta">{{ exam.startTime }} | {{ exam.duration }}分钟</text>
            </view>
            <button
              class="exam-btn"
              :disabled="exam.status !== 'ONGOING'"
              @click="goToExam(exam)"
            >
              <text class="btn-text">{{ exam.status === 'ONGOING' ? '进入考试' : '等待开始' }}</text>
            </button>
          </view>
          <view class="empty" v-if="pendingExams.length === 0">
            <text class="empty-text">暂无待考考试</text>
          </view>
        </view>
      </view>

      <!-- 考试须知 -->
      <view class="card tips-card">
        <view class="card-header">
          <view class="card-title">
            <text class="card-emoji">ℹ️</text>
            <text class="title-text">考试须知</text>
          </view>
        </view>
        <view class="tips-list">
          <view class="tip-item">
            <text class="tip-number">1.</text>
            <text class="tip-text">进入考试后请保持网络畅通</text>
          </view>
          <view class="tip-item">
            <text class="tip-number">2.</text>
            <text class="tip-text">考试过程中请勿频繁切换页面</text>
          </view>
          <view class="tip-item">
            <text class="tip-number">3.</text>
            <text class="tip-text">答案会自动保存，但建议手动提交</text>
          </view>
          <view class="tip-item">
            <text class="tip-number">4.</text>
            <text class="tip-text">考试结束后可查看错题分析</text>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { examApi, examRecordApi, statisticsApi, logApi, userApi } from '../../utils/api'

export default {
  setup() {
    const userInfo = ref(uni.getStorageSync('userInfo') || {})

    const displayName = computed(() => {
      const name = userInfo.value.realName
      const username = userInfo.value.username
      return (name && name.trim()) ? name : username
    })

    const currentDate = computed(() => {
      const now = new Date()
      const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
      return now.toLocaleDateString('zh-CN', options)
    })

    const roleText = computed(() => {
      const map = { ADMIN: '管理员', TEACHER: '教师', STUDENT: '学生' }
      return map[userInfo.value.role] || '用户'
    })

    const stats = ref({
      totalUsers: 0,
      studentCount: 0,
      teacherCount: 0,
      departmentCount: 0,
      classCount: 0,
      paperCount: 0,
      questionCount: 0,
      examCount: 0,
      pendingExams: 0,
      completedExams: 0,
      wrongCount: 0,
      averageScore: 0
    })

    const recentExams = ref([])
    const pendingExams = ref([])
    const recentLogs = ref([])

    const statusClass = (status) => {
      const map = { PENDING: 'pending', ONGOING: 'ongoing', FINISHED: 'finished' }
      return map[status] || ''
    }

    const statusText = (status) => {
      const map = { PENDING: '待开始', ONGOING: '进行中', FINISHED: '已结束' }
      return map[status] || status
    }

    const goTo = (url) => {
      uni.navigateTo({ url })
    }

    const goToExam = (exam) => {
      if (userInfo.value.role === 'STUDENT') {
        uni.navigateTo({
          url: `/pages/student/exam-take?id=${exam.id}`
        })
      } else {
        uni.navigateTo({
          url: `/pages/teacher/exam-manage?id=${exam.id}`
        })
      }
    }

    const loadStats = async () => {
      try {
        if (userInfo.value.role === 'ADMIN') {
          const res = await statisticsApi.overview()
          if (res.code === 200) {
            stats.value = {
              totalUsers: res.data.totalUsers || 0,
              studentCount: res.data.studentCount || 0,
              teacherCount: res.data.teacherCount || 0,
              departmentCount: res.data.departmentCount || 0
            }
          }
        } else if (userInfo.value.role === 'TEACHER') {
          const res = await statisticsApi.teacherStats()
          if (res.code === 200) {
            stats.value = {
              classCount: res.data.classCount || 0,
              paperCount: res.data.paperCount || 0,
              questionCount: res.data.questionCount || 0,
              examCount: res.data.examCount || 0
            }
          }
        } else if (userInfo.value.role === 'STUDENT') {
          const res = await examRecordApi.getStudentStats()
          if (res.code === 200) {
            stats.value = {
              pendingExams: res.data.pendingExams || 0,
              completedExams: res.data.completedExams || 0,
              wrongCount: res.data.wrongCount || 0,
              averageScore: res.data.averageScore || 0
            }
          }
        }
      } catch (e) {
        console.error('加载统计数据失败:', e)
      }
    }

    const loadRecentExams = async () => {
      try {
        const res = await examApi.page({ current: 1, size: 5 })
        if (res.code === 200) {
          recentExams.value = res.data.records || []
        }
      } catch (e) {
        console.error('加载最近考试失败:', e)
      }
    }

    const loadPendingExams = async () => {
      try {
        const res = await examApi.studentPage({ current: 1, size: 10 })
        if (res.code === 200) {
          const records = res.data.records || []
          pendingExams.value = records.filter(e =>
            e.exam && e.exam.status !== 'FINISHED' && e.studentStatus !== 'SUBMITTED'
          ).map(e => ({
            ...e.exam,
            studentStatus: e.studentStatus
          }))
        }
      } catch (e) {
        console.error('加载待考考试失败:', e)
      }
    }

    const loadLogs = async () => {
      try {
        const res = await logApi.page({ current: 1, size: 10 })
        if (res.code === 200) {
          recentLogs.value = (res.data.records || []).map(log => ({
            operator: log.username || '-',
            action: log.operation || '-',
            createTime: formatDateTime(log.createTime)
          }))
        }
      } catch (e) {
        console.error('加载日志失败:', e)
      }
    }

    const formatDateTime = (dateTime) => {
      if (!dateTime) return '-'
      const date = new Date(dateTime)
      return date.toLocaleString('zh-CN')
    }

    onMounted(async () => {
      await loadStats()

      if (userInfo.value.role === 'ADMIN') {
        await loadLogs()
      } else if (userInfo.value.role === 'TEACHER') {
        await loadRecentExams()
      } else if (userInfo.value.role === 'STUDENT') {
        await loadPendingExams()
      }
    })

    return {
      userInfo,
      displayName,
      currentDate,
      roleText,
      stats,
      recentExams,
      pendingExams,
      recentLogs,
      statusClass,
      statusText,
      goTo,
      goToExam
    }
  }
}
</script>

<style lang="scss">
.dashboard {
  padding: 24rpx;
  min-height: 100vh;
  background: #f5f5f5;
}

.page-header {
  margin-bottom: 24rpx;

  .title {
    font-size: 36rpx;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 8rpx;
  }

  .subtitle {
    font-size: 26rpx;
    color: #64748b;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);

  .stat-icon {
    width: 56rpx;
    height: 56rpx;
    border-radius: 14rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .emoji {
      font-size: 32rpx;
    }
  }

  .admin-icon {
    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  }

  .teacher-icon {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }

  .student-icon {
    background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  }

  .stat-info {
    flex: 1;

    .stat-value {
      font-size: 36rpx;
      font-weight: 700;
      color: #0f172a;
    }

    .stat-label {
      font-size: 24rpx;
      color: #64748b;
      margin-top: 4rpx;
    }
  }

  .arrow {
    font-size: 40rpx;
    color: #999;
  }
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;

    .card-title {
      display: flex;
      align-items: center;
      gap: 12rpx;

      .card-emoji {
        font-size: 28rpx;
      }

      .title-text {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
      }
    }

    .card-link {
      font-size: 26rpx;
      color: #dc2626;
    }
  }
}

.log-list {
  .log-item {
    display: flex;
    align-items: center;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #e5e5e5;

    &:last-child {
      border-bottom: none;
    }

    .log-operator {
      width: 120rpx;
      font-size: 26rpx;
      color: #333;
    }

    .log-action {
      flex: 1;
      font-size: 26rpx;
      color: #666;
    }

    .log-time {
      font-size: 24rpx;
      color: #999;
    }
  }
}

.exam-list {
  .exam-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #e5e5e5;

    &:last-child {
      border-bottom: none;
    }

    .exam-info {
      flex: 1;

      .exam-title {
        font-size: 28rpx;
        color: #333;
        font-weight: 500;
        margin-bottom: 8rpx;
      }

      .exam-meta {
        font-size: 24rpx;
        color: #999;
      }
    }

    .exam-status {
      .status-tag {
        padding: 8rpx 16rpx;
        border-radius: 8rpx;

        &.pending {
          background: rgba(245, 158, 11, 0.1);
          .status-text { color: #f59e0b; }
        }

        &.ongoing {
          background: rgba(34, 197, 94, 0.1);
          .status-text { color: #22c55e; }
        }

        &.finished {
          background: rgba(100, 116, 139, 0.1);
          .status-text { color: #64748b; }
        }

        .status-text {
          font-size: 24rpx;
        }
      }
    }

    .exam-btn {
      height: 64rpx;
      padding: 0 24rpx;
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      border-radius: 8rpx;
      border: none;

      .btn-text {
        font-size: 26rpx;
        color: #fff;
      }

      &[disabled] {
        background: #ccc;
      }
    }
  }
}

.tips-card {
  .tips-list {
    .tip-item {
      display: flex;
      align-items: flex-start;
      padding: 12rpx 0;

      .tip-number {
        width: 40rpx;
        font-size: 26rpx;
        color: #dc2626;
        font-weight: 600;
      }

      .tip-text {
        font-size: 26rpx;
        color: #666;
      }
    }
  }
}

.empty {
  padding: 40rpx;
  text-align: center;

  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}
</style>