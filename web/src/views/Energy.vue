<template>
  <div class="energy-page">
    <a-page-header title="能源经营决策页" subtitle="全国通用 + 寿光样板 + 用户录入三口径" />

    <a-card class="decision-bar" :bordered="false">
      <template #title>口径与地区</template>
      <a-row :gutter="12" align="center">
        <a-col :xs="24" :md="10">
          <a-space>
            <span class="label">模式</span>
            <a-radio-group v-model="mode" type="button" @change="handleModeChange">
              <a-radio value="national">全国通用</a-radio>
              <a-radio value="shouguang">寿光样板</a-radio>
            </a-radio-group>
          </a-space>
        </a-col>
        <a-col :xs="24" :md="8">
          <a-space>
            <span class="label">地区代码</span>
            <a-input v-model="regionCode" allow-clear placeholder="例如 SD-WF-SG" style="width: 180px" />
          </a-space>
        </a-col>
        <a-col :xs="24" :md="6" style="text-align: right">
          <a-space>
            <a-tag color="blue">{{ overview.regionName || regionName }}</a-tag>
            <a-button type="outline" @click="showRecordModal = true">
              <template #icon><icon-plus /></template>
              录入数据
            </a-button>
            <a-button type="primary" :loading="loading.overview" @click="loadOverview">
              <template #icon><icon-refresh /></template>
              刷新口径
            </a-button>
          </a-space>
        </a-col>
      </a-row>
      <div class="decision-note">
        三口径说明：<b>模型估算</b>用于快速判断，<b>寿光样板</b>用于跨区对照，<b>用户录入</b>作为经营复盘依据。
      </div>
    </a-card>

    <a-row :gutter="16" class="stats-row">
      <a-col :xs="24" :sm="12" :md="6" v-for="card in decisionCards" :key="card.key">
        <a-card class="stat-card">
          <a-statistic :title="card.title" :value="card.value" :precision="card.precision || 1" :suffix="card.suffix" />
          <div class="stat-subtitle">{{ card.subtitle }}</div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="caliber-row">
      <a-col :xs="24" :lg="8" v-for="caliber in calibers" :key="caliber.key">
        <a-card :title="caliber.label" class="caliber-card" :bordered="false">
          <div class="caliber-metrics">
            <div class="metric-item">
              <span>发电</span>
              <strong>{{ formatNumber(caliber.data.generationKwh, 2) }} kWh</strong>
            </div>
            <div class="metric-item">
              <span>用电</span>
              <strong>{{ formatNumber(caliber.data.consumptionKwh, 2) }} kWh</strong>
            </div>
            <div class="metric-item">
              <span>自给率</span>
              <strong>{{ formatNumber(caliber.data.selfSufficiencyPct, 1) }}%</strong>
            </div>
            <div class="metric-item">
              <span>节省</span>
              <strong>{{ formatNumber(caliber.data.savingsYuan, 2) }} 元</strong>
            </div>
          </div>
          <div class="caliber-status">{{ caliber.data.statusLabel || '—' }}</div>
          <div class="caliber-meta">
            <a-tag size="small" color="blue">来源: {{ caliber.meta.caliberLabel || caliber.meta.sourceType || '-' }}</a-tag>
            <a-tag size="small" color="green">置信度: {{ confidencePercent(caliber.meta.confidence) }}</a-tag>
            <a-tag size="small" color="purple">更新时间: {{ formatDateTime(caliber.meta.updatedAt) }}</a-tag>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="main-row">
      <a-col :xs="24" :lg="16">
        <energy-charts
          :generation-data="chartData.generation"
          :consumption-data="chartData.consumption"
          :current-power="currentPower"
          :max-power="maxPower"
        />
      </a-col>
      <a-col :xs="24" :lg="8">
        <a-card title="自动解释" :bordered="false" class="interpret-card">
          <a-alert v-for="(item, idx) in autoInsights" :key="idx" :type="item.type" :title="item.title" :description="item.desc" show-icon />
        </a-card>
      </a-col>
    </a-row>

    <a-collapse :default-active-key="['time-series']" class="detail-collapse">
      <a-collapse-item key="forecast" header="预测明细（用于短期排班与调度）">
        <a-card :bordered="false" :loading="loading.forecast">
          <a-row :gutter="12" class="forecast-summary">
            <a-col :span="8">
              <div class="summary-item">
                <div class="label">预测总发电</div>
                <div class="value">{{ forecast.total || 0 }} kWh</div>
              </div>
            </a-col>
            <a-col :span="8">
              <div class="summary-item">
                <div class="label">平均日发电</div>
                <div class="value">{{ forecast.averageDaily || 0 }} kWh</div>
              </div>
            </a-col>
            <a-col :span="8">
              <div class="summary-item">
                <div class="label">预测日数</div>
                <div class="value">{{ forecast.daily?.length || 0 }} 天</div>
              </div>
            </a-col>
          </a-row>
          <a-table :columns="forecastColumns" :data="forecast.daily || []" :pagination="false" size="small">
            <template #generation="{ record }">{{ record.generation }} kWh</template>
            <template #sunshine="{ record }">{{ record.sunshineHours }} 小时</template>
            <template #weather="{ record }">{{ record.cloudCover }}%</template>
          </a-table>
        </a-card>
      </a-collapse-item>

      <a-collapse-item key="time-series" header="时序预测（用于中短期走势判断）">
        <time-series-prediction :historical-data="chartData.generation" />
      </a-collapse-item>

      <a-collapse-item key="storage" header="储能建议（用于设备投资评估）">
        <a-card :bordered="false">
          <a-descriptions :column="1" bordered>
            <a-descriptions-item label="建议容量">{{ storageRecommendations.recommendedCapacity }} kWh</a-descriptions-item>
            <a-descriptions-item label="多余发电">{{ storageRecommendations.excessGeneration }} kWh</a-descriptions-item>
            <a-descriptions-item label="电力缺口">{{ storageRecommendations.deficit }} kWh</a-descriptions-item>
            <a-descriptions-item label="回本周期">{{ storageRecommendations.paybackPeriod }} 年</a-descriptions-item>
            <a-descriptions-item label="预计年节省">{{ storageRecommendations.estimatedSavings }} 元</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-collapse-item>

      <a-collapse-item key="devices" header="设备管理（用于资产台账维护）">
        <a-card :bordered="false">
          <template #extra>
            <a-button type="primary" size="small" @click="showAddDevice = true">
              <icon-plus /> 添加设备
            </a-button>
          </template>
          <a-list :data="devices" :loading="loading.devices">
            <template #item="{ item }">
              <a-list-item>
                <a-list-item-meta :title="item.device_name" :description="`容量: ${item.capacity || 0} kW`" />
                <template #actions>
                  <a-tag :color="item.status === 'active' ? 'green' : 'red'">
                    {{ item.status === 'active' ? '运行中' : '已停用' }}
                  </a-tag>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-collapse-item>
    </a-collapse>

    <a-modal
      v-model:visible="showAddDevice"
      title="添加设备"
      @ok="handleAddDevice"
      @cancel="showAddDevice = false"
    >
      <a-form :model="newDevice" layout="vertical">
        <a-form-item label="设备名称" required>
          <a-input v-model="newDevice.deviceName" placeholder="请输入设备名称" />
        </a-form-item>
        <a-form-item label="设备类型" required>
          <a-select v-model="newDevice.deviceType" placeholder="请选择设备类型">
            <a-option value="solar">太阳能板</a-option>
            <a-option value="wind">风力发电</a-option>
            <a-option value="battery">储能系统</a-option>
            <a-option value="inverter">逆变器</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="容量 (kW)">
          <a-input-number v-model="newDevice.capacity" :min="0" :step="0.1" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:visible="showRecordModal"
      title="录入今日能源数据"
      @ok="handleRecordSubmit"
      @cancel="showRecordModal = false"
      :ok-loading="recordLoading"
    >
      <a-form :model="recordForm" layout="vertical">
        <a-form-item label="发电量 (kWh)" required>
          <a-input-number v-model="recordForm.generation" :min="0" :step="0.1" placeholder="请输入今日发电量" style="width: 100%" />
        </a-form-item>
        <a-form-item label="用电量 (kWh)" required>
          <a-input-number v-model="recordForm.consumption" :min="0" :step="0.1" placeholder="请输入今日用电量" style="width: 100%" />
        </a-form-item>
        <a-form-item label="上网电量 (kWh)">
          <a-input-number v-model="recordForm.gridExport" :min="0" :step="0.1" placeholder="可选" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus, IconRefresh } from '@arco-design/web-vue/es/icon'
