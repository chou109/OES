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
        <el-button type="success" @click="showGenerateDialog = true">自动组卷</el-button>
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

          <!-- 按题型批量设置分值 -->
          <div class="batch-score-setting" v-if="selectedQuestions.length > 0">
            <span class="setting-title">批量设置分值：</span>
            <el-select v-model="batchScoreType" placeholder="选择题型" style="width: 120px">
              <el-option label="单选题" value="SINGLE_CHOICE" />
              <el-option label="多选题" value="MULTIPLE_CHOICE" />
              <el-option label="判断题" value="JUDGMENT" />
              <el-option label="填空题" value="FILL_BLANK" />
              <el-option label="简答题" value="ESSAY" />
              <el-option label="编程题" value="PROGRAMMING" />
            </el-select>
            <el-input-number v-model="batchScoreValue" :min="1" :max="100" style="width: 100px" placeholder="分值" />
            <el-button type="primary" @click="applyBatchScore">应用到已选题目</el-button>
          </div>

          <el-table :data="questions" height="350" @selection-change="handleSelectionChange" ref="questionTableRef" v-loading="questionsLoading" row-key="id">
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

    <!-- 自动组卷对话框 -->
    <el-dialog v-model="showGenerateDialog" title="自动组卷" width="700px">
      <el-form ref="generateFormRef" :model="generateForm" label-width="120px">
        <el-form-item label="试卷标题" prop="title">
          <el-input v-model="generateForm.title" placeholder="请输入试卷标题" />
        </el-form-item>
        <el-form-item label="选择科目" prop="subjectId">
          <el-select v-model="generateForm.subjectId" style="width: 100%">
            <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="总分">
          <el-input v-model.number="generatedTotalScore" type="number" placeholder="自动计算" :disabled="true" />
        </el-form-item>
        <el-form-item label="时长(分钟)" prop="duration">
          <el-input v-model.number="generateForm.duration" type="number" placeholder="请输入考试时长" />
        </el-form-item>
        <el-form-item label="及格百分比" prop="passRate">
          <el-input v-model.number="generateForm.passRate" type="number" min="0" max="100" placeholder="请输入及格百分比" />
          <span style="margin-left: 10px">{{ generateForm.passRate }}%</span>
        </el-form-item>
        <el-form-item label="题目数量与分值">
          <div class="question-count-grid">
            <div class="count-item">
              <label>单选题</label>
              <div class="count-score-row">
                <el-input v-model.number="generateForm.questionCounts.SINGLE_CHOICE" type="number" min="0" placeholder="数量" />
                <span class="score-label">每题</span>
                <el-input v-model.number="generateForm.questionScores.SINGLE_CHOICE" type="number" min="1" max="100" placeholder="分值" />
                <span class="score-label">分</span>
              </div>
            </div>
            <div class="count-item">
              <label>多选题</label>
              <div class="count-score-row">
                <el-input v-model.number="generateForm.questionCounts.MULTIPLE_CHOICE" type="number" min="0" placeholder="数量" />
                <span class="score-label">每题</span>
                <el-input v-model.number="generateForm.questionScores.MULTIPLE_CHOICE" type="number" min="1" max="100" placeholder="分值" />
                <span class="score-label">分</span>
              </div>
            </div>
            <div class="count-item">
              <label>判断题</label>
              <div class="count-score-row">
                <el-input v-model.number="generateForm.questionCounts.JUDGMENT" type="number" min="0" placeholder="数量" />
                <span class="score-label">每题</span>
                <el-input v-model.number="generateForm.questionScores.JUDGMENT" type="number" min="1" max="100" placeholder="分值" />
                <span class="score-label">分</span>
              </div>
            </div>
            <div class="count-item">
              <label>填空题</label>
              <div class="count-score-row">
                <el-input v-model.number="generateForm.questionCounts.FILL_BLANK" type="number" min="0" placeholder="数量" />
                <span class="score-label">每题</span>
                <el-input v-model.number="generateForm.questionScores.FILL_BLANK" type="number" min="1" max="100" placeholder="分值" />
                <span class="score-label">分</span>
              </div>
            </div>
            <div class="count-item">
              <label>简答题</label>
              <div class="count-score-row">
                <el-input v-model.number="generateForm.questionCounts.ESSAY" type="number" min="0" placeholder="数量" />
                <span class="score-label">每题</span>
                <el-input v-model.number="generateForm.questionScores.ESSAY" type="number" min="1" max="100" placeholder="分值" />
                <span class="score-label">分</span>
              </div>
            </div>
          </div>
        </el-form-item>
        <el-form-item>
          <el-alert title="提示" type="warning" :closable="false">
            <p>系统将从题库中随机抽取指定数量的题目自动生成试卷</p>
            <p>如果题库中某题型数量不足，组卷将失败</p>
          </el-alert>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showGenerateDialog = false">取消</el-button>
        <el-button type="success" @click="handleGeneratePaper">生成试卷</el-button>
      </template>
    </el-dialog>

    <!-- 组卷结果对话框 -->
    <el-dialog v-model="showGenerateResult" title="组卷结果" width="500px">
      <div v-if="generateResult">
        <div class="result-summary">
          <div :class="['result-icon', generateResult.success ? 'success' : 'error']">
            <span>{{ generateResult.success ? '✓' : '✗' }}</span>
          </div>
          <div class="result-info">
            <p class="result-message">{{ generateResult.message }}</p>
            <div v-if="generateResult.success" class="result-stats">
              <span class="stat-item">题目数量：<strong>{{ generateResult.questionCount }}</strong></span>
              <span class="stat-item">总分：<strong>{{ generateResult.totalScore }}</strong></span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button v-if="!generateResult?.success" type="primary" @click="showGenerateResult = false">确定</el-button>
        <template v-else>
          <el-button @click="showGenerateResult = false; showGenerateDialog = false">关闭</el-button>
          <el-button type="success" @click="goToPaper(generateResult.paperId)">查看试卷</el-button>
        </template>
      </template>
    </el-dialog>

    <el-dialog v-model="previewDialogVisible" :title="'学生视角预览: ' + previewTitle" width="95%" top="10px">
      <div class="exam-preview-container">
        <!-- 试卷头部信息 -->
        <header class="exam-preview-header">
          <div class="header-left">
            <h2>{{ previewTitle }}</h2>
            <div class="exam-meta">
              <span class="meta-item">总分：{{ previewTotalScore }}分</span>
              <span class="meta-item">时长：{{ form.duration }}分钟</span>
              <span class="meta-item">及格分：{{ form.passScore }}分</span>
            </div>
          </div>
        </header>

        <div class="exam-preview-body">
          <!-- 左侧题目导航 -->
          <aside class="question-nav">
            <div class="nav-section" v-for="section in questionSections" :key="section.type">
              <div class="section-title">{{ section.typeName }} ({{ section.questions.length }}题)</div>
              <div class="question-grid">
                <div
                  v-for="(q, qIndex) in section.questions"
                  :key="q.id"
                  :class="['nav-question-item', { current: currentPreviewQuestion?.id === q.id }]"
                  @click="setCurrentPreviewQuestion(q)"
                >
                  {{ section.startIndex + qIndex + 1 }}
                </div>
              </div>
            </div>
            <div class="nav-legend">
              <div class="legend-item"><span class="dot current"></span>当前</div>
              <div class="legend-item"><span class="dot unanswered"></span>未答</div>
            </div>
          </aside>

          <!-- 右侧题目内容 -->
          <main class="question-content">
            <div v-if="currentPreviewQuestion" class="question-card">
              <div class="question-header">
                <div class="question-info">
                  <el-tag type="info">{{ getTypeName(currentPreviewQuestion.type) }}</el-tag>
                  <span class="question-score">{{ currentPreviewQuestion.score }}分</span>
                </div>
                <div class="question-number">第 {{ getCurrentQuestionNumber() }} 题</div>
              </div>

              <div class="question-text">{{ currentPreviewQuestion.content }}</div>

              <!-- 选择题/判断题 -->
              <div class="question-options" v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'JUDGMENT'].includes(currentPreviewQuestion.type)">
                <el-radio-group v-if="currentPreviewQuestion.type === 'SINGLE_CHOICE'" :disabled="true">
                  <el-radio v-for="(item, index) in parsePreviewOptions(currentPreviewQuestion)" :key="item.key" :value="item.key">
                    {{ item.key }}. {{ item.label }}
                  </el-radio>
                </el-radio-group>

                <el-checkbox-group v-else-if="currentPreviewQuestion.type === 'MULTIPLE_CHOICE'" :disabled="true">
                  <el-checkbox v-for="(item, index) in parsePreviewOptions(currentPreviewQuestion)" :key="item.key" :value="item.key">
                    {{ item.key }}. {{ item.label }}
                  </el-checkbox>
                </el-checkbox-group>

                <el-radio-group v-else-if="currentPreviewQuestion.type === 'JUDGMENT'" :disabled="true">
                  <el-radio v-for="(item, index) in parsePreviewOptions(currentPreviewQuestion)" :key="item.key" :value="item.key">
                    {{ item.label }}
                  </el-radio>
                </el-radio-group>
              </div>

              <!-- 填空题 -->
              <div class="question-input" v-else-if="currentPreviewQuestion.type === 'FILL_BLANK'">
                <el-input
                  type="textarea"
                  :rows="4"
                  placeholder="请输入答案"
                  disabled
                />
              </div>

              <!-- 简答题/编程题 -->
              <div class="question-input" v-else>
                <el-input
                  type="textarea"
                  :rows="8"
                  placeholder="请输入答案"
                  disabled
                />
              </div>

              <div class="question-actions">
                <el-button @click="prevPreviewQuestion" :disabled="isFirstPreviewQuestion">上一题</el-button>
                <span class="progress-text">{{ getCurrentQuestionNumber() }} / {{ previewQuestions.length }}</span>
                <el-button @click="nextPreviewQuestion" :disabled="isLastPreviewQuestion">下一题</el-button>
              </div>
            </div>

            <div v-else class="no-question">
              <el-empty description="暂无题目" />
            </div>
          </main>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
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
const currentPreviewQuestion = ref(null)
const selectedQuestions = ref([])
const questionTableRef = ref()
const questionScores = reactive({})

