<template>
  <div class="department-manage">
    <div class="page-header">
      <h2>院系管理</h2>
      <p>维护学校组织架构</p>
    </div>

    <div class="card">
      <div class="toolbar">
        <el-button type="danger" @click="handleCreate">新增院系</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe row-key="id" default-expand-all>
        <el-table-column prop="name" label="院系名称" />
        <el-table-column prop="code" label="院系代码" width="150" />
        <el-table-column prop="sortOrder" label="排序" width="100" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="danger" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑院系' : '新增院系'" width="400px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="院系名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="院系代码" prop="code">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
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
import { departmentApi } from '../../utils/api'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

const form = reactive({ id: null, name: '', code: '', sortOrder: 0 })
const rules = { name: [{ required: true, message: '请输入院系名称', trigger: 'blur' }] }

const loadData = async () => {
  loading.value = true
  try {
    const res = await departmentApi.tree()
    if (res.code === 200) tableData.value = res.data
  } catch (e) { console.error(e) } finally { loading.value = false }
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(form, { id: null, name: '', code: '', sortOrder: 0 })
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
    const res = isEdit.value ? await departmentApi.update(form) : await departmentApi.create(form)
    if (res.code === 200) { ElMessage.success('操作成功'); dialogVisible.value = false; loadData() }
    else ElMessage.error(res.message)
  } catch (e) { ElMessage.error(e.message) }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定要删除该院系吗？')
  try {
    const res = await departmentApi.delete(row.id)
    if (res.code === 200) { ElMessage.success('删除成功'); loadData() }
  } catch (e) { ElMessage.error(e.message) }
}

onMounted(() => { loadData() })
</script>

<style lang="scss" scoped>
.department-manage { max-width: 1000px; }
.toolbar { margin-bottom: 20px; }
</style>
