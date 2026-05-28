<template>
  <div class="question-manage">
    <div class="page-header">
      <h2>题库管理</h2>
      <p>管理考试题目，支持多种题型</p>
    </div>

    <div class="card">
      <div class="toolbar">
        <el-select v-model="params.subjectId" placeholder="选择科目" style="width: 180px" clearable @change="loadData">
          <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <el-select v-model="params.type" placeholder="题目类型" style="width: 160px" clearable @change="loadData">
          <el-option label="单选题" value="SINGLE_CHOICE" />
          <el-option label="多选题" value="MULTIPLE_CHOICE" />
          <el-option label="判断题" value="JUDGMENT" />
          <el-option label="填空题" value="FILL_BLANK" />
          <el-option label="简答题" value="ESSAY" />
          <el-option label="编程题" value="PROGRAMMING" />
        </el-select>
        <el-input v-model="params.keyword" placeholder="搜索题目内容" style="width: 200px" clearable @change="loadData" />
        <el-button type="danger" @click="loadData">搜索</el-button>
        <el-button type="danger" @click="handleCreate">新增题目</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="题目内容" show-overflow-tooltip />
        <el-table-column prop="usedCount" label="使用次数" width="100" />
        <el-table-column label="正确率" width="100">
          <template #default="{ row }">
            <span>{{ row.usedCount > 0 ? ((row.correctCount / row.usedCount) * 100).toFixed(1) + '%' : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑题目' : '新增题目'" width="800px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="科目" prop="subjectId">
          <el-select v-model="form.subjectId" style="width: 100%">
            <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="题目类型" prop="type">
          <el-select v-model="form.type" style="width: 100%" @change="handleTypeChange">
            <el-option label="单选题" value="SINGLE_CHOICE" />
            <el-option label="多选题" value="MULTIPLE_CHOICE" />
            <el-option label="判断题" value="JUDGMENT" />
            <el-option label="填空题" value="FILL_BLANK" />
            <el-option label="简答题" value="ESSAY" />
            <el-option label="编程题" value="PROGRAMMING" />
          </el-select>
        </el-form-item>

        <template v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(form.type)">
          <el-form-item label="选项数量" prop="optionCount">
            <el-select v-model="form.optionCount" style="width: 150px">
              <el-option label="2个选项" :value="2" />
              <el-option label="3个选项" :value="3" />
              <el-option label="4个选项" :value="4" />
              <el-option label="5个选项" :value="5" />
              <el-option label="6个选项" :value="6" />
            </el-select>
          </el-form-item>
        </template>

        <template v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'JUDGMENT'].includes(form.type)">
          <el-form-item label="题目内容" prop="content">
            <el-input v-model="form.content" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="选项" v-for="(option, index) in form.options" :key="index" :label="getOptionLabel(index)">
            <el-input v-model="option.content" :placeholder="'请输入' + getOptionLabel(index) + '选项内容'" />
          </el-form-item>
          <el-form-item label="正确答案" prop="answer">
            <el-select v-model="form.answer" :multiple="form.type === 'MULTIPLE_CHOICE'" style="width: 100%">
              <el-option v-for="(option, index) in form.options" :key="index" :label="getOptionLabel(index)" :value="getOptionLabel(index)" />
            </el-select>
          </el-form-item>
        </template>

        <template v-if="form.type === 'FILL_BLANK'">
          <el-form-item label="题目内容" prop="content">
            <el-input v-model="form.content" type="textarea" :rows="3" placeholder="输入题目内容，在需要填空的位置输入 $blank$" />
          </el-form-item>
          <div class="blank-toolbar">
            <el-button type="default" size="small" @click="insertBlank">插入填空标记</el-button>
            <span class="hint">点击按钮在光标位置插入 "$blank$" 作为填空标记</span>
          </div>
          <el-form-item label="正确答案" prop="answer">
            <el-input v-model="form.answer" placeholder="多个空用英文逗号分隔，如：答案1,答案2,答案3" />
          </el-form-item>
        </template>

        <template v-if="form.type === 'ESSAY'">
          <el-form-item label="题目内容" prop="content">
            <el-input v-model="form.content" type="textarea" :rows="5" />
          </el-form-item>
          <el-form-item label="参考答案" prop="answer">
            <el-input v-model="form.answer" type="textarea" :rows="3" />
          </el-form-item>
        </template>

        <template v-if="form.type === 'PROGRAMMING'">
          <el-form-item label="题目内容" prop="content">
            <el-input v-model="form.content" type="textarea" :rows="5" />
          </el-form-item>
          <el-form-item label="参考答案" prop="answer">
            <el-input v-model="form.answer" type="textarea" :rows="5" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { questionApi, subjectApi } from '../../utils/api'

const loading = ref(false)
const tableData = ref([])
const subjects = ref([])
const current = ref(1)
const size = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

const params = reactive({
  subjectId: null,
  type: '',
  keyword: ''
})

const form = reactive({
  id: null,
  subjectId: null,
  type: 'SINGLE_CHOICE',
  optionCount: 4,
  content: '',
  options: [],
  answer: ''
})

const rules = {
  subjectId: [{ required: true, message: '请选择科目', trigger: 'change' }],
  type: [{ required: true, message: '请选择题目类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入题目内容', trigger: 'blur' }],
  answer: [{ required: true, message: '请输入正确答案', trigger: 'blur' }]
}

const typeText = (type) => {
  const map = { SINGLE_CHOICE: '单选题', MULTIPLE_CHOICE: '多选题', JUDGMENT: '判断题', FILL_BLANK: '填空题', ESSAY: '简答题', PROGRAMMING: '编程题' }
  return map[type] || type
}

const getOptionLabel = (index) => {
  return String.fromCharCode(65 + index)
}

const initOptions = (count) => {
  form.options = []
  for (let i = 0; i < count; i++) {
    form.options.push({ key: getOptionLabel(i), content: '' })
  }
}

const handleTypeChange = () => {
  form.options = []
  form.answer = ''
  
  if (form.type === 'JUDGMENT') {
    form.options = [
      { key: 'A', content: '正确' },
      { key: 'B', content: '错误' }
    ]
    form.optionCount = 2
  } else if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(form.type)) {
    initOptions(form.optionCount)
  }
}

