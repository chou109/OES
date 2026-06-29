<template>
  <div class="subject-manage">
    <div class="page-header">
      <h2>科目管理</h2>
      <p>管理考试科目</p>
    </div>

    <div class="card">
      <div class="toolbar">
        <div class="search-row">
          <el-input v-model="params.keyword" placeholder="搜索科目" style="width: 200px" clearable @change="loadData" />
          <el-button type="danger" @click="loadData">搜索</el-button>
        </div>
        <div class="action-row">
          <el-button type="danger" @click="handleCreate">新增科目</el-button>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="科目名称" />
        <el-table-column prop="code" label="科目代码" width="150" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="danger" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="current"
        v-model:page-size="size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadData"
        @current-change="loadData"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑科目' : '新增科目'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="科目名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="科目代码" prop="code">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { subjectApi } from '../../utils/api'

const loading = ref(false)
const tableData = ref([])
const current = ref(1)
const size = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

const params = reactive({ keyword: '' })
const form = reactive({ id: null, name: '', code: '', description: '' })
const rules = { name: [{ required: true, message: '请输入科目名称', trigger: 'blur' }] }

const loadData = async () => {
  loading.value = true
  try {
    const res = await subjectApi.page({ current: current.value, size: size.value, ...params })
    if (res.code === 200) { tableData.value = res.data.records; total.value = res.data.total }
  } catch (e) { console.error(e) } finally { loading.value = false }
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(form, { id: null, name: '', code: '', description: '' })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  try {
    const res = isEdit.value ? await subjectApi.update(form) : await subjectApi.create(form)
    if (res.code === 200) { ElMessage.success('操作成功'); dialogVisible.value = false; loadData() }
    else ElMessage.error(res.message)
  } catch (e) { ElMessage.error(e.message) }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定要删除该科目吗？')
  try {
    const res = await subjectApi.delete(row.id)
    if (res.code === 200) { ElMessage.success('删除成功'); loadData() }
  } catch (e) { ElMessage.error(e.message) }
}

onMounted(() => { loadData() })
</script>

<style lang="scss" scoped>
.subject-manage {
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

.card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.toolbar {
  margin-bottom: 20px;
}

.search-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  position: sticky;
  top: 24px;
  z-index: 100;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin: -20px -20px 20px;
}

.action-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

@media screen and (max-width: 768px) {
  .subject-manage {
    padding: 0 4px;
  }
  
  .page-header {
    padding: 0 4px;
    
    h2 {
      font-size: clamp(18px, 4vw, 24px);
    }
  }
  
  .card {
    padding: 14px;
    overflow-x: auto;
  }
  
  .search-row {
    margin: -14px -14px 16px;
    padding: 14px;
    flex-wrap: nowrap;

    .el-input {
      flex: 1;
      min-width: 0;
      width: auto !important;
    }

    .el-button {
      flex: 0 0 auto;
      white-space: nowrap;
    }
  }
  
  .action-row {
    flex-wrap: nowrap;
  }
}

@media screen and (max-width: 576px) {
  .card {
    padding: 12px;
  }
  
  .search-row {
    margin: -12px -12px 14px;
    padding: 12px;
  }
  
  .action-row {
    gap: 10px;
  }
}

@media screen and (max-width: 360px) {
  .card {
    padding: 10px;
  }
  
  .search-row {
    margin: -10px -10px 12px;
    padding: 10px;
  }
}
</style>
