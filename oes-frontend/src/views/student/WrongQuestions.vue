<template>
  <div class="wrong-questions">
    <div class="page-header">
      <h2>错题本</h2>
      <p>自动收录所有答错的题目，支持反复练习</p>
    </div>

    <div class="card">
      <div class="toolbar">
        <el-select v-model="params.subjectId" placeholder="选择科目" style="width: 180px" clearable @change="loadData">
          <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <el-button type="danger" @click="loadData">搜索</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="content" label="题目内容" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="wrongAnswer" label="错误答案" width="120" />
        <el-table-column prop="correctAnswer" label="正确答案" width="120">
          <template #default="{ row }">
            <span style="color: #22c55e; font-weight: 500;">{{ row.correctAnswer }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="practicedCount" label="练习次数" width="100" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="danger" link @click="handlePractice(row)">练习</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="current"
        v-model:page-size="size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadData"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </div>

    <el-dialog v-model="practiceVisible" title="错题练习" width="600px">
      <div v-if="currentQuestion" class="practice-content">
        <div class="question-type">{{ typeText(currentQuestion.type) }}</div>
        <div class="question-text">{{ currentQuestion.content }}</div>

        <div class="question-options" v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'JUDGMENT'].includes(currentQuestion.type)">
          <el-radio-group v-if="currentQuestion.type === 'SINGLE_CHOICE'" v-model="practiceAnswer">
            <el-radio v-for="(label, key) in parseOptions(currentQuestion.options)" :key="key" :value="key">
              {{ key }}. {{ label }}
            </el-radio>
          </el-radio-group>
          <el-checkbox-group v-else-if="currentQuestion.type === 'MULTIPLE_CHOICE'" v-model="practiceMultiAnswers">
            <el-checkbox v-for="(label, key) in parseOptions(currentQuestion.options)" :key="key" :value="key">
              {{ key }}. {{ label }}
            </el-checkbox>
          </el-checkbox-group>
          <el-radio-group v-else-if="currentQuestion.type === 'JUDGMENT'" v-model="practiceAnswer">
            <el-radio value="A">正确</el-radio>
            <el-radio value="B">错误</el-radio>
          </el-radio-group>
        </div>

        <div class="question-input" v-else>
          <el-input v-model="practiceAnswer" type="textarea" :rows="4" placeholder="请输入答案" />
        </div>

        <div class="result-panel" v-if="showResult">
          <div :class="['result-badge', isCorrect ? 'correct' : 'wrong']">
            {{ isCorrect ? '回答正确' : '回答错误' }}
          </div>
          <div class="analysis" v-if="currentQuestion.analysis">
            <strong>解析：</strong>{{ currentQuestion.analysis }}
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="practiceVisible = false">关闭</el-button>
        <el-button type="danger" v-if="!showResult" @click="checkAnswer">提交答案</el-button>
        <el-button type="success" v-else @click="nextQuestion">下一题</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { wrongQuestionApi, subjectApi } from '../../utils/api'

const loading = ref(false)
const tableData = ref([])
const subjects = ref([])
const current = ref(1)
const size = ref(10)
const total = ref(0)
const params = reactive({ subjectId: null })

const practiceVisible = ref(false)
const currentQuestion = ref(null)
const practiceAnswer = ref('')
const practiceMultiAnswers = ref([])
const showResult = ref(false)
const isCorrect = ref(false)

const typeText = (type) => ({ SINGLE_CHOICE: '单选题', MULTIPLE_CHOICE: '多选题', JUDGMENT: '判断题', FILL_BLANK: '填空题', ESSAY: '简答题', PROGRAMMING: '编程题' }[type] || type)
const parseOptions = (options) => { try { return options ? JSON.parse(options) : {} } catch { return {} } }

const loadData = async () => {
  loading.value = true
  try {
    const res = await wrongQuestionApi.page({ current: current.value, size: size.value, ...params })
    if (res.code === 200) { tableData.value = res.data.records; total.value = res.data.total }
  } catch (e) { console.error(e) } finally { loading.value = false }
}

const loadSubjects = async () => {
  const res = await subjectApi.list()
  if (res.code === 200) subjects.value = res.data
}

const handlePractice = async (row) => {
  currentQuestion.value = row
  practiceAnswer.value = ''
  practiceMultiAnswers.value = []
  showResult.value = false
  practiceVisible.value = true

  await wrongQuestionApi.practice(row.id)
}

const checkAnswer = () => {
  let answer = practiceAnswer.value
  if (currentQuestion.value.type === 'MULTIPLE_CHOICE') {
    answer = practiceMultiAnswers.value.sort().join(',')
  }

  isCorrect.value = answer.toUpperCase() === currentQuestion.value.correctAnswer?.toUpperCase()
  showResult.value = true
}

const nextQuestion = () => {
  const currentIndex = tableData.value.findIndex(t => t.id === currentQuestion.value.id)
  if (currentIndex < tableData.value.length - 1) {
    handlePractice(tableData.value[currentIndex + 1])
  } else {
    ElMessage.success('已完成所有错题练习')
    practiceVisible.value = false
  }
}

onMounted(() => { loadData(); loadSubjects() })
</script>

<style lang="scss" scoped>
.wrong-questions { max-width: 1200px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 20px; }

.practice-content { padding: 20px 0; }
.question-type { background: #f1f5f9; padding: 4px 12px; border-radius: 6px; font-size: 13px; color: #64748b; display: inline-block; margin-bottom: 16px; }
.question-text { font-size: 16px; line-height: 1.8; color: #1e293b; margin-bottom: 24px; }
.question-options { display: flex; flex-direction: column; gap: 12px; }
.question-options :deep(.el-radio), .question-options :deep(.el-checkbox) { padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; width: 100%; margin-right: 0; }
.question-input { margin-bottom: 20px; }

.result-panel { margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 12px; }
.result-badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-bottom: 12px; }
.result-badge.correct { background: #dcfce7; color: #16a34a; }
.result-badge.wrong { background: #fee2e2; color: #dc2626; }
.analysis { font-size: 14px; color: #475569; line-height: 1.6; }
</style>
