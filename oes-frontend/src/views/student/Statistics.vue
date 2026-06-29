<template>
  <div class="student-statistics">
    <div class="page-header">
      <h2>成绩分析</h2>
      <p>查看您的学习数据分析</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-grid">
      <div class="stat-card" v-for="(item, index) in statItems" :key="index">
        <div class="stat-icon" :style="{ background: item.bgColor }">
          <el-icon><component :is="item.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ item.value }}</p>
          <p class="stat-label">{{ item.label }}</p>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <!-- 科目成绩 -->
      <div class="card">
        <div class="card-header">
          <h3>科目成绩</h3>
        </div>
        <div class="subject-list">
          <div class="subject-item" v-for="subject in subjectScores" :key="subject.subjectName">
            <div class="subject-info">
              <h4>{{ subject.subjectName }}</h4>
              <p>{{ subject.examCount }}次考试</p>
            </div>
            <div class="subject-score">
              <span class="score-value">{{ subject.avgScore }}</span>
              <span class="score-label">分</span>
            </div>
            <div class="score-bar">
              <div class="bar-fill" :style="{ width: subject.avgScore + '%', background: subject.color }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 答题情况 -->
      <div class="card">
        <div class="card-header">
          <h3>答题情况</h3>
        </div>
        <div class="answer-stats">
          <div class="answer-item">
            <div class="answer-icon correct">
              <el-icon><SuccessFilled /></el-icon>
            </div>
            <div class="answer-info">
              <span class="answer-count">{{ stats.correctCount }}</span>
              <span class="answer-label">答对题数</span>
            </div>
            <span class="answer-rate">{{ correctRate }}%</span>
          </div>
          <div class="answer-item">
            <div class="answer-icon wrong">
              <el-icon><CircleCloseFilled /></el-icon>
            </div>
            <div class="answer-info">
              <span class="answer-count">{{ stats.wrongCount }}</span>
              <span class="answer-label">答错题数</span>
            </div>
            <span class="answer-rate">{{ wrongRate }}%</span>
          </div>
          <div class="answer-item">
            <div class="answer-icon skip">
              <el-icon><RemoveFilled /></el-icon>
            </div>
            <div class="answer-info">
              <span class="answer-count">{{ stats.skippedCount }}</span>
              <span class="answer-label">未答题数</span>
            </div>
            <span class="answer-rate">{{ skippedRate }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 成绩趋势图 -->
    <div class="card full-width">
      <div class="card-header">
        <h3>成绩趋势</h3>
      </div>
      <div ref="scoreTrendChart" class="chart-container"></div>
    </div>

    <!-- 知识点掌握雷达图 -->
    <div class="card full-width">
      <div class="card-header">
        <h3>知识点掌握情况</h3>
      </div>
      <div ref="knowledgeRadarChart" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { examRecordApi } from '../../utils/api'
import * as echarts from 'echarts'
import { SuccessFilled, Medal, TrendCharts, Warning, CircleCloseFilled, RemoveFilled } from '@element-plus/icons-vue'

const stats = ref({
  totalExams: 0,
  averageScore: 0,
  highestScore: 0,
  wrongCount: 0,
  correctCount: 0,
  skippedCount: 0
})

const statItems = computed(() => [
  { icon: SuccessFilled, value: stats.value.totalExams, label: '总考试数', bgColor: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' },
  { icon: Medal, value: stats.value.averageScore, label: '平均分', bgColor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
  { icon: TrendCharts, value: stats.value.highestScore, label: '最高分', bgColor: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' },
  { icon: Warning, value: stats.value.wrongCount, label: '错题数', bgColor: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }
])

const subjectColors = ['#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444', '#f87171', '#fb923c', '#f59e0b']

const subjectScores = ref([])
const scoreTrendData = ref([])
const knowledgeMasteryData = ref([])

const scoreTrendChart = ref(null)
const knowledgeRadarChart = ref(null)
let scoreTrendChartInstance = null
let knowledgeRadarChartInstance = null

const totalAnswers = computed(() => stats.value.correctCount + stats.value.wrongCount + stats.value.skippedCount)
const correctRate = computed(() => totalAnswers.value > 0 ? Math.round((stats.value.correctCount / totalAnswers.value) * 100) : 0)
const wrongRate = computed(() => totalAnswers.value > 0 ? Math.round((stats.value.wrongCount / totalAnswers.value) * 100) : 0)
const skippedRate = computed(() => totalAnswers.value > 0 ? Math.round((stats.value.skippedCount / totalAnswers.value) * 100) : 0)

const loadData = async () => {
  try {
    const res = await examRecordApi.getAnalysis()
    if (res.code === 200) {
      stats.value = res.data
    }
  } catch (e) {
    console.error(e)
    stats.value = {
      totalExams: 0,
      averageScore: 0,
      highestScore: 0,
      wrongCount: 0,
      correctCount: 0,
      skippedCount: 0
    }
  }
}

const loadSubjectScores = async () => {
  try {
    const res = await examRecordApi.getStudentSubjectScores()
    if (res.code === 200 && res.data) {
      subjectScores.value = res.data.map((subject, index) => ({
        ...subject,
        color: subjectColors[index % subjectColors.length]
      }))
    }
  } catch (e) {
    console.error(e)
    subjectScores.value = []
  }
}

const loadScoreTrend = async () => {
  try {
    const res = await examRecordApi.getScoreTrend()
    if (res.code === 200 && res.data) {
      scoreTrendData.value = res.data
      initScoreTrendChart()
    }
  } catch (e) {
    console.error(e)
  }
}

const loadKnowledgeMastery = async () => {
  try {
    const res = await examRecordApi.getKnowledgeMastery()
    if (res.code === 200 && res.data) {
      knowledgeMasteryData.value = res.data
      initKnowledgeRadarChart()
    }
  } catch (e) {
    console.error(e)
  }
}

const initScoreTrendChart = () => {
  if (!scoreTrendChart.value) return
  
  if (scoreTrendChartInstance) {
    scoreTrendChartInstance.dispose()
  }
  
  scoreTrendChartInstance = echarts.init(scoreTrendChart.value)
  
  const dates = scoreTrendData.value.map(item => {
    const date = new Date(item.submitTime)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
  const scores = scoreTrendData.value.map(item => item.score)
  const titles = scoreTrendData.value.map(item => item.examTitle)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const index = params[0].dataIndex
        return `${titles[index]}<br/>分数: ${params[0].value}分`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      },
      axisLabel: {
        color: '#64748b'
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      },
      axisLabel: {
        color: '#64748b'
      },
      splitLine: {
        lineStyle: {
          color: '#f1f5f9'
        }
      }
    },
    series: [
      {
        name: '分数',
        type: 'line',
        smooth: true,
        data: scores,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#dc2626' },
              { offset: 1, color: '#b91c1c' }
            ]
          }
        },
        itemStyle: {
          color: '#dc2626',
          borderColor: '#fff',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(220, 38, 38, 0.3)' },
              { offset: 1, color: 'rgba(220, 38, 38, 0.05)' }
            ]
          }
        }
      }
    ]
  }
  
  scoreTrendChartInstance.setOption(option)
}

