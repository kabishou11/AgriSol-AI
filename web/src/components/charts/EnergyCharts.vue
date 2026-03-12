<template>
  <div class="energy-charts">
    <!-- Generation Trend Chart -->
    <a-card title="发电趋势" class="chart-card">
      <v-chart :option="generationTrendOption" style="height: 350px" />
    </a-card>

    <!-- Consumption Structure -->
    <a-card title="用电结构" class="chart-card">
      <v-chart :option="consumptionPieOption" style="height: 350px" />
    </a-card>

    <!-- Energy Flow Sankey -->
    <a-card title="能源流向" class="chart-card">
      <v-chart :option="energyFlowOption" style="height: 400px" />
    </a-card>

    <!-- Monthly Comparison -->
    <a-card title="月度对比" class="chart-card">
      <v-chart :option="monthlyComparisonOption" style="height: 350px" />
    </a-card>

    <!-- Real-time Monitoring Gauge -->
    <a-card title="实时功率" class="chart-card">
      <v-chart :option="gaugeOption" style="height: 300px" />
    </a-card>

    <!-- Annual Statistics -->
    <a-card title="年度统计" class="chart-card">
      <v-chart :option="annualStatsOption" style="height: 350px" />
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  LineChart,
  PieChart,
  BarChart,
  GaugeChart,
  SankeyChart
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  BarChart,
  GaugeChart,
  SankeyChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

const props = defineProps({
  generationData: {
    type: Array,
    default: () => []
  },
  consumptionData: {
    type: Array,
    default: () => []
  },
  currentPower: {
    type: Number,
    default: 0
  },
  maxPower: {
    type: Number,
    default: 10
  }
})

// Generation Trend Chart
const generationTrendOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' }
  },
  legend: {
    data: ['发电量', '用电量', '自用电量']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: props.generationData.map(d => d.date)
  },
  yAxis: {
    type: 'value',
    name: 'kWh'
  },
  series: [
    {
      name: '发电量',
      type: 'line',
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(255, 193, 7, 0.5)' },
            { offset: 1, color: 'rgba(255, 193, 7, 0.1)' }
          ]
        }
      },
      itemStyle: { color: '#FFC107' },
      data: props.generationData.map(d => d.generation)
    },
    {
      name: '用电量',
      type: 'line',
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(33, 150, 243, 0.5)' },
            { offset: 1, color: 'rgba(33, 150, 243, 0.1)' }
          ]
        }
      },
      itemStyle: { color: '#2196F3' },
      data: props.consumptionData.map(d => d.consumption)
    },
    {
      name: '自用电量',
      type: 'line',
      smooth: true,
      itemStyle: { color: '#4CAF50' },
      data: props.generationData.map((d, i) =>
        Math.min(d.generation, props.consumptionData[i]?.consumption || 0)
      )
    }
  ]
}))

// Consumption Structure Pie Chart
const consumptionPieOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} kWh ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      name: '用电结构',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}: {d}%'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      data: [
        { value: 35, name: '灌溉系统', itemStyle: { color: '#2196F3' } },
        { value: 25, name: '温室控制', itemStyle: { color: '#4CAF50' } },
        { value: 20, name: '照明设备', itemStyle: { color: '#FFC107' } },
        { value: 15, name: '监控系统', itemStyle: { color: '#FF5722' } },
        { value: 5, name: '其他设备', itemStyle: { color: '#9E9E9E' } }
      ]
    }
  ]
}))

// Energy Flow Sankey Diagram
const energyFlowOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    triggerOn: 'mousemove'
  },
  series: [
    {
      type: 'sankey',
      layout: 'none',
      emphasis: {
        focus: 'adjacency'
      },
      data: [
        { name: '太阳能发电' },
        { name: '电网供电' },
        { name: '自用电量' },
        { name: '并网售电' },
        { name: '储能系统' },
        { name: '灌溉' },
        { name: '温室' },
        { name: '照明' }
      ],
      links: [
        { source: '太阳能发电', target: '自用电量', value: 45 },
        { source: '太阳能发电', target: '并网售电', value: 15 },
        { source: '太阳能发电', target: '储能系统', value: 10 },
        { source: '电网供电', target: '自用电量', value: 20 },
        { source: '储能系统', target: '自用电量', value: 8 },
        { source: '自用电量', target: '灌溉', value: 25 },
        { source: '自用电量', target: '温室', value: 20 },
        { source: '自用电量', target: '照明', value: 15 }
      ],
      lineStyle: {
        color: 'gradient',
        curveness: 0.5
      }
    }
  ]
}))

