<template>
  <div class="carbon-page">
    <a-row :gutter="16">
      <a-col :span="24" :lg="10">
        <a-card title="碳固存计算器" class="calculator-card">
          <a-form :model="form" layout="vertical" @submit="handleCalculate">
            <a-form-item label="作物类型" required>
              <a-select
                v-model="form.cropType"
                placeholder="选择作物类型"
                :loading="loadingCropTypes"
                allow-search
              >
                <a-option
                  v-for="crop in cropTypes"
                  :key="crop.value"
                  :value="crop.value"
                >
                  <span>{{ crop.icon }} {{ crop.label }}</span>
                  <span style="color: var(--color-text-3); margin-left: 8px">
                    ({{ crop.rate }} t CO₂/ha/年)
                  </span>
                </a-option>
              </a-select>
            </a-form-item>

            <a-form-item label="种植面积" required>
              <a-input-group compact>
                <a-input-number
                  v-model="form.area"
                  :min="0.01"
                  :precision="2"
                  placeholder="输入面积"
                  style="width: 60%"
                />
                <a-select v-model="form.areaUnit" style="width: 40%">
                  <a-option value="hectare">公顷</a-option>
                  <a-option value="mu">亩</a-option>
                  <a-option value="acre">英亩</a-option>
                  <a-option value="sqm">平方米</a-option>
                </a-select>
              </a-input-group>
            </a-form-item>

            <a-form-item label="种植时长（月）" required>
              <a-slider
                v-model="form.duration"
                :min="1"
                :max="36"
                :marks="{ 3: '3月', 6: '6月', 12: '1年', 24: '2年', 36: '3年' }"
                show-tooltip
              />
              <div style="text-align: center; margin-top: 8px">
                <a-tag color="blue">{{ form.duration }} 个月</a-tag>
              </div>
            </a-form-item>

            <a-form-item>
              <a-space>
                <a-button
                  type="primary"
                  html-type="submit"
                  :loading="calculating"
                  long
                >
                  <template #icon><icon-calculator /></template>
                  计算碳固存量
                </a-button>
                <a-button @click="handleReset">重置</a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </a-card>

        <a-card v-if="result" title="计算结果" class="result-card" :bordered="false">
          <div class="result-main">
            <a-statistic
              title="总碳固存量"
              :value="result.totalSequestered"
              suffix="吨 CO₂"
              :precision="3"
              animation
            >
              <template #prefix>
                <icon-check-circle-fill style="color: rgb(var(--green-6))" />
              </template>
            </a-statistic>
          </div>

          <a-divider />

          <a-row :gutter="16">
            <a-col :span="12">
              <a-statistic
                title="生物质碳"
                :value="result.biomassCarbon"
                suffix="吨"
                :precision="3"
              />
            </a-col>
            <a-col :span="12">
              <a-statistic
                title="土壤碳"
                :value="result.soilCarbon"
                suffix="吨"
                :precision="3"
              />
            </a-col>
          </a-row>

          <a-divider />

          <div class="equivalent-trees">
            <div class="trees-title">相当于种植</div>
            <div class="trees-count">
              <span class="tree-icon" v-for="i in Math.min(result.equivalentTrees, 10)" :key="i">
                🌳
              </span>
              <span v-if="result.equivalentTrees > 10" class="more-trees">
                +{{ result.equivalentTrees - 10 }}
              </span>
            </div>
            <div class="trees-number">{{ result.equivalentTrees }} 棵树</div>
          </div>

          <a-divider />

          <a-descriptions title="减排贡献" :column="1" bordered>
            <a-descriptions-item label="相当于减少汽车行驶">
              {{ result.emissionReduction.carKm.toLocaleString() }} 公里
            </a-descriptions-item>
            <a-descriptions-item label="相当于节约用电">
              {{ result.emissionReduction.electricityKwh.toLocaleString() }} 千瓦时
            </a-descriptions-item>
            <a-descriptions-item label="相当于减少航班">
              {{ result.emissionReduction.flights }} 次短途飞行
            </a-descriptions-item>
          </a-descriptions>

          <a-divider />

          <a-space style="width: 100%">
            <a-button type="primary" @click="handleSaveRecord">
              <template #icon><icon-save /></template>
              保存记录
            </a-button>
            <a-button @click="handleGenerateCertificate">
              <template #icon><icon-file /></template>
              生成证书
            </a-button>
          </a-space>
        </a-card>
      </a-col>

      <a-col :span="24" :lg="14">
        <a-card title="碳固存台账" class="ledger-card">
          <template #extra>
            <a-space>
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
          >
            <template #cropType="{ record }">
              <a-tag>{{ getCropName(record.crop_type) }}</a-tag>
            </template>
            <template #carbon="{ record }">
              <a-statistic
                :value="record.carbon_sequestered"
                suffix="t"
                :precision="3"
                :value-style="{ fontSize: '14px' }"
              />
            </template>
            <template #trees="{ record }">
              <span>🌳 {{ record.equivalent_trees }}</span>
            </template>
            <template #date="{ record }">
              {{ formatDate(record.created_at) }}
            </template>
            <template #actions="{ record }">
              <a-space>
                <a-button size="small" type="text" @click="viewCertificate(record)">
                  查看证书
                </a-button>
              </a-space>
            </template>
          </a-table>
        </a-card>

        <a-card title="碳固存统计" class="stats-card" style="margin-top: 16px">
          <div ref="chartContainer" style="height: 300px"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-modal
      v-model:visible="certificateVisible"
      title="碳固存证书"
      width="600px"
      :footer="false"
    >
      <div v-if="currentCertificate" class="certificate">
        <div class="certificate-header">
          <h2>碳固存证书</h2>
          <p class="certificate-id">证书编号: {{ currentCertificate.certificate_id }}</p>
        </div>
        <div class="certificate-body">
          <p>兹证明：</p>
          <p class="certificate-content">
            通过种植 <strong>{{ getCropName(currentCertificate.crop_type) }}</strong>
            {{ currentCertificate.planting_area }} {{ getUnitName(currentCertificate.area_unit) }}，
            持续 {{ currentCertificate.planting_duration }} 个月，
            共固存二氧化碳 <strong>{{ currentCertificate.carbon_sequestered }} 吨</strong>，
            相当于种植 <strong>{{ currentCertificate.equivalent_trees }} 棵树</strong>。
          </p>
          <p class="certificate-method">
            计算方法: {{ currentCertificate.calculation_method }}
          </p>
          <p class="certificate-date">
            颁发日期: {{ formatDate(currentCertificate.created_at) }}
          </p>
        </div>
        <div class="certificate-footer">
          <a-button type="primary" @click="downloadCertificate">
            <template #icon><icon-download /></template>
            下载证书
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconCalculator,
  IconCheckCircleFill,
  IconSave,
  IconFile,
  IconRefresh,
  IconDownload
} from '@arco-design/web-vue/es/icon'
import axios from 'axios'
import * as echarts from 'echarts'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

