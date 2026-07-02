/**
 * API接口定义
 * 使用UniApp请求封装
 */
import request, { get, post, put, del } from './request'

// 认证相关API
export const authApi = {
  login: (data) => post('/auth/login', data),
  register: (data) => post('/auth/register', data),
  getUserInfo: () => get('/auth/info'),
  changePassword: (data) => post('/auth/changePassword', data)
}

// 用户管理API
export const userApi = {
  page: (params) => get('/users/page', params),
  getById: (id) => get(`/users/${id}`),
  create: (data) => post('/users', data),
  update: (data) => put('/users', data),
  delete: (id) => del(`/users/${id}`),
  getStudents: () => get('/users/students'),
  getTeachers: () => get('/users/teachers'),
  changeStatus: (id, status) => put(`/users/${id}/status`, null, { status })
}

// 院系管理API
export const departmentApi = {
  tree: () => get('/departments/tree'),
  list: () => get('/departments'),
  getById: (id) => get(`/departments/${id}`),
  create: (data) => post('/departments', data),
  update: (data) => put('/departments', data),
  delete: (id) => del(`/departments/${id}`)
}

// 班级管理API
export const classApi = {
  page: (params) => get('/classes/page', params),
  list: (params) => get('/classes', params),
  getById: (id) => get(`/classes/${id}`),
  create: (data, teacherId) => post('/class/create', data, { teacherId }),
  update: (data) => put('/classes', data),
  delete: (id) => del(`/classes/${id}`),
  getMyClasses: (userId) => get('/class/my-classes', { userId }),
  joinByCode: (inviteCode, userId) => post('/class/join-by-code', { inviteCode, userId }),
  getClassInfo: (classId) => get(`/classes/${classId}`),
  getClassMembers: (classId) => get(`/class/${classId}/members`),
  getMessages: (classId, current, size) => get(`/class/${classId}/messages`, { current, size }),
  sendMessage: (classId, content, senderId) => post(`/class/${classId}/message`, { content }, { senderId }),
  checkMemberRole: (classId, userId) => get(`/class/${classId}/member/${userId}/check`)
}

// 日志管理API
export const logApi = {
  page: (params) => get('/logs/page', params)
}

// 科目管理API
export const subjectApi = {
  page: (params) => get('/subjects/page', params),
  list: () => get('/subjects'),
  getById: (id) => get(`/subjects/${id}`),
  create: (data) => post('/subjects', data),
  update: (data) => put('/subjects', data),
  delete: (id) => del(`/subjects/${id}`)
}

// 知识点管理API
export const knowledgePointApi = {
  list: (params) => get('/knowledge-points', params),
  tree: (params) => get('/knowledge-points/tree', params),
  getById: (id) => get(`/knowledge-points/${id}`),
  create: (data) => post('/knowledge-points', data),
  update: (data) => put('/knowledge-points', data),
  delete: (id) => del(`/knowledge-points/${id}`)
}

// 题库管理API
export const questionApi = {
  page: (params) => get('/questions/page', params),
  list: (params) => get('/questions/list', params),
  getById: (id) => get(`/questions/${id}`),
  create: (data) => post('/questions', data),
  update: (data) => put('/questions', data),
  delete: (id) => del(`/questions/${id}`),
  getCorrectRate: (id) => get(`/questions/${id}/correct-rate`),
  import: (data) => post('/questions/import', data),
  generatePaper: (data) => post('/questions/generate-paper', data)
}

// 试卷管理API
export const paperApi = {
  page: (params) => get('/papers/page', params),
  getById: (id) => get(`/papers/${id}`),
  getQuestions: (id) => get(`/papers/${id}/questions`),
  create: (data) => post('/papers', data),
  update: (data) => put('/papers', data),
  publish: (id) => put(`/papers/${id}/publish`),
  delete: (id) => del(`/papers/${id}`)
}

// 考试管理API
export const examApi = {
  page: (params) => get('/exams/page', params),
  studentPage: (params) => get('/exams/student/page', params),
  getById: (id) => get(`/exams/${id}`),
  create: (data) => post('/exams', data),
  update: (data) => put('/exams', data),
  publish: (id) => put(`/exams/${id}/publish`),
  start: (id) => put(`/exams/${id}/start`),
  finish: (id) => put(`/exams/${id}/finish`),
  extend: (id, minutes) => put(`/exams/${id}/extend`, null, { minutes }),
  delete: (id) => del(`/exams/${id}`),
  getStatistics: (id) => get(`/exams/${id}/statistics`)
}

// 考试记录API
export const examRecordApi = {
  page: (params) => get('/exam-records/page', params),
  getById: (id) => get(`/exam-records/${id}`),
  start: (data) => post('/exam-records/start', data),
  saveAnswer: (data) => post('/exam-records/answer', data),
  autoSave: (data) => post('/exam-records/auto-save', data),
  submit: (id) => post(`/exam-records/submit/${id}`),
  autoSubmit: (id) => post(`/exam-records/auto-submit/${id}`),
  screenSwitch: (data) => post('/exam-records/screen-switch', data),
  reportLeave: (data) => post('/exam-records/report-leave', data),
  getAnswers: (id) => get(`/exam-records/${id}/answers`),
  getStudentHistory: (params) => get('/exam-records/student/history', params),
  getAnalysis: (params) => get('/exam-records/analysis', params),
  getStudentStats: () => get('/exam-records/student/stats'),
  getStudentSubjectScores: () => get('/exam-records/student/subject-scores'),
  getScoreTrend: () => get('/exam-records/student/score-trend'),
  getKnowledgeMastery: () => get('/exam-records/student/knowledge-mastery'),
  getExamStats: (examId) => get(`/exam-records/teacher/exam-stats/${examId}`),
  getQuestionAnalysis: (examId) => get(`/exam-records/teacher/question-analysis/${examId}`),
  exportExamScores: (examId) => get(`/exam-records/teacher/export/${examId}`)
}

// 错题本API
export const wrongQuestionApi = {
  page: (params) => get('/wrong-questions/page', params),
  getById: (id) => get(`/wrong-questions/${id}`),
  practice: (id) => post(`/wrong-questions/${id}/practice`),
  correct: (id) => post(`/wrong-questions/${id}/correct`),
  updateMastered: (id, mastered) => put(`/wrong-questions/${id}/mastered`, null, { mastered })
}

// 统计API
export const statisticsApi = {
  overview: () => get('/statistics/overview'),
  teacherStats: () => get('/statistics/teacher/stats')
}

export default {
  authApi,
  userApi,
  departmentApi,
  classApi,
  logApi,
  subjectApi,
  knowledgePointApi,
  questionApi,
  paperApi,
  examApi,
  examRecordApi,
  wrongQuestionApi,
  statisticsApi
}