import EnergyCharts from '../components/charts/EnergyCharts.vue'
import TimeSeriesPrediction from '../components/charts/TimeSeriesPrediction.vue'
import api from '../api.js'

const userId = 1

const mode = ref('national')
const regionCode = ref('')

const loading = ref({
  overview: false,
  forecast: false,
  devices: false
})

const overview = ref({
  regionName: '全国通用',
  estimate: {},
  sample: {},
  userInput: {},
  sourceMeta: {}
})

const forecast = ref({ daily: [], total: 0, averageDaily: 0 })
const devices = ref([])

const storageRecommendations = ref({
  recommendedCapacity: 0,
  excessGeneration: 0,
  deficit: 0,
  paybackPeriod: 0,
  estimatedSavings: 0
})

const showAddDevice = ref(false)
const newDevice = ref({ deviceName: '', deviceType: '', capacity: 0 })

const showRecordModal = ref(false)
const recordForm = ref({
  generation: null,
  consumption: null,
  gridExport: null
})
const recordLoading = ref(false)

const chartData = ref({ generation: [], consumption: [] })
const currentPower = ref(0)
const maxPower = ref(12)

let refreshTimer = null
let refreshing = false

const regionName = computed(() => (mode.value === 'shouguang' ? '山东寿光样板' : '全国通用'))

