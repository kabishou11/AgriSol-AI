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
  padding: 20px;
  background: #f7f8fa;
  min-height: 100vh;
}

.briefing-card {
  margin-bottom: 16px;
  border-radius: 12px;
}

.briefing-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.insight-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.insight-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  border-left: 4px solid transparent;
  transition: all 0.2s;
}

.insight-card:hover {
  transform: translateY(-2px);
}

.insight-card.success {
  background: #f0fff4;
  border-left-color: #00b42a;
}

.insight-card.warning {
  background: #fffbf0;
  border-left-color: #ff7d00;
}

.insight-card.danger {
  background: #fff1f0;
  border-left-color: #f53f3f;
}

.insight-card.info {
  background: #f2f3ff;
  border-left-color: #165dff;
}

.insight-card-icon {
  font-size: 24px;
  margin-top: 2px;
}

.insight-card-body {
  flex: 1;
}

.insight-card-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 6px;
}

.insight-card-desc {
  font-size: 13px;
  color: #4e5969;
  line-height: 1.6;
}

.insight-action {
  position: absolute;
  right: 12px;
  bottom: 8px;
  color: #165dff;
}

.insight-loading {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.insight-skeleton {
  height: 90px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e6e6e6 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.metrics-row {
  margin-bottom: 16px;
}

.metric-card {
  text-align: center;
  border-radius: 8px;
}

.metric-card.agriculture { border-left: 4px solid #00b42a; }
.metric-card.energy { border-left: 4px solid #ff7d00; }
.metric-card.carbon { border-left: 4px solid #165dff; }
.metric-card.environment { border-left: 4px solid #722ed1; }

.trend {
  margin-top: 8px;
  color: #f53f3f;
}

.trend.positive {
  color: #00b42a;
}

.subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #86909c;
}

.charts-row {
  margin-bottom: 16px;
}

.quick-actions :deep(.arco-btn) {
  justify-content: flex-start;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.activity-title {
  font-size: 13px;
  color: #1d2129;
}

.activity-time {
  font-size: 12px;
  color: #86909c;
}
</style>
