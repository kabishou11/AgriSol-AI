<template>
  <a-card
    :class="['data-card', `variant-${variant}`, { hoverable, clickable }]"
    :hoverable="hoverable"
    @click="handleClick"
  >
    <template v-if="$slots.cover" #cover>
      <slot name="cover" />
    </template>

    <template v-if="icon" #extra>
      <div class="card-icon" :style="{ color: iconColor }">
        {{ icon }}
      </div>
    </template>

    <div class="card-content">
      <h3 v-if="title" class="card-title">{{ title }}</h3>
      <p v-if="description" class="card-description">{{ description }}</p>
      <slot />
    </div>

    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>
  </a-card>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  iconColor: {
    type: String,
    default: 'var(--color-primary)'
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'primary', 'success', 'warning', 'error'].includes(value)
  },
  hoverable: {
    type: Boolean,
    default: true
  },
  clickable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<style scoped>
.data-card {
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
  height: 100%;
}

.data-card.hoverable:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.data-card.clickable {
  cursor: pointer;
}

.card-icon {
  font-size: 32px;
}

.card-content {
  padding: var(--spacing-sm) 0;
}

.card-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-sm);
}

.card-description {
  font-size: var(--font-size-base);
  color: var(--color-gray-600);
  margin: 0;
}

.variant-primary {
  border-color: var(--color-primary);
}

.variant-success {
  border-color: var(--color-success);
}

.variant-warning {
  border-color: var(--color-warning);
}

.variant-error {
  border-color: var(--color-error);
}
</style>
