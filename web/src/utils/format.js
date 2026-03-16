/**
 * AgriSol-AI 工具函数库
 */

/**
 * 格式化数字（带千分位）
 */
export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return '0'
  return Number(num).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * 格式化相对时间（X分钟前/X小时前/X天前）
 */
export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

/**
 * 格式化日期
 */
export const formatDate = (dateStr, format = 'YYYY-MM-DD') => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
}

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * 格式化碳汇量（自动选择单位）
 */
export const formatCarbon = (kg) => {
  if (!kg) return '0 kg'
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} 吨`
  return `${kg.toFixed(2)} kg`
}

/**
 * 格式化电量（自动选择单位）
 */
export const formatEnergy = (kwh) => {
  if (!kwh) return '0 kWh'
  if (kwh >= 1000) return `${(kwh / 1000).toFixed(2)} MWh`
  return `${kwh.toFixed(1)} kWh`
}

/**
 * 格式化货币
 */
export const formatCurrency = (amount, currency = '¥') => {
  if (!amount) return `${currency}0.00`
  return `${currency}${Number(amount).toFixed(2)}`
}

/**
 * 获取健康分颜色
 */
export const getHealthColor = (score) => {
  if (score >= 80) return '#52c41a'
  if (score >= 60) return '#faad14'
  return '#ff4d4f'
}

/**
 * 获取健康分状态文字
 */
export const getHealthStatus = (score) => {
  if (score >= 80) return '健康'
  if (score >= 60) return '一般'
  return '需关注'
}

/**
 * 防抖函数
 */
export const debounce = (fn, delay = 300) => {
  let timer = null
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * 节流函数
 */
export const throttle = (fn, interval = 300) => {
  let lastTime = 0
  return (...args) => {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn(...args)
    }
  }
}

/**
 * 数字滚动动画
 */
export const animateNumber = (el, from, to, duration = 1000) => {
  const start = Date.now()
  const update = () => {
    const elapsed = Date.now() - start
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
    const current = from + (to - from) * eased
    el.textContent = Math.round(current).toLocaleString('zh-CN')
    if (progress < 1) requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
}

/**
 * 安全转义 HTML
 */
export const escapeHtml = (text = '') => String(text)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

/**
 * 安全渲染简易 Markdown（粗体/斜体/行内代码/列表/换行）
 */
export const renderSimpleMarkdown = (text = '') => {
  const safe = escapeHtml(text)
  return safe
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="md-list-item">$1. $2</div>')
    .replace(/^[-*]\s+(.+)$/gm, '<div class="md-list-item">• $1</div>')
    .replace(/\n/g, '<br>')
}

/**
 * 获取活动类型图标
 */
export const getActivityIcon = (type) => {
  const icons = {
    crop: '🌾',
    crop_analyze: '🌾',
    crop_analysis: '🌾',
    energy: '⚡',
    energy_record: '⚡',
    energy_prediction: '⚡',
    carbon: '🌍',
    carbon_calculate: '🌍',
    carbon_calculation: '🌍',
    wisdom: '📝',
    wisdom_record: '📝',
    environment: '🌱',
    environment_record: '🌱',
    family_update: '👨‍👩‍👧‍👦',
    profile_update: '👤',
    settings_update: '⚙️',
    ai_chat: '🤖'
  }
  return icons[type] || '📋'
}

/**
 * 获取活动类型颜色
 */
export const getActivityColor = (type) => {
  const colors = {
    crop_analyze: '#52c41a',
    energy_record: '#fa8c16',
    carbon_calculate: '#1890ff',
    wisdom_record: '#722ed1',
    environment_record: '#13c2c2',
    family_update: '#eb2f96'
  }
  return colors[type] || '#8c8c8c'
}
