<template>
  <view class="manage-page">
    <view class="page-header">
      <text class="title">班级管理</text>
    </view>
    
    <!-- 搜索栏 -->
    <view class="search-bar">
      <picker mode="selector" :range="departments" range-key="name" @change="onDeptChange">
        <view class="picker">
          <text class="picker-text">{{ selectedDeptName || '选择院系' }}</text>
        </view>
      </picker>
      <input class="search-input" v-model="keyword" placeholder="搜索班级名称" />
      <button class="search-btn" @click="loadData">搜索</button>
    </view>
    
    <!-- 班级列表 -->
    <view class="list">
      <view class="list-item" v-for="item in classList" :key="item.id">
        <view class="item-info">
          <text class="item-title">{{ item.className }}</text>
          <text class="item-meta">群号: {{ item.inviteCode || '-' }} | {{ getDeptName(item.departmentId) }}</text>
        </view>
        <view class="item-actions">
          <text class="action-btn" @click="editClass(item)">编辑</text>
          <text class="action-btn danger" @click="deleteClass(item)">删除</text>
        </view>
      </view>
      
      <view class="empty" v-if="classList.length === 0">
        <text class="empty-text">暂无班级数据</text>
      </view>
    </view>
    
    <!-- 新增按钮 -->
    <view class="add-btn" @click="addClass">
      <uni-icons type="plus" size="20" color="#fff" />
      <text class="add-text">新增班级</text>
    </view>
  </view>
</template>

<script>
import { ref, onMounted } from 'vue'
import { classApi, departmentApi } from '../../utils/api'

export default {
  setup() {
    const keyword = ref('')
    const classList = ref([])
    const departments = ref([])
    const selectedDeptId = ref(null)
    
    const selectedDeptName = computed(() => {
      const dept = departments.value.find(d => d.id === selectedDeptId.value)
      return dept?.name || ''
    })
    
    const getDeptName = (id) => {
      const dept = departments.value.find(d => d.id === id)
      return dept?.name || '-'
    }
    
    const onDeptChange = (e) => {
      const index = e.detail.value
      if (departments.value[index]) {
        selectedDeptId.value = departments.value[index].id
      }
    }
    
    const loadData = async () => {
      try {
        uni.showLoading({ title: '加载中...' })
        const res = await classApi.page({
          current: 1,
          size: 20,
          keyword: keyword.value,
          departmentId: selectedDeptId.value
        })
        if (res.code === 200) {
          classList.value = res.data.records
        }
      } catch (e) {
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
    
    const loadDepartments = async () => {
      try {
        const res = await departmentApi.list()
        if (res.code === 200) {
          departments.value = res.data
        }
      } catch (e) {
        console.error(e)
      }
    }
    
    const addClass = () => {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    }
    
    const editClass = (item) => {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    }
    
    const deleteClass = async (item) => {
      uni.showModal({
        title: '提示',
        content: `确定要删除班级 ${item.className} 吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await classApi.delete(item.id)
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
      loadDepartments()
      loadData()
    })
    
    return {
      keyword,
      classList,
      departments,
      selectedDeptName,
      getDeptName,
      onDeptChange,
      loadData,
      addClass,
      editClass,
      deleteClass
    }
  }
}
</script>

<style lang="scss">
@import "../../styles/manage.scss";

.picker {
  padding: 16rpx 24rpx;
  background: #fff;
  border-radius: 12rpx;
  
  .picker-text {
    font-size: 28rpx;
    color: #333;
  }
}
</style>