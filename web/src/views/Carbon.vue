<template>
  <div class="carbon-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>🌍 碳汇计算</h1>
      <p>计算农业碳汇量，追踪碳减排贡献，生成认证报告</p>
    </div>

    <!-- 统计卡片 -->
    <a-row :gutter="16" style="margin-bottom: 16px">
      <a-col :span="24" :md="8">
        <a-card class="stat-card">
          <a-statistic
            title="总碳汇量"
            :value="statistics.totalCarbon"
            suffix="吨 CO₂"
            :precision="2"
            :value-style="{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold' }"
          >
            <template #prefix>🌿</template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="24" :md="8">
        <a-card class="stat-card">
          <a-statistic
            title="等效植树数"
            :value="statistics.totalTrees"
            suffix="棵"
            :value-style="{ color: '#1890ff', fontSize: '28px', fontWeight: 'bold' }"
          >
            <template #prefix>🌳</template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="24" :md="8">
        <a-card class="stat-card">
          <a-statistic
            title="本月新增"
            :value="statistics.monthlyCarbon"
            suffix="吨 CO₂"
            :precision="2"
            :value-style="{ color: '#fa8c16', fontSize: '28px', fontWeight: 'bold' }"
          >
            <template #prefix>📅</template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 计算表单 -->
    <a-card class="calc-card" style="margin-bottom: 16px">
      <template #title>🧮 碳汇计算器</template>
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
              <div style="text-align: center; margin-top: 8px">
                <a-tag color="blue">{{ form.duration }} 个月</a-tag>
              </div>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            :loading="calculating"
            size="large"
            style="width: 200px; background: #52c41a; border-color: #52c41a; font-size: 16px"
          >
            <template #icon><icon-formula /></template>
            立即计算碳汇量
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 计算结果 -->
    <transition name="result-fade">
      <a-card v-if="calcResult" class="result-card" style="margin-bottom: 16px">
        <template #title>✅ 计算结果</template>
        <a-row :gutter="24" align="center">
          <a-col :span="24" :md="10">
            <div class="result-main">
              <div class="result-label">碳汇量</div>
              <div class="result-value">{{ calcResult.carbon.toFixed(2) }}</div>
              <div class="result-unit">吨 CO₂</div>
            </div>
          </a-col>
          <a-col :span="24" :md="10">
            <div class="result-trees">
              <div class="result-label">等效植树</div>
              <div class="trees-icon">🌳</div>
              <div class="result-value trees-value">{{ calcResult.trees }}</div>
              <div class="result-unit">棵</div>
            </div>
          </a-col>
        </a-row>
        <a-divider />
        <div style="padding: 0 16px">
          <div style="margin-bottom: 8px; color: #666">减排贡献进度</div>
          <a-progress
            :percent="Math.min(calcResult.carbon / 10, 1)"
            :format="() => `${calcResult.carbon.toFixed(2)} 吨`"
            status="success"
            size="large"
          />
        </div>
        <a-divider />
        <div style="padding: 0 16px; color: #666; font-size: 13px">
          认证编号：<a-tag color="green">{{ calcResult.certNo }}</a-tag>
        </div>
        <a-divider />
        <a-space>
          <a-button type="primary" :loading="saving" @click="handleSave">
            <template #icon><icon-save /></template>
            保存记录
          </a-button>
          <a-button @click="handleDownload">
            <template #icon><icon-download /></template>
            下载报告
          </a-button>
        </a-space>
      </a-card>
    </transition>

    <!-- 碳汇账本 -->
    <a-card class="ledger-card" style="margin-bottom: 16px">
      <template #title>📒 碳汇账本</template>
      <template #extra>
        <a-button size="small" @click="loadLedger">
          <template #icon><icon-refresh /></template>
          刷新
        </a-button>
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
          <a-tag color="green">{{ record.crop_type || record.cropType }}</a-tag>
        </template>
        <template #carbon="{ record }">
          <span style="color: #52c41a; font-weight: bold">
            {{ Number(record.carbon_sequestered || record.carbon || 0).toFixed(2) }} 吨
          </span>
        </template>
        <template #trees="{ record }">
          🌳 {{ record.equivalent_trees || record.trees || 0 }}
        </template>
        <template #status="{ record }">
          <a-tag color="blue">{{ record.status || '已认证' }}</a-tag>
        </template>
        <template #date="{ record }">
          {{ formatDate(record.created_at || record.date) }}
        </template>
      </a-table>
    </a-card>

    <!-- 图表区域 -->
    <a-row :gutter="16">
      <a-col :span="24" :md="14">
        <a-card>
          <template #title>📈 碳汇累计趋势</template>
          <div ref="trendChart" style="height: 280px"></div>
        </a-card>
      </a-col>
      <a-col :span="24" :md="10">
        <a-card>
          <template #title>🥧 作物碳汇构成</template>
          <div ref="pieChart" style="height: 280px"></div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconFormula, IconSave, IconDownload, IconRefresh } from '@arco-design/web-vue/es/icon'
import * as echarts from 'echarts'
import apiService from '../api.js'

// 碳汇系数
const carbonFactors = {
  '水稻': 0.18, '小麦': 0.12, '玉米': 0.15,
  '大豆': 0.20, '蔬菜': 0.08, '果树': 0.25
}

const form = reactive({ cropType: '水稻', area: 1, areaUnit: '亩', duration: 12 })
const calculating = ref(false)
const saving = ref(false)
const calcResult = ref(null)

const statistics = reactive({ totalCarbon: 0, totalTrees: 0, monthlyCarbon: 0 })

const ledgerData = ref([])
const loadingLedger = ref(false)
const pagination = reactive({ current: 1, pageSize: 8, total: 0 })

