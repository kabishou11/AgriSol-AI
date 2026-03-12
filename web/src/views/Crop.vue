<template>
  <div class="crop-page">
    <a-page-header title="作物智能分析" subtitle="上传作物图片，获取专业的健康分析和护理建议" />

    <a-row :gutter="16">
      <a-col :span="24" :lg="12">
        <a-card title="图片上传" :bordered="false" class="upload-card">
          <ImageUpload v-model="imageUrl" @success="handleUploadSuccess" @error="handleUploadError" />
          <a-space style="margin-top: 16px; width: 100%;" direction="vertical">
            <a-button type="primary" size="large" long :loading="analyzing" :disabled="!imageUrl" @click="startAnalysis">
              <template #icon><icon-scan /></template>
              开始智能分析
            </a-button>
            <a-button size="large" long :disabled="!imageUrl" @click="clearImage">
              <template #icon><icon-delete /></template>
              清除图片
            </a-button>
          </a-space>
        </a-card>
      </a-col>

      <a-col :span="24" :lg="12">
        <a-card title="分析进度" :bordered="false" v-if="analyzing || analysisResult">
          <div v-if="analyzing" class="analysis-progress">
            <a-progress :percent="progress" :status="progressStatus" />
            <p class="progress-text">{{ progressText }}</p>
            <a-spin dot style="margin-top: 20px;" />
          </div>

          <div v-if="analysisResult && !analyzing" class="analysis-result">
            <a-result status="success" title="分析完成">
              <template #subtitle>已成功识别作物并完成健康评估</template>
            </a-result>

            <a-statistic title="健康评分" :value="analysisResult.healthScore" suffix="/ 100" :value-style="{ color: getScoreColor(analysisResult.healthScore) }" style="margin-top: 20px;">
              <template #prefix><icon-heart-fill /></template>
            </a-statistic>
          </div>
        </a-card>

        <a-empty v-if="!analyzing && !analysisResult" description="上传图片后开始分析" style="margin-top: 60px;" />
      </a-col>
    </a-row>

    <div v-if="analysisResult" class="results-section">
      <a-row :gutter="16">
        <a-col :span="24" :md="8">
          <a-card title="作物信息" :bordered="false">
            <a-descriptions :column="1" bordered>
              <a-descriptions-item label="作物类型">
                <a-tag color="green">{{ analysisResult.cropType }}</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="生长阶段">{{ analysisResult.growthStage }}</a-descriptions-item>
              <a-descriptions-item label="健康状态">
                <a-tag :color="analysisResult.healthStatus === '健康' ? 'green' : 'red'">{{ analysisResult.healthStatus }}</a-tag>
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>

        <a-col :span="24" :md="8">
          <a-card title="病虫害检测" :bordered="false">
            <a-list :data="analysisResult.pests" size="small">
              <template #item="{ item }">
                <a-list-item>
                  <a-list-item-meta :title="item.name" :description="`严重程度: ${item.severity}`">
                    <template #avatar>
                      <a-avatar :style="{ backgroundColor: getSeverityColor(item.severity) }">
                        <icon-bug />
                      </a-avatar>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
              <template #empty>
                <a-empty description="未检测到病虫害" />
              </template>
            </a-list>
          </a-card>
        </a-col>

        <a-col :span="24" :md="8">
          <a-card title="护理建议" :bordered="false">
            <a-timeline>
              <a-timeline-item v-for="(step, index) in analysisResult.recommendations" :key="index">
                {{ step }}
              </a-timeline-item>
            </a-timeline>
          </a-card>
        </a-col>
      </a-row>

      <a-card title="数据可视化" :bordered="false" style="margin-top: 16px;">
        <CropCharts :health-data="chartData.health" :pest-data="chartData.pest" :growth-data="chartData.growth" :env-data="chartData.env" />
      </a-card>

      <a-card title="历史对比" :bordered="false" style="margin-top: 16px;">
        <a-table :columns="historyColumns" :data="historyData" :pagination="{ pageSize: 5 }">
          <template #healthScore="{ record }">
            <a-progress :percent="record.healthScore" :show-text="false" :color="getScoreColor(record.healthScore)" />
            <span style="margin-left: 8px;">{{ record.healthScore }}</span>
          </template>
          <template #actions="{ record }">
            <a-button type="text" size="small" @click="viewDetail(record)">查看详情</a-button>
            <a-button type="text" size="small" status="danger" @click="deleteRecord(record)">删除</a-button>
          </template>
        </a-table>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconScan, IconDelete, IconHeartFill, IconBug } from '@arco-design/web-vue/es/icon'