// 自动组卷相关
const showGenerateDialog = ref(false)
const showGenerateResult = ref(false)
const generateFormRef = ref()
const generateForm = reactive({
  title: '',
  subjectId: null,
  duration: 120,
  passRate: 60,
  questionCounts: {
    SINGLE_CHOICE: 10,
    MULTIPLE_CHOICE: 5,
    JUDGMENT: 5,
    FILL_BLANK: 5,
    ESSAY: 2
  },
  questionScores: {
    SINGLE_CHOICE: 5,
    MULTIPLE_CHOICE: 10,
    JUDGMENT: 5,
    FILL_BLANK: 10,
    ESSAY: 20
  }
})
const generateResult = ref(null)

const generatedTotalScore = computed(() => {
  let total = 0
  const types = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'JUDGMENT', 'FILL_BLANK', 'ESSAY']
  types.forEach(type => {
    const count = generateForm.questionCounts[type] || 0
    const score = generateForm.questionScores[type] || 0
    total += count * score
  })
  return total
})

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

const previewTotalScore = computed(() => {
  return previewQuestions.value.reduce((sum, q) => sum + (q.score || 0), 0)
})

const setCurrentPreviewQuestion = (q) => {
  currentPreviewQuestion.value = q
}

const getCurrentQuestionNumber = () => {
  if (!currentPreviewQuestion.value) return 0
  const index = previewQuestions.value.findIndex(q => q.id === currentPreviewQuestion.value.id)
  return index + 1
}

