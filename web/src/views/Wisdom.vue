<template>
  <div class="wisdom-page">
    <div class="page-header">
      <h1>农事智慧库</h1>
      <p class="subtitle">记录和分享您的农事经验</p>
    </div>

    <a-row :gutter="24">
      <a-col :span="24" :lg="16">
        <a-card class="record-card" :bordered="false">
          <template #title>
            <div class="card-title">
              <icon-edit />
              <span>记录新经验</span>
            </div>
          </template>

          <a-tabs default-active-key="text" @change="handleTabChange">
            <a-tab-pane key="text" title="文字记录">
              <a-form :model="form" layout="vertical">
                <a-form-item label="标题" required>
                  <a-input
                    v-model="form.title"
                    placeholder="给您的经验起个标题"
                    size="large"
                  />
                </a-form-item>

                <a-form-item label="详细内容" required>
                  <a-textarea
                    v-model="form.content"
                    placeholder="详细描述您的农事经验..."
                    :rows="8"
                    :max-length="2000"
                    show-word-limit
                  />
                </a-form-item>

                <a-form-item label="分类">
                  <a-select v-model="form.category" placeholder="选择分类">
                    <a-option value="planting">种植技巧</a-option>
                    <a-option value="fertilizer">施肥经验</a-option>
                    <a-option value="pest">病虫害防治</a-option>
                    <a-option value="irrigation">灌溉方法</a-option>
                    <a-option value="harvest">收获技巧</a-option>
                    <a-option value="storage">储存方法</a-option>
                    <a-option value="other">其他</a-option>
                  </a-select>
                </a-form-item>

                <a-form-item label="标签">
                  <a-input-tag
                    v-model="form.tags"
                    placeholder="添加标签，按回车确认"
                    allow-clear
                  />
                </a-form-item>

                <a-form-item>
                  <a-space size="large">
                    <a-button
                      type="primary"
                      size="large"
                      @click="submitRecord"
                      :loading="submitting"
                    >
                      <template #icon><icon-check /></template>
                      保存记录
                    </a-button>
                    <a-button size="large" @click="resetForm">
                      <template #icon><icon-refresh /></template>
                      重置
                    </a-button>
                  </a-space>
                </a-form-item>
              </a-form>
            </a-tab-pane>

            <a-tab-pane key="voice" title="语音记录">
              <div class="voice-tab">
                <VoiceRecorder @save="handleVoiceSave" @cancel="handleVoiceCancel" />
                <a-divider />
                <a-form :model="voiceForm" layout="vertical">
                  <a-form-item label="标题（可选）">
                    <a-input
                      v-model="voiceForm.title"
                      placeholder="为语音记录添加标题"
                      size="large"
                    />
                  </a-form-item>
                  <a-form-item label="补充说明（可选）">
                    <a-textarea
                      v-model="voiceForm.content"
                      placeholder="添加补充说明..."
                      :rows="4"
                    />
                  </a-form-item>
                </a-form>
              </div>
            </a-tab-pane>
          </a-tabs>
        </a-card>

        <a-card class="records-card" :bordered="false" style="margin-top: 24px">
          <template #title>
            <div class="card-title">
              <icon-book />
              <span>我的经验</span>
            </div>
          </template>

          <template #extra>
            <a-input-search
              v-model="searchKeyword"
              placeholder="搜索经验..."
              style="width: 300px"
              @search="handleSearch"
            />
          </template>

          <a-spin :loading="loading" style="width: 100%">
            <div class="records-grid">
              <div
                v-for="record in records"
                :key="record.id"
                class="record-card"
                @click="viewRecord(record)"
              >
                <div class="record-header">
                  <h3>{{ record.title }}</h3>
                  <a-tag :color="getCategoryColor(record.category)">
                    {{ getCategoryName(record.category) }}
                  </a-tag>
                </div>
                <p class="record-content">{{ record.content }}</p>
                <div class="record-footer">
                  <a-space>
                    <span v-if="record.audio_path">
                      <icon-voice /> 语音
                    </span>
                    <span>
                      <icon-eye /> {{ record.view_count || 0 }}
                    </span>
                    <span>
                      <icon-heart :class="{ filled: record.is_favorited }" />
                      {{ record.favorite_count || 0 }}
                    </span>
                  </a-space>
                  <span class="record-date">
                    {{ formatDate(record.created_at) }}
                  </span>
                </div>
                <div class="record-tags" v-if="record.tags && record.tags.length">
                  <a-tag v-for="tag in record.tags.slice(0, 3)" :key="tag" size="small">
                    {{ tag }}
                  </a-tag>
                </div>
              </div>
            </div>

            <a-empty v-if="!loading && records.length === 0" description="还没有记录，快来添加第一条经验吧！" />
          </a-spin>
        </a-card>
      </a-col>

      <a-col :span="24" :lg="8">
        <a-card class="popular-card" :bordered="false">
          <template #title>
            <div class="card-title">
              <icon-fire />
              <span>热门经验</span>
            </div>
          </template>

          <a-spin :loading="loadingPopular">
            <div class="popular-list">
              <div
                v-for="(item, index) in popularRecords"
                :key="item.id"
                class="popular-item"
                @click="viewRecord(item)"
              >
                <div class="popular-rank">{{ index + 1 }}</div>
                <div class="popular-content">
                  <h4>{{ item.title }}</h4>
                  <a-space size="small">
                    <span><icon-eye /> {{ item.view_count }}</span>
                    <span><icon-heart /> {{ item.favorite_count }}</span>
                  </a-space>
                </div>
              </div>
            </div>
          </a-spin>
        </a-card>

        <a-card class="categories-card" :bordered="false" style="margin-top: 24px">
          <template #title>
            <div class="card-title">
              <icon-apps />
              <span>分类浏览</span>
            </div>
          </template>

          <div class="categories-list">
            <div
              v-for="cat in categories"
              :key="cat.category"
              class="category-item"
              @click="filterByCategory(cat.category)"
            >
              <span>{{ getCategoryName(cat.category) }}</span>
              <a-badge :count="cat.count" />
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-modal
      v-model:visible="detailVisible"
      :title="currentRecord?.title"
      width="800px"
      :footer="false"
    >
      <div class="record-detail" v-if="currentRecord">
        <div class="detail-meta">
          <a-tag :color="getCategoryColor(currentRecord.category)">
            {{ getCategoryName(currentRecord.category) }}
          </a-tag>
          <span class="detail-date">{{ formatDate(currentRecord.created_at) }}</span>
        </div>

        <div class="detail-audio" v-if="currentRecord.audio_path">
          <audio controls :src="`/${currentRecord.audio_path}`" style="width: 100%"></audio>
        </div>

        <div class="detail-content">
          {{ currentRecord.content }}
        </div>

        <div class="detail-tags" v-if="currentRecord.tags && currentRecord.tags.length">
          <a-tag v-for="tag in currentRecord.tags" :key="tag">{{ tag }}</a-tag>
        </div>

        <div class="detail-actions">
          <a-space size="large">
            <a-button @click="toggleFavorite(currentRecord)">
              <template #icon>
                <icon-heart :class="{ filled: currentRecord.is_favorited }" />
              </template>
              {{ currentRecord.is_favorited ? '取消收藏' : '收藏' }}
            </a-button>
            <a-button>
              <template #icon><icon-share-alt /></template>
              分享
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconEdit,
  IconBook,
  IconFire,
  IconApps,
  IconCheck,
  IconRefresh,
  IconVoice,
  IconEye,
  IconHeart,
  IconShareAlt
} from '@arco-design/web-vue/es/icon'
import VoiceRecorder from '../components/voice/VoiceRecorder.vue'
import api from '../api.js'

