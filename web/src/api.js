import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
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
    analyze: (data) => api.post('/crop/analyze', data),
    getHistory: () => api.get('/crop/history')
  },
  energy: {
    getMonitoring: () => api.get('/energy/monitoring'),
    getStats: () => api.get('/energy/stats')
  },
  carbon: {
    calculate: (data) => api.post('/carbon/calculate', data),
    getReport: () => api.get('/carbon/report')
  },
  wisdom: {
    create: (data) => api.post('/wisdom/record', data),
    getList: () => api.get('/wisdom/list')
  }
}
