<template>
  <view class="paper-manage">
    <view class="page-header">
      <text class="title">试卷管理</text>
      <text class="subtitle">创建和管理考试试卷，支持手动组卷和自动组卷</text>
    </view>

    <!-- 工具栏 -->
    <view class="toolbar">
      <view class="toolbar-left">
        <picker mode="selector" :range="subjectOptions" range-key="name" @change="onSubjectChange">
          <view class="picker">{{ currentSubjectText }}</view>
        </picker>
        <picker mode="selector" :range="statusOptions" range-key="label" @change="onStatusChange">
          <view class="picker">{{ currentStatusText }}</view>
        </picker>
      </view>
      <button class="create-btn" @click="handleCreate">创建试卷</button>
    </view>

    <!-- 试卷列表 -->
    <view class="paper-list">
      <view class="paper-item" v-for="item in tableData" :key="item.id">
        <view class="paper-header">
          <text class="paper-title">{{ item.title }}</text>
          <view class="paper-status" :class="item.status === 'PUBLISHED' ? 'status-success' : 'status-info'">
            <text>{{ item.status === 'PUBLISHED' ? '已发布' : '草稿' }}</text>
          </view>
        </view>

        <view class="paper-info">
          <view class="info-row">
            <uni-icons type="flag" size="16" color="#666" />
            <text class="info-text">科目：{{ getSubjectName(item.subjectId) }}</text>
          </view>
          <view class="info-row">
            <uni-icons type="list" size="16" color="#666" />
            <text class="info-text">题数：{{ item.questionCount }}道</text>
          </view>
          <view class="info-row">
            <uni-icons type="medal" size="16" color="#666" />
            <text class="info-text">总分：{{ item.totalScore }}分</text>
          </view>
          <view class="info-row">
            <uni-icons type="clock" size="16" color="#666" />
            <text class="info-text">时长：{{ item.duration }}分钟</text>
          </view>
        </view>

        <view class="paper-actions">
          <button class="action-btn" @click="handleEdit(item)">编辑</button>
          <button class="action-btn" @click="handlePreview(item)">预览</button>
          <button v-if="item.status === 'DRAFT'" class="action-btn success" @click="handlePublish(item)">发布</button>
          <button class="action-btn danger" @click="handleDelete(item)">删除</button>
        </view>
      </view>
    </view>

    <uni-load-more :status="loadStatus" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { paperApi, subjectApi } from '../../utils/api.js'

const tableData = ref([])
const subjects = ref([])
const params = ref({
  subjectId: '',
  status: '',
  keyword: ''
})
const loadStatus = ref('more')
const current = ref(1)
const size = ref(10)

const subjectOptions = computed(() => {
  return [{ id: '', name: '全部科目' }, ...subjects.value]
})

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'PUBLISHED', label: '已发布' }
]

const currentSubjectText = computed(() => {
  const option = subjectOptions.value.find(s => s.id === params.value.subjectId)
  return option ? option.name : '全部科目'
})

const currentStatusText = computed(() => {
  const option = statusOptions.find(s => s.value === params.value.status)
  return option ? option.label : '全部状态'
})

const getSubjectName = (subjectId) => {
  const subject = subjects.value.find(s => s.id === subjectId)
  return subject ? subject.name : '未知科目'
}

const onSubjectChange = (e) => {
  const index = e.detail.value
  params.value.subjectId = subjectOptions.value[index].id
  loadData()
}

const onStatusChange = (e) => {
  const index = e.detail.value
  params.value.status = statusOptions[index].value
  loadData()
}

const handleCreate = () => {
  uni.showToast({ title: '试卷创建功能开发中', icon: 'none' })
}

const handleEdit = (item) => {
  uni.showToast({ title: '编辑功能开发中', icon: 'none' })
}

const handlePreview = (item) => {
  uni.showToast({ title: '预览功能开发中', icon: 'none' })
}

const handlePublish = async (item) => {
  uni.showModal({
    title: '提示',
    content: '确定要发布试卷吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await paperApi.publish(item.id)
          if (result.code === 200) {
            uni.showToast({ title: '试卷已发布', icon: 'success' })
            loadData()
          } else {
            uni.showToast({ title: result.message || '操作失败', icon: 'none' })
          }
        } catch (e) {
          uni.showToast({ title: '网络错误', icon: 'none' })
        }
      }
    }
  })
}

const handleDelete = async (item) => {
  uni.showModal({
    title: '警告',
    content: '确定要删除试卷吗？此操作不可恢复！',
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await paperApi.delete(item.id)
          if (result.code === 200) {
            uni.showToast({ title: '试卷已删除', icon: 'success' })
            loadData()
          } else {
            uni.showToast({ title: result.message || '操作失败', icon: 'none' })
          }
        } catch (e) {
          uni.showToast({ title: '网络错误', icon: 'none' })
        }
      }
    }
  })
}

const loadSubjects = async () => {
  try {
    const res = await subjectApi.list()
    if (res.code === 200) {
      subjects.value = res.data
    }
  } catch (e) {
    console.error(e)
  }
}

const loadData = async () => {
  if (loadStatus.value === 'loading') return
  loadStatus.value = 'loading'
  current.value = 1
  tableData.value = []

  try {
    const res = await paperApi.page({
      current: current.value,
      size: size.value,
      subjectId: params.value.subjectId,
      status: params.value.status,
      keyword: params.value.keyword
    })
    if (res.code === 200) {
      tableData.value = res.data.records
      loadStatus.value = res.data.records.length >= size.value ? 'more' : 'noMore'
    } else {
      uni.showToast({ title: res.message || '加载失败', icon: 'none' })
      loadStatus.value = 'more'
    }
  } catch (e) {
    console.error(e)
    uni.showToast({ title: '网络错误', icon: 'none' })
    loadStatus.value = 'more'
  }
}

onMounted(() => {
  loadSubjects()
  loadData()
})
</script>

<style scoped>
.paper-manage {
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

.toolbar {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  display: flex;
  gap: 20rpx;
  flex: 1;
}

.picker {
  padding: 16rpx 24rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #666;
}

.create-btn {
  width: 200rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: #f56c6c;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.paper-list {
  margin-top: 24rpx;
}

.paper-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.paper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.paper-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.paper-status {
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.status-success {
  background: #f0f9ff;
  color: #67c23a;
}

.status-info {
  background: #f4f4f5;
  color: #909399;
}

.paper-info {
  margin-bottom: 20rpx;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.info-text {
  margin-left: 12rpx;
  font-size: 28rpx;
  color: #666;
}

.paper-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 20rpx;
}

.action-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: #f5f5f5;
  color: #666;
}

.action-btn.success {
  background: #67c23a;
  color: #fff;
}

.action-btn.danger {
  background: #f56c6c;
  color: #fff;
}
</style>