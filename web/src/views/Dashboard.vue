<template>
  <div class="dashboard-container">
    <a-page-header title="每日经营简报" subtitle="围绕经营决策与成果沉淀" />

    <a-card class="briefing-card" :bordered="false">
      <template #title>
        <a-space>
          <span>🧠 AI 每日简报</span>
          <a-tag color="purple" size="small">固定行动映射</a-tag>
        </a-space>
      </template>
      <template #extra>
        <a-space>
          <a-radio-group v-model="regionMode" type="button" size="small" @change="handleModeChange">
            <a-radio value="national">全国通用</a-radio>
            <a-radio value="shouguang">寿光样板</a-radio>
          </a-radio-group>
          <a-button size="small" :loading="insightLoading" @click="loadInsights(false)">
            <template #icon><icon-refresh /></template>
            刷新
          </a-button>
          <a-button type="primary" size="small" :loading="insightLoading" @click="loadInsights(true)">
            重新生成今日简报
          </a-button>
        </a-space>
      </template>

      <div class="briefing-meta">
        <a-tag :color="briefingMeta.cached ? 'green' : 'arcoblue'">
          {{ briefingMeta.cached ? '缓存命中' : '实时生成' }}
        </a-tag>
        <a-tag color="blue">{{ briefingMeta.regionName || regionLabel }}</a-tag>
        <a-tag color="gold">数据范围: {{ briefingMeta.dataWindow || '-' }}</a-tag>
        <a-tag color="purple">生成时间: {{ formatDateTime(briefingMeta.generatedAt) }}</a-tag>
      </div>

      <div v-if="insightLoading" class="insight-loading">
        <div class="insight-skeleton" v-for="i in 4" :key="i"></div>
      </div>

      <div v-else-if="insights.length" class="insight-cards">
        <div
          v-for="item in insights"
          :key="item.id"
          class="insight-card"
          :class="item.level"
        >
          <div class="insight-card-icon">{{ item.icon }}</div>
          <div class="insight-card-body">
            <div class="insight-card-title">{{ item.title }}</div>
            <div class="insight-card-desc">{{ item.desc }}</div>
          </div>
          <a-button
            v-if="actionMap[item.actionKey]"
            type="text"
            size="mini"
            class="insight-action"
            @click="goByAction(item.actionKey)"
          >
            查看详情 →
          </a-button>
        </div>
      </div>

      <a-empty v-else description="暂无今日简报" />
    </a-card>

    <a-row :gutter="16" class="metrics-row">
      <a-col :span="6">
        <a-card class="metric-card agriculture">
          <a-statistic title="农业健康" :value="overview.agriculture.avgHealthScore" :precision="1" suffix="分">
            <template #prefix>🌾</template>
          </a-statistic>
          <div class="trend" :class="{ positive: overview.agriculture.trend > 0 }">
            <icon-arrow-up v-if="overview.agriculture.trend > 0" />
            <icon-arrow-down v-else />
            {{ Math.abs(overview.agriculture.trend) }}%
          </div>
          <div class="subtitle">分析次数: {{ overview.agriculture.totalAnalysis }}</div>
        </a-card>
      </a-col>

      <a-col :span="6">
        <a-card class="metric-card energy">
          <a-statistic title="近30天日均发电" :value="overview.energy.avgGeneration" :precision="1" suffix="kWh">
            <template #prefix><icon-sun /></template>
          </a-statistic>
          <div class="trend" :class="{ positive: overview.energy.trend > 0 }">
            <icon-arrow-up v-if="overview.energy.trend > 0" />
            <icon-arrow-down v-else />
            {{ Math.abs(overview.energy.trend) }}%
          </div>
          <div class="subtitle">总发电: {{ overview.energy.totalGeneration.toFixed(1) }} kWh</div>
        </a-card>
      </a-col>

      <a-col :span="6">
        <a-card class="metric-card carbon">
          <a-statistic title="累计固碳" :value="overview.carbon.totalCarbonTons" :precision="2" suffix="吨CO₂">
            <template #prefix><icon-cloud /></template>
          </a-statistic>
          <div class="trend" :class="{ positive: overview.carbon.trend > 0 }">
            <icon-arrow-up v-if="overview.carbon.trend > 0" />
            <icon-arrow-down v-else />
            {{ Math.abs(overview.carbon.trend) }}%
          </div>
          <div class="subtitle">本月新增: {{ overview.carbon.monthlyCarbonTons.toFixed(2) }} 吨</div>
        </a-card>
      </a-col>

      <a-col :span="6">
        <a-card class="metric-card environment">
          <a-statistic title="环境评分" :value="overview.environment.envScore" :precision="1" suffix="分">
            <template #prefix>🌿</template>
          </a-statistic>
          <div class="trend" :class="{ positive: overview.environment.trend > 0 }">
            <icon-arrow-up v-if="overview.environment.trend > 0" />
            <icon-arrow-down v-else />
            {{ Math.abs(overview.environment.trend) }}%
          </div>
          <div class="subtitle">生物多样性: {{ overview.environment.biodiversityScore.toFixed(1) }}</div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="charts-row">
      <a-col :span="16">
        <a-card title="经营趋势" :bordered="false">
          <a-space>
            <a-radio-group v-model="trendType" type="button" @change="loadTrends">
              <a-radio value="crops">作物健康</a-radio>
              <a-radio value="energy">能源</a-radio>
              <a-radio value="carbon">碳汇趋势</a-radio>
              <a-radio value="environment">环境评分</a-radio>
            </a-radio-group>
            <a-radio-group v-model="trendPeriod" type="button" @change="loadTrends">
              <a-radio value="7d">7天</a-radio>
              <a-radio value="30d">30天</a-radio>
              <a-radio value="90d">90天</a-radio>
            </a-radio-group>
          </a-space>
          <DashboardCharts :data="trendsData" :type="trendType" style="margin-top: 20px" />
        </a-card>
      </a-col>

      <a-col :span="8">
        <a-card title="快速操作" :bordered="false" class="quick-actions">
          <a-space direction="vertical" fill>
            <a-button type="primary" long @click="router.push('/crop')">🌾 作物分析</a-button>
            <a-button type="primary" long @click="router.push('/energy')"><icon-sun /> 能源经营</a-button>
            <a-button type="primary" long @click="router.push('/carbon')"><icon-cloud /> 碳账本</a-button>
            <a-button type="primary" long @click="router.push('/environment')">🌱 环境监测</a-button>
          </a-space>
        </a-card>

        <a-card title="最近活动" :bordered="false" style="margin-top: 16px">
          <a-empty v-if="recentActivities.length === 0" description="暂无活动" />
          <a-timeline v-else>
            <a-timeline-item v-for="(activity, index) in recentActivities" :key="index">
              <div class="activity-item">
                <div class="activity-title">{{ activity.action_type || activity.title || '系统活动' }}</div>
                <div class="activity-time">{{ formatDateTime(activity.created_at || activity.time) }}</div>
              </div>
            </a-timeline-item>
          </a-timeline>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import api from '../api'
