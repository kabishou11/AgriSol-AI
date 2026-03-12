<template>
  <div class="crop-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">🌾 作物智能分析</h1>
          <p class="page-subtitle">上传作物图片，AI智能识别健康状态、病虫害，提供专业养护建议</p>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-value">{{ statistics.totalAnalysis }}</span>
            <span class="stat-label">总分析次数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" :style="{ color: getScoreColor(statistics.avgHealth) }">
              {{ statistics.avgHealth }}
            </span>
            <span class="stat-label">平均健康分</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ statistics.monthlyNew }}</span>
            <span class="stat-label">本月新增</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传区域 -->
    <a-card class="upload-card" :bordered="false">
      <a-row :gutter="24">
        <a-col :span="24" :lg="14">
          <div
            class="upload-zone"
            :class="{ 'drag-over': isDragOver, 'has-image': previewUrl }"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleFileChange"
            />
            <div v-if="!previewUrl" class="upload-placeholder">
              <div class="upload-icon">📷</div>
              <p class="upload-text">拖拽图片到此处，或点击上传</p>
              <p class="upload-hint">支持 JPG、PNG、WEBP 格式，最大 10MB</p>
              <a-button type="outline" class="upload-btn" @click.stop="triggerFileInput">选择图片</a-button>
            </div>
            <div v-else class="image-preview">
              <img :src="previewUrl" alt="作物图片预览" class="preview-img" />
              <div class="preview-overlay">
                <a-button type="text" class="change-btn" @click.stop="triggerFileInput">更换图片</a-button>
              </div>
            </div>
          </div>
        </a-col>

        <a-col :span="24" :lg="10">
          <div class="upload-controls">
            <div class="control-section">
              <p class="control-label">作物类型</p>
              <a-select v-model="selectedCropType" placeholder="选择作物类型（可选）" allow-clear style="width: 100%">
                <a-option v-for="crop in cropTypes" :key="crop.value" :value="crop.value">
                  {{ crop.label }}
                </a-option>
              </a-select>
            </div>
            <div class="control-section">
              <p class="control-label">分析说明（可选）</p>
              <a-textarea
                v-model="analysisNote"
                placeholder="描述作物的异常情况，帮助AI更准确分析..."
                :max-length="200"
                show-word-limit
                :auto-size="{ minRows: 3, maxRows: 5 }"
              />
            </div>
            <div class="action-buttons">
              <a-button
                type="primary"
                size="large"
                long
                :loading="analyzing"
                :disabled="!previewUrl"
                @click="startAnalysis"
                class="analyze-btn"
              >
                {{ analyzing ? '分析中...' : '🔍 开始智能分析' }}
              </a-button>
              <a-button size="large" long :disabled="!previewUrl" @click="clearImage" class="clear-btn">
                清除图片
              </a-button>
            </div>
            <div v-if="analyzing" class="progress-section">
              <a-progress :percent="progress" :color="'#52c41a'" />
              <p class="progress-text">{{ progressText }}</p>
            </div>
          </div>
        </a-col>
      </a-row>
    </a-card>

    <!-- 分析结果 -->
    <a-card v-if="analysisResult" class="result-card" :bordered="false">
      <template #title>
        <span>📊 分析结果</span>
        <a-tag color="green" style="margin-left: 12px">分析完成</a-tag>
      </template>
      <a-row :gutter="24">
        <a-col :span="24" :md="8">
          <div class="score-section">
            <p class="section-title">健康评分</p>
            <div class="score-circle-wrap">
              <a-progress
                type="circle"
                :percent="analysisResult.healthScore"
                :color="getScoreColor(analysisResult.healthScore)"
                :width="160"
                :stroke-width="10"
              >
                <template #text>
                  <div class="score-inner">
                    <span class="score-number" :style="{ color: getScoreColor(analysisResult.healthScore) }">
                      {{ analysisResult.healthScore }}
                    </span>
                    <span class="score-unit">分</span>
                  </div>
                </template>
              </a-progress>
            </div>
            <div class="crop-info-tags">
              <a-tag color="green">{{ analysisResult.cropType }}</a-tag>
              <a-tag color="blue">{{ analysisResult.growthStage }}</a-tag>
              <a-tag :color="analysisResult.healthStatus === '健康' ? 'green' : 'orange'">
                {{ analysisResult.healthStatus }}
              </a-tag>
            </div>
          </div>
        </a-col>
        <a-col :span="24" :md="8">
          <div class="pest-section">
            <p class="section-title">病虫害检测</p>
            <div v-if="analysisResult.pests && analysisResult.pests.length > 0">
              <div v-for="pest in analysisResult.pests" :key="pest.name" class="pest-item">
                <div class="pest-header">
                  <span class="pest-name">🐛 {{ pest.name }}</span>
                  <a-tag :color="getSeverityColor(pest.severity)" size="small">{{ pest.severity }}</a-tag>
                </div>
                <a-progress
                  :percent="getSeverityPercent(pest.severity)"
                  :color="getSeverityHex(pest.severity)"
                  :show-text="false"
                  size="small"
                />
              </div>
            </div>
            <a-empty v-else description="未检测到病虫害 ✅" />
          </div>
        </a-col>
        <a-col :span="24" :md="8">
          <div class="advice-section">
            <p class="section-title">养护建议</p>
            <a-timeline>
              <a-timeline-item
                v-for="(step, index) in analysisResult.recommendations"
                :key="index"
                :dot-color="'#52c41a'"
              >
                <span class="advice-step">{{ step }}</span>
              </a-timeline-item>
            </a-timeline>
          </div>
        </a-col>
      </a-row>
      <div v-if="analysisResult.aiAnalysis" class="ai-analysis">
        <p class="section-title">🤖 AI综合分析</p>
        <a-alert :message="analysisResult.aiAnalysis" type="info" show-icon />
      </div>
    </a-card>

    <!-- 历史记录 -->
    <a-card class="history-card" :bordered="false">
      <template #title>历史分析记录</template>
      <template #extra>
        <a-button type="text" @click="loadHistory" :loading="historyLoading">刷新</a-button>
      </template>
      <a-spin :loading="historyLoading">
        <div v-if="historyList.length > 0" class="history-grid">
          <div
            v-for="item in historyList"
            :key="item.id"
            class="history-item"
            @click="viewHistoryDetail(item)"
          >
            <div class="history-thumb">
              <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.cropType" class="thumb-img" />
              <div v-else class="thumb-placeholder">🌱</div>
            </div>
            <div class="history-info">
              <p class="history-crop">{{ item.cropType || '未知作物' }}</p>
              <div class="history-score-row">
                <span class="history-score" :style="{ color: getScoreColor(item.healthScore) }">
                  {{ item.healthScore }}分
                </span>
                <a-tag
                  :color="item.healthScore >= 80 ? 'green' : item.healthScore >= 60 ? 'orange' : 'red'"
                  size="small"
                >
                  {{ item.healthScore >= 80 ? '健康' : item.healthScore >= 60 ? '一般' : '异常' }}
                </a-tag>
              </div>
              <p class="history-date">{{ item.date }}</p>
            </div>
          </div>
        </div>
        <a-empty v-else description="暂无历史记录" />
      </a-spin>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import api from '../api.js'

