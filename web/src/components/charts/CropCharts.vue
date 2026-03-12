<template>
  <div class="crop-charts">
    <a-row :gutter="16">
      <a-col :span="12">
        <a-card title="健康度趋势" :bordered="false">
          <div ref="healthTrendRef" class="chart-container"></div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="病虫害分布" :bordered="false">
          <div ref="pestDistRef" class="chart-container"></div>
        </a-card>
      </a-col>
    </a-row>
    <a-row :gutter="16" style="margin-top: 16px;">
      <a-col :span="12">
        <a-card title="生长阶段时间线" :bordered="false">
          <div ref="growthTimelineRef" class="chart-container"></div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="环境因素雷达图" :bordered="false">
          <div ref="envRadarRef" class="chart-container"></div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  healthData: { type: Array, default: () => [] },
  pestData: { type: Array, default: () => [] },
  growthData: { type: Array, default: () => [] },
  envData: { type: Object, default: () => ({}) }
})

const healthTrendRef = ref(null)
const pestDistRef = ref(null)
const growthTimelineRef = ref(null)
const envRadarRef = ref(null)

let healthChart = null
let pestChart = null
let growthChart = null
let envChart = null

const initHealthTrendChart = () => {
  if (!healthTrendRef.value) return
  healthChart = echarts.init(healthTrendRef.value)
  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: props.healthData.map(d => d.date) || ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
    yAxis: { type: 'value', min: 0, max: 100 },
    series: [{
      data: props.healthData.map(d => d.score) || [85, 88, 90, 87, 92, 89, 91],
      type: 'line',
      smooth: true,
      areaStyle: { color: 'rgba(22, 93, 255, 0.1)' },
      itemStyle: { color: '#165DFF' },
      lineStyle: { width: 3 }
    }]
  }
  healthChart.setOption(option)
}

const initPestDistChart = () => {
  if (!pestDistRef.value) return
  pestChart = echarts.init(pestDistRef.value)
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      name: '病虫害类型',
      type: 'pie',
      radius: '50%',
      data: props.pestData.length > 0 ? props.pestData : [
        { value: 30, name: '蚜虫' },
        { value: 20, name: '白粉病' },
        { value: 15, name: '叶斑病' },
        { value: 35, name: '健康' }
      ],
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
    }]
  }
  pestChart.setOption(option)
}

const initGrowthTimelineChart = () => {
  if (!growthTimelineRef.value) return
  growthChart = echarts.init(growthTimelineRef.value)
  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: props.growthData.map(d => d.stage) || ['播种', '发芽', '生长', '开花', '结果'] },
    yAxis: { type: 'value' },
    series: [{
      data: props.growthData.map(d => d.days) || [7, 14, 30, 45, 60],
      type: 'bar',
      itemStyle: { color: '#00B42A' },
      label: { show: true, position: 'top' }
    }]
  }
  growthChart.setOption(option)
}

const initEnvRadarChart = () => {
  if (!envRadarRef.value) return
  envChart = echarts.init(envRadarRef.value)
  const option = {
    tooltip: {},
    radar: {
      indicator: [
        { name: '温度', max: 100 },
        { name: '湿度', max: 100 },
        { name: '光照', max: 100 },
        { name: '土壤', max: 100 },
        { name: '养分', max: 100 }
      ]
    },
    series: [{
      name: '环境因素',
      type: 'radar',
      data: [{
        value: props.envData.values || [80, 75, 85, 70, 90],
        name: '当前状态',
        areaStyle: { color: 'rgba(255, 125, 0, 0.2)' },
        itemStyle: { color: '#FF7D00' }
      }]
    }]
  }
  envChart.setOption(option)
}

const resizeCharts = () => {
  healthChart?.resize()
  pestChart?.resize()
  growthChart?.resize()
  envChart?.resize()
}

onMounted(() => {
  initHealthTrendChart()
  initPestDistChart()
  initGrowthTimelineChart()
  initEnvRadarChart()
  window.addEventListener('resize', resizeCharts)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  healthChart?.dispose()
  pestChart?.dispose()
  growthChart?.dispose()
  envChart?.dispose()
})

watch(() => [props.healthData, props.pestData, props.growthData, props.envData], () => {
  initHealthTrendChart()
  initPestDistChart()
  initGrowthTimelineChart()
  initEnvRadarChart()
}, { deep: true })
</script>

<style scoped>
.crop-charts { width: 100%; }
.chart-container { width: 100%; height: 300px; }
</style>