const isDefinedNumber = (value) => value !== null && value !== undefined
const pickCaliberValue = (userValue, estimateValue) => (isDefinedNumber(userValue) ? userValue : (isDefinedNumber(estimateValue) ? estimateValue : 0))

const decisionCards = computed(() => {
  const estimate = overview.value.estimate || {}
  const userInput = overview.value.userInput || {}
  const hasUserGeneration = isDefinedNumber(userInput.generationKwh)
  const hasUserConsumption = isDefinedNumber(userInput.consumptionKwh)
  const hasUserSufficiency = isDefinedNumber(userInput.selfSufficiencyPct)
  const hasUserSavings = isDefinedNumber(userInput.savingsYuan)

  return [
    {
      key: 'generation',
      title: '今日发电（决策口径）',
      value: Number(pickCaliberValue(userInput.generationKwh, estimate.generationKwh)),
      suffix: 'kWh',
      subtitle: hasUserGeneration ? '优先使用用户录入' : '用户缺失时使用模型估算'
    },
    {
      key: 'consumption',
      title: '今日用电（决策口径）',
      value: Number(pickCaliberValue(userInput.consumptionKwh, estimate.consumptionKwh)),
      suffix: 'kWh',
      subtitle: hasUserConsumption ? '优先使用用户录入' : '用户缺失时使用模型估算'
    },
    {
      key: 'sufficiency',
      title: '自给率（决策口径）',
      value: Number(pickCaliberValue(userInput.selfSufficiencyPct, estimate.selfSufficiencyPct)),
      suffix: '%',
      subtitle: hasUserSufficiency ? '优先使用用户录入' : '用于判断是否需要削峰移谷'
    },
    {
      key: 'savings',
      title: '节省金额（决策口径）',
      value: Number(pickCaliberValue(userInput.savingsYuan, estimate.savingsYuan)),
      suffix: '元',
      precision: 2,
      subtitle: hasUserSavings ? '优先使用用户录入' : '用于评估日经营收益'
    }
  ]
})

const calibers = computed(() => {
  const sourceMeta = overview.value.sourceMeta || {}
  return [
    {
      key: 'estimate',
      label: '模型估算',
      data: overview.value.estimate || {},
      meta: sourceMeta.estimate || {}
    },
    {
      key: 'sample',
      label: '寿光样板参考',
      data: overview.value.sample || {},
      meta: sourceMeta.sample || {}
    },
    {
      key: 'userInput',
      label: '用户录入',
      data: overview.value.userInput || {},
      meta: sourceMeta.userInput || {}
    }
  ]
})