// ---- 状态 ----
const fileInputRef = ref(null)
const previewUrl = ref('')
const selectedFile = ref(null)
const selectedCropType = ref('')
const analysisNote = ref('')
const isDragOver = ref(false)
const analyzing = ref(false)
const progress = ref(0)
const progressText = ref('')
const analysisResult = ref(null)
const historyList = ref([])
const historyLoading = ref(false)

const statistics = reactive({
  totalAnalysis: 0,
  avgHealth: 0,
  monthlyNew: 0
})

const cropTypes = [
  { value: 'wheat', label: '🌾 小麦' },
  { value: 'rice', label: '🌾 水稻' },
  { value: 'corn', label: '🌽 玉米' },
  { value: 'soybean', label: '🫘 大豆' },
  { value: 'cotton', label: '🌿 棉花' },
  { value: 'vegetable', label: '🥬 蔬菜' },
  { value: 'fruit', label: '🍎 果树' },
  { value: 'other', label: '🌱 其他' }
]

// ---- 文件上传 ----
const triggerFileInput = () => fileInputRef.value?.click()

const handleFileChange = (e) => {
  const file = e.target.files?.[0]
  if (file) processFile(file)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragOver.value = false
  const file = e.dataTransfer.files?.[0]
  if (file && file.type.startsWith('image/')) processFile(file)
  else Message.warning('请上传图片文件')
}

