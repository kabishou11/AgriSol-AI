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

const unwrapData = (res) => res?.data ?? res

export default {
  crop: {
    upload: (formData) => axios.post('/api/crops/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    }).then(r => r.data),
    analyze: (data) => api.post('/crops/analyze', data).then(unwrapData),
    getHistory: (params) => api.get('/crops/history', { params }).then(unwrapData),
    getStatistics: () => api.get('/crops/statistics').then(unwrapData),
    getDetail: (id) => api.get(`/crops/${id}`).then(unwrapData),
    getCompare: (cropType) => api.get(`/crops/compare/${cropType}`).then(unwrapData),
    delete: (id) => api.delete(`/crops/${id}`).then(unwrapData)
  },
  energy: {
    record: (data) => api.post('/energy/record', data).then(unwrapData),
    getToday: (params) => api.get('/energy/today', { params }).then(unwrapData),
    getOverview: (params) => api.get('/energy/overview', { params }).then(unwrapData),
    getForecast: (params) => api.get('/energy/forecast', { params }).then(unwrapData),
    getStatistics: (params) => api.get('/energy/statistics', { params }).then(unwrapData),
    optimize: (data) => api.post('/energy/optimize', data).then(unwrapData),
    addDevice: (data) => api.post('/energy/devices', data).then(unwrapData),
    getDevices: (params) => api.get('/energy/devices', { params }).then(unwrapData)
  },
  carbon: {
    calculate: (data) => api.post('/carbon/calculate', data).then(unwrapData),
    record: (data) => api.post('/carbon/record', data).then(unwrapData),
    getLedger: (params) => api.get('/carbon/ledger', { params }).then(unwrapData),
    getStatistics: (params) => api.get('/carbon/statistics', { params }).then(unwrapData),
    getCertificate: (id) => api.get(`/carbon/certificate/${id}`).then(unwrapData),
    getCropTypes: () => api.get('/carbon/crop-types').then(unwrapData),
    getReport: () => api.get('/carbon/report').then(unwrapData),
    getMonthlyReport: (params) => api.get('/carbon/reports/monthly', { params }).then(unwrapData),
    generateMonthlyReport: (data) => api.post('/carbon/reports/monthly/generate', data).then(unwrapData),
    autoCalculate: (params) => api.get('/carbon/auto-calculate', { params }).then(unwrapData)
  },
  environment: {
    record: (data) => api.post('/environment/record', data).then(unwrapData),
    getIndicators: (params) => api.get('/environment/indicators', { params }).then(unwrapData),
    getStatistics: (params) => api.get('/environment/statistics', { params }).then(unwrapData),
    getLatest: () => api.get('/environment/latest').then(unwrapData)
  },
  wisdom: {
    create: (data) => api.post('/wisdom/record', data).then(unwrapData),
    getList: (params) => api.get('/wisdom/search', { params }).then(unwrapData),
    recordAudio: (formData) => axios.post('/api/wisdom/record-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    }).then(r => r.data),
    search: (params) => api.get('/wisdom/search', { params }).then(unwrapData),
    getCategories: () => api.get('/wisdom/categories').then(unwrapData),
    like: (id) => api.post(`/wisdom/${id}/like`).then(unwrapData),
    favorite: (data) => api.post('/wisdom/favorite', data).then(unwrapData),
    unfavorite: (data) => api.delete('/wisdom/favorite', { data }).then(unwrapData),
    getPopular: (params) => api.get('/wisdom/popular', { params }).then(unwrapData),
    getDetail: (id) => api.get(`/wisdom/${id}`).then(unwrapData),
    update: (id, data) => api.put(`/wisdom/${id}`, data).then(unwrapData),
    delete: (id) => api.delete(`/wisdom/${id}`).then(unwrapData)
  },
  family: {
    getMembers: () => api.get('/family/members').then(unwrapData),
    addMember: (data) => api.post('/family/member', data).then(unwrapData),
    getLeaderboard: (params) => api.get('/family/leaderboard', { params }).then(unwrapData),
    awardPoints: (data) => api.post('/family/points', data).then(unwrapData),
    getAchievements: (memberId) => api.get(`/family/achievements/${memberId}`).then(unwrapData),
    getActivity: (params) => api.get('/family/activity', { params }).then(unwrapData)
  },
  statistics: {
    getOverview: (params) => api.get('/statistics/overview', { params }).then(unwrapData),
    getTrends: (params) => api.get('/statistics/trends', { params }).then(unwrapData),
    getSummary: (params) => api.get('/statistics/summary', { params }).then(unwrapData),
    getActivities: (params) => api.get('/statistics/activities', { params }).then(unwrapData),
    recordActivity: (data) => api.post('/statistics/activity', data).then(unwrapData)
  },
  user: {
    getProfile: () => api.get('/user/profile').then(unwrapData),
    updateProfile: (data) => api.put('/user/profile', data).then(unwrapData),
    getSettings: () => api.get('/user/settings').then(unwrapData),
    updateSettings: (data) => api.put('/user/settings', data).then(unwrapData),
    getHistory: (params) => api.get('/user/history', { params }).then(unwrapData)
  },
  ai: {
    chat: (data) => api.post('/ai/chat', data).then(unwrapData),
    getSuggestions: () => api.get('/ai/suggestions').then(unwrapData),
    getDailyInsights: (params) => api.get('/ai/insights/daily', { params }).then(unwrapData)
  },
  graph: {
    getKnowledge: () => api.get('/graph/knowledge').then(unwrapData),
    getNodeDetail: (type, id) => api.get(`/graph/node/${type}/${id}`).then(unwrapData)
  },
  prompts: {
    getPresets: (params) => api.get('/prompts/presets', { params }).then(unwrapData),
    getCustom: () => api.get('/prompts/custom').then(unwrapData),
    getSystem: () => api.get('/prompts/system').then(unwrapData),
    createCustom: (data) => api.post('/prompts/custom', data).then(unwrapData),
    updateCustom: (id, data) => api.put(`/prompts/custom/${id}`, data).then(unwrapData),
    deleteCustom: (id) => api.delete(`/prompts/custom/${id}`).then(unwrapData),
    fill: (data) => api.post('/prompts/fill', data).then(unwrapData),
    generate: (data) => api.post('/prompts/generate', data).then(unwrapData)
  }
}
