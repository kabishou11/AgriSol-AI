<template>
  <div class="loading-state">
    <a-spin :size="size" />
    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: '加载中...'
  },
  size: {
    type: String,
    default: 'large'
  }
})
</script>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl) var(--spacing-lg);
  min-height: 200px;
}

.loading-text {
  margin-top: var(--spacing-md);
  color: var(--color-gray-600);
  font-size: var(--font-size-base);
}
</style>
