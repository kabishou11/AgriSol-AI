<template>
  <div class="energy">
    <a-row :gutter="16">
      <a-col :span="8">
        <a-card title="实时功率">
          <a-statistic :value="stats.current_power" suffix="kW" />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="今日用电">
          <a-statistic :value="stats.today_usage" suffix="kWh" />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="本月用电">
          <a-statistic :value="stats.month_usage" suffix="kWh" />
        </a-card>
      </a-col>
    </a-row>

    <a-card title="能耗趋势" class="chart-card">
      <v-chart :option="chartOption" style="height: 400px" />
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import api from '../api.js'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

const stats = ref({
  current_power: 0,
  today_usage: 0,
  month_usage: 0
})

const chartOption = ref({
  tooltip: { trigger: 'axis' },
  legend: { data: ['用电量'] },
  xAxis: { type: 'category', data: [] },
  yAxis: { type: 'value', name: 'kWh' },
  series: [{ name: '用电量', type: 'line', data: [] }]
})

const fetchData = async () => {
  try {
    const data = await api.energy.getStats()
    stats.value = data.stats
    chartOption.value.xAxis.data = data.chart.dates
    chartOption.value.series[0].data = data.chart.values
  } catch (error) {
    console.error('Failed to fetch energy data:', error)
  }
}

onMounted(() => {
  fetchData()
  setInterval(fetchData, 30000)
})
</script>

<style scoped>
.energy {
  max-width: 1200px;
  margin: 0 auto;
}

.chart-card {
  margin-top: 16px;
}
</style>
