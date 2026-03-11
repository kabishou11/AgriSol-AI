<template>
  <div class="crop">
    <a-card title="作物病虫害分析">
      <a-space direction="vertical" size="large" fill>
        <a-upload
          :auto-upload="false"
          :show-file-list="false"
          @change="handleUpload"
        >
          <template #upload-button>
            <a-button type="primary">上传作物图片</a-button>
          </template>
        </a-upload>

        <div v-if="imageUrl" class="preview">
          <img :src="imageUrl" alt="作物图片" />
        </div>

        <a-button
          type="primary"
          :loading="loading"
          :disabled="!imageUrl"
          @click="analyze"
        >
          开始分析
        </a-button>

        <a-card v-if="result" title="分析结果" class="result">
          <a-descriptions :column="1">
            <a-descriptions-item label="作物类型">{{ result.crop_type }}</a-descriptions-item>
            <a-descriptions-item label="健康状态">{{ result.health_status }}</a-descriptions-item>
            <a-descriptions-item label="病虫害">{{ result.disease || '无' }}</a-descriptions-item>
            <a-descriptions-item label="建议措施">{{ result.suggestion }}</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-space>
    </a-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import api from '../api.js'

const imageUrl = ref('')
const loading = ref(false)
const result = ref(null)

const handleUpload = (fileList) => {
  const file = fileList[0]
  if (file) {
    imageUrl.value = URL.createObjectURL(file.file)
  }
}

const analyze = async () => {
  loading.value = true
  try {
    const response = await api.crop.analyze({ image: imageUrl.value })
    result.value = response
    Message.success('分析完成')
  } catch (error) {
    Message.error('分析失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.crop {
  max-width: 800px;
  margin: 0 auto;
}

.preview {
  text-align: center;
}

.preview img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 4px;
}

.result {
  margin-top: 16px;
}
</style>
