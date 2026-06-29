<template>
  <div class="history">
    <div class="page-header">
      <h2>考试历史</h2>
      <p>查看已完成考试的成绩和答卷详情</p>
    </div>

    <!-- 大屏幕表格视图 -->
    <div class="desktop-view">
      <div class="card">
        <el-table :data="tableData" v-loading="loading" stripe>
          <el-table-column prop="examTitle" label="考试名称" min-width="200" />
          <el-table-column prop="score" label="得分" width="120">
            <template #default="{ row }">
              <span :class="{ pass: row.score >= 60, fail: row.score < 60 }">{{ row.score }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="submitTime" label="交卷时间" width="180" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="danger" link @click="handleDetail(row)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="no-more" v-if="!hasMore && tableData.length > 0">
          没有更多数据了
        </div>

        <!-- 大屏幕懒加载触发器 -->
        <div ref="loadTrigger" class="load-trigger"></div>
      </div>
    </div>

    <!-- 小屏幕卡片视图 -->
    <div class="mobile-view">
      <div class="card-list">
        <div class="card-item" v-for="row in tableData" :key="row.id">
          <div class="item-title">{{ row.examTitle }}</div>
          <div class="item-info">
            <div class="info-row">
              <span class="info-label">得分</span>
              <span class="info-value" :class="{ pass: row.score >= 60, fail: row.score < 60 }">{{ row.score }}分</span>
            </div>
            <div class="info-row">
              <span class="info-label">交卷时间</span>
              <span class="info-value">{{ row.submitTime }}</span>
            </div>
          </div>
          <div class="item-action">
            <span class="action-link" @click="handleDetail(row)">查看详情</span>
          </div>
        </div>

        <!-- 小屏幕懒加载触发器 -->
        <div ref="loadTrigger" class="load-trigger"></div>
      </div>

      <el-empty v-if="!loading && tableData.length === 0" description="暂无考试记录" />

      <div class="mobile-no-more" v-if="!hasMore && tableData.length > 0">
        没有更多数据了
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { examRecordApi } from '../../utils/api'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const current = ref(1)
const size = ref(10)
const hasMore = ref(true)
const loadTrigger = ref(null)
let observer = null
let scrollContainer = null

const getPageSize = () => {
  if (window.innerWidth >= 992) {
    return 30
  } else if (window.innerWidth >= 768) {
    return 20
  }
  return 10
}

const typeText = (type) => ({ SINGLE_CHOICE: '单选题', MULTIPLE_CHOICE: '多选题', JUDGMENT: '判断题', FILL_BLANK: '填空题', ESSAY: '简答题', PROGRAMMING: '编程题' }[type] || type)

const loadData = async (append = false) => {
  if (loading.value || !hasMore.value) return
  loading.value = true
  const pageSize = getPageSize()
  try {
    const res = await examRecordApi.getStudentHistory({ current: current.value, size: pageSize })
    if (res.code === 200) {
      const data = res.data.records
      if (append) {
        tableData.value = [...tableData.value, ...data]
      } else {
        tableData.value = data
      }
      hasMore.value = data.length >= pageSize
    }
  } catch (e) { console.error(e) } finally { loading.value = false }
}

const loadMore = () => {
  if (loading.value || !hasMore.value) return
  current.value++
  loadData(true)
}

const handleDetail = (row) => {
  router.push(`/student/examing/${row.examId}`)
}

const setupIntersectionObserver = () => {
  nextTick(() => {
    if (observer) {
      observer.disconnect()
    }
    
    // 找到滚动容器（.content 元素）
    scrollContainer = document.querySelector('.content') || document.documentElement
    
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadMore()
        }
      })
    }, {
      root: scrollContainer === document.documentElement ? null : scrollContainer,
      rootMargin: '0px 0px 200px 0px',
      threshold: 0.1
    })

    if (loadTrigger.value) {
      observer.observe(loadTrigger.value)
    }
  })
}