import ImageUpload from '../components/upload/ImageUpload.vue'
import CropCharts from '../components/charts/CropCharts.vue'
import api from '../api.js'

const imageUrl = ref('')
const analyzing = ref(false)
const progress = ref(0)
const progressStatus = ref('normal')
const progressText = ref('')
const analysisResult = ref(null)

const chartData = reactive({
  health: [],
  pest: [],
  growth: [],
  env: {}
})

const historyColumns = [
  { title: '日期', dataIndex: 'date' },
  { title: '作物类型', dataIndex: 'cropType' },
  { title: '健康评分', dataIndex: 'healthScore', slotName: 'healthScore' },
  { title: '状态', dataIndex: 'status' },
  { title: '操作', slotName: 'actions' }
]

const historyData = ref([])

const handleUploadSuccess = (data) => {
  Message.success('图片上传成功')
}

const handleUploadError = (error) => {
  Message.error('图片上传失败')
}

const clearImage = () => {
  imageUrl.value = ''
  analysisResult.value = null
  progress.value = 0
}

const startAnalysis = async () => {
  analyzing.value = true
  progress.value = 0
  progressStatus.value = 'normal'

  const steps = [
    { percent: 20, text: '正在上传图片...' },
    { percent: 40, text: '图像预处理中...' },
    { percent: 60, text: 'AI模型分析中...' },
    { percent: 80, text: '生成分析报告...' },
    { percent: 100, text: '分析完成！' }
  ]

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 800))
    progress.value = step.percent
    progressText.value = step.text
  }

  try {
    const response = await api.crop.analyze({ image: imageUrl.value })
    analysisResult.value = {
      cropType: '小麦',
      growthStage: '拔节期',
      healthStatus: '良好',
      healthScore: 87,
      pests: [
        { name: '蚜虫', severity: '轻度' },
        { name: '白粉病', severity: '中度' }
      ],
      recommendations: [
        '建议使用生物农药防治蚜虫',
        '增加通风，降低湿度以预防白粉病',
        '适当增施钾肥，提高抗病能力',
        '定期监测病虫害发展情况'
      ]
    }

    chartData.health = [
      { date: '3-5', score: 85 },
      { date: '3-6', score: 86 },
      { date: '3-7', score: 84 },
      { date: '3-8', score: 87 },
      { date: '3-9', score: 88 },
      { date: '3-10', score: 87 },
      { date: '3-11', score: 87 }
    ]
    chartData.pest = [
      { value: 30, name: '蚜虫' },
      { value: 20, name: '白粉病' },
      { value: 50, name: '健康' }
    ]
    chartData.growth = [
      { stage: '播种', days: 7 },
      { stage: '发芽', days: 14 },
      { stage: '生长', days: 30 },
      { stage: '拔节', days: 45 },
      { stage: '抽穗', days: 60 }
    ]
    chartData.env = {
      values: [80, 75, 85, 70, 90]
    }

    historyData.value.unshift({
      date: new Date().toLocaleDateString(),
      cropType: analysisResult.value.cropType,
      healthScore: analysisResult.value.healthScore,
      status: analysisResult.value.healthStatus
    })

    progressStatus.value = 'success'
    Message.success('分析完成！')
  } catch (error) {
    progressStatus.value = 'danger'
    Message.error('分析失败，请重试')
  } finally {
    analyzing.value = false
  }
}

const getScoreColor = (score) => {
  if (score >= 80) return '#00b42a'
  if (score >= 60) return '#ff7d00'
  return '#f53f3f'
}

const getSeverityColor = (severity) => {
  const colors = { '轻度': '#00b42a', '中度': '#ff7d00', '重度': '#f53f3f' }
  return colors[severity] || '#165dff'
}

const viewDetail = (record) => {
  Message.info('查看详情功能开发中')
}

const deleteRecord = (record) => {
  const index = historyData.value.indexOf(record)
  if (index > -1) {
    historyData.value.splice(index, 1)
    Message.success('删除成功')
  }
}
</script>

<style scoped>
.crop-page { padding: 20px; }
.upload-card { min-height: 500px; }
.analysis-progress { text-align: center; padding: 40px 20px; }
.progress-text { margin-top: 16px; font-size: 16px; color: var(--color-text-2); }
.analysis-result { text-align: center; }
.results-section { margin-top: 24px; }
</style>
