<template>
  <div class="wisdom">
    <a-card title="农事记录">
      <a-space direction="vertical" size="large" fill>
        <a-button type="primary" @click="showModal = true">新增记录</a-button>

        <a-table :columns="columns" :data="records" :loading="loading">
          <template #date="{ record }">
            {{ formatDate(record.date) }}
          </template>
        </a-table>
      </a-space>
    </a-card>

    <a-modal v-model:visible="showModal" title="新增农事记录" @ok="handleSubmit">
      <a-form :model="form" layout="vertical">
        <a-form-item label="日期">
          <a-date-picker v-model="form.date" style="width: 100%" />
        </a-form-item>
        <a-form-item label="活动类型">
          <a-select v-model="form.activity_type">
            <a-option value="播种">播种</a-option>
            <a-option value="施肥">施肥</a-option>
            <a-option value="灌溉">灌溉</a-option>
            <a-option value="除草">除草</a-option>
            <a-option value="收获">收获</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="详细描述">
          <a-textarea v-model="form.description" :rows="4" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import api from '../api.js'

const showModal = ref(false)
const loading = ref(false)
const records = ref([])

const form = ref({
  date: new Date(),
  activity_type: '',
  description: ''
})

const columns = [
  { title: '日期', dataIndex: 'date', slotName: 'date' },
  { title: '活动类型', dataIndex: 'activity_type' },
  { title: '描述', dataIndex: 'description' }
]

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const fetchRecords = async () => {
  loading.value = true
  try {
    records.value = await api.wisdom.getList()
  } catch (error) {
    console.error('Failed to fetch records:', error)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  try {
    await api.wisdom.create(form.value)
    Message.success('记录已保存')
    showModal.value = false
    form.value = { date: new Date(), activity_type: '', description: '' }
    fetchRecords()
  } catch (error) {
    Message.error('保存失败，请重试')
  }
}

onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
.wisdom {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