const prevPreviewQuestion = () => {
  const index = previewQuestions.value.findIndex(q => q.id === currentPreviewQuestion.value?.id)
  if (index > 0) {
    currentPreviewQuestion.value = previewQuestions.value[index - 1]
  }
}

const nextPreviewQuestion = () => {
  const index = previewQuestions.value.findIndex(q => q.id === currentPreviewQuestion.value?.id)
  if (index < previewQuestions.value.length - 1) {
    currentPreviewQuestion.value = previewQuestions.value[index + 1]
  }
}

const isFirstPreviewQuestion = computed(() => {
  if (!currentPreviewQuestion.value) return true
  const index = previewQuestions.value.findIndex(q => q.id === currentPreviewQuestion.value.id)
  return index === 0
})

const isLastPreviewQuestion = computed(() => {
  if (!currentPreviewQuestion.value) return true
  const index = previewQuestions.value.findIndex(q => q.id === currentPreviewQuestion.value.id)
  return index === previewQuestions.value.length - 1
})

const getTypeName = (type) => {
  return typeMap[type] || type
}

const parsePreviewOptions = (q) => {
  const options = parseOptions(q.options)
  return Object.entries(options).map(([key, label]) => ({ key, label }))
}

const parseOptions = (options) => {
  try {
    const parsed = JSON.parse(options)
    // 如果是数组格式，转换为对象格式
    if (Array.isArray(parsed)) {
      const result = {}
      parsed.forEach(item => {
        if (item.key && item.content) {
          result[item.key] = item.content
        }
      })
      return result
    }
    return parsed
  } catch {
    return {}
  }
}

