import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    const msg = error.response?.data?.message || error.message || '请求失败'
    console.error('API Error:', msg)
    return Promise.reject(new Error(msg))
  }
)

export default {
  crop: {
    upload: (formData) => axios.post('/api/crops/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    }).then(r => r.data),
    analyze: (data) => api.post('/crops/analyze', data),
    getHistory: (params) => api.get('/crops/history', { params }),
    getStatistics: () => api.get('/crops/statistics'),
    getDetail: (id) => api.get(`/crops/${id}`),
    delete: (id) => api.delete(`/crops/${id}`)
  },
  energy: {
    record: (data) => api.post('/energy/record', data),
    getToday: () => api.get('/energy/today'),
    getForecast: (params) => api.get('/energy/forecast', { params }),
    getStatistics: (params) => api.get('/energy/statistics', { params }),
    optimize: (data) => api.post('/energy/optimize', data),
    addDevice: (data) => api.post('/energy/devices', data),
    getDevices: () => api.get('/energy/devices')
  },
  carbon: {
    calculate: (data) => api.post('/carbon/calculate', data),
    record: (data) => api.post('/carbon/record', data),
    getLedger: (params) => api.get('/carbon/ledger', { params }),
    getStatistics: (params) => api.get('/carbon/statistics', { params }),
    getCertificate: (id) => api.get(`/carbon/certificate/${id}`),
    getCropTypes: () => api.get('/carbon/crop-types'),
    getReport: () => api.get('/carbon/report')
  },
  environment: {
    record: (data) => api.post('/environment/record', data),
    getIndicators: (params) => api.get('/environment/indicators', { params }),
    getStatistics: (params) => api.get('/environment/statistics', { params }),
    getLatest: () => api.get('/environment/latest')
  },
  wisdom: {
    create: (data) => api.post('/wisdom/record', data),
    getList: (params) => api.get('/wisdom/list', { params }),
    recordAudio: (formData) => axios.post('/api/wisdom/record-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    }).then(r => r.data),
    search: (params) => api.get('/wisdom/search', { params }),
    getCategories: () => api.get('/wisdom/categories'),
    like: (id) => api.post(`/wisdom/${id}/like`),
    getPopular: (params) => api.get('/wisdom/popular', { params }),
    getDetail: (id) => api.get(`/wisdom/${id}`),
    update: (id, data) => api.put(`/wisdom/${id}`, data),
    delete: (id) => api.delete(`/wisdom/${id}`)
  },
  family: {
    getMembers: () => api.get('/family/members'),
    addMember: (data) => api.post('/family/member', data),
    getLeaderboard: (params) => api.get('/family/leaderboard', { params }),
    awardPoints: (data) => api.post('/family/points', data),
    getAchievements: (memberId) => api.get(`/family/achievements/${memberId}`),
    getActivity: (params) => api.get('/family/activity', { params })
  },
  statistics: {
    getOverview: () => api.get('/statistics/overview'),
    getTrends: (params) => api.get('/statistics/trends', { params }),
    getSummary: () => api.get('/statistics/summary'),
    getActivities: (params) => api.get('/statistics/activities', { params }),
    recordActivity: (data) => api.post('/statistics/activity', data)
  },
  user: {
    getProfile: () => api.get('/user/profile'),
    updateProfile: (data) => api.put('/user/profile', data),
    getSettings: () => api.get('/user/settings'),
    updateSettings: (data) => api.put('/user/settings', data),
    getHistory: (params) => api.get('/user/history', { params })
  }
}
