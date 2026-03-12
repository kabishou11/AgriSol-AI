<template>
  <div class="energy-page">
    <!-- Header Stats -->
    <a-row :gutter="16" class="stats-row">
      <a-col :xs="24" :sm="12" :md="6">
        <a-card class="stat-card generation">
          <a-statistic
            title="今日发电"
            :value="todayData.generation"
            suffix="kWh"
            :precision="2"
          >
            <template #prefix>
              <icon-sun-fill :style="{ color: '#FFC107' }" />
            </template>
          </a-statistic>
          <div class="stat-trend">
            <icon-arrow-up v-if="trends.generation > 0" />
            <icon-arrow-down v-else />
            <span>{{ Math.abs(trends.generation) }}% 较昨日</span>
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :md="6">
        <a-card class="stat-card consumption">
          <a-statistic
            title="今日用电"
            :value="todayData.consumption"
            suffix="kWh"
            :precision="2"
          >
            <template #prefix>
              <icon-thunderbolt :style="{ color: '#2196F3' }" />
            </template>
          </a-statistic>
          <div class="stat-trend">
            <icon-arrow-up v-if="trends.consumption > 0" />
            <icon-arrow-down v-else />
            <span>{{ Math.abs(trends.consumption) }}% 较昨日</span>
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :md="6">
        <a-card class="stat-card self-sufficiency">
          <a-statistic
            title="能源自给率"
            :value="todayData.selfSufficiency"
            suffix="%"
            :precision="1"
          >
            <template #prefix>
              <icon-check-circle-fill :style="{ color: '#4CAF50' }" />
            </template>
          </a-statistic>
          <a-progress
            :percent="parseFloat(todayData.selfSufficiency)"
            :stroke-color="{
              '0%': '#4CAF50',
              '100%': '#8BC34A'
            }"
            :show-text="false"
            class="progress-bar"
          />
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :md="6">
        <a-card class="stat-card savings">
          <a-statistic
            title="今日节省"
            :value="todayData.savings"
            suffix="元"
            :precision="2"
          >
            <template #prefix>
              <icon-gift :style="{ color: '#FF9800' }" />
            </template>
          </a-statistic>
          <div class="stat-info">
            累计节省 {{ totalSavings }} 元
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- Main Content -->
    <a-row :gutter="16" class="content-row">
      <!-- Left Column -->
      <a-col :xs="24" :lg="16">
        <!-- Generation Forecast -->
        <a-card title="发电预测" class="forecast-card" :loading="loading.forecast">
          <template #extra>
            <a-space>
              <a-tag color="blue">未来7天</a-tag>
              <a-button type="text" size="small" @click="refreshForecast">
                <icon-refresh />
              </a-button>
            </a-space>
          </template>

          <div v-if="forecast.daily && forecast.daily.length > 0">
            <a-row :gutter="16" class="forecast-summary">
              <a-col :span="8">
                <div class="forecast-item">
                  <div class="label">预计总发电</div>
                  <div class="value">{{ forecast.total }} kWh</div>
                </div>
              </a-col>
              <a-col :span="8">
                <div class="forecast-item">
                  <div class="label">日均发电</div>
                  <div class="value">{{ forecast.averageDaily }} kWh</div>
                </div>
              </a-col>
              <a-col :span="8">
                <div class="forecast-item">
                  <div class="label">预计收益</div>
                  <div class="value">{{ (forecast.total * 0.5).toFixed(2) }} 元</div>
                </div>
              </a-col>
            </a-row>

            <a-table
              :columns="forecastColumns"
              :data="forecast.daily"
              :pagination="false"
              class="forecast-table"
            >
              <template #date="{ record }">
                {{ formatDate(record.date) }}
              </template>
              <template #generation="{ record }">
                <a-tag color="orange">{{ record.generation }} kWh</a-tag>
              </template>
              <template #sunshine="{ record }">
                {{ record.sunshineHours }} 小时
              </template>
              <template #weather="{ record }">
                <a-space>
                  <icon-sun-fill v-if="record.cloudCover < 30" style="color: #FFC107" />
                  <icon-cloud v-else-if="record.cloudCover < 70" style="color: #9E9E9E" />
                  <icon-cloud v-else style="color: #607D8B" />
                  <span>{{ record.cloudCover }}%</span>
                </a-space>
              </template>
            </a-table>
          </div>
          <a-empty v-else description="暂无预测数据" />
        </a-card>

        <!-- Charts -->
        <energy-charts
          :generation-data="chartData.generation"
          :consumption-data="chartData.consumption"
          :current-power="currentPower"
          :max-power="maxPower"
          class="charts-section"
        />
      </a-col>

      <!-- Right Column -->
      <a-col :xs="24" :lg="8">
        <!-- Optimization Recommendations -->
        <a-card title="优化建议" class="recommendations-card" :loading="loading.recommendations">
          <a-empty v-if="recommendations.length === 0" description="暂无建议" />
          <a-space direction="vertical" :size="12" v-else style="width: 100%">
            <a-alert
              v-for="(rec, index) in recommendations"
              :key="index"
              :type="rec.type"
              :title="rec.title"
              :description="rec.description"
              show-icon
            >
              <template #icon>
                <icon-exclamation-circle-fill v-if="rec.priority === 'high'" />
                <icon-info-circle-fill v-else-if="rec.priority === 'medium'" />
                <icon-check-circle-fill v-else />
              </template>
            </a-alert>
          </a-space>
        </a-card>

        <!-- Energy Storage Recommendations -->
        <a-card title="储能建议" class="storage-card" :loading="loading.storage">
          <a-descriptions :column="1" bordered>
            <a-descriptions-item label="建议容量">
              {{ storageRecommendations.recommendedCapacity }} kWh
            </a-descriptions-item>
            <a-descriptions-item label="多余发电">
              {{ storageRecommendations.excessGeneration }} kWh
            </a-descriptions-item>
            <a-descriptions-item label="电力缺口">
              {{ storageRecommendations.deficit }} kWh
            </a-descriptions-item>
            <a-descriptions-item label="回本周期">
              {{ storageRecommendations.paybackPeriod }} 年
            </a-descriptions-item>
            <a-descriptions-item label="年节省">
              {{ storageRecommendations.estimatedSavings }} 元
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- Equipment Management -->
        <a-card title="设备管理" class="devices-card">
          <template #extra>
            <a-button type="primary" size="small" @click="showAddDevice = true">
              <icon-plus /> 添加设备
            </a-button>
          </template>

          <a-list :data="devices" :loading="loading.devices">
            <template #item="{ item }">
              <a-list-item>
                <a-list-item-meta
                  :title="item.device_name"
                  :description="`容量: ${item.capacity} kW`"
                >
                  <template #avatar>
                    <a-avatar>
                      <icon-sun-fill v-if="item.device_type === 'solar'" />
                      <icon-thunderbolt v-else />
                    </a-avatar>
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a-tag :color="item.status === 'active' ? 'green' : 'red'">
                    {{ item.status === 'active' ? '运行中' : '已停用' }}
                  </a-tag>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>

    <!-- Add Device Modal -->
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconSunFill,
  IconThunderbolt,
  IconCheckCircleFill,
  IconGift,
  IconArrowUp,
  IconArrowDown,
  IconRefresh,
  IconCloud,
  IconExclamationCircleFill,
  IconInfoCircleFill,
  IconPlus
} from '@arco-design/web-vue/es/icon'
import EnergyCharts from '../components/charts/EnergyCharts.vue'
import api from '../api.js'

