<template>
  <a-layout class="layout">
    <a-layout-header class="header">
      <div class="logo">AgriSol-AI</div>
      <a-menu mode="horizontal" :default-selected-keys="[currentRoute]">
        <a-menu-item key="home" @click="navigate('/')">首页</a-menu-item>
        <a-menu-item key="crop" @click="navigate('/crop')">作物分析</a-menu-item>
        <a-menu-item key="energy" @click="navigate('/energy')">能源监测</a-menu-item>
        <a-menu-item key="carbon" @click="navigate('/carbon')">碳排放</a-menu-item>
        <a-menu-item key="wisdom" @click="navigate('/wisdom')">农事记录</a-menu-item>
      </a-menu>
    </a-layout-header>
    <a-layout-content class="content">
      <router-view />
    </a-layout-content>
  </a-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const currentRoute = computed(() => {
  const path = route.path
  if (path === '/') return 'home'
  return path.slice(1)
})

const navigate = (path) => {
  router.push(path)
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #165dff;
  margin-right: 40px;
}

.content {
  padding: 24px;
  background: #f5f5f5;
}
</style>