const form = reactive({
  cropType: 'rice',
  area: 1,
  areaUnit: 'hectare',
  duration: 12
})

const cropTypes = ref([])
const loadingCropTypes = ref(false)
const calculating = ref(false)
const result = ref(null)

const ledgerData = ref([])
const loadingLedger = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

const certificateVisible = ref(false)
const currentCertificate = ref(null)
const chartContainer = ref(null)

const ledgerColumns = [
  { title: '作物类型', dataIndex: 'crop_type', slotName: 'cropType' },
  { title: '种植面积', dataIndex: 'planting_area' },
  { title: '碳固存量', slotName: 'carbon' },
  { title: '等效树木', slotName: 'trees' },
  { title: '记录时间', slotName: 'date' },
  { title: '操作', slotName: 'actions' }
]

const loadCropTypes = async () => {
  loadingCropTypes.value = true
  try {
    const response = await api.get('/carbon/crop-types')
    cropTypes.value = response.data
  } catch (error) {
    Message.error('加载作物类型失败')
  } finally {
    loadingCropTypes.value = false
  }
}

const handleCalculate = async () => {
  if (!form.cropType || !form.area || form.area <= 0) {
    Message.warning('请填写完整的计算参数')
    return
  }

  calculating.value = true
  try {
    const response = await api.post('/carbon/calculate', form)
    result.value = response.data
    Message.success('计算完成')
  } catch (error) {
    Message.error('计算失败，请重试')
  } finally {
    calculating.value = false
  }
}