// State
const loading = ref({
  forecast: false,
  recommendations: false,
  storage: false,
  devices: false
})

const todayData = ref({
  generation: 0,
  consumption: 0,
  selfSufficiency: 0,
  savings: 0
})

const trends = ref({
  generation: 5.2,
  consumption: -3.1
})

const totalSavings = ref(1250.50)

const forecast = ref({
  daily: [],
  total: 0,
  averageDaily: 0
})

const recommendations = ref([])
const storageRecommendations = ref({
  recommendedCapacity: 0,
  excessGeneration: 0,
  deficit: 0,
  paybackPeriod: 0,
  estimatedSavings: 0
})

const devices = ref([])
const showAddDevice = ref(false)
const newDevice = ref({
  deviceName: '',
  deviceType: '',
  capacity: 0
})

const chartData = ref({
  generation: [],
  consumption: []
})

const currentPower = ref(0)
const maxPower = ref(10)

// Forecast table columns
const forecastColumns = [
  { title: '日期', dataIndex: 'date', slotName: 'date' },
  { title: '预计发电', dataIndex: 'generation', slotName: 'generation' },
  { title: '日照时长', dataIndex: 'sunshineHours', slotName: 'sunshine' },
  { title: '天气', dataIndex: 'cloudCover', slotName: 'weather' }
]

