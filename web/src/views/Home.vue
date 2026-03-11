<template>
  <div class="home">
    <a-card class="hero">
      <h1>AgriSol-AI 农业能源环境智能平台</h1>
      <p>集成作物分析、能源监测、碳排放计算与农事记录的智能化解决方案</p>
    </a-card>

    <a-row :gutter="16" class="features">
      <a-col :span="6">
        <a-card hoverable @click="navigate('/crop')">
          <template #cover>
            <div class="card-icon">🌾</div>
          </template>
          <a-card-meta title="作物分析" description="智能识别作物病虫害，提供精准诊断" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card hoverable @click="navigate('/energy')">
          <template #cover>
            <div class="card-icon">⚡</div>
          </template>
          <a-card-meta title="能源监测" description="实时监控能源使用，优化能耗管理" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card hoverable @click="navigate('/carbon')">
          <template #cover>
            <div class="card-icon">🌍</div>
          </template>
          <a-card-meta title="碳排放" description="计算碳足迹，助力绿色农业发展" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card hoverable @click="navigate('/wisdom')">
          <template #cover>
            <div class="card-icon">📝</div>
          </template>
          <a-card-meta title="农事记录" description="记录农事活动，积累农业智慧" />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const navigate = (path) => {
  router.push(path)
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  margin-bottom: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.hero h1 {
  font-size: 32px;
  margin-bottom: 16px;
  color: white;
}

.hero p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
}

.features {
  margin-top: 24px;
}

.card-icon {
  font-size: 48px;
  text-align: center;
  padding: 24px;
}
</style>
