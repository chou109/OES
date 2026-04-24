import axios from 'axios'
import { useUserStore } from '../store'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(config => {
  const userStore = useUserStore()
  const token = userStore.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default request

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  register: (data) => request.post('/auth/register', data),
  getUserInfo: () => request.get('/auth/info'),
  changePassword: (data) => request.post('/auth/changePassword', data)
}

export const userApi = {
  page: (params) => request.get('/users/page', { params }),
  getById: (id) => request.get(`/users/${id}`),
  create: (data) => request.post('/users', data),
  update: (data) => request.put('/users', data),
  delete: (id) => request.delete(`/users/${id}`),
  getStudents: () => request.get('/users/students'),
  getTeachers: () => request.get('/users/teachers'),
  changeStatus: (id, status) => request.put(`/users/${id}/status`, null, { params: { status } })
}

export const departmentApi = {
  tree: () => request.get('/departments/tree'),
  list: () => request.get('/departments'),
  getById: (id) => request.get(`/departments/${id}`),
  create: (data) => request.post('/departments', data),
  update: (data) => request.put('/departments', data),
  delete: (id) => request.delete(`/departments/${id}`)
}

export const classApi = {
  page: (params) => request.get('/classes/page', { params }),
  list: (params) => request.get('/classes', { params }),
  getById: (id) => request.get(`/classes/${id}`),
  create: (data) => request.post('/classes', data),
  update: (data) => request.put('/classes', data),
  delete: (id) => request.delete(`/classes/${id}`)
}

export const logApi = {
  page: (params) => request.get('/logs/page', { params })
}

export const subjectApi = {
  page: (params) => request.get('/subjects/page', { params }),
  list: () => request.get('/subjects'),
  getById: (id) => request.get(`/subjects/${id}`),
  create: (data) => request.post('/subjects', data),
  update: (data) => request.put('/subjects', data),
  delete: (id) => request.delete(`/subjects/${id}`)
}

export const knowledgePointApi = {
  list: (params) => request.get('/knowledge-points', { params }),
  tree: (params) => request.get('/knowledge-points/tree', { params }),
  getById: (id) => request.get(`/knowledge-points/${id}`),
  create: (data) => request.post('/knowledge-points', data),
  update: (data) => request.put('/knowledge-points', data),
  delete: (id) => request.delete(`/knowledge-points/${id}`)
}

export const questionApi = {
  page: (params) => request.get('/questions/page', { params }),
  list: (params) => request.get('/questions/list', { params }),
  getById: (id) => request.get(`/questions/${id}`),
  create: (data) => request.post('/questions', data),
  update: (data) => request.put('/questions', data),
  delete: (id) => request.delete(`/questions/${id}`),
  getCorrectRate: (id) => request.get(`/questions/${id}/correct-rate`)
}

export const paperApi = {
  page: (params) => request.get('/papers/page', { params }),
  getById: (id) => request.get(`/papers/${id}`),
  getQuestions: (id) => request.get(`/papers/${id}/questions`),
  create: (data, params) => request.post('/papers', data, { params }),
  update: (data, params) => request.put('/papers', data, { params }),
  publish: (id) => request.put(`/papers/${id}/publish`),
  delete: (id) => request.delete(`/papers/${id}`)
}

export const examApi = {
  page: (params) => request.get('/exams/page', { params }),
  studentPage: (params) => request.get('/exams/student/page', { params }),
  getById: (id) => request.get(`/exams/${id}`),
  create: (data) => request.post('/exams', data),
  update: (data) => request.put('/exams', data),
  publish: (id) => request.put(`/exams/${id}/publish`),
  start: (id) => request.put(`/exams/${id}/start`),
  finish: (id) => request.put(`/exams/${id}/finish`),
  extend: (id, minutes) => request.put(`/exams/${id}/extend`, null, { params: { minutes } }),
  delete: (id) => request.delete(`/exams/${id}`),
  getStatistics: (id) => request.get(`/exams/${id}/statistics`)
}

export const examRecordApi = {
  page: (params) => request.get('/exam-records/page', { params }),
  getById: (id) => request.get(`/exam-records/${id}`),
  start: (data) => request.post('/exam-records/start', data),
  saveAnswer: (data) => request.post('/exam-records/answer', data),
  autoSave: (data) => request.post('/exam-records/auto-save', data),
  submit: (id) => request.post(`/exam-records/submit/${id}`),
  screenSwitch: (data) => request.post('/exam-records/screen-switch', data),
  getAnswers: (id) => request.get(`/exam-records/${id}/answers`),
  getStudentHistory: (params) => request.get('/exam-records/student/history', { params }),
  getAnalysis: (params) => request.get('/exam-records/analysis', { params })
}

export const wrongQuestionApi = {
  page: (params) => request.get('/wrong-questions/page', { params }),
  getById: (id) => request.get(`/wrong-questions/${id}`),
  practice: (id) => request.post(`/wrong-questions/${id}/practice`)
}

export const statisticsApi = {
  overview: () => request.get('/statistics/overview')
}