const processFile = (file) => {
  if (file.size > 10 * 1024 * 1024) {
    Message.error('图片大小不能超过 10MB')
    return
  }
  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => { previewUrl.value = e.target.result }
  reader.readAsDataURL(file)
  analysisResult.value = null
}

const clearImage = () => {
  previewUrl.value = ''
  selectedFile.value = null
  analysisResult.value = null
  progress.value = 0
  progressText.value = ''
}

// ---- 分析 ----
const startAnalysis = async () => {
  if (!selectedFile.value) return
  analyzing.value = true
  progress.value = 0
  analysisResult.value = null

  const steps = [
    { percent: 20, text: '正在上传图片...' },
    { percent: 45, text: '图像预处理中...' },
    { percent: 70, text: 'AI模型分析中...' },
    { percent: 90, text: '生成分析报告...' }
  ]

  const timer = setInterval(() => {
    const next = steps.find(s => s.percent > progress.value)
    if (next) {
      progress.value = next.percent
      progressText.value = next.text
    }
  }, 700)

  try {
    const formData = new FormData()
    formData.append('image', selectedFile.value)
    if (selectedCropType.value) formData.append('cropType', selectedCropType.value)
    if (analysisNote.value) formData.append('note', analysisNote.value)

    const res = await api.crop.upload(formData)
    clearInterval(timer)
    progress.value = 100
    progressText.value = '分析完成！'

    analysisResult.value = {
      cropType: res.cropType || selectedCropType.value || '未知作物',
      growthStage: res.growthStage || '生长期',
      healthStatus: res.healthStatus || '良好',
      healthScore: res.healthScore ?? 85,
      pests: res.pests || [],
      recommendations: res.recommendations || ['保持适当水分', '定期检查病虫害', '合理施肥'],
      aiAnalysis: res.aiAnalysis || ''
    }

    Message.success('分析完成！')
    loadHistory()
    loadStatistics()
  } catch (err) {
    clearInterval(timer)
    progress.value = 0
    Message.error(err.message || '分析失败，请重试')
  } finally {
    analyzing.value = false
  }
}

// ---- 历史 & 统计 ----
const loadHistory = async () => {
  historyLoading.value = true
  try {
    const res = await api.crop.getHistory({ limit: 12 })
    historyList.value = (res.data || res || []).map(item => ({
      id: item.id,
      cropType: item.cropType,
      healthScore: item.healthScore ?? 0,
      imageUrl: item.imageUrl || '',
      date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-CN') : item.date || ''
    }))
  } catch {
    // 静默失败，保留空列表
  } finally {
    historyLoading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const res = await api.crop.getStatistics()
    statistics.totalAnalysis = res.totalAnalysis ?? res.total ?? 0
    statistics.avgHealth = res.avgHealth ?? res.averageScore ?? 0
    statistics.monthlyNew = res.monthlyNew ?? res.thisMonth ?? 0
  } catch {
    // 静默失败
  }
}

const viewHistoryDetail = (item) => {
  Message.info(`查看 ${item.cropType || '作物'} 详情功能开发中`)
}