const insertBlank = () => {
  const textarea = document.querySelector('textarea.el-textarea__inner')
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = form.content
    form.content = value.substring(0, start) + '$blank$' + value.substring(end)
  } else {
    form.content += ' $blank$'
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await questionApi.page({ current: current.value, size: size.value, ...params })
    if (res.code === 200) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadSubjects = async () => {
  const res = await subjectApi.list()
  if (res.code === 200) subjects.value = res.data
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(form, { id: null, subjectId: null, type: 'SINGLE_CHOICE', optionCount: 4, content: '', options: [], answer: '' })
  initOptions(4)
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, { id: row.id, subjectId: row.subjectId, type: row.type, content: row.content })
  
  if (row.type === 'MULTIPLE_CHOICE' && row.answer && row.answer.includes(',')) {
    form.answer = row.answer.split(',')
  } else {
    form.answer = row.answer
  }
  
  if (row.options) {
    try {
      const options = typeof row.options === 'string' ? JSON.parse(row.options) : row.options
      form.options = Object.keys(options).map(key => ({ key, content: options[key] }))
      form.optionCount = form.options.length
    } catch {
      form.options = []
    }
  } else if (row.type === 'JUDGMENT') {
    form.options = [
      { key: 'A', content: '正确' },
      { key: 'B', content: '错误' }
    ]
    form.optionCount = 2
  } else {
    form.options = []
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  try {
    let answer = form.answer
    if (Array.isArray(answer)) {
      answer = answer.join(',')
    }
    
    const submitForm = {
      id: form.id,
      subjectId: form.subjectId,
      type: form.type,
      content: form.content,
      options: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'JUDGMENT'].includes(form.type) 
        ? JSON.stringify(Object.fromEntries(form.options.map(o => [o.key, o.content])))
        : null,
      answer: answer
    }
    
    const res = isEdit.value ? await questionApi.update(submitForm) : await questionApi.create(submitForm)
    if (res.code === 200) {
      ElMessage.success('操作成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定要删除该题目吗？')
  try {
    const res = await questionApi.delete(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadData()
    }
  } catch (e) {
    ElMessage.error(e.message)
  }
}

watch(() => form.optionCount, (newVal) => {
  if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(form.type)) {
    initOptions(newVal)
  }
})

onMounted(() => {
  loadData()
  loadSubjects()
  initOptions(4)
})
</script>

<style lang="scss" scoped>
.question-manage {
  max-width: 1400px;
}

.page-header {
  margin-bottom: 24px;
  
  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 8px;
  }
  
  p {
    font-size: 14px;
    color: #666;
  }
}

.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 24px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.blank-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  
  .hint {
    font-size: 12px;
    color: #999;
  }
}

:deep(.el-button--danger) {
  background: linear-gradient(135deg, #f25858 0%, #f85151 100%);
  border: none;
  color: #fff;
  
  &:hover, &:focus {
    background: linear-gradient(135deg, #f25858 0%, #dc2626 100%);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
  }
}

:deep(.el-button--danger.el-button--link) {
  background: transparent;
  color: #dc2626;
  
  &:hover {
    color: #ef4444;
    text-decoration: underline;
  }
}

:deep(.el-select__wrapper) {
  border-radius: 8px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-table) {
  --el-table-header-text-color: #0f172a;
  --el-table-row-hover-bg-color: rgba(220, 38, 38, 0.08);
}

:deep(.el-tag) {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  border: none;
  color: #fff;
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #ec6767 0%, #c05151 100%);
  padding: 16px 20px;
  
  .el-dialog__title {
    color: #fff;
    font-weight: 600;
  }
  
  .el-dialog__close {
    color: #fff;
    
    &:hover {
      color: rgba(255, 255, 255, 0.8);
    }
  }
}

:deep(.el-form-item__label) {
  color: #333;
  font-weight: 500;
}

:deep(.el-radio__inner) {
  border-color: #dc2626;
  
  &:checked {
    background: linear-gradient(135deg, #dc2626 0%, #ed4a4a 100%);
    border-color: transparent;
  }
}

:deep(.el-select-dropdown__item.selected) {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

:deep(.el-pagination.is-background .el-pager li:not(.disabled).active) {
  background: linear-gradient(135deg, #dc2626 0%, #ec4f4f 100%);
  border-color: transparent;
}
</style>