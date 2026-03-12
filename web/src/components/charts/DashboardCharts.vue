<template>
  <div class="dashboard-charts">
    <v-chart :option="chartOption" :style="{ height: '400px' }" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components';

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
]);

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  type: {
    type: String,
    default: 'crops'
  }
});

const chartOption = computed(() => {
  const dates = props.data.map(item => item.date);

  if (props.type === 'crops') {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: {
        data: ['数量', '平均健康分']
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
        data: dates
      },
      yAxis: [
        {
          type: 'value',
          name: '数量',
          position: 'left'
        },
        {
          type: 'value',
          name: '健康分',
          position: 'right',
          max: 100
        }
      ],
      series: [
        {
          name: '数量',
          type: 'line',
          data: props.data.map(item => item.count || 0),
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 180, 42, 0.3)' },
                { offset: 1, color: 'rgba(0, 180, 42, 0.05)' }
              ]
            }
          },
          itemStyle: { color: '#00b42a' }
        },
        {
          name: '平均健康分',
          type: 'line',
          yAxisIndex: 1,
          data: props.data.map(item => item.avgScore || 0),
          smooth: true,
          itemStyle: { color: '#165dff' }
        }
      ]
    };
  } else if (props.type === 'energy') {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: {
        data: ['太阳能潜力', '风能潜力']
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
        data: dates
      },
      yAxis: {
        type: 'value',
        name: 'kWh'
      },
      series: [
        {
          name: '太阳能潜力',
          type: 'line',
          data: props.data.map(item => item.solar || 0),
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255, 125, 0, 0.3)' },
                { offset: 1, color: 'rgba(255, 125, 0, 0.05)' }
              ]
            }
          },
          itemStyle: { color: '#ff7d00' }
        },
        {
          name: '风能潜力',
          type: 'line',
          data: props.data.map(item => item.wind || 0),
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(22, 93, 255, 0.3)' },
                { offset: 1, color: 'rgba(22, 93, 255, 0.05)' }
              ]
            }
          },
          itemStyle: { color: '#165dff' }
        }
      ]
    };
  } else if (props.type === 'carbon') {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['碳排放']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates
      },
      yAxis: {
        type: 'value',
        name: 'kg CO₂'
      },
      series: [
        {
          name: '碳排放',
          type: 'bar',
          data: props.data.map(item => item.total || 0),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#165dff' },
                { offset: 1, color: '#4080ff' }
              ]
            }
          }
        }
      ]
    };
  } else if (props.type === 'environment') {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: {
        data: ['环境评分']
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
        data: dates
      },
      yAxis: {
        type: 'value',
        name: '评分',
        max: 100
      },
      series: [
        {
          name: '环境评分',
          type: 'line',
          data: props.data.map(item => item.score || 0),
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(114, 46, 209, 0.3)' },
                { offset: 1, color: 'rgba(114, 46, 209, 0.05)' }
              ]
            }
          },
          itemStyle: { color: '#722ed1' }
        }
      ]
    };
  }

  return {};
});
</script>

<style scoped>
.dashboard-charts {
  width: 100%;
}
</style>
