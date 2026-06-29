<template>
  <div class="exam-list">
    <div class="page-header">
      <h2>考试列表</h2>
      <p>查看并参加待进行的考试</p>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="search-bar">
      <div class="search-left">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索考试名称"
          class="search-input"
          @keyup.enter.native="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="searchForm.status"
          placeholder="筛选状态"
          class="status-select"
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="待开始" value="PENDING" />
          <el-option label="进行中" value="ONGOING" />
          <el-option label="已结束" value="FINISHED" />
        </el-select>
      </div>
      <el-button type="danger" @click="handleSearch">搜索</el-button>
    </div>

    <div class="exam-grid">
      <div class="exam-card" v-for="item in tableData" :key="item.exam.id">
        <div class="exam-header">
          <h3>{{ item.exam.title }}</h3>
          <el-tag :type="getExamStatusType(item)">
            {{ getExamStatusText(item) }}
          </el-tag>
        </div>
        <div class="exam-info">
          <div class="info-item">
            <el-icon><Clock /></el-icon>
            <span>考试时长：{{ item.exam.duration }} 分钟</span>
          </div>
          <div class="info-item">
            <el-icon><Timer /></el-icon>
            <span>总分：{{ item.exam.totalScore }}</span>
          </div>
          <div class="info-item">
            <el-icon><Calendar /></el-icon>
            <span>{{ formatTime(item.exam.startTime) }}</span>
          </div>
        </div>
        <div class="exam-actions">
          <el-button 
            :type="item.studentStatus === 'SUBMITTED' ? 'success' : 'danger'" 
            @click="handleJoin(item.exam)" 
            :disabled="!canJoin(item) && !canView(item)"
          >
            {{ getButtonText(item) }}
          </el-button>
        </div>
      </div>
    </div>

    <el-empty v-if="tableData.length === 0" description="暂无考试" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { examApi } from '../../utils/api'

const router = useRouter()
const tableData = ref([])
const searchForm = ref({
  keyword: '',
  status: ''
})

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const getExamStatusType = (item) => {
  if (item.studentStatus === 'AUTO_SUBMITTED') {
    return 'danger'
  }
  if (item.studentStatus === 'SUBMITTED') {
    return 'success'
  }
  if (item.exam.status === 'ONGOING') return 'warning'
  return 'info'
}

const getExamStatusText = (item) => {
  if (item.studentStatus === 'AUTO_SUBMITTED') {
    return '强制收卷'
  }
  if (item.studentStatus === 'SUBMITTED') {
    return '已完成'
  }
  if (item.exam.status === 'ONGOING') return '进行中'
  return '即将开始'
}

const canJoin = (item) => {
  return item.exam.status === 'ONGOING' && item.studentStatus !== 'SUBMITTED' && item.studentStatus !== 'AUTO_SUBMITTED'
}

const canView = (item) => {
  return item.studentStatus === 'SUBMITTED' || item.studentStatus === 'AUTO_SUBMITTED'
}

const getButtonText = (item) => {
  if (item.studentStatus === 'SUBMITTED' || item.studentStatus === 'AUTO_SUBMITTED') return '查看详情'
  if (item.exam.status === 'ONGOING') return '进入考试'
  return '等待开始'
}

const handleJoin = (exam) => {
  router.push(`/student/examing/${exam.id}`)
}

const handleSearch = () => {
  loadData()
}

const loadData = async () => {
  try {
    const params = { 
      current: 1, 
      size: 20,
      keyword: searchForm.value.keyword,
      status: searchForm.value.status
    }
    const res = await examApi.studentPage(params)
    if (res.code === 200) {
      tableData.value = res.data.records
    }
  } catch (e) { console.error(e) }
}

onMounted(() => { 
  loadData()
})
</script>

<style lang="scss" scoped>
.exam-list {
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

.search-bar {
  position: sticky;
  top: 24px;
  z-index: 100;
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  align-items: center;
  
  .search-left {
    display: flex;
    gap: 12px;
    flex: 1;
    min-width: 0;
    align-items: center;
  }
  
  .search-input {
    flex: 1;
    min-width: 0;
  }
  
  .status-select {
    width: 140px;
    flex: 0 0 auto;
  }
  
  .el-button {
    flex: 0 0 auto;
    white-space: nowrap;
    width: auto;
  }
}

.exam-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
  transition: all 0.2s;
}

.exam-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(99, 102, 241, 0.15);
}

.exam-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 0 8px;
  
  .exam-card {
    flex: 1;
    min-width: 280px;
    max-width: calc(33.333% - 16px);
  }
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.exam-header h3 {
  font-size: clamp(16px, 3vw, 18px);
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  word-break: break-word;
  line-height: 1.3;
}

.exam-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: clamp(13px, 2.8vw, 14px);
  line-height: 1.4;
}

.info-item .el-icon {
  color: #94a3b8;
  flex-shrink: 0;
}

.exam-actions {
  display: flex;
  justify-content: flex-end;
}

/* 响应式布局 */
@media screen and (max-width: 1200px) {
  .exam-grid {
    gap: 20px;
  }
  
  .exam-grid .exam-card {
    max-width: calc(50% - 10px);
  }
}

@media screen and (max-width: 576px) {
  .search-bar {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
  
  .search-bar .search-left {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }
  
  .search-bar .search-input {
    flex: 1;
    min-width: 0;
  }
  
  .search-bar .status-select {
    flex: 0 0 auto;
    width: auto;
    min-width: 100px;
  }
  
  .search-bar .el-button {
    flex: 0 0 auto;
    white-space: nowrap;
    width: auto;
  }
}

@media screen and (max-width: 768px) {
  .exam-list {
    padding: 0 4px;
  }
  
  .page-header {
    padding: 0 4px;
  }
  
  .search-bar {
    padding: 12px 16px;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .exam-grid {
    gap: 14px;
    padding: 0 4px;
    
    .exam-card {
      max-width: calc(50% - 7px);
      min-width: calc(50% - 7px);
      padding: 16px;
    }
  }
  
  .exam-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .exam-info {
    gap: 10px;
    margin-bottom: 16px;
  }
}

@media screen and (max-width: 576px) {
  .exam-grid {
    gap: 12px;
    
    .exam-card {
      max-width: 100%;
      min-width: 100%;
      margin-bottom: 0;
      padding: 14px;
    }
  }
  
  .exam-header h3 {
    font-size: 15px;
  }
  
  .info-item {
    font-size: 13px;
    gap: 6px;
  }
  
  .exam-info {
    gap: 8px;
  }
}

@media screen and (max-width: 360px) {
  .exam-card {
    padding: 12px;
  }
  
  .exam-header {
    gap: 8px;
  }
  
  .exam-header h3 {
    font-size: 14px;
  }
  
  .info-item {
    font-size: 12px;
  }
}
</style>
