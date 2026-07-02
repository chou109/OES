<template>
  <view class="manage-page">
    <view class="page-header">
      <text class="title">题库管理</text>
    </view>
    
    <!-- 搜索栏 -->
    <view class="search-bar">
      <picker mode="selector" :range="subjects" range-key="name" @change="onSubjectChange">
        <view class="picker">
          <text class="picker-text">{{ selectedSubjectName || '选择科目' }}</text>
        </view>
      </picker>
      <picker mode="selector" :range="questionTypes" range-key="label" @change="onTypeChange">
        <view class="picker">
          <text class="picker-text">{{ selectedTypeName || '题目类型' }}</text>
        </view>
      </picker>
      <input class="search-input" v-model="keyword" placeholder="搜索题目内容" />
      <button class="search-btn" @click="loadData">搜索</button>
    </view>
    
    <!-- 题目列表 -->
    <view class="list">
      <view class="list-item" v-for="item in questionList" :key="item.id">
        <view class="item-info">
          <view class="type-tag">{{ typeText(item.type) }}</view>
          <text class="item-title">{{ truncate(item.content, 50) }}</text>
        </view>
        <view class="item-actions">
          <text class="action-btn" @click="editQuestion(item)">编辑</text>
          <text class="action-btn danger" @click="deleteQuestion(item)">删除</text>
        </view>
      </view>
      
      <view class="empty" v-if="questionList.length === 0">
        <text class="empty-text">暂无题目数据</text>
      </view>
    </view>
    
    <!-- 新增按钮 -->
    <view class="add-btn" @click="addQuestion">
      <uni-icons type="plus" size="20" color="#fff" />
      <text class="add-text">新增题目</text>
    </view>
    
    <!-- 批量导入按钮 -->
    <view class="import-btn" @click="importQuestion">
      <uni-icons type="upload" size="20" color="#fff" />
      <text class="import-text">批量导入</text>
    </view>
  </view>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { questionApi, subjectApi } from '../../utils/api'

export default {
  setup() {
    const keyword = ref('')
    const questionList = ref([])
    const subjects = ref([])
    const selectedSubjectId = ref(null)
    const selectedTypeId = ref('')
    
    const questionTypes = [
      { value: '', label: '全部' },
      { value: 'SINGLE_CHOICE', label: '单选题' },
      { value: 'MULTIPLE_CHOICE', label: '多选题' },
      { value: 'JUDGMENT', label: '判断题' },
      { value: 'FILL_BLANK', label: '填空题' },
      { value: 'ESSAY', label: '简答题' }
    ]
    
    const selectedSubjectName = computed(() => {
      const s = subjects.value.find(s => s.id === selectedSubjectId.value)
      return s?.name || ''
    })
    
    const selectedTypeName = computed(() => {
      const t = questionTypes.find(t => t.value === selectedTypeId.value)
      return t?.label || ''
    })
    
    const typeText = (type) => {
      const map = {
        SINGLE_CHOICE: '单选',
        MULTIPLE_CHOICE: '多选',
        JUDGMENT: '判断',
        FILL_BLANK: '填空',
        ESSAY: '简答',
        PROGRAMMING: '编程'
      }
      return map[type] || type
    }
    
    const truncate = (text, len) => {
      if (!text) return '-'
      return text.length > len ? text.substring(0, len) + '...' : text
    }
    
    const onSubjectChange = (e) => {
      const index = e.detail.value
      if (subjects.value[index]) {
        selectedSubjectId.value = subjects.value[index].id
      }
    }
    
    const onTypeChange = (e) => {
      const index = e.detail.value
      if (questionTypes[index]) {
        selectedTypeId.value = questionTypes[index].value
      }
    }
    
    const loadData = async () => {
      try {
        uni.showLoading({ title: '加载中...' })
        const res = await questionApi.page({
          current: 1,
          size: 20,
          keyword: keyword.value,
          subjectId: selectedSubjectId.value,
          type: selectedTypeId.value
        })
        if (res.code === 200) {
          questionList.value = res.data.records
        }
      } catch (e) {
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
    
    const loadSubjects = async () => {
      try {
        const res = await subjectApi.list()
        if (res.code === 200) {
          subjects.value = [{ id: null, name: '全部' }, ...res.data]
        }
      } catch (e) {
        console.error(e)
      }
    }
    
    const addQuestion = () => {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    }
    
    const importQuestion = () => {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    }
    
    const editQuestion = (item) => {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    }
    
    const deleteQuestion = async (item) => {
      uni.showModal({
        title: '提示',
        content: `确定要删除此题目吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await questionApi.delete(item.id)
              if (result.code === 200) {
                uni.showToast({ title: '删除成功', icon: 'success' })
                loadData()
              } else {
                uni.showToast({ title: result.message || '删除失败', icon: 'none' })
              }
            } catch (e) {
              uni.showToast({ title: '删除失败', icon: 'none' })
            }
          }
        }
      })
    }
    
    onMounted(() => {
      loadSubjects()
      loadData()
    })
    
    return {
      keyword,
      questionList,
      subjects,
      questionTypes,
      selectedSubjectName,
      selectedTypeName,
      typeText,
      truncate,
      onSubjectChange,
      onTypeChange,
      loadData,
      addQuestion,
      importQuestion,
      editQuestion,
      deleteQuestion
    }
  }
}
</script>

<style lang="scss">
@import "../../styles/manage.scss";

.type-tag {
  display: inline-block;
  padding: 4rpx 12rpx;
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
  font-size: 24rpx;
  border-radius: 4rpx;
  margin-right: 12rpx;
}

.import-btn {
  position: fixed;
  bottom: 100rpx;
  right: 160rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx 32rpx;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 24rpx;
  
  .import-text {
    font-size: 28rpx;
    color: #fff;
  }
}
</style>