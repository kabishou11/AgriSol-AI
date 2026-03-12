<template>
  <div class="image-upload">
    <a-upload :custom-request="handleUpload" :file-list="fileList" :show-file-list="false" :accept="acceptTypes" :multiple="multiple" :disabled="disabled" @before-upload="beforeUpload">
      <template #upload-button>
        <div class="upload-area" :class="{ 'is-dragover': isDragover, 'has-image': previewUrl }">
          <div v-if="!previewUrl" class="upload-content">
            <div class="upload-icon"><icon-image :size="64" /></div>
            <div class="upload-text">
              <p class="upload-title">点击或拖拽图片到此处上传</p>
              <p class="upload-hint">支持 JPG、PNG、WEBP 格式，最大 10MB</p>
            </div>
          </div>
          <div v-else class="preview-container">
            <img :src="previewUrl" alt="预览图" class="preview-image" />
            <div class="preview-mask">
              <div class="preview-actions">
                <a-button type="text" size="large" @click.stop="handlePreview"><template #icon><icon-eye /></template></a-button>
                <a-button type="text" size="large" status="danger" @click.stop="handleRemove"><template #icon><icon-delete /></template></a-button>
              </div>
            </div>
            <a-progress v-if="uploading" :percent="uploadProgress" :show-text="false" class="upload-progress" />
          </div>
        </div>
      </template>
    </a-upload>
    <a-modal v-model:visible="previewVisible" :footer="false" width="auto" :mask-closable="true" unmount-on-close>
      <img :src="previewUrl" alt="预览" style="max-width: 100%; max-height: 80vh;" />
    </a-modal>
    <div v-if="multiple && imageList.length > 0" class="image-list">
      <div v-for="(image, index) in imageList" :key="index" class="image-item">
        <img :src="image.url" alt="图片" class="thumbnail" />
        <div class="image-item-mask">
          <a-button type="text" size="small" @click="previewImage(image)"><template #icon><icon-eye /></template></a-button>
          <a-button type="text" size="small" status="danger" @click="removeImage(index)"><template #icon><icon-delete /></template></a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconImage, IconEye, IconDelete } from '@arco-design/web-vue/es/icon'

const props = defineProps({
  modelValue: { type: [String, Array], default: '' },
  multiple: { type: Boolean, default: false },
  maxSize: { type: Number, default: 10 * 1024 * 1024 },
  acceptTypes: { type: String, default: 'image/jpeg,image/png,image/webp' },
  compress: { type: Boolean, default: true },
  maxWidth: { type: Number, default: 1920 },
  maxHeight: { type: Number, default: 1920 },
  quality: { type: Number, default: 0.8 },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change', 'success', 'error'])
const fileList = ref([])
const previewUrl = ref('')
const previewVisible = ref(false)
const isDragover = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const imageList = ref([])

watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.multiple && Array.isArray(val)) {
      imageList.value = val.map(url => ({ url }))
    } else if (!props.multiple && typeof val === 'string') {
      previewUrl.value = val
    }
  }
}, { immediate: true })

const beforeUpload = (file) => {
  const isValidType = props.acceptTypes.split(',').some(type => file.type === type.trim())
  if (!isValidType) {
    Message.error('不支持的图片格式')
    return false
  }
  if (file.size > props.maxSize) {
    Message.error(`图片大小不能超过 ${props.maxSize / 1024 / 1024}MB`)
    return false
  }
  return true
}

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!props.compress) {
      resolve(file)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        if (width > props.maxWidth || height > props.maxHeight) {
          const ratio = Math.min(props.maxWidth / width, props.maxHeight / height)
          width *= ratio
          height *= ratio
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, { type: file.type, lastModified: Date.now() })
          resolve(compressedFile)
        }, file.type, props.quality)
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const handleUpload = async (option) => {
  const { fileItem, onProgress, onSuccess, onError } = option
  try {
    uploading.value = true
    uploadProgress.value = 0
    const compressedFile = await compressImage(fileItem.file)
    const url = URL.createObjectURL(compressedFile)
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
        onProgress(uploadProgress.value)
      }
    }, 100)
    setTimeout(() => {
      clearInterval(progressInterval)
      uploadProgress.value = 100
      onProgress(100)
      if (props.multiple) {
        imageList.value.push({ url, file: compressedFile })
        emit('update:modelValue', imageList.value.map(img => img.url))
      } else {
        previewUrl.value = url
        emit('update:modelValue', url)
      }
      emit('success', { url, file: compressedFile })
      emit('change', props.multiple ? imageList.value : url)
      onSuccess()
      uploading.value = false
      Message.success('上传成功')
    }, 1000)
  } catch (error) {
    console.error('Upload error:', error)
    uploading.value = false
    emit('error', error)
    onError(error)
    Message.error('上传失败')
  }
}

const handlePreview = () => { previewVisible.value = true }
const handleRemove = () => {
  previewUrl.value = ''
  fileList.value = []
  emit('update:modelValue', '')
  emit('change', '')
}
const previewImage = (image) => {
  previewUrl.value = image.url
  previewVisible.value = true
}
const removeImage = (index) => {
  imageList.value.splice(index, 1)
  emit('update:modelValue', imageList.value.map(img => img.url))
  emit('change', imageList.value)
}
</script>

<style scoped>
.image-upload { width: 100%; }
.upload-area { position: relative; width: 100%; min-height: 300px; border: 2px dashed var(--color-border-2); border-radius: 8px; background-color: var(--color-fill-1); cursor: pointer; transition: all 0.3s ease; overflow: hidden; }
.upload-area:hover { border-color: rgb(var(--primary-6)); background-color: var(--color-fill-2); }
.upload-area.is-dragover { border-color: rgb(var(--primary-6)); background-color: rgb(var(--primary-1)); }
.upload-area.has-image { border-style: solid; border-color: var(--color-border-1); }
.upload-content { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; padding: 20px; }
.upload-icon { color: var(--color-text-3); margin-bottom: 16px; animation: float 3s ease-in-out infinite; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.upload-text { text-align: center; }
.upload-title { font-size: 16px; font-weight: 500; color: var(--color-text-1); margin-bottom: 8px; }
.upload-hint { font-size: 14px; color: var(--color-text-3); }
.preview-container { position: relative; width: 100%; height: 300px; }
.preview-image { width: 100%; height: 100%; object-fit: contain; }
.preview-mask { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease; }
.preview-container:hover .preview-mask { opacity: 1; }
.preview-actions { display: flex; gap: 12px; }
.preview-actions .arco-btn { color: white; font-size: 20px; }
.upload-progress { position: absolute; bottom: 0; left: 0; right: 0; }
.image-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; margin-top: 16px; }
.image-item { position: relative; width: 100%; padding-bottom: 100%; border-radius: 4px; overflow: hidden; border: 1px solid var(--color-border-2); }
.thumbnail { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; }
.image-item-mask { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; gap: 8px; opacity: 0; transition: opacity 0.3s ease; }
.image-item:hover .image-item-mask { opacity: 1; }
.image-item-mask .arco-btn { color: white; }
</style>