const handleScroll = () => {
  if (loading.value || !hasMore.value) return
  
  // 使用正确的滚动容器
  const container = scrollContainer || document.documentElement
  const scrollTop = container.scrollTop || window.scrollY
  const containerHeight = container === document.documentElement ? window.innerHeight : container.clientHeight
  const scrollHeight = container.scrollHeight
  
  if (scrollTop + containerHeight >= scrollHeight - 300) {
    loadMore()
  }
}

onMounted(() => {
  loadData()
  setupIntersectionObserver()
  // 添加滚动事件监听作为备用方案
  nextTick(() => {
    scrollContainer = document.querySelector('.content') || document.documentElement
    scrollContainer.addEventListener('scroll', handleScroll)
  })
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style lang="scss" scoped>
.history {
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

.pass { 
  color: #22c55e; 
  font-weight: 600; 
}
.fail { 
  color: #ef4444; 
  font-weight: 600; 
}

.info-value.pass { 
  color: #22c55e; 
  font-weight: 600; 
}
.info-value.fail { 
  color: #ef4444; 
  font-weight: 600; 
}

.desktop-view {
  display: block;
  width: 100%;
}

.mobile-view {
  display: none;
  width: 100%;
}

.card-list {
  width: 100%;
}

.card-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #e2e8f0;
  width: calc(100% - 16px);
  margin-left: 8px;
  margin-right: 8px;
  box-sizing: border-box;
  transition: box-shadow 0.2s;
  
  &:active {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.item-title {
  font-size: clamp(15px, 3.5vw, 16px);
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
  word-break: break-word;
  line-height: 1.3;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: clamp(12px, 2.8vw, 13px);
  color: #64748b;
  min-width: 65px;
}

.info-value {
  font-size: clamp(13px, 3vw, 14px);
  color: #1e293b;
  text-align: right;
  flex: 1;
  margin-left: 12px;
}

.item-action {
  display: flex;
  justify-content: flex-end;
}

.action-link {
  color: #ef4444;
  font-size: clamp(13px, 3vw, 14px);
  cursor: pointer;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
  
  &:active {
    opacity: 0.8;
  }
}

.mobile-no-more {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  padding: 0 16px;
  color: #94a3b8;
  font-size: 14px;
}

.no-more {
  margin-top: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}

.load-trigger {
  height: 50px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

/* 响应式布局 */
@media screen and (max-width: 992px) {
  .card {
    padding: 12px;
  }
}

@media screen and (max-width: 768px) {
  .history {
    padding: 0 4px;
  }
  
  .page-header {
    padding: 0 4px;
  }
  
  .desktop-view {
    display: none;
  }

  .mobile-view {
    display: block;
  }
  
  .card-item {
    padding: 14px;
    margin-left: 4px;
    margin-right: 4px;
    width: calc(100% - 8px);
  }
  
  .item-info {
    gap: 10px;
    margin-bottom: 14px;
  }
  
  .info-row {
    padding: 8px 0;
    border-bottom: 1px solid #f1f5f9;
    
    &:last-child {
      border-bottom: none;
    }
  }
}

@media screen and (max-width: 576px) {
  .card-item {
    padding: 12px;
  }
  
  .item-title {
    font-size: 15px;
    margin-bottom: 10px;
  }
  
  .item-info {
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .info-label {
    font-size: 12px;
    min-width: 60px;
  }
  
  .info-value {
    font-size: 13px;
  }
  
  .action-link {
    font-size: 13px;
  }
}

@media screen and (max-width: 360px) {
  .card-item {
    padding: 10px;
    margin-bottom: 10px;
  }
  
  .item-title {
    font-size: 14px;
  }
  
  .info-label {
    font-size: 12px;
  }
  
  .info-value {
    font-size: 12px;
  }
  
  .action-link {
    font-size: 12px;
  }
}
</style>
