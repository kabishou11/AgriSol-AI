<template>
  <div class="graph-page">
    <!-- Header -->
    <div class="graph-header">
      <div class="header-left">
        <h1 class="graph-title">
          <span class="title-icon">🕸️</span>
          知识图谱
        </h1>
        <p class="graph-subtitle">农光互补生态系统知识关联可视化</p>
      </div>
      <div class="header-controls">
        <a-space>
          <a-select v-model="filterCategory" size="small" style="width: 120px" @change="applyFilter">
            <a-option value="all">全部节点</a-option>
            <a-option value="concept">核心概念</a-option>
            <a-option value="crop">作物</a-option>
            <a-option value="energy">能源</a-option>
            <a-option value="environment">环境</a-option>
            <a-option value="carbon">碳汇</a-option>
            <a-option value="wisdom">农事经验</a-option>
            <a-option value="tag">标签</a-option>
          </a-select>
          <a-button size="small" @click="resetGraph">
            <icon-refresh /> 重置
          </a-button>
          <a-button size="small" @click="toggleFullscreen">
            <icon-fullscreen /> 全屏
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- Legend -->
    <div class="graph-legend">
      <div v-for="cat in categories" :key="cat.name" class="legend-item">
        <span class="legend-dot" :style="{ background: cat.color, boxShadow: `0 0 6px ${cat.color}` }"></span>
        <span>{{ cat.label }}</span>
      </div>
    </div>

    <!-- Main layout -->
    <div class="graph-main" ref="containerRef">
      <!-- Graph canvas -->
      <div class="graph-canvas" ref="graphRef">
        <div v-if="loading" class="graph-loading">
          <a-spin size="large" />
          <p>正在构建知识图谱...</p>
        </div>
        <v-chart
          v-else
          ref="chartRef"
          :option="chartOption"
          :style="{ width: '100%', height: '100%' }"
          autoresize
          @click="handleNodeClick"
        />
      </div>

      <!-- Detail panel -->
      <transition name="panel-slide">
        <div class="detail-panel" v-if="selectedNode">
          <div class="panel-header">
            <div class="panel-node-info">
              <span class="panel-dot" :style="{ background: getNodeColor(selectedNode.category), boxShadow: `0 0 8px ${getNodeColor(selectedNode.category)}` }"></span>
              <span class="panel-category">{{ getCategoryLabel(selectedNode.category) }}</span>
            </div>
            <a-button type="text" size="mini" @click="selectedNode = null">✕</a-button>
          </div>
          <h3 class="panel-title">{{ selectedNode.name }}</h3>

          <div class="panel-stats">
            <div class="stat-item">
              <span class="stat-label">连接数</span>
              <span class="stat-value">{{ getNodeConnections(selectedNode.id) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">权重</span>
              <span class="stat-value">{{ selectedNode.value }}</span>
            </div>
          </div>

          <!-- Connected nodes -->
          <div class="panel-connections" v-if="connectedNodes.length">
            <div class="connections-title">关联节点</div>
            <div class="connection-list">
              <div
                v-for="conn in connectedNodes.slice(0, 8)"
                :key="conn.id"
                class="connection-item"
                @click="focusNode(conn)"
              >
                <span class="conn-dot" :style="{ background: getNodeColor(conn.category) }"></span>
                <span class="conn-label">{{ conn.label }}</span>
                <span class="conn-rel">{{ conn.relation }}</span>
              </div>
            </div>
          </div>

          <!-- Wisdom detail -->
          <div class="panel-wisdom" v-if="wisdomDetail">
            <a-divider style="margin: 12px 0; border-color: rgba(255,255,255,0.1)" />
            <div class="wisdom-content">{{ wisdomDetail.content?.slice(0, 200) }}...</div>
            <div class="wisdom-tags" v-if="wisdomDetail.tags?.length">
              <a-tag v-for="t in wisdomDetail.tags" :key="t" size="small" color="arcoblue">{{ t }}</a-tag>
            </div>
          </div>

          <!-- AI insight button -->
          <a-button
            type="primary"
            size="small"
            long
            style="margin-top: 16px"
            @click="askAiAboutNode"
          >
            🤖 AI深度解析
          </a-button>
        </div>
      </transition>
    </div>

    <!-- Stats bar -->
    <div class="graph-stats">
      <div class="stat-pill">
        <span class="pill-num">{{ graphData.nodes?.length || 0 }}</span>
        <span class="pill-label">知识节点</span>
      </div>
      <div class="stat-pill">
        <span class="pill-num">{{ graphData.edges?.length || 0 }}</span>
        <span class="pill-label">关联边</span>
      </div>
      <div class="stat-pill">
        <span class="pill-num">{{ categories.length }}</span>
        <span class="pill-label">知识域</span>
      </div>
      <div class="stat-pill">
        <span class="pill-num">{{ wisdomCount }}</span>
        <span class="pill-label">农事经验</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { use } from 'echarts/core'
import { GraphChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { IconRefresh, IconFullscreen } from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import api from '../api.js'

use([GraphChart, TooltipComponent, LegendComponent, CanvasRenderer])

const loading = ref(true)
const graphData = ref({ nodes: [], edges: [], categories: [] })
const selectedNode = ref(null)
const wisdomDetail = ref(null)
const filterCategory = ref('all')
const chartRef = ref(null)
const graphRef = ref(null)

const CATEGORY_META = {
  concept:     { label: '核心概念', color: '#a78bfa' },
  crop:        { label: '作物',     color: '#4ade80' },
  energy:      { label: '能源',     color: '#facc15' },
  environment: { label: '环境',     color: '#60a5fa' },
  carbon:      { label: '碳汇',     color: '#34d399' },
  wisdom:      { label: '农事经验', color: '#f472b6' },
  tag:         { label: '标签',     color: '#fb923c' }
}

const categories = Object.entries(CATEGORY_META).map(([name, meta]) => ({
  name, label: meta.label, color: meta.color
}))

const getNodeColor = (cat) => CATEGORY_META[cat]?.color || '#86909c'
const getCategoryLabel = (cat) => CATEGORY_META[cat]?.label || cat

const wisdomCount = computed(() =>
  graphData.value.nodes?.filter(n => n.category === 'wisdom').length || 0
)

const filteredNodes = computed(() => {
  if (filterCategory.value === 'all') return graphData.value.nodes || []
  return (graphData.value.nodes || []).filter(n => n.category === filterCategory.value)
})

const filteredEdges = computed(() => {
  if (filterCategory.value === 'all') return graphData.value.edges || []
  const nodeIds = new Set(filteredNodes.value.map(n => n.id))
  return (graphData.value.edges || []).filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
})

const connectedNodes = computed(() => {
  if (!selectedNode.value) return []
  const id = selectedNode.value.id
  const result = []
  const nodeMap = new Map((graphData.value.nodes || []).map(n => [n.id, n]))

  ;(graphData.value.edges || []).forEach(e => {
    if (e.source === id) {
      const n = nodeMap.get(e.target)
      if (n) result.push({ id: n.id, label: n.name, category: n.category, relation: e.label || '关联' })
    } else if (e.target === id) {
      const n = nodeMap.get(e.source)
      if (n) result.push({ id: n.id, label: n.name, category: n.category, relation: e.label || '关联' })
    }
  })
  return result
})

const getNodeConnections = (id) => {
  return (graphData.value.edges || []).filter(e => e.source === id || e.target === id).length
}

const chartOption = computed(() => ({
  backgroundColor: '#0d1117',
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(13,17,23,0.95)',
    borderColor: 'rgba(255,255,255,0.1)',
    textStyle: { color: '#c9d1d9', fontSize: 13 },
    formatter: (params) => {
      if (params.dataType === 'node') {
        const cat = getCategoryLabel(params.data.category)
        return `<div style="padding:4px 0">
          <strong style="color:#e8f4fd">${params.data.name}</strong><br/>
          <span style="color:#86909c">${cat}</span>
        </div>`
      }
      return params.data.label || ''
    }
  },
  series: [{
    type: 'graph',
    layout: 'force',
    data: filteredNodes.value.map(n => ({
      ...n,
      itemStyle: {
        color: getNodeColor(n.category),
        shadowBlur: n.category === 'concept' ? 20 : 10,
        shadowColor: getNodeColor(n.category),
        borderColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1
      },
      label: {
        show: n.value >= 3 || n.category === 'concept',
        color: '#e8f4fd',
        fontSize: n.category === 'concept' ? 13 : 11,
        fontWeight: n.category === 'concept' ? 600 : 400,
        textShadowBlur: 4,
        textShadowColor: getNodeColor(n.category)
      }
    })),
    links: filteredEdges.value.map(e => ({
      ...e,
      lineStyle: {
        color: 'rgba(255,255,255,0.12)',
        width: e.lineStyle?.width || 1,
        curveness: 0.1
      },
      label: {
        show: false,
        color: '#86909c',
        fontSize: 10
      }
    })),
    force: {
      repulsion: 180,
      gravity: 0.08,
      edgeLength: [60, 180],
      layoutAnimation: true,
      friction: 0.6
    },
    roam: true,
    draggable: true,
    focusNodeAdjacency: true,
    emphasis: {
      focus: 'adjacency',
      lineStyle: { width: 3, color: 'rgba(255,255,255,0.4)' },
      itemStyle: { shadowBlur: 30 }
    },
    selectedMode: 'single',
    select: {
      itemStyle: { borderWidth: 3, borderColor: '#fff' }
    }
  }]
}))

const handleNodeClick = async (params) => {
  if (params.dataType !== 'node') return
  selectedNode.value = params.data
  wisdomDetail.value = null

  // Load wisdom detail if applicable
  if (params.data.category === 'wisdom') {
    const idMatch = params.data.id?.match(/wisdom_(\d+)/)
    if (idMatch) {
      try {
        const res = await api.graph.getNodeDetail('wisdom', idMatch[1])
        wisdomDetail.value = res.data
      } catch {}
    }
  }
}

const focusNode = (conn) => {
  const node = (graphData.value.nodes || []).find(n => n.id === conn.id)
  if (node) selectedNode.value = node
}

const applyFilter = () => {
  selectedNode.value = null
}

const resetGraph = () => {
  filterCategory.value = 'all'
  selectedNode.value = null
  chartRef.value?.chart?.dispatchAction({ type: 'restore' })
}

const toggleFullscreen = () => {
  const el = graphRef.value
  if (!document.fullscreenElement) {
    el?.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

const askAiAboutNode = () => {
  if (!selectedNode.value) return
  Message.info(`已向AI发送关于"${selectedNode.value.name}"的查询，请打开AI助手查看`)
  // Emit event or use global state to pre-fill AI chat
  window.dispatchEvent(new CustomEvent('ai-ask', { detail: { question: `请详细介绍${selectedNode.value.name}在农光互补系统中的作用和重要性` } }))
}

onMounted(async () => {
  try {
    const data = await api.graph.getKnowledge()
    graphData.value = data
  } catch (err) {
    console.error('Failed to load graph:', err)
    Message.error('知识图谱加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.graph-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--header-height) - 48px);
  background: #0d1117;
  border-radius: 12px;
  overflow: hidden;
  color: #c9d1d9;
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}

.graph-title {
  font-size: 20px;
  font-weight: 700;
  color: #e8f4fd;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.title-icon { font-size: 22px; }
.graph-subtitle { color: #586069; font-size: 13px; margin: 2px 0 0; }

.graph-legend {
  display: flex;
  gap: 16px;
  padding: 10px 24px;
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid rgba(255,255,255,0.04);
  flex-wrap: wrap;
  flex-shrink: 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8b949e;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.graph-main {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.graph-canvas {
  flex: 1;
  position: relative;
  background: #0d1117;
}

.graph-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #586069;
}

.detail-panel {
  width: 280px;
  background: #161b22;
  border-left: 1px solid rgba(255,255,255,0.06);
  padding: 20px;
  overflow-y: auto;
  flex-shrink: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-node-info { display: flex; align-items: center; gap: 8px; }
.panel-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.panel-category { font-size: 12px; color: #8b949e; }

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #e8f4fd;
  margin: 0 0 16px;
  line-height: 1.4;
}

.panel-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item { display: flex; flex-direction: column; gap: 2px; }
.stat-label { font-size: 11px; color: #586069; }
.stat-value { font-size: 18px; font-weight: 700; color: #79c0ff; }

.connections-title {
  font-size: 12px;
  color: #586069;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.connection-list { display: flex; flex-direction: column; gap: 6px; }

.connection-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  background: rgba(255,255,255,0.03);
}
.connection-item:hover { background: rgba(255,255,255,0.07); }

.conn-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.conn-label { flex: 1; font-size: 13px; color: #c9d1d9; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conn-rel { font-size: 11px; color: #586069; flex-shrink: 0; }

.wisdom-content {
  font-size: 13px;
  color: #8b949e;
  line-height: 1.6;
  margin-bottom: 10px;
}

.wisdom-tags { display: flex; flex-wrap: wrap; gap: 4px; }

.graph-stats {
  display: flex;
  gap: 0;
  border-top: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}

.stat-pill {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border-right: 1px solid rgba(255,255,255,0.04);
}
.stat-pill:last-child { border-right: none; }

.pill-num { font-size: 20px; font-weight: 700; color: #79c0ff; }
.pill-label { font-size: 11px; color: #586069; }

/* Transitions */
.panel-slide-enter-active, .panel-slide-leave-active {
  transition: all 0.25s ease;
}
.panel-slide-enter-from, .panel-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Arco overrides for dark theme */
:deep(.arco-select-view) {
  background: rgba(255,255,255,0.06) !important;
  border-color: rgba(255,255,255,0.1) !important;
  color: #c9d1d9 !important;
}
:deep(.arco-btn) { color: #8b949e; }
</style>