const initKnowledgeRadarChart = () => {
  if (!knowledgeRadarChart.value) return
  
  if (knowledgeRadarChartInstance) {
    knowledgeRadarChartInstance.dispose()
  }
  
  knowledgeRadarChartInstance = echarts.init(knowledgeRadarChart.value)
  
  const subjects = knowledgeMasteryData.value.map(item => item.subjectName)
  const masteryRates = knowledgeMasteryData.value.map(item => item.masteryRate)
  const correctRates = knowledgeMasteryData.value.map(item => item.correctRate)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        const index = params.dataIndex
        const data = knowledgeMasteryData.value[index]
        return `${data.subjectName}<br/>掌握率: ${data.masteryRate}%<br/>正确率: ${data.correctRate}%<br/>总题数: ${data.totalQuestions}<br/>已学会: ${data.masteredQuestions}`
      }
    },
    legend: {
      data: ['掌握率', '正确率'],
      bottom: 10,
      textStyle: {
        color: '#64748b'
      }
    },
    radar: {
      indicator: subjects.map(subject => ({
        name: subject,
        max: 100
      })),
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: '#1e293b',
        fontSize: 14
      },
      splitLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(220, 38, 38, 0.05)', 'rgba(220, 38, 38, 0.1)']
        }
      },
      axisLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      }
    },
    series: [
      {
        name: '知识点掌握',
        type: 'radar',
        data: [
          {
            value: masteryRates,
            name: '掌握率',
            itemStyle: {
              color: '#dc2626'
            },
            areaStyle: {
              color: 'rgba(220, 38, 38, 0.3)'
            },
            lineStyle: {
              color: '#dc2626',
              width: 2
            }
          },
          {
            value: correctRates,
            name: '正确率',
            itemStyle: {
              color: '#f59e0b'
            },
            areaStyle: {
              color: 'rgba(245, 158, 11, 0.3)'
            },
            lineStyle: {
              color: '#f59e0b',
              width: 2
            }
          }
        ]
      }
    ]
  }
  
  knowledgeRadarChartInstance.setOption(option)
}

