<template>
  <div class="dashboard-container">
    <a-page-header title="数据仪表板" subtitle="全方位数据概览" />

    <a-row :gutter="16" class="metrics-row">
      <a-col :span="6">
        <a-card class="metric-card agriculture">
          <a-statistic title="农业健康" :value="overview.agriculture.avgHealthScore" :precision="1" suffix="分">
            <template #prefix>
              <icon-leaf />
            </template>
          </a-statistic>
          <div class="trend" :class="{ positive: overview.agriculture.trend > 0 }">
            <icon-arrow-up v-if="overview.agriculture.trend > 0" />
            <icon-arrow-down v-else />
            {{ Math.abs(overview.agriculture.trend) }}%
          </div>
          <div class="subtitle">总作物: {{ overview.agriculture.totalCrops }}</div>
        </a-card>
      </a-col>

      <a-col :span="6">
        <a-card class="metric-card energy">
          <a-statistic title="能源潜力" :value="overview.energy.avgSolarPotential" :precision="1" suffix="kWh">
            <template #prefix>
              <icon-sun />
            </template>
          </a-statistic>
          <div class="trend" :class="{ positive: overview.energy.trend > 0 }">
            <icon-arrow-up v-if="overview.energy.trend > 0" />
            <icon-arrow-down v-else />
            {{ Math.abs(overview.energy.trend) }}%
          </div>
          <div class="subtitle">预测次数: {{ overview.energy.totalPredictions }}</div>
        </a-card>
      </a-col>

      <a-col :span="6">
        <a-card class="metric-card carbon">
          <a-statistic title="碳中和" :value="overview.carbon.netCarbon" :precision="1" suffix="kg">
            <template #prefix>
              <icon-cloud />
            </template>
          </a-statistic>
          <div class="trend" :class="{ positive: overview.carbon.trend < 0 }">
            <icon-arrow-down v-if="overview.carbon.trend < 0" />
            <icon-arrow-up v-else />
            {{ Math.abs(overview.carbon.trend) }}%
          </div>
          <div class="subtitle">等效树木: {{ overview.carbon.equivalentTrees }}</div>
        </a-card>
      </a-col>

      <a-col :span="6">
        <a-card class="metric-card community">
          <a-statistic title="社区活跃度" :value="overview.community.activeUsers" suffix="人">
            <template #prefix>
              <icon-user-group />
            </template>
          </a-statistic>
          <div class="trend positive">
            <icon-arrow-up />
            {{ overview.community.trend }}%
          </div>
          <div class="subtitle">提问数: {{ overview.community.totalQuestions }}</div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="charts-row">
      <a-col :span="16">
        <a-card title="趋势分析" :bordered="false">
          <a-radio-group v-model="trendType" type="button" @change="loadTrends">
            <a-radio value="crops">作物健康</a-radio>
            <a-radio value="energy">能源</a-radio>
            <a-radio value="carbon">碳排放</a-radio>
            <a-radio value="environment">环境</a-radio>
          </a-radio-group>
          <a-radio-group v-model="trendPeriod" type="button" @change="loadTrends" style="margin-left: 16px">
            <a-radio value="7d">7天</a-radio>
            <a-radio value="30d">30天</a-radio>
            <a-radio value="90d">90天</a-radio>
          </a-radio-group>
          <DashboardCharts :data="trendsData" :type="trendType" style="margin-top: 20px" />
        </a-card>
      </a-col>

      <a-col :span="8">
        <a-card title="快速操作" :bordered="false" class="quick-actions">
          <a-space direction="vertical" fill>
            <a-button type="primary" long @click="$router.push('/crop')">
              <icon-leaf /> 分析作物
            </a-button>
            <a-button type="primary" long @click="$router.push('/energy')">
              <icon-sun /> 能源预测
            </a-button>
            <a-button type="primary" long @click="$router.push('/carbon')">
              <icon-cloud /> 碳计算
            </a-button>
            <a-button type="primary" long @click="$router.push('/wisdom')">
              <icon-book /> 智慧问答
            </a-button>
          </a-space>
        </a-card>

        <a-card title="天气信息" :bordered="false" style="margin-top: 16px">
          <div class="weather-widget">
            <div class="weather-icon">
              <icon-sun-fill :size="48" />
            </div>
            <div class="weather-info">
              <div class="temperature">{{ weather.temperature }}°C</div>
              <div class="condition">{{ weather.condition }}</div>
              <div class="details">
                湿度: {{ weather.humidity }}% | 风速: {{ weather.windSpeed }} km/h
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="activity-row">
      <a-col :span="12">
        <a-card title="最近活动" :bordered="false">
          <a-timeline>
            <a-timeline-item v-for="activity in recentActivities" :key="activity.id">
              <template #dot>
                <icon-check-circle-fill :style="{ color: '#00b42a' }" />
              </template>
              <div class="activity-item">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-time">{{ formatTime(activity.time) }}</div>
              </div>
            </a-timeline-item>
          </a-timeline>
        </a-card>
      </a-col>

      <a-col :span="12">
        <a-card title="系统通知" :bordered="false">
          <a-list :data="notifications" :bordered="false">
            <template #item="{ item }">
              <a-list-item>
                <a-list-item-meta :title="item.title" :description="item.description">
                  <template #avatar>
                    <a-badge :status="item.status" />
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import api from '../api';
import DashboardCharts from '../components/charts/DashboardCharts.vue';
import {
  IconLeaf, IconSun, IconCloud, IconUserGroup, IconArrowUp, IconArrowDown,
  IconSunFill, IconCheckCircleFill, IconBook
} from '@arco-design/web-vue/es/icon';