const form = ref({
  title: '',
  content: '',
  category: 'planting',
  tags: []
})

const voiceForm = ref({
  title: '',
  content: ''
})

const voiceData = ref(null)
const submitting = ref(false)
const loading = ref(false)
const loadingPopular = ref(false)
const records = ref([])
const popularRecords = ref([])
const categories = ref([])
const searchKeyword = ref('')
const detailVisible = ref(false)
const currentRecord = ref(null)

const categoryMap = {
  planting: '种植技巧',
  fertilizer: '施肥经验',
  pest: '病虫害防治',
  irrigation: '灌溉方法',
  harvest: '收获技巧',
  storage: '储存方法',
  other: '其他'
}

const getCategoryName = (category) => categoryMap[category] || category
const getCategoryColor = (category) => {
  const colors = {
    planting: 'green',
    fertilizer: 'orange',
    pest: 'red',
    irrigation: 'blue',
    harvest: 'gold',
    storage: 'purple',
    other: 'gray'
  }
  return colors[category] || 'gray'
}

const handleTabChange = (key) => {
  if (key === 'voice') {
    voiceData.value = null
  }
}

const handleVoiceSave = (data) => {
  voiceData.value = data
  Message.success('语音录制完成，请填写标题后保存')
}

const handleVoiceCancel = () => {
  voiceData.value = null
}