const handleResize = () => {
  if (scoreTrendChartInstance) {
    scoreTrendChartInstance.resize()
  }
  if (knowledgeRadarChartInstance) {
    knowledgeRadarChartInstance.resize()
  }
}

onMounted(() => {
  loadData()
  loadSubjectScores()
  loadScoreTrend()
  loadKnowledgeMastery()
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (scoreTrendChartInstance) {
    scoreTrendChartInstance.dispose()
  }
  if (knowledgeRadarChartInstance) {
    knowledgeRadarChartInstance.dispose()
  }
})
</script>

<style lang="scss" scoped>
.student-statistics {
  width: 100%;
  max-width: 100%;
  padding: 0 8px;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 20px;
  padding: 0 8px;
  
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

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
  padding: 0 8px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  }
  
  .stat-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: white;
    flex-shrink: 0;
  }
  
  .stat-info {
    flex: 1;
    min-width: 0;
  }
  
  .stat-value {
    font-size: clamp(20px, 4vw, 28px);
    font-weight: 700;
    margin: 0;
    color: #0f172a;
    word-break: break-all;
    line-height: 1.2;
  }
  
  .stat-label {
    font-size: clamp(11px, 2.5vw, 13px);
    color: #64748b;
    margin: 4px 0 0 0;
    line-height: 1.4;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
  padding: 0 8px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  
  &.full-width {
    margin-bottom: 20px;
    margin-left: 8px;
    margin-right: 8px;
    width: calc(100% - 16px);
  }
}

.card-header {
  margin-bottom: 16px;
  
  h3 {
    font-size: clamp(14px, 3vw, 16px);
    font-weight: 600;
    color: #1e293b;
    margin: 0;
    line-height: 1.3;
  }
}

.chart-container {
  width: 100%;
  height: 300px;
}

.subject-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  .subject-item {
    padding: 12px 0;
    border-bottom: 1px solid #f1f5f9;
    
    &:last-child {
      border-bottom: none;
    }
    
    .subject-info {
      margin-bottom: 8px;
      
      h4 {
        font-size: clamp(13px, 2.8vw, 14px);
        font-weight: 600;
        color: #1e293b;
        margin: 0;
        line-height: 1.4;
      }
      
      p {
        font-size: clamp(11px, 2.4vw, 12px);
        color: #64748b;
        margin: 3px 0 0 0;
        line-height: 1.4;
      }
    }
    
    .subject-score {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-bottom: 8px;
      
      .score-value {
        font-size: clamp(18px, 4vw, 22px);
        font-weight: 700;
        color: #0f172a;
      }
      
      .score-label {
        font-size: clamp(11px, 2.4vw, 12px);
        color: #64748b;
      }
    }
    
    .score-bar {
      height: 6px;
      background: #f1f5f9;
      border-radius: 3px;
      overflow: hidden;
      
      .bar-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.5s ease;
      }
    }
  }
}

