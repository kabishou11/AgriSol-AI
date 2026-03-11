<template>
  <div class="carbon">
    <a-card title="碳排放计算">
      <a-form :model="form" layout="vertical">
        <a-form-item label="能源消耗 (kWh)">
          <a-input-number v-model="form.energy" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item label="化肥使用 (kg)">
          <a-input-number v-model="form.fertilizer" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item label="农药使用 (kg)">
          <a-input-number v-model="form.pesticide" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item label="机械作业 (小时)">
          <a-input-number v-model="form.machinery" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" :loading="loading" @click="calculate">
            计算碳排放
          </a-button>
        </a-form-item>
      </a-form>

      <a-card v-if="result" title="计算结果" class="result">
        <a-statistic
          title="总碳排放量"
          :value="result.total"
          suffix="kg CO₂"
          :precision="2"
        />
        <a-divider />
        <a-descriptions :column="1" title="排放明细">
          <a-descriptions-item label="能源">{{ result.energy }} kg CO₂</a-descriptions-item>
          <a-descriptions-item label="化肥">{{ result.fertilizer }} kg CO₂</a-descriptions-item>
          <a-descriptions-item label="农药">{{ result.pesticide }} kg CO₂</a-descriptions-item>
          <a-descriptions-item label="机械">{{ result.machinery }} kg CO₂</a-descriptions-item>
        </a-descriptions>
      </a-card>
    </a-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import api from '../api.js'

const form = ref({
  energy: 0,
  fertilizer: 0,
  pesticide: 0,
  machinery: 0
})

const loading = ref(false)
const result = ref(null)

const calculate = async () => {
  loading.value = true
  try {
    const response = await api.carbon.calculate(form.value)
    result.value = response
    Message.success('计算完成')
  } catch (error) {
    Message.error('计算失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.carbon {
  max-width: 800px;
  margin: 0 auto;
}

.result {
  margin-top: 24px;
}
</style>