import DashboardCharts from '../components/charts/DashboardCharts.vue'
import {
  IconSun,
  IconCloud,
  IconArrowUp,
  IconArrowDown,
  IconRefresh
} from '@arco-design/web-vue/es/icon'

const router = useRouter()
const userId = 1

const regionMode = ref('national')

const overview = ref({
  agriculture: { totalAnalysis: 0, avgHealthScore: 0, trend: 0 },
  energy: { totalGeneration: 0, avgGeneration: 0, totalRecords: 0, trend: 0 },
  carbon: { totalCarbonTons: 0, monthlyCarbonTons: 0, equivalentTrees: 0, trend: 0 },
  environment: { envScore: 0, biodiversityScore: 0, trend: 0 },
  wisdom: { totalRecords: 0, monthlyNew: 0, topCategory: '', trend: 0 }
})

const trendType = ref('energy')
const trendPeriod = ref('30d')
const trendsData = ref([])

const insights = ref([])
const insightLoading = ref(false)
const briefingMeta = ref({})

const recentActivities = ref([])

const actionMap = {
  OPEN_CROP: '/crop',
  OPEN_ENERGY: '/energy',
  OPEN_ENVIRONMENT: '/environment',
  OPEN_CARBON: '/carbon'
}

const regionLabel = computed(() => (
  regionMode.value === 'shouguang' ? '山东寿光样板' : '全国通用'
))

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

