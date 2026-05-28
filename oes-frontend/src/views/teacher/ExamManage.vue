<template>
  <div class="exam-manage">
    <div class="page-header">
      <h2>考试管理</h2>
      <p>发布和管理考试，监控考生状态</p>
    </div>

    <div class="card">
      <div class="toolbar">
        <el-select v-model="params.subjectId" placeholder="选择科目" style="width: 180px" clearable @change="loadData">
          <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <el-select v-model="params.status" placeholder="状态" style="width: 120px" clearable @change="loadData">
          <el-option label="待开始" value="PENDING" />
          <el-option label="进行中" value="ONGOING" />
          <el-option label="已结束" value="FINISHED" />
        </el-select>
        <el-input v-model="params.keyword" placeholder="搜索考试标题" style="width: 200px" clearable @change="loadData" />
        <el-button type="danger" @click="loadData">搜索</el-button>
        <el-button type="danger" @click="handleCreate">发布考试</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="考试标题" show-overflow-tooltip />
        <el-table-column prop="subjectId" label="科目" width="150">
          <template #default="{ row }">
            {{ getSubjectName(row.subjectId) }}
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.startTime) }}</template>
        </el-table-column>
        <el-table-column label="结束时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.endTime) }}</template>
        </el-table-column>
        <el-table-column prop="duration" label="时长" width="80" />
        <el-table-column prop="totalScore" label="总分" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link @click="handleMonitor(row)">监控</el-button>
            <el-button type="danger" link v-if="row.status === 'PENDING'" @click="handleStart(row)">开始</el-button>
            <el-button type="danger" link v-if="row.status === 'ONGOING'" @click="handleExtend(row)">延时</el-button>
            <el-button type="danger" link v-if="row.status === 'ONGOING'" @click="handleFinish(row)">结束</el-button>
            <el-button type="danger" link @click="handleStats(row)">统计</el-button>
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

    <el-dialog v-model="dialogVisible" title="发布考试" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="考试标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="选择试卷" prop="paperId">
          <el-select v-model="form.paperId" style="width: 100%" @change="onPaperChange">
            <el-option v-for="p in papers" :key="p.id" :label="p.title" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择班级" prop="classIds" :rules="[{ required: true, message: '请选择至少一个班级', trigger: 'change' }]">
          <el-select v-model="form.classIds" multiple placeholder="选择发布班级" style="width: 100%">
            <el-option v-for="c in classes" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间">
              <el-date-picker v-model="form.startTime" type="datetime" placeholder="选择开始时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间">
              <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择结束时间" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="考试时长">
              <el-input-number v-model="form.duration" :min="1" :max="300" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="及格比例">
              <el-input-number v-model="form.passRate" :min="0" :max="100" style="width: 100%" />
              <span style="margin-left: 8px; color: #909399">%</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider>防作弊设置</el-divider>
        <el-form-item label="题目乱序">
          <el-switch v-model="form.config.shuffleQuestions" />
        </el-form-item>
        <el-form-item label="选项乱序">
          <el-switch v-model="form.config.shuffleOptions" />
        </el-form-item>
        <el-form-item label="离开检测">
          <el-switch v-model="form.config.leaveDetection" />
        </el-form-item>
        <el-form-item label="离开次数上限" v-if="form.config.leaveDetection">
          <el-input-number v-model="form.config.maxLeaveCount" :min="1" :max="10" style="width: 100%" />
          <span style="margin-left: 8px; color: #909399">次，超过将自动收卷</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleSubmit">发布</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="monitorVisible" title="考试监控" width="900px">
      <el-row :gutter="20" class="monitor-stats">
        <el-col :span="6">
          <div class="stat-item">
            <span class="label">总考生</span>
            <span class="value">{{ monitorStats.totalStudents }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <span class="label">已交卷</span>
            <span class="value">{{ monitorStats.submitted }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <span class="label">进行中</span>
            <span class="value">{{ monitorStats.ongoing }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <span class="label">可疑试卷</span>
            <span class="value warning">{{ monitorStats.suspicious }}</span>
          </div>
        </el-col>
      </el-row>
      <el-table :data="monitorRecords" size="small">
        <el-table-column prop="studentName" label="学生" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'SUBMITTED' ? 'success' : row.status === 'ONGOING' ? 'warning' : 'info'">
              {{ row.status === 'SUBMITTED' ? '已交卷' : row.status === 'ONGOING' ? '进行中' : '未开始' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="screenSwitchCount" label="切屏次数" />
        <el-table-column prop="isSuspicious" label="可疑">
          <template #default="{ row }">
            <el-tag size="small" type="warning" v-if="row.isSuspicious">可疑</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="得分" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { examApi, subjectApi, paperApi, examRecordApi, classApi } from '../../utils/api'
import { useUserStore } from '../../store'

const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const tableData = ref([])
const subjects = ref([])
const papers = ref([])
const classes = ref([])
const current = ref(1)
const size = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const monitorVisible = ref(false)
const monitorExam = ref(null)
const monitorRecords = ref([])
const monitorStats = ref({ totalStudents: 0, submitted: 0, ongoing: 0, suspicious: 0 })
const formRef = ref()
let monitorTimer = null

const params = reactive({ subjectId: null, status: '', keyword: '' })

const form = reactive({
  title: '',
  paperId: null,
  subjectId: null,
  classIds: [],
  startTime: null,
  endTime: null,
  duration: 120,
  totalScore: 100,
  passRate: 60,
  config: { shuffleQuestions: true, shuffleOptions: true, leaveDetection: false, maxLeaveCount: 3 }
})

const rules = {
  title: [{ required: true, message: '请输入考试标题', trigger: 'blur' }],
  paperId: [{ required: true, message: '请选择试卷', trigger: 'change' }]
}

const statusType = (s) => ({ PENDING: 'warning', ONGOING: 'success', FINISHED: 'info' }[s])
const statusText = (s) => ({ PENDING: '待开始', ONGOING: '进行中', FINISHED: '已结束' }[s])
const getSubjectName = (id) => subjects.value.find(s => s.id === id)?.name || ''
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${d} ${h}:${min}`
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await examApi.page({ current: current.value, size: size.value, ...params })
    if (res.code === 200) { tableData.value = res.data.records; total.value = res.data.total }
  } catch (e) { console.error(e) } finally { loading.value = false }
}

const loadSubjects = async () => {
  const res = await subjectApi.list()
  if (res.code === 200) subjects.value = res.data
}

const loadPapers = async () => {
  const res = await paperApi.page({ current: 1, size: 100, status: 'PUBLISHED' })
  if (res.code === 200) papers.value = res.data.records
}

const loadClasses = async () => {
  try {
    const rawUserId = userStore.userInfo?.userId
    const userId = rawUserId ?? localStorage.getItem('userId')
    if (!userId || String(userId) === 'null' || String(userId) === 'undefined' || String(userId) === 'NaN') {
      console.warn('userId not found, skipping loadClasses')
      return
    }
    const res = await classApi.getMyClasses(String(userId))
    if (res.code === 200) {
      classes.value = res.data.map(item => ({ id: item.class.id, name: item.class.className }))
    }
  } catch (e) { 
    console.error('loadClasses error:', e.message || e)
  }
}

const onPaperChange = (paperId) => {
  const paper = papers.value.find(p => p.id === paperId)
  if (paper) {
    form.subjectId = paper.subjectId
    form.totalScore = paper.totalScore
    form.passRate = Math.round((paper.passScore / paper.totalScore) * 100) || 60
    form.duration = paper.duration
  }
}

const handleCreate = () => {
  const queryClassId = route.query.classId
  Object.assign(form, { title: '', paperId: null, subjectId: null, classIds: queryClassId ? [parseInt(queryClassId)] : [], startTime: null, endTime: null, duration: 120, totalScore: 100, passRate: 60, config: { shuffleQuestions: true, shuffleOptions: true, leaveDetection: false, maxLeaveCount: 3 } })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  try {
    const passScore = Math.round(form.totalScore * form.passRate / 100)
    const submitData = {
      title: form.title,
      paperId: form.paperId,
      subjectId: form.subjectId,
      classIds: form.classIds.join(','),
      startTime: form.startTime,
      endTime: form.endTime,
      duration: form.duration,
      totalScore: form.totalScore,
      passScore: passScore,
      config: JSON.stringify(form.config)
    }
    const res = await examApi.create(submitData)
    if (res.code === 200) { ElMessage.success('发布成功'); dialogVisible.value = false; loadData() }
    else ElMessage.error(res.message)
  } catch (e) { ElMessage.error(e.message) }
}

const handleStart = async (row) => {
  await ElMessageBox.confirm('确定要开始该考试吗？')
  try {
    const res = await examApi.start(row.id)
    if (res.code === 200) { ElMessage.success('考试已开始'); loadData() }
  } catch (e) { ElMessage.error(e.message) }
}

const handleFinish = async (row) => {
  await ElMessageBox.confirm('确定要结束该考试吗？所有未交卷考生将自动交卷')
  try {
    const res = await examApi.finish(row.id)
    if (res.code === 200) { ElMessage.success('考试已结束'); loadData() }
  } catch (e) { ElMessage.error(e.message) }
}

const handleExtend = async (row) => {
  await ElMessageBox.prompt('请输入延长时间（分钟）', '延长考试时间', { confirmButtonText: '确定', cancelButtonText: '取消' })
    .then(async ({ value }) => {
      try {
        const res = await examApi.extend(row.id, parseInt(value))
        if (res.code === 200) { ElMessage.success('已延长考试时间'); loadData() }
      } catch (e) { ElMessage.error(e.message) }
    })
}

const handleMonitor = async (row) => {
  monitorExam.value = row
  monitorVisible.value = true
  await loadMonitorData()
  monitorTimer = setInterval(loadMonitorData, 10000)
}

const loadMonitorData = async () => {
  if (!monitorExam.value) return
  try {
    const res = await examRecordApi.page({ current: 1, size: 100, examId: monitorExam.value.id })
    if (res.code === 200) {
      monitorRecords.value = res.data.records
      monitorStats.value = {
        totalStudents: res.data.total,
        submitted: res.data.records.filter(r => r.status === 'SUBMITTED').length,
        ongoing: res.data.records.filter(r => r.status === 'ONGOING').length,
        suspicious: res.data.records.filter(r => r.isSuspicious === 1).length
      }
    }
  } catch (e) { console.error(e) }
}

const handleStats = async (row) => {
  try {
    const res = await examApi.getStatistics(row.id)
    if (res.code === 200) {
      const stats = res.data
      ElMessageBox.alert(`考试统计：<br>总分：${stats.totalStudents}<br>平均分：${stats.avgScore}<br>最高分：${stats.maxScore}<br>最低分：${stats.minScore}<br>及格率：${stats.passRate}%`, '考试统计', { dangerouslyUseHTMLString: true })
    }
  } catch (e) { console.error(e) }
}

onMounted(() => { loadData(); loadSubjects(); loadPapers(); loadClasses() })
onUnmounted(() => { if (monitorTimer) clearInterval(monitorTimer) })
</script>

<style lang="scss" scoped>
.exam-manage { max-width: 1400px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.monitor-stats { margin-bottom: 20px; }
.stat-item { background: #f8fafc; padding: 16px; border-radius: 10px; text-align: center; }
.stat-item .label { display: block; font-size: 13px; color: #64748b; margin-bottom: 8px; }
.stat-item .value { font-size: 24px; font-weight: 700; color: #1e293b; }
.stat-item .value.warning { color: #f59e0b; }
</style>
