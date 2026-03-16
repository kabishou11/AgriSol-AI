<template>
  <PageContainer>
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title animate-fade-in-up">
          AgriSol-AI 农业能源环境智能平台
        </h1>
        <p class="hero-subtitle animate-fade-in-up" style="animation-delay: 0.1s;">
          集成作物分析、能源监测、碳排放计算与农事记录的智能化解决方案
        </p>
        <div class="hero-actions animate-fade-in-up" style="animation-delay: 0.2s;">
          <a-space :size="16">
            <a-button type="primary" size="large" @click="navigate('/crop')">
              开始使用
            </a-button>
            <a-button size="large">
              了解更多
            </a-button>
          </a-space>
        </div>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="stats-section">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :lg="6">
          <StatCard
            label="作物分析次数"
            :value="stats.cropAnalysis"
            icon="🌾"
            :icon-bg="'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'"
            :trend="12.5"
          />
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <StatCard
            label="能源监测点"
            :value="stats.energyPoints"
            icon="⚡"
            :icon-bg="'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)'"
            :trend="8.3"
          />
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <StatCard
            label="碳减排量(吨)"
            :value="stats.carbonReduction"
            icon="🌍"
            :icon-bg="'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)'"
            :trend="15.7"
          />
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <StatCard
            label="农事记录"
            :value="stats.wisdomRecords"
            icon="📝"
            :icon-bg="'linear-gradient(135deg, #722ed1 0%, #531dab 100%)'"
            :trend="20.1"
          />
        </a-col>
      </a-row>
    </div>

    <!-- Feature Cards -->
    <div class="features-section">
      <h2 class="section-title">核心功能</h2>
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :lg="6">
          <DataCard
            title="作物分析"
            description="智能识别作物病虫害，提供精准诊断与防治建议"
            icon="🌾"
            :icon-color="'var(--color-primary)'"
            :clickable="true"
            @click="navigate('/crop')"
            class="feature-card animate-fade-in-up"
          >
            <template #actions>
              <a-button type="text" @click="navigate('/crop')">
                立即使用 →
              </a-button>
            </template>
          </DataCard>
        </a-col>

        <a-col :xs="24" :sm="12" :lg="6">
          <DataCard
            title="能源监测"
            description="实时监控能源使用情况，优化能耗管理"
            icon="⚡"
            :icon-color="'var(--color-energy)'"
            :clickable="true"
            @click="navigate('/energy')"
            class="feature-card animate-fade-in-up"
            style="animation-delay: 0.1s;"
          >
            <template #actions>
              <a-button type="text" @click="navigate('/energy')">
                立即使用 →
              </a-button>
            </template>
          </DataCard>
        </a-col>

        <a-col :xs="24" :sm="12" :lg="6">
          <DataCard
            title="碳排放"
            description="计算碳足迹，助力绿色农业可持续发展"
            icon="🌍"
            :icon-color="'var(--color-environment)'"
            :clickable="true"
            @click="navigate('/carbon')"
            class="feature-card animate-fade-in-up"
            style="animation-delay: 0.2s;"
          >
            <template #actions>
              <a-button type="text" @click="navigate('/carbon')">
                立即使用 →
              </a-button>
            </template>
          </DataCard>
        </a-col>

        <a-col :xs="24" :sm="12" :lg="6">
          <DataCard
            title="农事记录"
            description="记录农事活动，积累农业智慧与经验"
            icon="📝"
            :icon-color="'var(--color-community)'"
            :clickable="true"
            @click="navigate('/wisdom')"
            class="feature-card animate-fade-in-up"
            style="animation-delay: 0.3s;"
          >
            <template #actions>
              <a-button type="text" @click="navigate('/wisdom')">
                立即使用 →
              </a-button>
            </template>
          </DataCard>
        </a-col>
      </a-row>
    </div>

    <!-- Recent Activity -->
    <div class="activity-section">
      <h2 class="section-title">最近活动</h2>
      <a-card>
        <a-timeline>
          <a-timeline-item v-for="(activity, index) in recentActivities" :key="index">
            <template #dot>
              <span style="font-size: 16px;">{{ activity.icon }}</span>
            </template>
            <div class="activity-item">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-time">{{ activity.time }}</div>
            </div>
          </a-timeline-item>
        </a-timeline>
      </a-card>
    </div>
  </PageContainer>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageContainer from '../components/common/PageContainer.vue'
import StatCard from '../components/common/StatCard.vue'
import DataCard from '../components/common/DataCard.vue'
import api from '../api'
import { formatRelativeTime, getActivityIcon } from '../utils/format.js'

const router = useRouter()

const stats = ref({
  cropAnalysis: 1248,
  energyPoints: 36,
  carbonReduction: 125.8,
  wisdomRecords: 892
})

const recentActivities = ref([
  { icon: '🌾', title: '完成玉米病虫害分析', time: '2分钟前' },
  { icon: '⚡', title: '能源监测数据更新', time: '15分钟前' },
  { icon: '🌍', title: '碳排放报告生成', time: '1小时前' },
  { icon: '📝', title: '新增农事记录', time: '2小时前' },
  { icon: '🌾', title: '小麦生长数据采集', time: '3小时前' }
])

const loadSummary = async () => {
  try {
    const data = await api.statistics.getSummary()
    if (data?.stats) {
      const s = data.stats
      stats.value = {
        cropAnalysis: s.cropAnalysis || stats.value.cropAnalysis,
        energyPoints: s.totalGeneration || stats.value.energyPoints,
        carbonReduction: s.carbonReduction || stats.value.carbonReduction,
        wisdomRecords: s.wisdomRecords || stats.value.wisdomRecords
      }
    }
    if (data?.recentActivities?.length) {
      recentActivities.value = data.recentActivities.map(a => ({
        icon: getActivityIcon(a.action_type),
        title: a.action_data || a.action_type,
        time: formatRelativeTime(a.created_at)
      }))
    }
  } catch {}
}

const navigate = (path) => router.push(path)

onMounted(loadSummary)
</script>

<style scoped>
.hero-section {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  border-radius: var(--radius-xl);
  padding: var(--spacing-3xl) var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  color: white;
  text-align: center;
  box-shadow: var(--shadow-xl);
}

.hero-title {
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-md);
  color: white;
}

.hero-subtitle {
  font-size: var(--font-size-xl);
  margin-bottom: var(--spacing-xl);
  opacity: 0.95;
}

.hero-actions {
  margin-top: var(--spacing-xl);
}

.stats-section {
  margin-bottom: var(--spacing-xl);
}

.features-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-lg);
  color: var(--color-gray-900);
}

.feature-card {
  height: 100%;
}

.activity-section {
  margin-bottom: var(--spacing-xl);
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-title {
  font-size: var(--font-size-base);
  color: var(--color-gray-800);
}

.activity-time {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

@media (max-width: 767px) {
  .hero-title {
    font-size: var(--font-size-3xl);
  }

  .hero-subtitle {
    font-size: var(--font-size-base);
  }

  .hero-section {
    padding: var(--spacing-xl) var(--spacing-lg);
  }
}
</style>