// Monthly Comparison Bar Chart
const monthlyComparisonOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' }
  },
  legend: {
    data: ['发电量', '用电量', '节省费用']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  },
  yAxis: [
    {
      type: 'value',
      name: 'kWh',
      position: 'left'
    },
    {
      type: 'value',
      name: '元',
      position: 'right'
    }
  ],
  series: [
    {
      name: '发电量',
      type: 'bar',
      data: [120, 132, 150, 180, 200, 220, 230, 225, 190, 160, 140, 125],
      itemStyle: { color: '#FFC107' }
    },
    {
      name: '用电量',
      type: 'bar',
      data: [100, 110, 130, 150, 170, 180, 190, 185, 160, 140, 120, 105],
      itemStyle: { color: '#2196F3' }
    },
    {
      name: '节省费用',
      type: 'line',
      yAxisIndex: 1,
      data: [20, 22, 20, 30, 30, 40, 40, 40, 30, 20, 20, 20],
      itemStyle: { color: '#4CAF50' }
    }
  ]
}))

// Real-time Gauge Chart
const gaugeOption = computed(() => ({
  series: [
    {
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: props.maxPower,
      splitNumber: 8,
      axisLine: {
        lineStyle: {
          width: 6,
          color: [
            [0.3, '#4CAF50'],
            [0.7, '#FFC107'],
            [1, '#F44336']
          ]
        }
      },
      pointer: {
        icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
        length: '12%',
        width: 20,
        offsetCenter: [0, '-60%'],
        itemStyle: {
          color: 'auto'
        }
      },
      axisTick: {
        length: 12,
        lineStyle: {
          color: 'auto',
          width: 2
        }
      },
      splitLine: {
        length: 20,
        lineStyle: {
          color: 'auto',
          width: 5
        }
      },
      axisLabel: {
        color: '#464646',
        fontSize: 14,
        distance: -60,
        formatter: (value) => {
          return value.toFixed(0)
        }
      },
      title: {
        offsetCenter: [0, '-20%'],
        fontSize: 18,
        color: '#464646'
      },
      detail: {
        fontSize: 32,
        offsetCenter: [0, '0%'],
        valueAnimation: true,
        formatter: (value) => {
          return value.toFixed(2) + ' kW'
        },
        color: 'auto'
      },
      data: [
        {
          value: props.currentPower,
          name: '当前功率'
        }
      ]
    }
  ]
}))

// Annual Statistics Chart
const annualStatsOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' }
  },
  legend: {
    data: ['总发电量', '总用电量', '自给率']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['2020', '2021', '2022', '2023', '2024', '2025', '2026']
  },
  yAxis: [
    {
      type: 'value',
      name: 'kWh',
      position: 'left'
    },
    {
      type: 'value',
      name: '自给率 (%)',
      position: 'right',
      max: 100
    }
  ],
  series: [
    {
      name: '总发电量',
      type: 'bar',
      data: [1200, 1500, 1800, 2100, 2300, 2500, 2600],
      itemStyle: { color: '#FFC107' }
    },
    {
      name: '总用电量',
      type: 'bar',
      data: [1500, 1600, 1700, 1800, 1900, 2000, 2100],
      itemStyle: { color: '#2196F3' }
    },
    {
      name: '自给率',
      type: 'line',
      yAxisIndex: 1,
      data: [80, 94, 106, 117, 121, 125, 124],
      itemStyle: { color: '#4CAF50' },
      lineStyle: { width: 3 },
      smooth: true
    }
  ]
}))

watch(() => props.currentPower, () => {
  // Trigger chart update when power changes
})
</script>

<style scoped>
.energy-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 16px;
}

.chart-card {
  height: 100%;
}

@media (max-width: 768px) {
  .energy-charts {
    grid-template-columns: 1fr;
  }
}
</style>