const goByAction = (actionKey) => {
  const target = actionMap[actionKey]
  if (!target) {
    Message.warning('该洞察暂不支持跳转')
    return
  }
  router.push(target)
}

const loadOverview = async () => {
  try {
    const data = await api.statistics.getOverview({ userId })
    const d = data || {}
    overview.value = {
      agriculture: {
        totalAnalysis: Number(d.agriculture?.totalAnalysis || 0),
        avgHealthScore: Number(d.agriculture?.avgHealthScore || 0),
        trend: Number(d.agriculture?.trend || 0)
      },
      energy: {
        totalGeneration: Number(d.energy?.generationKwh || d.energy?.totalGeneration || 0),
        avgGeneration: Number(d.energy?.avgGeneration || 0),
        totalRecords: Number(d.energy?.totalRecords || 0),
        trend: Number(d.energy?.trend || 0)
      },
      carbon: {
        totalCarbonTons: Number(d.carbon?.totalCarbonTons || d.carbon?.totalSequestered || 0),
        monthlyCarbonTons: Number(d.carbon?.monthlyCarbonTons || d.carbon?.monthlyNew || 0),
        equivalentTrees: Number(d.carbon?.equivalentTrees || 0),
        trend: Number(d.carbon?.trend || 0)
      },
      environment: {
        envScore: Number(d.environment?.envScore || 0),
        biodiversityScore: Number(d.environment?.biodiversityScore || 0),
        trend: Number(d.environment?.trend || 0)
      },
      wisdom: {
        totalRecords: Number(d.wisdom?.totalRecords || 0),
        monthlyNew: Number(d.wisdom?.monthlyNew || 0),
        topCategory: d.wisdom?.topCategory || '',
        trend: Number(d.wisdom?.trend || 0)
      }
    }
  } catch {
    Message.warning('加载概览数据失败')
  }
}

const loadTrends = async () => {
  try {
    const data = await api.statistics.getTrends({ period: trendPeriod.value, userId })

    if (trendType.value === 'crops') {
      trendsData.value = data.cropTrend || []
      return
    }

    if (trendType.value === 'energy') {
      trendsData.value = data.energyTrend || []
      return
    }

    if (trendType.value === 'carbon') {
      trendsData.value = data.monthlyTrend || data.carbonTrend || []
      return
    }

    trendsData.value = data.environmentTrend || []
  } catch {
    trendsData.value = []
    Message.warning('加载趋势数据失败')
  }
}

const loadSummary = async () => {
  try {
    const data = await api.statistics.getSummary({ userId })
    recentActivities.value = data?.recentActivities || []
  } catch {
    recentActivities.value = []
  }
}

const loadInsights = async (forceRefresh = false) => {
  insightLoading.value = true
  try {
    const today = new Date().toISOString().slice(0, 10)
    const res = await api.ai.getDailyInsights({
      date: today,
      mode: regionMode.value,
      forceRefresh,
      userId
    })

    insights.value = (res?.insights || []).map((item, index) => ({
      id: `${index}-${item.actionKey || 'none'}`,
      ...item
    }))

    briefingMeta.value = {
      generatedAt: res?.meta?.generatedAt,
      cached: Boolean(res?.meta?.cached),
      regionMode: res?.meta?.regionMode || regionMode.value,
      regionName: res?.meta?.regionName || regionLabel.value,
      dataWindow: res?.meta?.dataWindow || '-'
    }

    if (forceRefresh) {
      Message.success('已重新生成今日简报')
    }
  } catch {
    insights.value = []
    briefingMeta.value = {
      generatedAt: new Date().toISOString(),
      cached: false,
      regionMode: regionMode.value,
      regionName: regionLabel.value,
      dataWindow: '-'
    }
    Message.warning('加载今日简报失败')
  } finally {
    insightLoading.value = false
  }
}

