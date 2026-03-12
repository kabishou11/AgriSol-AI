<template>
  <a-layout-header class="app-header">
    <div class="header-left">
      <a-button
        class="menu-toggle"
        type="text"
        @click="$emit('toggle-sidebar')"
      >
        <icon-menu v-if="collapsed" />
        <icon-menu-fold v-else />
      </a-button>
      <div class="logo">
        <span class="logo-icon">🌱</span>
        <span class="logo-text">AgriSol-AI</span>
      </div>
    </div>

    <div class="header-right">
      <a-space :size="16">
        <a-tooltip content="通知">
          <a-badge :count="3" dot>
            <a-button type="text" shape="circle">
              <icon-notification />
            </a-button>
          </a-badge>
        </a-tooltip>

        <a-tooltip content="帮助">
          <a-button type="text" shape="circle">
            <icon-question-circle />
          </a-button>
        </a-tooltip>

        <a-dropdown>
          <a-avatar :size="36" style="background-color: var(--color-primary)">
            <icon-user />
          </a-avatar>
          <template #content>
            <a-doption>
              <icon-user />
              个人中心
            </a-doption>
            <a-doption>
              <icon-settings />
              设置
            </a-doption>
            <a-doption>
              <icon-export />
              退出登录
            </a-doption>
          </template>
        </a-dropdown>
      </a-space>
    </div>
  </a-layout-header>
</template>

<script setup>
import {
  IconMenu,
  IconMenuFold,
  IconNotification,
  IconQuestionCircle,
  IconUser,
  IconSettings,
  IconExport
} from '@arco-design/web-vue/es/icon'

defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle-sidebar'])
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-fixed);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 var(--spacing-lg);
  background: var(--bg-primary);
  box-shadow: var(--shadow-sm);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.menu-toggle {
  font-size: 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-right {
  display: flex;
  align-items: center;
}

@media (max-width: 767px) {
  .logo-text {
    display: none;
  }
}
</style>
