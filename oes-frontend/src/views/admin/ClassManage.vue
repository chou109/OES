<template>
  <div class="class-manage">
    <div class="page-header">
      <h2>班级管理</h2>
      <p>维护班级信息</p>
    </div>

    <div class="card">
      <div class="toolbar">
        <el-select v-model="params.departmentId" placeholder="选择院系" style="width: 180px" clearable @change="loadData">
          <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
        </el-select>
        <el-input v-model="params.keyword" placeholder="搜索班级" style="width: 200px" clearable @change="loadData" />
        <el-button type="danger" @click="loadData">搜索</el-button>
        <el-button type="danger" @click="handleCreate">新增班级</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="班级名称" />
        <el-table-column prop="code" label="班级代码" width="150" />
        <el-table-column prop="departmentId" label="所属院系" width="180">
          <template #default="{ row }">
            {{ getDepartmentName(row.departmentId) }}
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" width="120" />
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑班级' : '新增班级'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="班级名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="班级代码" prop="code">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="所属院系" prop="departmentId">
          <el-select v-model="form.departmentId" style="width: 100%">
            <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-input v-model="form.grade" placeholder="如：2021" />
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
import { classApi, departmentApi } from '../../utils/api'

const loading = ref(false)
const tableData = ref([])
const departments = ref([])
const current = ref(1)
const size = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

const params = reactive({ departmentId: null, keyword: '' })
const form = reactive({ id: null, name: '', code: '', departmentId: null, grade: '' })
const rules = { name: [{ required: true, message: '请输入班级名称', trigger: 'blur' }] }

const getDepartmentName = (id) => departments.value.find(d => d.id === id)?.name || ''

const loadData = async () => {
  loading.value = true
  try {
    const res = await classApi.page({ current: current.value, size: size.value, ...params })
    if (res.code === 200) { tableData.value = res.data.records; total.value = res.data.total }
  } catch (e) { console.error(e) } finally { loading.value = false }
}

const loadDepartments = async () => {
  const res = await departmentApi.list()
  if (res.code === 200) departments.value = res.data
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(form, { id: null, name: '', code: '', departmentId: null, grade: '' })
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
    const res = isEdit.value ? await classApi.update(form) : await classApi.create(form)
    if (res.code === 200) { ElMessage.success('操作成功'); dialogVisible.value = false; loadData() }
    else ElMessage.error(res.message)
  } catch (e) { ElMessage.error(e.message) }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定要删除该班级吗？')
  try {
    const res = await classApi.delete(row.id)
    if (res.code === 200) { ElMessage.success('删除成功'); loadData() }
  } catch (e) { ElMessage.error(e.message) }
}

onMounted(() => { loadData(); loadDepartments() })
</script>

<style lang="scss" scoped>
.class-manage { max-width: 1200px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
</style>
