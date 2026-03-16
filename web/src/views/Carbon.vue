<template>
  <div class="carbon-page">
    <a-page-header title="碳账本与月报中心" subtitle="经营沉淀 + 申报准备双主线" />

    <a-row :gutter="16" class="top-row">
      <a-col :span="24" :md="8">
        <a-card class="stat-card" :bordered="false">
          <a-statistic
            title="累计固碳"
            :value="statistics.totalCarbonTons"
            suffix="吨CO₂"
            :precision="2"
            :value-style="{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold' }"
          />
        </a-card>
      </a-col>
      <a-col :span="24" :md="8">
        <a-card class="stat-card" :bordered="false">
          <a-statistic
            title="等效植树"
            :value="statistics.equivalentTrees"
            suffix="棵"
            :value-style="{ color: '#1890ff', fontSize: '28px', fontWeight: 'bold' }"
          />
        </a-card>
      </a-col>
      <a-col :span="24" :md="8">
        <a-card class="stat-card" :bordered="false">
          <a-statistic
            title="本月碳账本"
            :value="statistics.monthlyCarbonTons"
            suffix="吨CO₂"
            :precision="2"
            :value-style="{ color: '#fa8c16', fontSize: '28px', fontWeight: 'bold' }"
          />
          <div class="report-status">
            月报状态：
            <a-tag :color="statistics.reportStatus === 'generated' ? 'green' : 'orange'">
              {{ statistics.reportStatus === 'generated' ? '已生成' : '未生成' }}
            </a-tag>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="chart-row">
      <a-col :span="24" :md="14">
        <a-card :bordered="false" title="月度碳汇趋势（真实数据）">
          <div v-if="statistics.monthlyTrend.length" ref="trendChart" style="height: 300px"></div>
          <a-empty v-else description="暂无趋势数据，请先加入碳账本记录" />
        </a-card>
      </a-col>
      <a-col :span="24" :md="10">
        <a-card :bordered="false" title="作物贡献构成">
          <div v-if="statistics.byCropType.length" ref="pieChart" style="height: 300px"></div>
          <a-empty v-else description="暂无作物贡献数据" />
        </a-card>
      </a-col>
    </a-row>

    <a-card class="ledger-card" :bordered="false">
      <template #title>碳账本记录</template>
      <template #extra>
        <a-space>
          <a-date-picker v-model="selectedMonth" mode="month" value-format="YYYY-MM" placeholder="按月份筛选" style="width: 140px" @change="handleMonthChange" />
          <a-button size="small" @click="resetMonth">重置</a-button>
          <a-button size="small" @click="loadLedger">
            <template #icon><icon-refresh /></template>
            刷新
          </a-button>
        </a-space>
      </template>
      <a-table
        :columns="ledgerColumns"
        :data="ledgerData"
        :loading="loadingLedger"
        :pagination="pagination"
        @page-change="handlePageChange"
        size="small"
      >
        <template #cropType="{ record }">
          <a-tag color="green">{{ record.cropType || record.crop_type }}</a-tag>
        </template>
        <template #carbon="{ record }">
          <span style="color: #52c41a; font-weight: bold">
            {{ Number(record.carbon || record.carbon_sequestered || 0).toFixed(2) }} 吨
          </span>
        </template>
        <template #trees="{ record }">
          🌳 {{ record.trees || record.equivalent_trees || 0 }}
        </template>
        <template #date="{ record }">
          {{ formatDate(record.created_at || record.date) }}
        </template>
      </a-table>
    </a-card>

    <a-card class="report-card" :bordered="false">
      <template #title>月报中心</template>
      <a-row :gutter="12" align="center">
        <a-col :xs="24" :md="10">
          <a-space>
            <span>目标月份</span>
            <a-date-picker v-model="reportMonth" mode="month" value-format="YYYY-MM" style="width: 140px" />
          </a-space>
        </a-col>
        <a-col :xs="24" :md="14" style="text-align: right">
          <a-space>
            <a-button :loading="reportLoading" @click="loadMonthlyReport">查看月报</a-button>
            <a-button type="primary" :loading="reportLoading" @click="generateMonthlyReport">生成月报</a-button>
          </a-space>
        </a-col>
      </a-row>

      <div class="report-preview" v-if="monthlyReport.status === 'generated' && monthlyReport.report">
        <a-descriptions :column="1" bordered>
          <a-descriptions-item label="报告类型">{{ monthlyReport.report.reportType }}</a-descriptions-item>
          <a-descriptions-item label="生成时间">{{ formatDateTime(monthlyReport.report.generatedAt) }}</a-descriptions-item>
          <a-descriptions-item label="记录条数">{{ monthlyReport.report.summary?.recordCount || 0 }}</a-descriptions-item>
          <a-descriptions-item label="总固碳">{{ Number(monthlyReport.report.summary?.totalCarbonTons || 0).toFixed(3) }} 吨CO₂</a-descriptions-item>
          <a-descriptions-item label="等效植树">{{ monthlyReport.report.summary?.equivalentTrees || 0 }} 棵</a-descriptions-item>
        </a-descriptions>
      </div>
      <a-empty v-else description="该月份尚未生成月报" />
    </a-card>

    <a-card class="calc-card" :bordered="false">
      <template #title>补录工具：加入本月碳账本</template>
      <a-form :model="form" layout="vertical" @submit.prevent="handleCalculate">
        <a-row :gutter="16">
          <a-col :span="24" :md="8">
            <a-form-item label="作物类型" required>
              <a-select v-model="form.cropType" placeholder="选择作物类型" size="large">
                <a-option value="水稻">🌾 水稻</a-option>
                <a-option value="小麦">🌾 小麦</a-option>
                <a-option value="玉米">🌽 玉米</a-option>
                <a-option value="大豆">🫘 大豆</a-option>
                <a-option value="蔬菜">🥬 蔬菜</a-option>
                <a-option value="果树">🍎 果树</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="24" :md="8">
            <a-form-item label="种植面积" required>
              <a-input-group compact>
                <a-input-number
                  v-model="form.area"
                  :min="0.1"
                  :precision="1"
                  placeholder="输入面积"
                  size="large"
                  style="width: 60%"
                />
                <a-select v-model="form.areaUnit" size="large" style="width: 40%">
                  <a-option value="亩">亩</a-option>
                  <a-option value="公顷">公顷</a-option>
                </a-select>
              </a-input-group>
            </a-form-item>
          </a-col>
          <a-col :span="24" :md="8">
            <a-form-item label="种植时长（月）" required>
              <a-slider
                v-model="form.duration"
                :min="1"
                :max="36"
                :marks="{ 6: '6月', 12: '1年', 24: '2年', 36: '3年' }"
                show-tooltip
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-space>
          <a-button type="primary" html-type="submit" :loading="calculating" size="large">
            计算本次碳贡献
          </a-button>
          <a-button type="primary" status="success" :loading="saving" :disabled="!calcResult" @click="handleSave">
            加入本月碳账本
          </a-button>
        </a-space>
      </a-form>

      <a-alert
        v-if="calcResult"
        style="margin-top: 12px"
        type="success"
        :title="`本次预计固碳 ${calcResult.carbon.toFixed(3)} 吨CO₂，等效植树 ${calcResult.trees} 棵`"
      />
    </a-card>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconRefresh } from '@arco-design/web-vue/es/icon'
