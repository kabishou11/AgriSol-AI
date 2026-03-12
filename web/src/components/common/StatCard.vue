<template>
  <a-card class="stat-card" :class="`variant-${variant}`">
    <div class="stat-content">
      <div class="stat-icon" :style="{ background: iconBg, color: iconColor }">
        {{ icon }}
      </div>
      <div class="stat-info">
        <div class="stat-label">{{ label }}</div>
        <div class="stat-value">{{ value }}</div>
        <div v-if="trend !== null" class="stat-trend" :class="trendClass">
          <icon-arrow-up v-if="trend > 0" />
          <icon-arrow-down v-if="trend < 0" />
          <span>{{ Math.abs(trend) }}%</span>
        </div>
      </div>
    </div>
  </a-card>
</template>

<script setup>
import { computed } from 'vue'
import { IconArrowUp, IconArrowDown } from '@arco-design/web-vue/es/icon'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: String,
    default: '📊'
  },
  iconColor: {
    type: String,
    default: '#fff'
  },
  iconBg: {
    type: String,
    default: 'var(--color-primary)'
  },
  trend: {
    type: Number,
    default: null
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'primary', 'success', 'warning', 'error'].includes(value)
  }
})

const trendClass = computed(() => {
  if (props.trend > 0) return 'trend-up'
  if (props.trend < 0) return 'trend-down'
  return ''
})
</script>

<style scoped>
.stat-card {
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
  margin-bottom: var(--spacing-xs);
}

.stat-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  line-height: 1;
  margin-bottom: var(--spacing-xs);
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.trend-up {
  color: var(--color-success);
}

.trend-down {
  color: var(--color-error);
}
</style>
