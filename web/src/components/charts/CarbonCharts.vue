<template>
  <div class="carbon-charts">
    <a-row :gutter="16">
      <a-col :span="24" :lg="12">
        <a-card title="碳固存累积趋势">
          <div ref="trendChart" style="height: 300px"></div>
        </a-card>
      </a-col>

      <a-col :span="24" :lg="12">
        <a-card title="碳固存组成">
          <div ref="pieChart" style="height: 300px"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="24" :lg="12">
        <a-card title="月度对比">
          <div ref="monthlyChart" style="height: 300px"></div>
        </a-card>
      </a-col>

      <a-col :span="24" :lg="12">
        <a-card title="作物类型分布">
          <div ref="cropChart" style="height: 300px"></div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})

const trendChart = ref(null)
const pieChart = ref(null)
const monthlyChart = ref(null)
const cropChart = ref(null)

const initTrendChart = () => {
  if (!trendChart.value) return

  const chart = echarts.init(trendChart.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: props.data.trendData?.dates || []
    },
    yAxis: {
      type: 'value',
      name: '吨 CO₂'
    },
    series: [{
      name: '累积碳固存',
      type: 'line',
      data: props.data.trendData?.values || [],
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: 'rgba(20, 201, 201, 0.5)'
          }, {
            offset: 1,
            color: 'rgba(20, 201, 201, 0.1)'
          }]
        }
      },
      lineStyle: {
        color: '#14C9C9',
        width: 3
      }
    }]
  }

  chart.setOption(option)
}

const initPieChart = () => {
  if (!pieChart.value) return

  const chart = echarts.init(pieChart.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 吨 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [{
      name: '碳固存组成',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 20,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { value: props.data.biomassCarbon || 0, name: '生物质碳', itemStyle: { color: '#14C9C9' } },
        { value: props.data.soilCarbon || 0, name: '土壤碳', itemStyle: { color: '#722ED1' } }
      ]
    }]
  }

  chart.setOption(option)
}

const initMonthlyChart = () => {
  if (!monthlyChart.value) return

  const chart = echarts.init(monthlyChart.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: props.data.monthlyData?.months || []
    },
    yAxis: {
      type: 'value',
      name: '吨 CO₂'
    },
    series: [{
      name: '月度碳固存',
      type: 'bar',
      data: props.data.monthlyData?.values || [],
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: '#14C9C9'
          }, {
            offset: 1,
            color: '#0E9F9F'
          }]
        },
        borderRadius: [4, 4, 0, 0]
      }
    }]
  }

  chart.setOption(option)
}

const initCropChart = () => {
  if (!cropChart.value) return

  const chart = echarts.init(cropChart.value)

  const option = {
    tooltip: {
      trigger: 'item'
    },
    series: [{
      name: '作物类型',
      type: 'pie',
      radius: '70%',
      data: props.data.cropDistribution || [],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }

  chart.setOption(option)
}

watch(() => props.data, () => {
  initTrendChart()
  initPieChart()
  initMonthlyChart()
  initCropChart()
}, { deep: true })

onMounted(() => {
  setTimeout(() => {
    initTrendChart()
    initPieChart()
    initMonthlyChart()
    initCropChart()
  }, 100)
})
</script>

<style scoped>
.carbon-charts {
  width: 100%;
}
</style>
