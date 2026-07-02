<template>
  <view class="manage-page">
    <view class="page-header">
      <text class="title">院系管理</text>
    </view>
    
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input class="search-input" v-model="keyword" placeholder="搜索院系名称" />
      <button class="search-btn" @click="loadData">搜索</button>
    </view>
    
    <!-- 院系列表 -->
    <view class="dept-list">
      <view class="dept-item" v-for="dept in deptList" :key="dept.id">
        <view class="dept-info">
          <text class="dept-name">{{ dept.name }}</text>
          <text class="dept-code">{{ dept.code || '-' }}</text>
        </view>
        <view class="dept-actions">
          <text class="action-btn" @click="editDept(dept)">编辑</text>
          <text class="action-btn danger" @click="deleteDept(dept)">删除</text>
        </view>
      </view>
      
      <view class="empty" v-if="deptList.length === 0">
        <text class="empty-text">暂无院系数据</text>
      </view>
    </view>
    
    <!-- 新增按钮 -->
    <view class="add-btn" @click="addDept">
      <uni-icons type="plus" size="20" color="#fff" />
      <text class="add-text">新增院系</text>
    </view>
  </view>
</template>

<script>
import { ref, onMounted } from 'vue'
import { departmentApi } from '../../utils/api'

export default {
  setup() {
    const keyword = ref('')
    const deptList = ref([])
    
    const loadData = async () => {
      try {
        uni.showLoading({ title: '加载中...' })
        const res = await departmentApi.list()
        if (res.code === 200) {
          deptList.value = res.data
        }
      } catch (e) {
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
    
    const addDept = () => {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    }
    
    const editDept = (dept) => {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    }
    
    const deleteDept = async (dept) => {
      uni.showModal({
        title: '提示',
        content: `确定要删除院系 ${dept.name} 吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await departmentApi.delete(dept.id)
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
      deptList,
      loadData,
      addDept,
      editDept,
      deleteDept
    }
  }
}
</script>

<style lang="scss">
@import "../../styles/manage.scss";
</style>