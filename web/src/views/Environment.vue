<template>
  <div class="environment-page">
    <a-row :gutter="16">
      <a-col :span="24" :lg="12">
        <a-card title="环境监测数据录入">
          <a-form :model="form" layout="vertical" @submit="handleSubmit">
            <a-divider orientation="left">土壤健康指标</a-divider>

            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="土壤pH值" required>
                  <a-input-number
                    v-model="form.soilPh"
                    :min="0"
                    :max="14"
                    :precision="1"
                    :step="0.1"
                    placeholder="6.0-7.5为最佳"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="有机质含量 (%)" required>
                  <a-input-number
                    v-model="form.soilOrganicMatter"
                    :min="0"
                    :max="100"
                    :precision="2"
                    :step="0.1"
                    placeholder="≥3%为优"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-row :gutter="16">
              <a-col :span="8">
                <a-form-item label="氮含量 (%)" required>
                  <a-input-number
                    v-model="form.soilNitrogen"
                    :min="0"
                    :max="1"
                    :precision="3"
                    :step="0.01"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="磷含量 (%)" required>
                  <a-input-number
                    v-model="form.soilPhosphorus"
                    :min="0"
                    :max="1"
                    :precision="3"
                    :step="0.01"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="钾含量 (%)" required>
                  <a-input-number
                    v-model="form.soilPotassium"
                    :min="0"
                    :max="1"
                    :precision="3"
                    :step="0.01"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-divider orientation="left">水资源利用</a-divider>

            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="用水量 (m³)" required>
                  <a-input-number
                    v-model="form.waterUsage"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="水分利用效率" required>
                  <a-slider
                    v-model="form.waterEfficiency"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    :format-tooltip="(value) => (value * 100).toFixed(0) + '%'"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-divider orientation="left">生物多样性</a-divider>

            <a-form-item label="生物多样性评分 (0-100)" required>
              <a-slider
                v-model="form.biodiversityScore"
                :min="0"
                :max="100"
                :marks="{ 0: '低', 50: '中', 100: '高' }"
                show-tooltip
              />
            </a-form-item>

            <a-form-item label="监测地点">
              <a-input v-model="form.location" placeholder="输入地点名称" />
            </a-form-item>

            <a-form-item label="备注">
              <a-textarea
                v-model="form.notes"
                placeholder="记录其他观察信息"
                :max-length="500"
                show-word-limit
              />
            </a-form-item>

            <a-form-item>
              <a-space>
                <a-button type="primary" html-type="submit" :loading="submitting">
                  <template #icon><icon-save /></template>
                  保存监测数据
                </a-button>
                <a-button @click="handleCalculateScore">
                  <template #icon><icon-formula /></template>
                  计算环境评分
                </a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>

      <a-col :span="24" :lg="12">
        <a-card v-if="score" title="环境质量评分" class="score-card">
          <div class="score-main">
            <a-progress
              type="circle"
              :percent="score.totalScore"
              :color="getScoreColor(score.totalScore)"
              :size="180"
            >
              <template #text>
                <div class="score-text">
                  <div class="score-value">{{ score.totalScore }}</div>
                  <div class="score-rating">{{ getRatingText(score.rating) }}</div>
                </div>
              </template>
            </a-progress>
          </div>

          <a-divider />

          <a-row :gutter="16">
            <a-col :span="8">
              <a-statistic
                title="土壤健康"
                :value="score.soilHealthScore"
                suffix="/ 60"
              >
                <template #prefix>
                  <span style="font-size: 20px">🌱</span>
                </template>
              </a-statistic>
            </a-col>
            <a-col :span="8">
              <a-statistic
                title="水资源"
                :value="score.waterEfficiencyScore"
                suffix="/ 30"
              >
                <template #prefix>
                  <span style="font-size: 20px">💧</span>
                </template>
              </a-statistic>
            </a-col>
            <a-col :span="8">
              <a-statistic
                title="生物多样性"
                :value="score.biodiversityScore"
                suffix="/ 30"
              >
                <template #prefix>
                  <span style="font-size: 20px">🦋</span>
                </template>
              </a-statistic>
            </a-col>
          </a-row>

          <a-divider />

          <div class="recommendations">
            <h4>改进建议</h4>
            <a-list :data="score.recommendations" size="small">
              <template #item="{ item }">
                <a-list-item>
                  <icon-check-circle style="color: rgb(var(--green-6)); margin-right: 8px" />
                  {{ item }}
                </a-list-item>
              </template>
            </a-list>
          </div>
        </a-card>

        <a-card title="环境健康雷达图" style="margin-top: 16px">
          <div ref="radarChart" style="height: 300px"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="监测历史记录" style="margin-top: 16px">
      <template #extra>
        <a-button size="small" @click="loadHistory">
          <template #icon><icon-refresh /></template>
          刷新
        </a-button>
      </template>

      <a-table
        :columns="historyColumns"
        :data="historyData"
        :loading="loadingHistory"
        :pagination="pagination"
        @page-change="handlePageChange"
      >
        <template #score="{ record }">
          <a-tag :color="getScoreTagColor(record.environmental_score)">
            {{ record.environmental_score }}
          </a-tag>
        </template>
        <template #date="{ record }">
          {{ formatDate(record.monitoring_date) }}
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconSave,
  IconFormula,
  IconCheckCircle,
  IconRefresh
} from '@arco-design/web-vue/es/icon'
import axios from 'axios'
import * as echarts from 'echarts'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