.answer-stats {
  .answer-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 0;
    border-bottom: 1px solid #f1f5f9;
    
    &:last-child {
      border-bottom: none;
    }
    
    .answer-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
      
      &.correct {
        background: #dcfce7;
        color: #16a34a;
      }
      
      &.wrong {
        background: #fee2e2;
        color: #dc2626;
      }
      
      &.skip {
        background: #f3f4f6;
        color: #6b7280;
      }
    }
    
    .answer-info {
      flex: 1;
      min-width: 0;
      
      .answer-count {
        display: block;
        font-size: clamp(16px, 3.5vw, 18px);
        font-weight: 700;
        color: #0f172a;
        line-height: 1.2;
      }
      
      .answer-label {
        font-size: clamp(11px, 2.4vw, 12px);
        color: #64748b;
        line-height: 1.4;
      }
    }
    
    .answer-rate {
      font-size: clamp(14px, 3vw, 16px);
      font-weight: 600;
      color: #dc2626;
      flex-shrink: 0;
      min-width: 40px;
      text-align: right;
    }
  }
}

/* 响应式布局 */
@media screen and (max-width: 1200px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
  
  .stat-card {
    padding: 18px;
    gap: 12px;
    
    .stat-icon {
      width: 48px;
      height: 48px;
      font-size: 20px;
    }
  }
}

@media screen and (max-width: 768px) {
  .student-statistics {
    padding: 0 4px;
  }
  
  .page-header {
    padding: 0 4px;
    margin-bottom: 16px;
  }
  
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 0 4px;
  }
  
  .stat-card {
    padding: 14px;
    gap: 10px;
    
    .stat-icon {
      width: 38px;
      height: 38px;
      font-size: 16px;
      border-radius: 10px;
    }
    
    .stat-value {
      font-size: 18px;
    }
    
    .stat-label {
      font-size: 11px;
    }
  }
  
  .content-grid {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 0 4px;
  }
  
  .card {
    padding: 14px;
  }
  
  .card.full-width {
    margin-left: 4px;
    margin-right: 4px;
    width: calc(100% - 8px);
  }
  
  .chart-container {
    height: 220px;
  }
  
  .subject-list {
    gap: 12px;
    
    .subject-item {
      padding: 10px 0;
    }
  }
  
  .answer-stats .answer-item {
    gap: 10px;
    padding: 12px 0;
    
    .answer-icon {
      width: 36px;
      height: 36px;
      font-size: 14px;
    }
    
    .answer-count {
      font-size: 14px;
    }
    
    .answer-rate {
      font-size: 13px;
    }
  }
}

@media screen and (max-width: 576px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .stat-card {
    padding: 12px;
    gap: 8px;
    
    .stat-icon {
      width: 34px;
      height: 34px;
      font-size: 14px;
    }
    
    .stat-value {
      font-size: 16px;
    }
  }
  
  .card {
    padding: 12px;
  }
  
  .chart-container {
    height: 200px;
  }
}

@media screen and (max-width: 360px) {
  .stat-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .stat-card {
    flex-direction: row;
    align-items: center;
    
    .stat-info {
      text-align: left;
    }
    
    .stat-icon {
      width: 40px;
      height: 40px;
      font-size: 16px;
    }
    
    .stat-value {
      font-size: 18px;
    }
  }
  
  .chart-container {
    height: 180px;
  }
  
  .answer-stats .answer-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    
    .answer-info {
      width: 100%;
    }
    
    .answer-rate {
      align-self: flex-end;
    }
  }
}
</style>