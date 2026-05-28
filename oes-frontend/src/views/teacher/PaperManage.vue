<template>
  <div class="paper-manage">
    <div class="page-header">
      <h2>试卷管理</h2>
      <p>创建和管理考试试卷，支持手动组卷和自动组卷</p>
    </div>

    <div class="card">
      <div class="toolbar">
        <el-select v-model="params.subjectId" placeholder="选择科目" style="width: 180px" clearable @change="loadData">
          <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <el-select v-model="params.status" placeholder="状态" style="width: 120px" clearable @change="loadData">
          <el-option label="草稿" value="DRAFT" />
          <el-option label="已发布" value="PUBLISHED" />
        </el-select>
        <el-input v-model="params.keyword" placeholder="搜索试卷标题" style="width: 200px" clearable @change="loadData" />
        <el-button type="danger" @click="loadData">搜索</el-button>
        <el-button type="danger" @click="handleCreate">创建试卷</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="试卷标题" show-overflow-tooltip />
        <el-table-column prop="subjectId" label="科目" width="150">
          <template #default="{ row }">
            {{ getSubjectName(row.subjectId) }}
          </template>
        </el-table-column>
        <el-table-column prop="questionCount" label="题数" width="80" />
        <el-table-column prop="totalScore" label="总分" width="80" />
        <el-table-column prop="passScore" label="及格分" width="80" />
        <el-table-column prop="duration" label="时长(分钟)" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'PUBLISHED' ? 'success' : 'info'">
              {{ row.status === 'PUBLISHED' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handlePreview(row)">预览</el-button>
            <el-button type="danger" link v-if="row.status === 'DRAFT'" @click="handlePublish(row)">发布</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑试卷' : '创建试卷'" width="900px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="试卷标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入试卷标题" />
        </el-form-item>
        <el-form-item label="科目" prop="subjectId">
          <el-select v-model="form.subjectId" style="width: 100%" @change="handleSubjectChange">
            <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="总分">
              <el-input-number v-model="form.totalScore" :min="0" :max="200" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="及格分数">
              <el-input-number v-model="form.passScore" :min="0" :max="form.totalScore" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="时长(分钟)">
              <el-input-number v-model="form.duration" :min="1" :max="300" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">题目设置</el-divider>

        <div v-if="form.subjectId" class="question-selector">
          <div class="selector-toolbar">
            <el-input v-model="searchKeyword" placeholder="搜索题目" style="width: 200px" clearable />
            <el-select v-model="searchType" placeholder="题目类型" style="width: 140px" clearable>
              <el-option label="单选题" value="SINGLE_CHOICE" />
              <el-option label="多选题" value="MULTIPLE_CHOICE" />
              <el-option label="判断题" value="JUDGMENT" />
              <el-option label="填空题" value="FILL_BLANK" />
              <el-option label="简答题" value="ESSAY" />
              <el-option label="编程题" value="PROGRAMMING" />
            </el-select>
            <el-button type="danger" @click="loadQuestions">搜索题目</el-button>
            <el-button @click="clearSelection">清空选择</el-button>
            <span class="subject-tip">当前科目：{{ getSubjectName(form.subjectId) }}</span>
          </div>

          <el-table :data="questions" height="350" @selection-change="handleSelectionChange" ref="questionTableRef" v-loading="questionsLoading">
            <el-table-column type="selection" width="55" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ typeText(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="题目内容" show-overflow-tooltip />
            <el-table-column prop="difficulty" label="难度" width="70">
              <template #default="{ row }">
                <el-tag size="small" :type="difficultyType(row.difficulty)">{{ difficultyText(row.difficulty) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="设置分值" width="120">
              <template #default="{ row }">
                <el-input-number 
                  :model-value="questionScores[row.id] || 5"
                  :min="1" 
                  :max="100" 
                  :disabled="!isSelected(row.id)"
                  @update:model-value="updateScore(row.id, $event)"
                />
              </template>
            </el-table-column>
          </el-table>

          <div class="selected-info">
            <div class="info-row">
              <span>已选择 {{ selectedQuestions.length }} 题</span>
              <span>总分 {{ totalSelectedScore }}</span>
            </div>
            <div v-if="selectedQuestions.length > 0" class="type-stats">
              <span v-for="(stat, type) in typeStatistics" :key="type">
                {{ typeText(type) }}: {{ stat.count }}题 / {{ stat.score }}分
              </span>
            </div>
          </div>
        </div>

        <div v-else class="empty-hint">
          <el-empty description="请先选择科目，才能添加题目" />
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="previewDialogVisible" :title="'预览: ' + previewTitle" width="800px">
      <div class="preview-container">
        <div v-for="(section, sIndex) in questionSections" :key="section.type" class="preview-section">
          <div class="section-header">{{ section.typeName }}</div>
          <div v-for="(q, qIndex) in section.questions" :key="q.id" class="preview-question">
            <div class="question-header">
              <span class="question-number">{{ section.startIndex + qIndex + 1 }}.</span>
              <span class="question-content">{{ q.content }}</span>
              <span class="question-score">{{ q.score }}分</span>
            </div>
            <div class="question-options" v-if="q.options">
              <div v-for="(label, key) in parseOptions(q.options)" :key="key" class="option-item">
                {{ key }}. {{ label }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElEmpty } from 'element-plus'
import { paperApi, subjectApi, questionApi } from '../../utils/api'

const loading = ref(false)
const questionsLoading = ref(false)
const tableData = ref([])
const subjects = ref([])
const current = ref(1)
const size = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const previewDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const questions = ref([])
const previewQuestions = ref([])
const previewTitle = ref('')
const selectedQuestions = ref([])
const questionTableRef = ref()
const questionScores = reactive({})

const typeMap = {
  SINGLE_CHOICE: '单选题',
  MULTIPLE_CHOICE: '多选题',
  JUDGMENT: '判断题',
  FILL_BLANK: '填空题',
  ESSAY: '简答题',
  PROGRAMMING: '编程题'
}

const questionSections = computed(() => {
  const sections = []
  const typeOrder = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'JUDGMENT', 'FILL_BLANK', 'ESSAY', 'PROGRAMMING']
  let globalIndex = 0
  
  for (const type of typeOrder) {
    const typeQuestions = previewQuestions.value.filter(q => q.type === type)
    if (typeQuestions.length > 0) {
      sections.push({
        type,
        typeName: typeMap[type] || type,
        questions: typeQuestions,
        startIndex: globalIndex
      })
      globalIndex += typeQuestions.length
    }
  }
  return sections
})

const parseOptions = (options) => {
  try { return options ? JSON.parse(options) : {} } catch { return {} }
}

const params = reactive({ subjectId: null, status: '', keyword: '' })
const searchKeyword = ref('')
const searchType = ref('')

const form = reactive({
  id: null,
  title: '',
  subjectId: null,
  totalScore: 100,
  passScore: 60,
  duration: 120,
  questionIds: []
})

const rules = {
  title: [{ required: true, message: '请输入试卷标题', trigger: 'blur' }],
  subjectId: [{ required: true, message: '请选择科目', trigger: 'change' }]
}

const totalSelectedScore = computed(() => {
  return selectedQuestions.value.reduce((sum, q) => {
    const score = questionScores[q.id] || q.score || 5
    return sum + score
  }, 0)
})

const typeStatistics = computed(() => {
  const stats = {}
  selectedQuestions.value.forEach(q => {
    const type = q.type
    if (!stats[type]) {
      stats[type] = { count: 0, score: 0 }
    }
    stats[type].count++
    stats[type].score += questionScores[q.id] || q.score || 5
  })
  return stats
})

const typeText = (type) => ({ SINGLE_CHOICE: '单选', MULTIPLE_CHOICE: '多选', JUDGMENT: '判断', FILL_BLANK: '填空', ESSAY: '简答', PROGRAMMING: '编程' }[type] || type)
const difficultyType = (d) => ({ EASY: 'success', MEDIUM: 'warning', HARD: 'danger' }[d])
const difficultyText = (d) => ({ EASY: '简单', MEDIUM: '中等', HARD: '困难' }[d])

const getSubjectName = (id) => subjects.value.find(s => s.id === id)?.name || ''

const updateScore = (id, score) => {
  questionScores[id] = score
}

const isSelected = (id) => {
  return selectedQuestions.value.some(q => q.id === id)
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await paperApi.page({ current: current.value, size: size.value, ...params })
    if (res.code === 200) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (e) { console.error(e) } finally { loading.value = false }
}

const loadSubjects = async () => {
  const res = await subjectApi.list()
  if (res.code === 200) subjects.value = res.data
}

const loadQuestions = async () => {
  if (!form.subjectId) {
    ElMessage.warning('请先选择科目')
    return
  }
  questionsLoading.value = true
  try {
    const res = await questionApi.list({ 
      subjectId: form.subjectId, 
      type: searchType.value, 
      keyword: searchKeyword.value, 
      count: 100 
    })
    if (res.code === 200) {
      questions.value = res.data
      res.data.forEach(q => {
        if (questionScores[q.id] === undefined) {
          questionScores[q.id] = q.score || 5
        }
      })
    }
  } catch (e) { console.error(e) } finally { questionsLoading.value = false }
}

const handleSubjectChange = () => {
  questions.value = []
  selectedQuestions.value = []
}

const handleSelectionChange = (selection) => {
  selectedQuestions.value = selection
}

const clearSelection = () => {
  if (questionTableRef.value) {
    questionTableRef.value.clearSelection()
  }
  selectedQuestions.value = []
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(form, { id: null, title: '', subjectId: null, totalScore: 100, passScore: 60, duration: 120, questionIds: [] })
  selectedQuestions.value = []
  questions.value = []
  Object.keys(questionScores).forEach(key => delete questionScores[key])
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  isEdit.value = true
  Object.assign(form, row)
  try {
    const res = await paperApi.getQuestions(row.id)
    if (res.code === 200) {
      selectedQuestions.value = res.data
      res.data.forEach(q => {
        questionScores[q.id] = q.score || 5
      })
    }
    await loadQuestions()
  } catch (e) { console.error(e) }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  if (selectedQuestions.value.length === 0) {
    ElMessage.warning('请至少选择一道题目')
    return
  }

  const questionIds = selectedQuestions.value.map(q => q.id)
  
  const questionScoreList = selectedQuestions.value.map(q => ({
    questionId: q.id,
    score: questionScores[q.id] || q.score || 5
  }))

  // 将 reactive 对象转换为普通对象
  const paperData = {
    id: form.id,
    title: form.title,
    subjectId: form.subjectId,
    totalScore: form.totalScore,
    passScore: form.passScore,
    duration: form.duration,
    status: form.status
  }

  const requestData = {
    paper: paperData,
    questionIds: questionIds,
    questionScores: questionScoreList
  }

  try {
    const res = isEdit.value 
      ? await paperApi.update(requestData) 
      : await paperApi.create(requestData)
    if (res.code === 200) {
      ElMessage.success('操作成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) { ElMessage.error(e.message) }
}

const handlePreview = async (row) => {
  try {
    const res = await paperApi.getQuestions(row.id)
    if (res.code === 200) {
      previewQuestions.value = res.data
      previewTitle.value = row.title
      previewDialogVisible.value = true
    }
  } catch (e) { console.error(e) }
}

const handlePublish = async (row) => {
  await ElMessageBox.confirm('确定要发布该试卷吗？')
  try {
    const res = await paperApi.publish(row.id)
    if (res.code === 200) {
      ElMessage.success('发布成功')
      loadData()
    }
  } catch (e) { ElMessage.error(e.message) }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定要删除该试卷吗？')
  try {
    const res = await paperApi.delete(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadData()
    }
  } catch (e) { ElMessage.error(e.message) }
}

onMounted(() => { loadData(); loadSubjects() })
</script>

<style lang="scss" scoped>
.paper-manage { max-width: 1400px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.question-selector { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
.selector-toolbar { display: flex; gap: 12px; margin-bottom: 12px; align-items: center; flex-wrap: wrap; }
.subject-tip { font-size: 12px; color: #666; background: #f0f0f0; padding: 4px 12px; border-radius: 4px; }
.selected-info { 
  margin-top: 12px; 
  padding: 12px; 
  background: #f8fafc; 
  border-radius: 8px; 
  font-size: 14px; 
  color: #475569; 
}
.info-row { display: flex; gap: 24px; margin-bottom: 8px; }
.type-stats { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: #666; }
.empty-hint { padding: 40px; text-align: center; }
.preview-container { max-height: 60vh; overflow-y: auto; }
.preview-section { margin-bottom: 24px; }
.preview-section .section-header { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #ef4444; }
.preview-question { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
.preview-question .question-header { display: flex; gap: 8px; margin-bottom: 8px; }
.preview-question .question-number { font-weight: 600; color: #ef4444; }
.preview-question .question-content { flex: 1; color: #1e293b; line-height: 1.6; }
.preview-question .question-score { color: #ef4444; font-weight: 500; white-space: nowrap; }
.preview-question .question-options { padding-left: 24px; }
.preview-question .option-item { padding: 6px 0; color: #475569; line-height: 1.5; }
</style>