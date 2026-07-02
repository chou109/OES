<template>
  <view class="manage-page">
    <view class="page-header">
      <text class="title">科目管理</text>
    </view>
    
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input class="search-input" v-model="keyword" placeholder="搜索科目名称" />
      <button class="search-btn" @click="loadData">搜索</button>
    </view>
    
    <!-- 科目列表 -->
    <view class="list">
      <view class="list-item" v-for="item in subjectList" :key="item.id">
        <view class="item-info">
          <text class="item-title">{{ item.name }}</text>
          <text class="item-meta">{{ item.code || '-' }}</text>
        </view>
        <view class="item-actions">
          <text class="action-btn" @click="editSubject(item)">编辑</text>
          <text class="action-btn danger" @click="deleteSubject(item)">删除</text>
        </view>
      </view>
      
      <view class="empty" v-if="subjectList.length === 0">
        <text class="empty-text">暂无科目数据</text>
      </view>
    </view>
    
    <!-- 新增按钮 -->
    <view class="add-btn" @click="addSubject">
      <uni-icons type="plus" size="20" color="#fff" />
      <text class="add-text">新增科目</text>
    </view>
  </view>
</template>

<script>
import { ref, onMounted } from 'vue'
import { subjectApi } from '../../utils/api'

export default {
  setup() {
    const keyword = ref('')
    const subjectList = ref([])
    
    const loadData = async () => {
      try {
        uni.showLoading({ title: '加载中...' })
        const res = await subjectApi.page({ current: 1, size: 20, keyword: keyword.value })
        if (res.code === 200) {
          subjectList.value = res.data.records
        }
      } catch (e) {
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
    
    const addSubject = () => {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    }
    
    const editSubject = (item) => {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    }
    
    const deleteSubject = async (item) => {
      uni.showModal({
        title: '提示',
        content: `确定要删除科目 ${item.name} 吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await subjectApi.delete(item.id)
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
      loadData()
    })
    
    return {
      keyword,
      subjectList,
      loadData,
      addSubject,
      editSubject,
      deleteSubject
    }
  }
}
</script>

<style lang="scss">
@import "../../styles/manage.scss";
</style>