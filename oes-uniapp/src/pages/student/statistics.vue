<template>
  <view class="statistics">
    <view class="page-header">
      <text class="title">成绩分析</text>
      <text class="subtitle">查看您的学习数据分析</text>
    </view>

    <!-- 统计卡片 -->
    <view class="stat-grid">
      <view class="stat-card" v-for="(item, index) in statItems" :key="index">
        <view class="stat-icon" :style="{ background: item.bgColor }">
          <uni-icons :type="item.icon" size="24" color="#fff" />
        </view>
        <view class="stat-info">
          <text class="stat-value">{{ item.value }}</text>
          <text class="stat-label">{{ item.label }}</text>
        </view>
      </view>
    </view>

    <!-- 科目成绩 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">科目成绩</text>
      </view>
      <view class="subject-list">
        <view class="subject-item" v-for="subject in subjectScores" :key="subject.subjectName">
          <view class="subject-info">
            <text class="subject-name">{{ subject.subjectName }}</text>
            <text class="subject-exams">{{ subject.examCount }}次考试</text>
          </view>
          <view class="subject-score">
            <text class="score-value">{{ subject.avgScore }}</text>
            <text class="score-unit">分</text>
          </view>
          <view class="score-bar">
            <view class="bar-fill" :style="{ width: subject.avgScore + '%', background: subject.color }"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 答题情况 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">答题情况</text>
      </view>
      <view class="answer-stats">
        <view class="answer-item">
          <view class="answer-icon correct">
            <uni-icons type="checkmarkempty" size="20" color="#67c23a" />
          </view>
          <view class="answer-info">
            <text class="answer-count">{{ stats.correctCount }}</text>
            <text class="answer-label">答对题数</text>
          </view>
          <text class="answer-rate">{{ correctRate }}%</text>
        </view>

        <view class="answer-item">
          <view class="answer-icon wrong">
            <uni-icons type="closeempty" size="20" color="#f56c6c" />
          </view>
          <view class="answer-info">
            <text class="answer-count">{{ stats.wrongCount }}</text>
            <text class="answer-label">答错题数</text>
          </view>
          <text class="answer-rate">{{ wrongRate }}%</text>
        </view>

        <view class="answer-item">
          <view class="answer-icon skip">
            <uni-icons type="minus" size="20" color="#909399" />
          </view>
          <view class="answer-info">
            <text class="answer-count">{{ stats.skippedCount }}</text>
            <text class="answer-label">未答题数</text>
          </view>
          <text class="answer-rate">{{ skippedRate }}%</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../../store/index.js'
import { statisticsApi } from '../../utils/api.js'

const userStore = useUserStore()
const stats = ref({
  totalExams: 0,
  avgScore: 0,
  correctCount: 0,
  wrongCount: 0,
  skippedCount: 0,
  passRate: 0
})

const subjectScores = ref([])

const statItems = computed(() => [
  {
    label: '总考试数',
    value: stats.value.totalExams,
    icon: 'flag',
    bgColor: '#667eea'
  },
  {
    label: '平均分',
    value: stats.value.avgScore,
    icon: 'star',
    bgColor: '#f56c6c'
  },
  {
    label: '通过率',
    value: stats.value.passRate + '%',
    icon: 'medal',
    bgColor: '#67c23a'
  }
])

const totalAnswered = computed(() => {
  return stats.value.correctCount + stats.value.wrongCount + stats.value.skippedCount
})

const correctRate = computed(() => {
  if (totalAnswered.value === 0) return 0
  return Math.round((stats.value.correctCount / totalAnswered.value) * 100)
})

const wrongRate = computed(() => {
  if (totalAnswered.value === 0) return 0
  return Math.round((stats.value.wrongCount / totalAnswered.value) * 100)
})

const skippedRate = computed(() => {
  if (totalAnswered.value === 0) return 0
  return Math.round((stats.value.skippedCount / totalAnswered.value) * 100)
})

const loadStatistics = async () => {
  try {
    const userId = userStore.userInfo?.userId
    if (!userId) return

    const res = await statisticsApi.getStudentStatistics(userId)
    if (res.code === 200) {
      stats.value = res.data.basicStats || stats.value
      subjectScores.value = res.data.subjectScores || []

      // 为科目数据添加颜色
      subjectScores.value = subjectScores.value.map((subject, index) => ({
        ...subject,
        color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'][index % 5]
      }))
    }
  } catch (e) {
    console.error(e)
    uni.showToast({
      title: '加载统计数据失败',
      icon: 'none'
    })
  }
}

onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
.statistics {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24rpx;
}

.page-header {
  margin-bottom: 32rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.stat-grid {
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.stat-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 4rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.card-header {
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.subject-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.subject-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.subject-info {
  flex: 1;
}

.subject-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 4rpx;
}

.subject-exams {
  font-size: 24rpx;
  color: #666;
}

.subject-score {
  text-align: right;
}

.score-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.score-unit {
  font-size: 24rpx;
  color: #666;
}

.score-bar {
  width: 160rpx;
  height: 12rpx;
  background: #f5f5f5;
  border-radius: 6rpx;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 6rpx;
}

.answer-stats {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.answer-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.answer-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.answer-icon.correct {
  background: #f0f9ff;
}

.answer-icon.wrong {
  background: #fef0f0;
}

.answer-icon.skip {
  background: #f4f4f5;
}

.answer-info {
  flex: 1;
}

.answer-count {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 4rpx;
}

.answer-label {
  font-size: 24rpx;
  color: #666;
}

.answer-rate {
  font-size: 28rpx;
  font-weight: bold;
  color: #409eff;
}
</style>