const form = reactive({
  soilPh: 7.0,
  soilOrganicMatter: 2.5,
  soilNitrogen: 0.1,
  soilPhosphorus: 0.02,
  soilPotassium: 0.15,
  waterUsage: 100,
  waterEfficiency: 0.6,
  biodiversityScore: 50,
  location: '',
  notes: ''
})

const submitting = ref(false)
const score = ref(null)
const radarChart = ref(null)

const historyData = ref([])
const loadingHistory = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

const historyColumns = [
  { title: '监测地点', dataIndex: 'location' },
  { title: '土壤pH', dataIndex: 'soil_ph' },
  { title: '有机质(%)', dataIndex: 'soil_organic_matter' },
  { title: '水效率', dataIndex: 'water_efficiency' },
  { title: '环境评分', slotName: 'score' },
  { title: '监测时间', slotName: 'date' }
]

const handleSubmit = async () => {
  submitting.value = true
  try {
    const response = await api.post('/environment/record', {
      ...form,
      userId: null
    })
    score.value = response.data
    Message.success('监测数据已保存')
    loadHistory()
    updateRadarChart()
  } catch (error) {
    Message.error('保存失败，请重试')
  } finally {
    submitting.value = false
  }
}

const handleCalculateScore = async () => {
  try {
    const response = await api.post('/environment/score', form)
    score.value = response.data
    updateRadarChart()
    Message.success('评分计算完成')
  } catch (error) {
    Message.error('计算失败')
  }
}

const loadHistory = async () => {
  loadingHistory.value = true
  try {
    const response = await api.get('/environment/indicators', {
      params: {
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize
      }
    })
    historyData.value = response.data.records
    pagination.total = response.data.total || response.data.records.length
  } catch (error) {
    Message.error('加载历史记录失败')
  } finally {
    loadingHistory.value = false
  }
}

const handlePageChange = (page) => {
  pagination.current = page
  loadHistory()
}

const updateRadarChart = () => {
  if (!radarChart.value || !score.value) return

  const chart = echarts.init(radarChart.value)

  const option = {
    radar: {
      indicator: [
        { name: '土壤健康', max: 60 },
        { name: '水资源利用', max: 30 },
        { name: '生物多样性', max: 30 }
      ],
      radius: '70%'
    },
    series: [{
      type: 'radar',
      data: [{
        value: [
          score.value.soilHealthScore,
          score.value.waterEfficiencyScore,
          score.value.biodiversityScore
        ],
        name: '环境指标',
        areaStyle: {
          color: 'rgba(20, 201, 201, 0.3)'
        },
        lineStyle: {
          color: '#14C9C9'
        }
      }]
    }]
  }

  chart.setOption(option)
}

const getScoreColor = (score) => {
  if (score >= 80) return '#00b42a'
  if (score >= 60) return '#14c9c9'
  if (score >= 40) return '#ff7d00'
  return '#f53f3f'
}

const getScoreTagColor = (score) => {
  if (score >= 80) return 'green'
  if (score >= 60) return 'cyan'
  if (score >= 40) return 'orange'
  return 'red'
}

const getRatingText = (rating) => {
  const ratings = {
    'Excellent': '优秀',
    'Good': '良好',
    'Fair': '一般',
    'Poor': '较差'
  }
  return ratings[rating] || rating
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(String(dateStr).replace(' ', 'T'))
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.environment-page {
  padding: 20px;
}

.score-card {
  height: 100%;
}

.score-main {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px 0;
}

.score-text {
  text-align: center;
}

.score-value {
  font-size: 36px;
  font-weight: bold;
  color: #14C9C9;
}

.score-rating {
  font-size: 16px;
  color: #666;
  margin-top: 8px;
}

.recommendations {
  margin-top: 16px;
}

.recommendations h4 {
  margin-bottom: 12px;
  color: #333;
}
</style>