import * as echarts from 'echarts'
import apiService from '../api.js'

const userId = 1

const form = reactive({ cropType: '水稻', area: 1, areaUnit: '亩', duration: 12 })
const calculating = ref(false)
const saving = ref(false)
const calcResult = ref(null)

const statistics = reactive({
  totalCarbonTons: 0,
  equivalentTrees: 0,
  monthlyCarbonTons: 0,
  monthlyTrend: [],
  byCropType: [],
  reportStatus: 'not_generated'
})

const ledgerData = ref([])
const loadingLedger = ref(false)
const selectedMonth = ref('')
const pagination = reactive({ current: 1, pageSize: 8, total: 0 })

const reportMonth = ref(new Date().toISOString().slice(0, 7))
const reportLoading = ref(false)
const monthlyReport = ref({ status: 'not_generated', report: null })

const trendChart = ref(null)
const pieChart = ref(null)
let trendChartInstance = null
let pieChartInstance = null

const ledgerColumns = [
  { title: '日期', slotName: 'date', width: 120 },
  { title: '作物', slotName: 'cropType', width: 100 },
  { title: '面积', dataIndex: 'planting_area', width: 80 },
  { title: '碳汇量', slotName: 'carbon', width: 120 },
  { title: '等效植树', slotName: 'trees', width: 100 }
]

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(String(dateStr).replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('zh-CN')
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

const loadStatistics = async () => {
  try {
    const data = await apiService.carbon.getStatistics({ period: '12m', userId })
    statistics.totalCarbonTons = Number(data.totalCarbonTons || 0)
    statistics.equivalentTrees = Number(data.equivalentTrees || 0)
    statistics.monthlyCarbonTons = Number(data.monthlyCarbonTons || 0)
    statistics.monthlyTrend = data.monthlyTrend || []
    statistics.byCropType = data.byCropType || []
    statistics.reportStatus = data.reportStatus || 'not_generated'

    await nextTick()
    renderCharts()
  } catch {
    Message.warning('加载碳汇统计失败')
  }
}

const loadLedger = async () => {
  loadingLedger.value = true
  try {
    const data = await apiService.carbon.getLedger({
      userId,
      month: selectedMonth.value || undefined,
      limit: pagination.pageSize,
      offset: (pagination.current - 1) * pagination.pageSize
    })

    ledgerData.value = data.records || []
    pagination.total = Number(data.total || 0)
  } catch {
    ledgerData.value = []
    pagination.total = 0
  } finally {
    loadingLedger.value = false
  }
}

const handlePageChange = (page) => {
  pagination.current = page
  loadLedger()
}

const handleMonthChange = () => {
  pagination.current = 1
  loadLedger()
}

const resetMonth = () => {
  selectedMonth.value = ''
  pagination.current = 1
  loadLedger()
}

const loadMonthlyReport = async () => {
  reportLoading.value = true
  try {
    const data = await apiService.carbon.getMonthlyReport({ month: reportMonth.value, userId })
    monthlyReport.value = {
      status: data.status || 'not_generated',
      report: data.report || null
    }
  } catch {
    monthlyReport.value = { status: 'not_generated', report: null }
    Message.warning('读取月报失败')
  } finally {
    reportLoading.value = false
  }
}

const generateMonthlyReport = async () => {
  reportLoading.value = true
  try {
    await apiService.carbon.generateMonthlyReport({ month: reportMonth.value, userId })
    Message.success('月报已生成')
    await Promise.all([loadMonthlyReport(), loadStatistics()])
  } catch {
    Message.error('生成月报失败')
  } finally {
    reportLoading.value = false
  }
}

const handleCalculate = async () => {
  if (!form.cropType || !form.area || form.area <= 0) {
    Message.warning('请填写完整的计算参数')
    return
  }
  calculating.value = true
  try {
    const res = await apiService.carbon.calculate(form)
    const carbon = Number(res.carbon || res.totalSequestered || 0)
    const trees = Number(res.trees || res.equivalentTrees || Math.round(carbon * 45))
    calcResult.value = { carbon, trees }
  } catch {
    Message.error('计算失败，请重试')
  } finally {
    calculating.value = false
  }
}

const handleSave = async () => {
  if (!calcResult.value) return
  saving.value = true
  try {
    await apiService.carbon.record({ ...form, userId })
    Message.success('已加入本月碳账本')
    await Promise.all([loadLedger(), loadStatistics(), loadMonthlyReport()])
  } catch {
    Message.error('加入账本失败')
  } finally {
    saving.value = false
  }
}

const renderCharts = () => {
  if (trendChart.value) {
    if (!trendChartInstance) {
      trendChartInstance = echarts.init(trendChart.value)
    }

    trendChartInstance.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: statistics.monthlyTrend.map((item) => item.month)
      },
      yAxis: {
        type: 'value',
        name: '吨CO₂'
      },
      series: [{
        name: '月度固碳',
        type: 'line',
        smooth: true,
        data: statistics.monthlyTrend.map((item) => Number(item.totalCarbonTons || 0)),
        areaStyle: { color: 'rgba(82,196,26,0.2)' },
        lineStyle: { color: '#52c41a' },
        itemStyle: { color: '#52c41a' }
      }]
    })
  }

  if (pieChart.value) {
    if (!pieChartInstance) {
      pieChartInstance = echarts.init(pieChart.value)
    }

    pieChartInstance.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} 吨 ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'center' },
      series: [{
        name: '作物碳汇贡献',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        data: statistics.byCropType.map((item) => ({
          name: item.crop_type || item.cropType,
          value: Number(item.total_carbon || item.totalCarbonTons || 0)
        })),
        label: { show: false }
      }]
    })
  }
}

const handleResize = () => {
  trendChartInstance?.resize()
  pieChartInstance?.resize()
}

onMounted(async () => {
  await Promise.all([loadStatistics(), loadLedger(), loadMonthlyReport()])
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChartInstance?.dispose()
  pieChartInstance?.dispose()
})
</script>

<style scoped>
.carbon-page {
  padding: 24px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  min-height: 100vh;
  position: relative;
}

.carbon-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 25% 35%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.carbon-page > * {
  position: relative;
  z-index: 1;
}

.top-row {
  margin-bottom: 20px;
}

.stat-card {
  min-height: 160px;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
}

.report-status {
  margin-top: 12px;
  color: #4e5969;
  font-size: 14px;
  font-weight: 500;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-row :deep(.arco-card) {
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
}

.ledger-card {
  margin-bottom: 20px;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
}

.report-card {
  margin-bottom: 20px;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
}

.report-preview {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f0fff4 0%, #e6f9ed 100%);
  border-radius: 12px;
  border-left: 4px solid #52c41a;
}

.calc-card {
  margin-bottom: 20px;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
}
</style>