const params = reactive({ subjectId: null, status: '', keyword: '' })
const searchKeyword = ref('')
const searchType = ref('')
const batchScoreType = ref('')
const batchScoreValue = ref(null)

// 维护一个独立的已选题ID集合（不依赖表格选择状态）
const selectedQuestionIds = ref(new Set())

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

const applyBatchScore = () => {
  if (!batchScoreType.value) {
    ElMessage.warning('请选择题型')
    return
  }
  if (!batchScoreValue.value) {
    ElMessage.warning('请输入分值')
    return
  }
  
  selectedQuestions.value.forEach(q => {
    if (q.type === batchScoreType.value) {
      questionScores[q.id] = batchScoreValue.value
    }
  })
  
  ElMessage.success('批量设置成功')
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
          // 确保分值是数字类型，处理字符串的情况
          const scoreValue = typeof q.score === 'string' ? parseInt(q.score, 10) : q.score
          questionScores[q.id] = scoreValue || 5
        }
      })
      
      // 等待表格渲染完成后设置勾选状态
      await nextTick()
      if (questionTableRef.value) {
        // 逐个设置勾选状态
        questions.value.forEach(q => {
          const isSelected = selectedQuestionIds.value.has(q.id)
          questionTableRef.value.toggleRowSelection(q, isSelected)
        })
      }
    }
  } catch (e) { console.error(e) } finally { questionsLoading.value = false }
}

const handleSubjectChange = () => {
  questions.value = []
  selectedQuestions.value = []
}

const handleSelectionChange = (selection) => {
  // 更新表格选中的题目
  selectedQuestions.value = selection
  
  // 更新独立的ID集合
  selection.forEach(q => selectedQuestionIds.value.add(q.id))
}

