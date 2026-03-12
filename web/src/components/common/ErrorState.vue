<template>
  <div class="error-state">
    <div class="error-icon">{{ icon }}</div>
    <h3 class="error-title">{{ title }}</h3>
    <p class="error-description">{{ description }}</p>
    <a-space>
      <a-button type="primary" @click="$emit('retry')">
        重试
      </a-button>
      <a-button v-if="showBack" @click="$emit('back')">
        返回
      </a-button>
    </a-space>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: '⚠️'
  },
  title: {
    type: String,
    default: '出错了'
  },
  description: {
    type: String,
    default: '加载数据时发生错误，请稍后重试'
  },
  showBack: {
    type: Boolean,
    default: false
  }
})

defineEmits(['retry', 'back'])
</script>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl) var(--spacing-lg);
  min-height: 300px;
  text-align: center;
}

.error-icon {
  font-size: 64px;
  margin-bottom: var(--spacing-lg);
}

.error-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-error);
  margin-bottom: var(--spacing-sm);
}

.error-description {
  font-size: var(--font-size-base);
  color: var(--color-gray-600);
  margin-bottom: var(--spacing-lg);
}
</style>
