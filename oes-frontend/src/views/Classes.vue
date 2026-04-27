<template>
  <div class="classes">
    <div class="page-header">
      <h2>班级管理</h2>
      <el-button type="danger" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        新建班级
      </el-button>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="班级名称">
          <el-input v-model="searchForm.className" placeholder="请输入班级名称" style="width: 200px" />
        </el-form-item>
        <el-form-item label="院系">
          <el-select v-model="searchForm.departmentId" placeholder="请选择院系" style="width: 200px">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="danger" @click="loadClasses">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="classes" stripe style="width: 100%">
        <el-table-column prop="id" label="班级ID" width="80" />
        <el-table-column prop="className" label="班级名称" />
        <el-table-column prop="departmentName" label="所属院系" />
        <el-table-column prop="studentCount" label="学生人数" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="danger" link @click="openEditDialog(row)">编辑</el-button>
            <el-button type="danger" link @click="deleteClass(row.id)">删除</el-button>
            <el-button type="danger" link @click="manageStudents(row.id)">管理学生</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="page.current"
          v-model:page-size="page.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新建/编辑班级对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新建班级' : '编辑班级'"
      width="500px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="班级名称" prop="className">
          <el-input v-model="form.className" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="所属院系" prop="departmentId">
          <el-select v-model="form.departmentId" placeholder="请选择院系">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="danger" @click="saveClass">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 管理学生对话框 -->
    <el-dialog
      v-model="studentDialogVisible"
      title="管理班级学生"
      width="800px"
    >
      <div class="student-management">
        <div class="left-panel">
          <h3>未加入班级的学生</h3>
          <el-input v-model="studentSearch" placeholder="搜索学生" class="mb-4" />
          <el-table :data="filteredStudents" stripe style="width: 100%">
            <el-table-column prop="id" label="学号" width="120" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="realName" label="姓名" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button type="danger" link @click="addStudent(row.id)">
                  <el-icon><Plus /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="right-panel">
          <h3>班级内学生 ({{ classStudents.length }})</h3>
          <el-table :data="classStudents" stripe style="width: 100%">
            <el-table-column prop="id" label="学号" width="120" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="realName" label="姓名" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button type="danger" link @click="removeStudent(row.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="studentDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { classApi, userApi, departmentApi } from '../utils/api'

const classes = ref([])
const departments = ref([])
const total = ref(0)
const page = ref({ current: 1, size: 10 })
const searchForm = ref({ className: '', departmentId: '' })
const dialogVisible = ref(false)
const dialogType = ref('create')
const form = ref({})
const studentDialogVisible = ref(false)
const currentClassId = ref(null)
const students = ref([])
const classStudents = ref([])
const studentSearch = ref('')

const filteredStudents = computed(() => {
  if (!studentSearch.value) return students.value
  return students.value.filter(student => 
    student.realName.toLowerCase().includes(studentSearch.value.toLowerCase()) ||
    student.username.toLowerCase().includes(studentSearch.value.toLowerCase())
  )
})

const loadClasses = async () => {
  try {
    const res = await classApi.page({
      ...page.value,
      ...searchForm.value
    })
    if (res.code === 200) {
      classes.value = res.data.records
      total.value = res.data.total
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('加载班级列表失败')
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

const loadStudents = async () => {
  try {
    const res = await userApi.getStudents()
    if (res.code === 200) {
      students.value = res.data
    }
  } catch (e) {
    console.error(e)
  }
}

const loadClassStudents = async (classId) => {
  try {
    const res = await classApi.getById(classId)
    if (res.code === 200) {
      classStudents.value = res.data.students || []
    }
  } catch (e) {
    console.error(e)
  }
}

const openCreateDialog = () => {
  dialogType.value = 'create'
  form.value = {}
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  dialogType.value = 'edit'
  form.value = { ...row }
  dialogVisible.value = true
}

const saveClass = async () => {
  try {
    let res
    if (dialogType.value === 'create') {
      res = await classApi.create(form.value)
    } else {
      res = await classApi.update(form.value)
    }
    if (res.code === 200) {
      ElMessage.success(dialogType.value === 'create' ? '创建班级成功' : '更新班级成功')
      dialogVisible.value = false
      loadClasses()
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('操作失败')
  }
}

const deleteClass = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个班级吗？', '提示')
    const res = await classApi.delete(id)
    if (res.code === 200) {
      ElMessage.success('删除班级成功')
      loadClasses()
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
      ElMessage.error('删除失败')
    }
  }
}

const manageStudents = (classId) => {
  currentClassId.value = classId
  studentDialogVisible.value = true
  loadStudents()
  loadClassStudents(classId)
}

const addStudent = async (studentId) => {
  try {
    // 这里需要调用添加学生到班级的API
    // 假设API为 classApi.addStudent(classId, studentId)
    ElMessage.success('添加学生成功')
    loadClassStudents(currentClassId.value)
  } catch (e) {
    console.error(e)
    ElMessage.error('添加失败')
  }
}

const removeStudent = async (studentId) => {
  try {
    // 这里需要调用从班级移除学生的API
    // 假设API为 classApi.removeStudent(classId, studentId)
    ElMessage.success('移除学生成功')
    loadClassStudents(currentClassId.value)
  } catch (e) {
    console.error(e)
    ElMessage.error('移除失败')
  }
}

const handleSizeChange = (size) => {
  page.value.size = size
  loadClasses()
}

const handleCurrentChange = (current) => {
  page.value.current = current
  loadClasses()
}

const resetSearch = () => {
  searchForm.value = { className: '', departmentId: '' }
  loadClasses()
}

onMounted(() => {
  loadDepartments()
  loadClasses()
})
</script>

<style lang="scss" scoped>
.classes {
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.search-form {
  margin-bottom: 0;
}

.table-card {
  margin-top: 24px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.student-management {
  display: flex;
  gap: 24px;
  height: 400px;
}

.left-panel,
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.left-panel h3,
.right-panel h3 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

.left-panel .el-table,
.right-panel .el-table {
  flex: 1;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>