const handleReset = () => {
  form.cropType = 'rice'
  form.area = 1
  form.areaUnit = 'hectare'
  form.duration = 12
  result.value = null
}

const handleSaveRecord = async () => {
  if (!result.value) return

  try {
    const response = await api.post('/carbon/record', {
      ...form,
      userId: null
    })
    Message.success('记录已保存')
    currentCertificate.value = response.data
    loadLedger()
  } catch (error) {
    Message.error('保存失败')
  }
}

const handleGenerateCertificate = () => {
  if (!result.value) return
  certificateVisible.value = true
  currentCertificate.value = {
    certificate_id: 'TEMP-' + Date.now(),
    ...form,
    ...result.value,
    created_at: new Date().toISOString()
  }
}

const loadLedger = async () => {
  loadingLedger.value = true
  try {
    const response = await api.get('/carbon/ledger', {
      params: {
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize
      }
    })
    ledgerData.value = response.data.records
    pagination.total = response.data.total
  } catch (error) {
    Message.error('加载台账失败')
  } finally {
    loadingLedger.value = false
  }
}

const handlePageChange = (page) => {
  pagination.current = page
  loadLedger()
}

const viewCertificate = async (record) => {
  currentCertificate.value = record
  certificateVisible.value = true
}

const downloadCertificate = () => {
  Message.info('证书下载功能开发中')
}

const getCropName = (cropType) => {
  const crop = cropTypes.value.find(c => c.value === cropType)
  return crop ? crop.label : cropType
}

const getUnitName = (unit) => {
  const units = {
    hectare: '公顷',
    mu: '亩',
    acre: '英亩',
    sqm: '平方米'
  }
  return units[unit] || unit
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const initChart = async () => {
  if (!chartContainer.value) return

  try {
    const response = await api.get('/carbon/statistics')
    const chart = echarts.init(chartContainer.value)

    const option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['碳固存量']
      },
      xAxis: {
        type: 'category',
        data: response.data.byCropType.map(item => getCropName(item.crop_type))
      },
      yAxis: {
        type: 'value',
        name: '吨 CO₂'
      },
      series: [{
        name: '碳固存量',
        type: 'bar',
        data: response.data.byCropType.map(item => item.total_carbon),
        itemStyle: {
          color: '#14C9C9'
        }
      }]
    }

    chart.setOption(option)
  } catch (error) {
    console.error('Failed to load chart data:', error)
  }
}

onMounted(() => {
  loadCropTypes()
  loadLedger()
  setTimeout(initChart, 500)
})
</script>

<style scoped>
.carbon-page {
  padding: 20px;
}

.calculator-card,
.result-card,
.ledger-card,
.stats-card {
  margin-bottom: 16px;
}

.result-main {
  text-align: center;
  padding: 20px 0;
}

.equivalent-trees {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.trees-title {
  font-size: 16px;
  margin-bottom: 12px;
}

.trees-count {
  font-size: 32px;
  margin: 12px 0;
}

.tree-icon {
  display: inline-block;
  animation: treeGrow 0.5s ease-in-out;
  margin: 0 4px;
}

@keyframes treeGrow {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.more-trees {
  font-size: 24px;
  margin-left: 8px;
}

.trees-number {
  font-size: 20px;
  font-weight: bold;
  margin-top: 8px;
}

.certificate {
  padding: 20px;
  border: 2px solid #14C9C9;
  border-radius: 8px;
}

.certificate-header {
  text-align: center;
  border-bottom: 2px solid #14C9C9;
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.certificate-header h2 {
  margin: 0;
  color: #14C9C9;
}

.certificate-id {
  margin-top: 8px;
  color: #666;
  font-size: 12px;
}

.certificate-body {
  line-height: 2;
  padding: 20px 0;
}

.certificate-content {
  text-indent: 2em;
  margin: 16px 0;
}

.certificate-method,
.certificate-date {
  color: #666;
  font-size: 14px;
}

.certificate-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
</style>


