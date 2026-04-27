<template>
  <div class="subject-manage">
    <div class="page-header">
      <h2>科目管理</h2>
      <p>管理考试科目</p>
    </div>

    <div class="card">
      <div class="toolbar">
        <el-input v-model="params.keyword" placeholder="搜索科目" style="width: 200px" clearable @change="loadData" />
        <el-button type="danger" @click="loadData">搜索</el-button>
        <el-button type="danger" @click="handleCreate">新增科目</el-button>
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
.subject-manage { max-width: 1200px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 20px; }
</style>