const autoInsights = computed(() => {
  const estimate = overview.value.estimate || {}
  const userInput = overview.value.userInput || {}
  const sample = overview.value.sample || {}

  const effective = {
    generationKwh: Number(pickCaliberValue(userInput.generationKwh, estimate.generationKwh)),
    consumptionKwh: Number(pickCaliberValue(userInput.consumptionKwh, estimate.consumptionKwh)),
    selfSufficiencyPct: Number(pickCaliberValue(userInput.selfSufficiencyPct, estimate.selfSufficiencyPct)),
    statusLabel: userInput.statusLabel || estimate.statusLabel || ''
  }

  const items = []

  if (effective.generationKwh === 0 && effective.consumptionKwh === 0) {
    items.push({
      type: 'info',
      title: '当前暂无有效经营数据',
      desc: effective.statusLabel || '请先录入今日发用电数据，系统将给出更可靠的经营结论。'
    })
  } else if (effective.selfSufficiencyPct < 70) {
    items.push({
      type: 'warning',
      title: '今日自给率偏低',
      desc: `自给率 ${formatNumber(effective.selfSufficiencyPct, 1)}%，建议将高耗能作业转移到发电高峰时段。`
    })
  } else {
    items.push({
      type: 'success',
      title: '今日发用电协同良好',
      desc: `自给率 ${formatNumber(effective.selfSufficiencyPct, 1)}%，可保持当前运行策略。`
    })
  }

  const gap = Number(sample.generationKwh || 0) - Number(estimate.generationKwh || 0)
  items.push({
    type: gap >= 0 ? 'info' : 'warning',
    title: '样板对照结论',
    desc: `寿光样板与本地估算发电差值 ${formatNumber(gap, 1)} kWh，可用于判断区域优化空间。`
  })

  return items
})

const forecastColumns = [
  { title: '日期', dataIndex: 'date' },
  { title: '预计发电', dataIndex: 'generation', slotName: 'generation' },
  { title: '日照时长', dataIndex: 'sunshineHours', slotName: 'sunshine' },
  { title: '云量', dataIndex: 'cloudCover', slotName: 'weather' }
]

const formatNumber = (value, digits = 1) => Number(value || 0).toFixed(digits)

const confidencePercent = (value) => `${Math.round(Number(value || 0) * 100)}%`

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

const loadOverview = async () => {
  loading.value.overview = true
  try {
    const date = new Date().toISOString().slice(0, 10)
    const data = await api.energy.getOverview({
      date,
      mode: mode.value,
      regionCode: regionCode.value || undefined,
      userId
    })

    overview.value = {
      regionName: data.regionName || regionName.value,
      estimate: data.estimate || {},
      sample: data.sample || {},
      userInput: data.userInput || {},
      sourceMeta: data.sourceMeta || {}
    }
  } catch {
    Message.warning('加载能源口径数据失败')
  } finally {
    loading.value.overview = false
  }
}

const loadForecast = async () => {
  loading.value.forecast = true
  try {
    const data = await api.energy.getForecast({ latitude: 39.9, longitude: 116.4, capacity: 10 })
    forecast.value = data.forecast || { daily: [], total: 0, averageDaily: 0 }
    storageRecommendations.value = data.storage || storageRecommendations.value
  } catch {
    Message.warning('加载预测数据失败')
  } finally {
    loading.value.forecast = false
  }
}

const loadStatistics = async () => {
  try {
    const data = await api.energy.getStatistics({ period: 'month', userId })
    const daily = data.daily || []
    chartData.value = {
      generation: daily.map((d) => ({ date: d.date, generation: Number(d.generation || 0), consumption: Number(d.consumption || 0) })),
      consumption: daily.map((d) => ({ date: d.date, consumption: Number(d.consumption || 0) }))
    }
    const latest = chartData.value.generation[chartData.value.generation.length - 1]
    currentPower.value = Number(latest?.generation || 0)
  } catch {
    chartData.value = { generation: [], consumption: [] }
  }
}