const trendChart = ref(null)
const pieChart = ref(null)
let trendChartInstance = null
let pieChartInstance = null

const ledgerColumns = [
  { title: '日期', slotName: 'date', width: 100 },
  { title: '作物', slotName: 'cropType', width: 80 },
  { title: '面积', dataIndex: 'planting_area', width: 80 },
  { title: '碳汇量', slotName: 'carbon', width: 100 },
  { title: '等效植树', slotName: 'trees', width: 90 },
  { title: '状态', slotName: 'status', width: 80 }
]

const handleCalculate = async () => {
  if (!form.cropType || !form.area || form.area <= 0) {
    Message.warning('请填写完整的计算参数')
    return
  }
  calculating.value = true
  try {
    let carbon
    try {
      const res = await apiService.carbon.calculate(form)
      carbon = res.carbon || res.totalSequestered || res.data?.carbon
    } catch {
      // 前端模拟计算
      const factor = carbonFactors[form.cropType] || 0.15
      const areaInMu = form.areaUnit === '公顷' ? form.area * 15 : form.area
      carbon = areaInMu * form.duration * factor / 12
    }
    calcResult.value = {
      carbon: Number(carbon.toFixed(3)),
      trees: Math.round(carbon * 45),
      certNo: 'CERT-' + Date.now().toString(36).toUpperCase()
    }
    Message.success('计算完成')
  } catch (e) {
    Message.error('计算失败，请重试')
  } finally {
    calculating.value = false
  }
}

const handleSave = async () => {
  if (!calcResult.value) return
  saving.value = true
  try {
    await apiService.carbon.record({ ...form, ...calcResult.value })
    Message.success('记录已保存')
    loadLedger()
    loadStatistics()
  } catch {
    Message.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handleDownload = () => {
  Message.info('报告下载功能开发中')
}

const loadStatistics = async () => {
  try {
    const res = await apiService.carbon.getStatistics()
    const data = res.data || res
    const totals = data.totals || data
    statistics.totalCarbon = Number(totals.totalCarbon || totals.total_carbon || 0)
    statistics.totalTrees = totals.totalTrees || totals.total_trees || 0
    statistics.monthlyCarbon = Number(totals.monthlyCarbon || totals.monthly_carbon || 0)
  } catch {
    // 静默失败
  }
}

const loadLedger = async () => {
  loadingLedger.value = true
  try {
    const res = await apiService.carbon.getLedger({
      limit: pagination.pageSize,
      offset: (pagination.current - 1) * pagination.pageSize
    })
    const data = res.data || res
    ledgerData.value = data.records || data.list || []
    pagination.total = data.total || ledgerData.value.length
  } catch {
    ledgerData.value = []
  } finally {
    loadingLedger.value = false
  }
}

const handlePageChange = (page) => {
  pagination.current = page
  loadLedger()
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(String(dateStr).replace(' ', 'T'))
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('zh-CN')
}

const initCharts = async () => {
  let byCrop = []
  let trend = []
  try {
    const res = await apiService.carbon.getStatistics()
    const data = res.data || res
    byCrop = data.byCropType || data.by_crop || []
    trend = data.trend || data.monthly || []
  } catch { /* 使用空数据 */ }

  // 趋势图
  if (trendChart.value) {
    trendChartInstance = echarts.init(trendChart.value)
    const months = trend.length ? trend.map(t => t.month || t.date) : ['1月','2月','3月','4月','5月','6月']
    const values = trend.length ? trend.map(t => t.carbon || t.value || 0) : [0.2,0.5,0.8,1.2,1.8,2.3]
    trendChartInstance.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value', name: '吨CO₂' },
      series: [{
        name: '碳汇量', type: 'line', smooth: true, areaStyle: { color: 'rgba(82,196,26,0.2)' },
        lineStyle: { color: '#52c41a' }, itemStyle: { color: '#52c41a' }, data: values
      }]
    })
  }

  // 饼图
  if (pieChart.value) {
    pieChartInstance = echarts.init(pieChart.value)
    const pieData = byCrop.length
      ? byCrop.map(b => ({ name: b.crop_type || b.cropType, value: Number(b.total_carbon || b.carbon || 0).toFixed(2) }))
      : Object.entries(carbonFactors).map(([k, v]) => ({ name: k, value: v }))
    pieChartInstance.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} 吨 ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'center' },
      series: [{
        name: '作物碳汇', type: 'pie', radius: ['40%', '70%'],
        center: ['40%', '50%'],
        data: pieData,
        label: { show: false }
      }]
    })
  }
}

const handleResize = () => {
  trendChartInstance?.resize()
  pieChartInstance?.resize()
}

onMounted(() => {
  loadStatistics()
  loadLedger()
  setTimeout(initCharts, 300)
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
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 4px;
  color: #1890ff;
}

.page-header p {
  color: #666;
  margin: 0;
}

.stat-card {
  margin-bottom: 16px;
}

.calc-card {
  margin-bottom: 16px;
}

.result-card {
  margin-bottom: 16px;
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
  border-color: #b7eb8f;
}

.result-main,
.result-trees {
  text-align: center;
  padding: 20px 0;
}

.result-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.result-value {
  font-size: 48px;
  font-weight: bold;
  color: #52c41a;
  line-height: 1.1;
}

.trees-value {
  font-size: 48px;
  color: #1890ff;
}

.result-unit {
  font-size: 16px;
  color: #888;
  margin-top: 4px;
}

.trees-icon {
  font-size: 48px;
  line-height: 1.2;
}

.ledger-card {
  margin-bottom: 16px;
}

.result-fade-enter-active {
  transition: all 0.4s ease;
}

.result-fade-enter-from {
  opacity: 0;
  transform: translateY(-16px);
}
</style>