// Methods
const fetchTodayData = async () => {
  try {
    const data = await api.energy.getToday()
    todayData.value = data
    currentPower.value = parseFloat(data.generation) / 10 // Simulate current power
  } catch (error) {
    console.error('Failed to fetch today data:', error)
    Message.error('获取今日数据失败')
  }
}

const fetchForecast = async () => {
  loading.value.forecast = true
  try {
    const data = await api.energy.getForecast({
      latitude: 39.9,
      longitude: 116.4,
      capacity: 10
    })
    forecast.value = data.forecast
    recommendations.value = data.recommendations
    storageRecommendations.value = data.storage

    // Update chart data
    chartData.value.generation = data.forecast.daily.map(d => ({
      date: d.date,
      generation: parseFloat(d.generation)
    }))
  } catch (error) {
    console.error('Failed to fetch forecast:', error)
    Message.error('获取预测数据失败')
  } finally {
    loading.value.forecast = false
  }
}

const fetchDevices = async () => {
  loading.value.devices = true
  try {
    const data = await api.energy.getDevices()
    devices.value = data.devices
  } catch (error) {
    console.error('Failed to fetch devices:', error)
    Message.error('获取设备列表失败')
  } finally {
    loading.value.devices = false
  }
}

const fetchStatistics = async () => {
  try {
    const data = await api.energy.getStatistics({ period: 'week' })
    chartData.value.consumption = data.daily.map(d => ({
      date: d.date,
      consumption: parseFloat(d.consumption)
    }))
  } catch (error) {
    console.error('Failed to fetch statistics:', error)
  }
}

const refreshForecast = () => {
  fetchForecast()
}

const handleAddDevice = async () => {
  if (!newDevice.value.deviceName || !newDevice.value.deviceType) {
    Message.warning('请填写完整信息')
    return
  }

  try {
    await api.energy.addDevice(newDevice.value)
    Message.success('设备添加成功')
    showAddDevice.value = false
    newDevice.value = { deviceName: '', deviceType: '', capacity: 0 }
    fetchDevices()
  } catch (error) {
    console.error('Failed to add device:', error)
    Message.error('添加设备失败')
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[date.getDay()]
  return `${month}月${day}日 周${weekday}`
}

// Lifecycle
onMounted(() => {
  fetchTodayData()
  fetchForecast()
  fetchDevices()
  fetchStatistics()

  // Auto refresh every 30 seconds
  setInterval(() => {
    fetchTodayData()
    currentPower.value = (Math.random() * 8 + 2).toFixed(2)
  }, 30000)
})
</script>

<style scoped>
.energy-page {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stat-card.generation {
  border-left: 4px solid #FFC107;
}

.stat-card.consumption {
  border-left: 4px solid #2196F3;
}

.stat-card.self-sufficiency {
  border-left: 4px solid #4CAF50;
}

.stat-card.savings {
  border-left: 4px solid #FF9800;
}

.stat-trend {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-info {
  margin-top: 12px;
  font-size: 12px;
  color: #999;
}

.progress-bar {
  margin-top: 12px;
}

.content-row {
  margin-top: 20px;
}

.forecast-card,
.recommendations-card,
.storage-card,
.devices-card {
  margin-bottom: 16px;
}

.forecast-summary {
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.forecast-item {
  text-align: center;
}

.forecast-item .label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.forecast-item .value {
  font-size: 24px;
  font-weight: bold;
}

.forecast-table {
  margin-top: 16px;
}

.charts-section {
  margin-top: 16px;
}

.recommendations-card :deep(.arco-alert) {
  margin-bottom: 12px;
}

.storage-card :deep(.arco-descriptions-item-label) {
  font-weight: 500;
}

@media (max-width: 768px) {
  .energy-page {
    padding: 12px;
  }

  .forecast-summary {
    padding: 12px;
  }

  .forecast-item .value {
    font-size: 18px;
  }
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.stat-card :deep(.arco-statistic-value) {
  animation: pulse 2s ease-in-out infinite;
}
</style>