const clearSelection = () => {
  if (questionTableRef.value) {
    questionTableRef.value.clearSelection()
  }
  selectedQuestions.value = []
  selectedQuestionIds.value.clear()
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(form, { id: null, title: '', subjectId: null, totalScore: 100, passScore: 60, duration: 120, questionIds: [] })
  selectedQuestions.value = []
  selectedQuestionIds.value.clear()
  questions.value = []
  Object.keys(questionScores).forEach(key => delete questionScores[key])
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
  
  try {
    // 清空之前的选择
    selectedQuestionIds.value.clear()
    
    // 先获取已选题目
    const res = await paperApi.getQuestions(row.id)
    if (res.code === 200) {
      selectedQuestions.value = res.data
      
      // 初始化独立的ID集合和分值（确保转换为数字类型）
      res.data.forEach(q => {
        selectedQuestionIds.value.add(q.id)
        // 确保分值是数字类型，处理字符串的情况
        const scoreValue = typeof q.score === 'string' ? parseInt(q.score, 10) : q.score
        questionScores[q.id] = scoreValue || 5
      })
    }
    // 加载题目并自动勾选
    await loadQuestions()
  } catch (e) { console.error(e) }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  if (selectedQuestionIds.value.size === 0) {
    ElMessage.warning('请至少选择一道题目')
    return
  }

  // 使用独立的ID集合获取所有已选题目的ID
  const questionIds = Array.from(selectedQuestionIds.value)
  
  // 构建题目分值列表
  const questionScoreList = []
  
  // 先从当前表格中的已选题目获取分值
  selectedQuestions.value.forEach(q => {
    questionScoreList.push({
      questionId: q.id,
      score: questionScores[q.id] || q.score || 5
    })
  })
  
  // 补充不在当前表格中的已选题目（使用默认分值）
  selectedQuestionIds.value.forEach(id => {
    if (!selectedQuestions.value.some(q => q.id === id)) {
      questionScoreList.push({
        questionId: id,
        score: questionScores[id] || 5
      })
    }
  })

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
      currentPreviewQuestion.value = res.data[0] || null
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

// 自动组卷
const handleGeneratePaper = async () => {
  if (!generateForm.title.trim()) {
    ElMessage.warning('请输入试卷标题')
    return
  }
  if (!generateForm.subjectId) {
    ElMessage.warning('请选择科目')
    return
  }
  
  const totalCount = Object.values(generateForm.questionCounts).reduce((sum, count) => sum + (count || 0), 0)
  if (totalCount === 0) {
    ElMessage.warning('请至少选择一种题型')
    return
  }
  
  try {
    const totalScore = generatedTotalScore.value
    const passScore = Math.round(totalScore * (generateForm.passRate / 100))
    
    const res = await questionApi.generatePaper({
      title: generateForm.title,
      subjectId: generateForm.subjectId,
      totalScore: totalScore,
      duration: generateForm.duration,
      passScore: passScore,
      questionCountMap: generateForm.questionCounts,
      questionScoreMap: generateForm.questionScores
    })
    if (res.code === 200) {
      generateResult.value = res.data
      showGenerateResult.value = true
      if (res.data.success) {
        loadData()
      }
    }
  } catch (e) {
    ElMessage.error(e.message)
  }
}

// 跳转到试卷编辑页面
const goToPaper = async (paperId) => {
  showGenerateResult.value = false
  showGenerateDialog.value = false
  
  try {
    // 先获取试卷详情
    const res = await paperApi.getById(paperId)
    if (res.code === 200) {
      handleEdit(res.data)
    } else {
      ElMessage.error('获取试卷信息失败')
    }
  } catch (e) {
    ElMessage.error('获取试卷信息失败: ' + e.message)
  }
}

onMounted(() => { loadData(); loadSubjects() })
</script>

<style lang="scss" scoped>
.paper-manage {
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
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.question-selector { 
  border: 1px solid #e2e8f0; 
  border-radius: 12px; 
  padding: 16px; 
}

.selector-toolbar { 
  display: flex; 
  gap: 12px; 
  margin-bottom: 12px; 
  align-items: center; 
  flex-wrap: wrap; 
}

.batch-score-setting {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: #fef3c7;
  border-radius: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  
  .setting-title {
    font-size: clamp(13px, 2.8vw, 14px);
    color: #92400e;
    font-weight: 500;
  }
}

.subject-tip { 
  font-size: clamp(11px, 2.5vw, 12px); 
  color: #666; 
  background: #f0f0f0; 
  padding: 4px 12px; 
  border-radius: 4px; 
}

.selected-info { 
  margin-top: 12px; 
  padding: 12px; 
  background: #f8fafc; 
  border-radius: 8px; 
  font-size: clamp(13px, 2.8vw, 14px); 
  color: #475569; 
}

.info-row { 
  display: flex; 
  gap: 24px; 
  margin-bottom: 8px; 
  flex-wrap: wrap;
}

.type-stats { 
  display: flex; 
  gap: 16px; 
  flex-wrap: wrap; 
  font-size: clamp(11px, 2.5vw, 12px); 
  color: #666; 
}

.empty-hint { 
  padding: 40px; 
  text-align: center; 
}

/* 学生视角预览样式 */
.exam-preview-container {
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.exam-preview-header {
  height: 64px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.exam-preview-header .header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exam-preview-header .header-left h2 {
  font-size: clamp(16px, 3vw, 18px);
  font-weight: 600;
  margin: 0;
}

.exam-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.exam-meta .meta-item {
  font-size: clamp(12px, 2.5vw, 13px);
  color: #64748b;
}

.exam-preview-body {
  display: flex;
  flex: 1;
  padding: 20px;
  gap: 20px;
}

.exam-preview-body .question-nav {
  width: 240px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  height: fit-content;
  position: sticky;
  top: 88px;
  max-height: calc(100vh - 150px);
  overflow-y: auto;
  flex-shrink: 0;
}

.exam-preview-body .nav-section {
  margin-bottom: 16px;
}

.exam-preview-body .nav-section .section-title {
  font-size: clamp(12px, 2.5vw, 13px);
  font-weight: 600;
  color: #475569;
  margin-bottom: 10px;
}

.exam-preview-body .question-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.exam-preview-body .nav-question-item {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: #f1f5f9;
  color: #64748b;
  transition: all 0.2s;
}

.exam-preview-body .nav-question-item:hover {
  background: #e2e8f0;
}

.exam-preview-body .nav-question-item.current {
  background: #ef4444;
  color: white;
}

.exam-preview-body .nav-legend {
  display: flex;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.exam-preview-body .legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: clamp(11px, 2.5vw, 12px);
  color: #64748b;
}

.exam-preview-body .legend-item .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #cbd5e1;
}

.exam-preview-body .legend-item .dot.current {
  background: #ef4444;
}

.exam-preview-body .legend-item .dot.unanswered {
  background: #cbd5e1;
}

.exam-preview-body .question-content {
  flex: 1;
  min-width: 0;
}

.exam-preview-body .question-card {
  background: white;
  border-radius: 12px;
  padding: 28px;
}

.exam-preview-body .question-card .question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.exam-preview-body .question-card .question-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.exam-preview-body .question-card .question-score {
  font-size: clamp(13px, 2.8vw, 14px);
  color: #ef4444;
  font-weight: 600;
}

.exam-preview-body .question-card .question-number {
  font-size: clamp(13px, 2.8vw, 14px);
  color: #64748b;
}

.exam-preview-body .question-card .question-text {
  font-size: clamp(14px, 3vw, 16px);
  line-height: 1.8;
  color: #1e293b;
  margin-bottom: 24px;
  white-space: pre-wrap;
}

.exam-preview-body .question-card .question-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exam-preview-body .question-card .question-input {
  margin-top: 16px;
}

.exam-preview-body .question-card .question-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.exam-preview-body .question-card .question-actions .progress-text {
  font-size: clamp(13px, 2.8vw, 14px);
  color: #64748b;
}

/* 自动组卷相关样式 */
.result-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  
  .result-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: #fff;
    
    &.success {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    }
    
    &.error {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }
  }
  
  .result-info {
    flex: 1;
    
    .result-message {
      font-size: clamp(14px, 3vw, 16px);
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 12px 0;
    }
    
    .result-stats {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      
      .stat-item {
        font-size: clamp(13px, 2.8vw, 14px);
        color: #666;
        
        strong {
          color: #ef4444;
          margin-left: 4px;
        }
      }
    }
  }
}

.question-count-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  
  .count-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    label {
      font-size: clamp(13px, 2.8vw, 14px);
      color: #333;
      font-weight: 500;
    }
    
    .count-score-row {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .el-input {
        width: 80px;
      }
      
      .score-label {
        font-size: clamp(12px, 2.5vw, 14px);
        color: #666;
      }
    }
    
    :deep(.el-input__wrapper) {
      width: 100%;
    }
  }
}