const loadDevices = async () => {
  loading.value.devices = true
  try {
    const data = await api.energy.getDevices({ userId })
    devices.value = data.devices || []
  } catch {
    devices.value = []
  } finally {
    loading.value.devices = false
  }
}

const handleAddDevice = async () => {
  if (!newDevice.value.deviceName || !newDevice.value.deviceType) {
    Message.warning('请填写完整设备信息')
    return
  }
  try {
    await api.energy.addDevice({ ...newDevice.value, userId })
    Message.success('设备添加成功')
    showAddDevice.value = false
    newDevice.value = { deviceName: '', deviceType: '', capacity: 0 }
    loadDevices()
  } catch {
    Message.error('设备添加失败')
  }
}

const handleRecordSubmit = async () => {
  if (recordForm.value.generation === null || recordForm.value.consumption === null) {
    Message.warning('请填写发电量和用电量')
    return
  }
  recordLoading.value = true
  try {
    await api.energy.record({
      generation: recordForm.value.generation,
      consumption: recordForm.value.consumption,
      gridExport: recordForm.value.gridExport || 0,
      userId
    })
    Message.success('数据录入成功')
    showRecordModal.value = false
    recordForm.value = { generation: null, consumption: null, gridExport: null }
    await loadOverview()
  } catch {
    Message.error('数据录入失败')
  } finally {
    recordLoading.value = false
  }
}

const handleModeChange = () => {
  loadOverview()
}

const refreshCoreData = async () => {
  if (refreshing) return
  refreshing = true
  try {
    await Promise.all([loadOverview(), loadStatistics()])
  } finally {
    refreshing = false
  }
}

onMounted(async () => {
  await Promise.all([loadOverview(), loadForecast(), loadStatistics(), loadDevices()])

  refreshTimer = setInterval(() => {
    refreshCoreData()
  }, 30000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style scoped>
.energy-page {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  min-height: 100vh;
  position: relative;
}

.energy-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.energy-page > * {
  position: relative;
  z-index: 1;
}

.decision-bar {
  margin-bottom: 20px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.label {
  color: #4e5969;
  font-size: 14px;
  font-weight: 500;
}

.decision-note {
  margin-top: 16px;
  padding: 12px;
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
  border-radius: 10px;
  color: #d46b08;
  font-size: 14px;
  border-left: 4px solid #ff9500;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-left: 5px solid #1890ff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
}

.stat-subtitle {
  margin-top: 10px;
  font-size: 13px;
  color: #86909c;
  font-weight: 400;
}

.caliber-row {
  margin-bottom: 20px;
}

.caliber-card {
  min-height: 240px;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.caliber-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
}

.caliber-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.metric-item {
  background: linear-gradient(135deg, #f7f8fa 0%, #e9ecef 100%);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.2s;
}

.metric-item:hover {
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  transform: scale(1.02);
}

.metric-item span {
  color: #86909c;
  font-size: 13px;
  font-weight: 500;
}

.metric-item strong {
  font-size: 16px;
  color: #1d2129;
  font-weight: 600;
}

.caliber-status {
  color: #4e5969;
  font-size: 14px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
  border-radius: 8px;
  font-weight: 500;
}

.caliber-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.main-row {
  margin-bottom: 20px;
}

.main-row :deep(.arco-card) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.interpret-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.interpret-card :deep(.arco-alert) {
  margin-bottom: 12px;
  border-radius: 10px;
}

.detail-collapse {
  margin-top: 12px;
  border-radius: 12px;
  overflow: hidden;
}

.detail-collapse :deep(.arco-collapse-item) {
  background: #ffffff;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.forecast-summary {
  margin-bottom: 16px;
}

.summary-item {
  background: linear-gradient(135deg, #f2f3f5 0%, #e9ecef 100%);
  border-radius: 10px;
  padding: 14px;
  text-align: center;
  transition: all 0.2s;
}

.summary-item:hover {
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  transform: scale(1.02);
}

.summary-item .label {
  color: #86909c;
  font-size: 13px;
  font-weight: 500;
}

.summary-item .value {
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
  margin-top: 6px;
}
</style>
