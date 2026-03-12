import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default {
  crop: {
    upload: (formData) => {
      return axios.post('/api/crops/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      })
    },
    analyze: (data) => api.post('/crops/analyze', data),
    getHistory: (params) => api.get('/crops/history', { params }),
    getStatistics: () => api.get('/crops/statistics'),
    getDetail: (id) => api.get(`/crops/${id}`),
    delete: (id) => api.delete(`/crops/${id}`)
  },
  energy: {
    getMonitoring: () => api.get('/energy/monitoring'),
    getStats: () => api.get('/energy/stats'),
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
    getCertificate: (certificateId) => api.get(`/carbon/certificate/${certificateId}`),
    getCropTypes: () => api.get('/carbon/crop-types'),
    getReport: () => api.get('/carbon/report')
  },
  environment: {
    record: (data) => api.post('/environment/record', data),
    getIndicators: (params) => api.get('/environment/indicators', { params }),
    calculateScore: (data) => api.post('/environment/score', data),
    getStatistics: (params) => api.get('/environment/statistics', { params }),
    getLatest: (params) => api.get('/environment/latest', { params })
  },
  wisdom: {
    create: (data) => api.post('/wisdom/record', data),
    getList: () => api.get('/wisdom/list'),
    record: (data) => api.post('/wisdom/record', data),
    recordAudio: (formData) => {
      return axios.post('/api/wisdom/record-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      })
    },
    search: (params) => api.get('/wisdom/search', { params }),
    getCategories: () => api.get('/wisdom/categories'),
    favorite: (data) => api.post('/wisdom/favorite', data),
    unfavorite: (data) => api.delete('/wisdom/favorite', { data }),
    getPopular: (params) => api.get('/wisdom/popular', { params }),
    getDetail: (id) => api.get(`/wisdom/${id}`)
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
    getOverview: (params) => api.get('/statistics/overview', { params }),
    getTrends: (params) => api.get('/statistics/trends', { params }),
    getReport: (params) => api.get('/statistics/report', { params }),
    export: (data) => api.post('/statistics/export', data)
  },
  user: {
    getProfile: (params) => api.get('/user/profile', { params }),
    updateProfile: (data) => api.put('/user/profile', data),
    getSettings: (params) => api.get('/user/settings', { params }),
    updateSettings: (data) => api.put('/user/settings', data),
    getHistory: (params) => api.get('/user/history', { params })
  },
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config)
}