/* 响应式布局 */
@media screen and (max-width: 992px) {
  .card {
    padding: 16px;
    overflow-x: auto;
  }
  
  .toolbar {
    gap: 10px;
  }
  
  .exam-preview-body {
    flex-direction: column;
  }
  
  .exam-preview-body .question-nav {
    width: 100%;
    position: static;
    max-height: none;
  }
  
  .exam-preview-body .question-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}

@media screen and (max-width: 768px) {
  .paper-manage {
    padding: 0 4px;
  }
  
  .page-header {
    padding: 0 4px;
  }
  
  .card {
    padding: 14px;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .toolbar .el-select,
  .toolbar .el-input {
    width: 100%;
  }
  
  .selector-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .selector-toolbar .el-select,
  .selector-toolbar .el-input {
    width: 100%;
  }
  
  .batch-score-setting {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .batch-score-setting .el-select,
  .batch-score-setting .el-input-number {
    width: 100%;
  }
  
  .info-row {
    gap: 16px;
  }
  
  .question-count-grid {
    grid-template-columns: 1fr;
  }
  
  .exam-preview-header {
    padding: 0 16px;
    height: 56px;
  }
  
  .exam-preview-body {
    padding: 12px;
    gap: 12px;
  }
  
  .exam-preview-body .question-card {
    padding: 16px;
  }
  
  .exam-preview-body .question-card .question-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media screen and (max-width: 576px) {
  .card {
    padding: 12px;
  }
  
  .question-selector {
    padding: 12px;
  }
  
  .exam-preview-body .question-grid {
    grid-template-columns: repeat(6, 1fr);
  }
  
  .exam-preview-body .nav-question-item {
    width: 28px;
    height: 28px;
    font-size: 11px;
  }
  
  .exam-preview-body .question-card {
    padding: 12px;
  }
  
  .exam-preview-body .question-card .question-text {
    margin-bottom: 16px;
  }
  
  .exam-preview-body .question-card .question-actions {
    margin-top: 16px;
    padding-top: 16px;
  }
}

@media screen and (max-width: 360px) {
  .card {
    padding: 10px;
  }
  
  .question-selector {
    padding: 10px;
  }
  
  .exam-preview-header {
    padding: 0 12px;
  }
  
  .exam-preview-body .question-grid {
    grid-template-columns: repeat(5, 1fr);
  }
  
  .exam-preview-body .question-card {
    padding: 10px;
  }
}
</style>