const overview = ref({
  agriculture: { totalCrops: 0, avgHealthScore: 0, trend: 0 },
  energy: { totalPredictions: 0, avgSolarPotential: 0, avgWindPotential: 0, trend: 0 },
  carbon: { totalEmissions: 0, totalSequestered: 0, netCarbon: 0, equivalentTrees: 0, trend: 0 },
  environment: { totalRecords: 0, avgScore: 0, avgBiodiversity: 0, trend: 0 },
  community: { totalQuestions: 0, activeUsers: 0, trend: 0 }
});

const trendType = ref('crops');
const trendPeriod = ref('7d');
const trendsData = ref([]);

const weather = ref({
  temperature: 24,
  condition: '晴朗',
  humidity: 65,
  windSpeed: 12
});

const recentActivities = ref([
  { id: 1, title: '完成作物健康分析', time: new Date(Date.now() - 3600000) },
  { id: 2, title: '生成能源预测报告', time: new Date(Date.now() - 7200000) },
  { id: 3, title: '计算碳足迹', time: new Date(Date.now() - 10800000) },
  { id: 4, title: '提交环境监测数据', time: new Date(Date.now() - 14400000) }
]);

const notifications = ref([
  { title: '系统更新', description: '新功能已上线', status: 'success' },
  { title: '数据同步', description: '数据已成功同步', status: 'success' },
  { title: '提醒', description: '请及时查看本周报告', status: 'warning' }
]);

const loadOverview = async () => {
  try {
    const response = await api.get('/api/statistics/overview');
    overview.value = response.data;
  } catch (error) {
    Message.error('加载概览数据失败');
  }
};

const loadTrends = async () => {
  try {
    const response = await api.get('/api/statistics/trends', {
      params: { type: trendType.value, period: trendPeriod.value }
    });
    trendsData.value = response.data.data;
  } catch (error) {
    Message.error('加载趋势数据失败');
  }
};

const formatTime = (time) => {
  const now = new Date();
  const diff = now - time;
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
};

onMounted(() => {
  loadOverview();
  loadTrends();
});
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.metrics-row {
  margin-bottom: 16px;
}

.metric-card {
  text-align: center;
  border-radius: 8px;
  transition: all 0.3s;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-card.agriculture {
  border-left: 4px solid #00b42a;
}

.metric-card.energy {
  border-left: 4px solid #ff7d00;
}

.metric-card.carbon {
  border-left: 4px solid #165dff;
}

.metric-card.community {
  border-left: 4px solid #722ed1;
}

.trend {
  margin-top: 8px;
  font-size: 14px;
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

.weather-widget {
  display: flex;
  align-items: center;
  gap: 16px;
}

.weather-icon {
  color: #ff7d00;
}

.temperature {
  font-size: 32px;
  font-weight: bold;
  color: #1d2129;
}

.condition {
  font-size: 16px;
  color: #4e5969;
  margin-top: 4px;
}

.details {
  font-size: 12px;
  color: #86909c;
  margin-top: 8px;
}

.activity-row {
  margin-bottom: 16px;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-title {
  font-size: 14px;
  color: #1d2129;
}

.activity-time {
  font-size: 12px;
  color: #86909c;
}
</style>