const handleModeChange = async () => {
  await loadInsights(false)
}

onMounted(async () => {
  await Promise.all([
    loadOverview(),
    loadTrends(),
    loadSummary(),
    loadInsights(false)
  ])
})
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;
}

.dashboard-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.dashboard-container > * {
  position: relative;
  z-index: 1;
}

.briefing-card {
  margin-bottom: 20px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.briefing-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
  padding: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 10px;
}

.insight-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.insight-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 14px;
  border-left: 5px solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.insight-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.insight-card.success {
  background: linear-gradient(135deg, #f0fff4 0%, #e6f9ed 100%);
  border-left-color: #52c41a;
}

.insight-card.warning {
  background: linear-gradient(135deg, #fffbf0 0%, #fff4e6 100%);
  border-left-color: #ff9500;
}

.insight-card.danger {
  background: linear-gradient(135deg, #fff1f0 0%, #ffe8e6 100%);
  border-left-color: #ff4d4f;
}

.insight-card.info {
  background: linear-gradient(135deg, #f2f3ff 0%, #e8eaff 100%);
  border-left-color: #1890ff;
}

.insight-card-icon {
  font-size: 28px;
  margin-top: 2px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.insight-card-body {
  flex: 1;
  padding-right: 90px;
  min-width: 0;
}

.insight-card-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1d2129;
  letter-spacing: -0.01em;
}

.insight-card-desc {
  font-size: 14px;
  color: #4e5969;
  line-height: 1.7;
  word-wrap: break-word;
  word-break: break-word;
  letter-spacing: 0.01em;
}

.insight-action {
  position: absolute;
  right: 16px;
  bottom: 12px;
  color: #1890ff;
  font-weight: 500;
  transition: all 0.2s;
}

.insight-action:hover {
  color: #40a9ff;
  transform: translateX(2px);
}

.insight-loading {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.insight-skeleton {
  height: 110px;
  border-radius: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.metrics-row {
  margin-bottom: 20px;
}

.metric-card {
  text-align: center;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transition: all 0.3s;
  overflow: hidden;
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, transparent, currentColor, transparent);
  opacity: 0.6;
}

.metric-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
}

.metric-card.agriculture {
  border-left: 5px solid #52c41a;
}

.metric-card.agriculture::before { color: #52c41a; }

.metric-card.energy {
  border-left: 5px solid #ff9500;
}

.metric-card.energy::before { color: #ff9500; }

.metric-card.carbon {
  border-left: 5px solid #1890ff;
}

.metric-card.carbon::before { color: #1890ff; }

.metric-card.environment {
  border-left: 5px solid #722ed1;
}

.metric-card.environment::before { color: #722ed1; }

.trend {
  margin-top: 10px;
  color: #ff4d4f;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.trend.positive {
  color: #52c41a;
}

.subtitle {
  margin-top: 8px;
  font-size: 13px;
  color: #86909c;
  font-weight: 400;
}

.charts-row {
  margin-bottom: 20px;
}

.charts-row :deep(.arco-card) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.quick-actions {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.quick-actions :deep(.arco-btn) {
  justify-content: flex-start;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.3s;
}

.quick-actions :deep(.arco-btn:hover) {
  transform: translateX(4px);
}

.activity-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
}

.activity-title {
  font-size: 14px;
  color: #1d2129;
  font-weight: 500;
}

.activity-time {
  font-size: 12px;
  color: #86909c;
  white-space: nowrap;
}
</style>