const submitRecord = async () => {
  if (!form.value.title || !form.value.content) {
    Message.warning('请填写标题和内容')
    return
  }

  submitting.value = true
  try {
    await api.wisdom.record({
      ...form.value,
      memberId: 1
    })
    Message.success('记录保存成功！')
    resetForm()
    fetchRecords()
  } catch (error) {
    Message.error('保存失败，请重试')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  form.value = {
    title: '',
    content: '',
    category: 'planting',
    tags: []
  }
}

const fetchRecords = async () => {
  loading.value = true
  try {
    const result = await api.wisdom.search({ keyword: searchKeyword.value })
    records.value = result.records || []
  } catch (error) {
    console.error('Failed to fetch records:', error)
  } finally {
    loading.value = false
  }
}

const fetchPopular = async () => {
  loadingPopular.value = true
  try {
    popularRecords.value = await api.wisdom.getPopular()
  } catch (error) {
    console.error('Failed to fetch popular:', error)
  } finally {
    loadingPopular.value = false
  }
}

const fetchCategories = async () => {
  try {
    categories.value = await api.wisdom.getCategories()
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

const handleSearch = () => {
  fetchRecords()
}

const filterByCategory = (category) => {
  searchKeyword.value = ''
  api.wisdom.search({ category }).then(result => {
    records.value = result.records || []
  })
}

const viewRecord = (record) => {
  currentRecord.value = record
  detailVisible.value = true
}

const toggleFavorite = async (record) => {
  try {
    if (record.is_favorited) {
      await api.wisdom.unfavorite({ wisdomId: record.id, memberId: 1 })
      record.is_favorited = false
      record.favorite_count--
    } else {
      await api.wisdom.favorite({ wisdomId: record.id, memberId: 1 })
      record.is_favorited = true
      record.favorite_count++
    }
  } catch (error) {
    Message.error('操作失败')
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(String(date).replace(' ', 'T'))
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

onMounted(() => {
  fetchRecords()
  fetchPopular()
  fetchCategories()
})
</script>

<style scoped>
.wisdom-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  color: #86909c;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}

.voice-tab {
  padding: 24px 0;
}

.records-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.record-card {
  padding: 20px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.record-card:hover {
  border-color: #165dff;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.1);
  transform: translateY(-2px);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.record-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  margin: 0;
  flex: 1;
}

.record-content {
  color: #4e5969;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.record-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #86909c;
}

.record-tags {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.popular-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.popular-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.popular-item:hover {
  background: #f7f8fa;
}

.popular-rank {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #165dff 0%, #4080ff 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.popular-content {
  flex: 1;
}

.popular-content h4 {
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
  margin: 0 0 8px 0;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.category-item:hover {
  background: #f7f8fa;
}

.record-detail {
  padding: 16px 0;
}

.detail-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.detail-date {
  color: #86909c;
  font-size: 14px;
}

.detail-audio {
  margin-bottom: 24px;
}

.detail-content {
  font-size: 15px;
  line-height: 1.8;
  color: #1d2129;
  margin-bottom: 24px;
  white-space: pre-wrap;
}

.detail-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.detail-actions {
  padding-top: 16px;
  border-top: 1px solid #e5e6eb;
}

.filled {
  color: #f53f3f;
}
</style>