// ---- 工具函数 ----
const getScoreColor = (score) => {
  if (score >= 80) return '#52c41a'
  if (score >= 60) return '#fa8c16'
  return '#f5222d'
}

const getSeverityColor = (severity) => {
  const map = { '轻度': 'green', '中度': 'orange', '重度': 'red' }
  return map[severity] || 'blue'
}

const getSeverityHex = (severity) => {
  const map = { '轻度': '#52c41a', '中度': '#fa8c16', '重度': '#f5222d' }
  return map[severity] || '#1890ff'
}

const getSeverityPercent = (severity) => {
  const map = { '轻度': 30, '中度': 60, '重度': 90 }
  return map[severity] ?? 50
}

onMounted(() => {
  loadHistory()
  loadStatistics()
})
</script>

<style scoped>
.crop-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 页面标题 */
.page-header {
  margin-bottom: 24px;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1d2129;
  margin: 0 0 6px;
}
.page-subtitle {
  color: #86909c;
  margin: 0;
  font-size: 14px;
}
.header-stats {
  display: flex;
  gap: 32px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #52c41a;
  line-height: 1;
}
.stat-label {
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
}

/* 上传卡片 */
.upload-card {
  margin-bottom: 24px;
  border-radius: 12px;
}
.upload-zone {
  height: 400px;
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
  background: #fafafa;
}
.upload-zone:hover,
.upload-zone.drag-over {
  border-color: #52c41a;
  background: #f6ffed;
}
.upload-zone.has-image {
  border-style: solid;
  border-color: #52c41a;
}
.upload-placeholder {
  text-align: center;
  padding: 40px;
}
.upload-icon {
  font-size: 64px;
  margin-bottom: 16px;
}
.upload-text {
  font-size: 16px;
  color: #4e5969;
  margin: 0 0 8px;
}
.upload-hint {
  font-size: 13px;
  color: #86909c;
  margin: 0 0 20px;
}
.upload-btn {
  border-color: #52c41a;
  color: #52c41a;
}
.image-preview {
  width: 100%;
  height: 100%;
  position: relative;
}
.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.preview-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  padding: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}
.image-preview:hover .preview-overlay {
  opacity: 1;
}
.change-btn {
  color: #fff;
}

/* 控制区 */
.upload-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}
.control-label {
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
  margin: 0 0 8px;
}
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.analyze-btn {
  background: #52c41a;
  border-color: #52c41a;
}
.analyze-btn:hover {
  background: #73d13d;
  border-color: #73d13d;
}
.progress-section {
  margin-top: 8px;
}
.progress-text {
  font-size: 13px;
  color: #52c41a;
  margin: 8px 0 0;
  text-align: center;
}

/* 结果卡片 */
.result-card {
  margin-bottom: 24px;
  border-radius: 12px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 16px;
}
.score-section {
  text-align: center;
  padding: 16px 0;
}
.score-circle-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}
.score-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.score-number {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
}
.score-unit {
  font-size: 14px;
  color: #86909c;
}
.crop-info-tags {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.pest-section,
.advice-section {
  padding: 16px 0;
}
.pest-item {
  margin-bottom: 16px;
}
.pest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.pest-name {
  font-size: 14px;
  color: #1d2129;
}
.advice-step {
  font-size: 14px;
  color: #4e5969;
  line-height: 1.6;
}
.ai-analysis {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

/* 历史卡片 */
.history-card {
  border-radius: 12px;
}
.history-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.history-item {
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}
.history-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  border-color: #52c41a;
}
.history-thumb {
  height: 140px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumb-placeholder {
  font-size: 48px;
}
.history-info {
  padding: 12px;
}
.history-crop {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 6px;
}
.history-score-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.history-score {
  font-size: 18px;
  font-weight: 700;
}
.history-date {
  font-size: 12px;
  color: #86909c;
  margin: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-stats {
    gap: 20px;
  }
  .upload-zone {
    height: 240px;
  }
  .history-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 1024px) and (min-width: 769px) {
  .history-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
