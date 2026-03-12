<template>
  <div class="knowledge-page">
    <div class="page-header">
      <h1>知识库</h1>
      <p class="subtitle">探索和学习农事智慧</p>
      <a-button type="outline" @click="$router.push('/graph')" style="margin-top: 12px">
        🕸️ 查看知识图谱
      </a-button>
    </div>

    <a-card :bordered="false" class="search-card">
      <a-input-search
        v-model="searchKeyword"
        placeholder="搜索农事经验、技巧..."
        size="large"
        @search="handleSearch"
      >
        <template #prefix>
          <icon-search />
        </template>
      </a-input-search>

      <div class="quick-filters">
        <a-space wrap>
          <a-tag
            v-for="cat in quickCategories"
            :key="cat.value"
            :color="selectedCategory === cat.value ? 'blue' : ''"
            checkable
            :checked="selectedCategory === cat.value"
            @check="selectCategory(cat.value)"
          >
            {{ cat.label }}
          </a-tag>
        </a-space>
      </div>
    </a-card>

    <a-row :gutter="24" style="margin-top: 24px">
      <a-col :span="24" :lg="18">
        <a-tabs v-model:active-key="activeTab" @change="handleTabChange">
          <a-tab-pane key="all" title="全部经验">
            <a-spin :loading="loading" style="width: 100%">
              <div class="knowledge-grid">
                <div
                  v-for="item in knowledgeList"
                  :key="item.id"
                  class="knowledge-card"
                  @click="viewDetail(item)"
                >
                  <div class="knowledge-header">
                    <h3>{{ item.title }}</h3>
                    <a-tag :color="getCategoryColor(item.category)">
                      {{ getCategoryName(item.category) }}
                    </a-tag>
                  </div>

                  <p class="knowledge-excerpt">{{ item.content }}</p>

                  <div class="knowledge-meta">
                    <a-space>
                      <span v-if="item.audio_path">
                        <icon-voice /> 语音
                      </span>
                      <span>
                        <icon-eye /> {{ item.view_count || 0 }}
                      </span>
                      <span>
                        <icon-heart /> {{ item.favorite_count || 0 }}
                      </span>
                      <span>
                        <icon-share-alt /> {{ item.share_count || 0 }}
                      </span>
                    </a-space>
                    <span class="knowledge-date">
                      {{ formatDate(item.created_at) }}
                    </span>
                  </div>

                  <div class="knowledge-tags" v-if="item.tags && item.tags.length">
                    <a-tag
                      v-for="tag in item.tags.slice(0, 4)"
                      :key="tag"
                      size="small"
                    >
                      {{ tag }}
                    </a-tag>
                  </div>
                </div>
              </div>

              <a-empty
                v-if="!loading && knowledgeList.length === 0"
                description="暂无相关经验"
              />

              <div class="pagination" v-if="total > pageSize">
                <a-pagination
                  v-model:current="currentPage"
                  :total="total"
                  :page-size="pageSize"
                  show-total
                  @change="handlePageChange"
                />
              </div>
            </a-spin>
          </a-tab-pane>

          <a-tab-pane key="favorites" title="我的收藏">
            <div class="favorites-list">
              <a-empty description="还没有收藏" />
            </div>
          </a-tab-pane>
        </a-tabs>
      </a-col>

      <a-col :span="24" :lg="6">
        <a-card :bordered="false" class="sidebar-card">
          <template #title>
            <div class="card-title">
              <icon-fire />
              <span>热门经验</span>
            </div>
          </template>

          <div class="popular-list">
            <div
              v-for="(item, index) in popularList"
              :key="item.id"
              class="popular-item"
              @click="viewDetail(item)"
            >
              <div class="popular-rank" :class="`rank-${index + 1}`">
                {{ index + 1 }}
              </div>
              <div class="popular-content">
                <h4>{{ item.title }}</h4>
                <div class="popular-stats">
                  <span><icon-eye /> {{ item.view_count }}</span>
                  <span><icon-heart /> {{ item.favorite_count }}</span>
                </div>
              </div>
            </div>
          </div>
        </a-card>

        <a-card :bordered="false" class="sidebar-card" style="margin-top: 16px">
          <template #title>
            <div class="card-title">
              <icon-tags />
              <span>热门标签</span>
            </div>
          </template>

          <div class="tags-cloud">
            <a-tag
              v-for="tag in hotTags"
              :key="tag.name"
              @click="searchByTag(tag.name)"
              style="cursor: pointer; margin: 4px"
            >
              {{ tag.name }} ({{ tag.count }})
            </a-tag>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-modal
      v-model:visible="detailVisible"
      :title="currentItem?.title"
      width="900px"
      :footer="false"
    >
      <div class="detail-content" v-if="currentItem">
        <div class="detail-header">
          <a-space>
            <a-tag :color="getCategoryColor(currentItem.category)">
              {{ getCategoryName(currentItem.category) }}
            </a-tag>
            <span class="detail-date">{{ formatDate(currentItem.created_at) }}</span>
          </a-space>

          <a-space>
            <span><icon-eye /> {{ currentItem.view_count }}</span>
            <span><icon-heart /> {{ currentItem.favorite_count }}</span>
            <span><icon-share-alt /> {{ currentItem.share_count }}</span>
          </a-space>
        </div>

        <div class="detail-audio" v-if="currentItem.audio_path">
          <audio
            controls
            :src="`/${currentItem.audio_path}`"
            style="width: 100%"
          ></audio>
        </div>

        <div class="detail-body">
          {{ currentItem.content }}
        </div>

        <div class="detail-tags" v-if="currentItem.tags && currentItem.tags.length">
          <a-tag v-for="tag in currentItem.tags" :key="tag">{{ tag }}</a-tag>
        </div>

        <a-divider />

        <div class="detail-actions">
          <a-space size="large">
            <a-button
              type="primary"
              @click="toggleFavorite(currentItem)"
              :loading="favoriteLoading"
            >
              <template #icon>
                <icon-heart :class="{ filled: currentItem.is_favorited }" />
              </template>
              {{ currentItem.is_favorited ? '取消收藏' : '收藏' }}
            </a-button>

            <a-button @click="shareKnowledge(currentItem)">
              <template #icon><icon-share-alt /></template>
              分享
            </a-button>

            <a-button @click="copyLink(currentItem)">
              <template #icon><icon-link /></template>
              复制链接
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
  IconSearch,
  IconFire,
  IconTags,
  IconVoice,
  IconEye,
  IconHeart,
  IconShareAlt,
  IconLink
} from '@arco-design/web-vue/es/icon'
import api from '../api.js'

const searchKeyword = ref('')
const selectedCategory = ref('all')
const activeTab = ref('all')
const loading = ref(false)
const favoriteLoading = ref(false)
const knowledgeList = ref([])
const popularList = ref([])
const hotTags = ref([])
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const detailVisible = ref(false)
const currentItem = ref(null)

const quickCategories = [
  { label: '全部', value: 'all' },
  { label: '种植技巧', value: 'planting' },
  { label: '施肥经验', value: 'fertilizer' },
  { label: '病虫害防治', value: 'pest' },
  { label: '灌溉方法', value: 'irrigation' },
  { label: '收获技巧', value: 'harvest' }
]

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

const handleSearch = () => {
  currentPage.value = 1
  fetchKnowledge()
}

const selectCategory = (category) => {
  selectedCategory.value = category
  currentPage.value = 1
  fetchKnowledge()
}

const handleTabChange = (key) => {
  activeTab.value = key
  if (key === 'all') {
    fetchKnowledge()
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchKnowledge()
}

const fetchKnowledge = async () => {
  loading.value = true
  try {
    const result = await api.wisdom.search({
      keyword: searchKeyword.value,
      category: selectedCategory.value === 'all' ? undefined : selectedCategory.value,
      page: currentPage.value,
      pageSize: pageSize.value
    })
    knowledgeList.value = result.records || []
    total.value = result.total || 0
  } catch (error) {
    console.error('Failed to fetch knowledge:', error)
  } finally {
    loading.value = false
  }
}

const fetchPopular = async () => {
  try {
    popularList.value = await api.wisdom.getPopular({ limit: 10 })
  } catch (error) {
    console.error('Failed to fetch popular:', error)
  }
}

const viewDetail = async (item) => {
  try {
    const detail = await api.wisdom.getDetail(item.id)
    currentItem.value = detail
    detailVisible.value = true
  } catch (error) {
    Message.error('加载详情失败')
  }
}

const toggleFavorite = async (item) => {
  favoriteLoading.value = true
  try {
    if (item.is_favorited) {
      await api.wisdom.unfavorite({ wisdomId: item.id, memberId: 1 })
      item.is_favorited = false
      item.favorite_count--
      Message.success('已取消收藏')
    } else {
      await api.wisdom.favorite({ wisdomId: item.id, memberId: 1 })
      item.is_favorited = true
      item.favorite_count++
      Message.success('收藏成功')
    }
  } catch (error) {
    Message.error('操作失败')
  } finally {
    favoriteLoading.value = false
  }
}

const shareKnowledge = (item) => {
  Message.info('分享功能开发中...')
}

const copyLink = (item) => {
  const link = `${window.location.origin}/knowledge/${item.id}`
  navigator.clipboard.writeText(link)
  Message.success('链接已复制到剪贴板')
}

const searchByTag = (tag) => {
  searchKeyword.value = tag
  handleSearch()
}

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(String(date).replace(' ', 'T'))
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

onMounted(() => {
  fetchKnowledge()
  fetchPopular()
})
</script>

<style scoped>
.knowledge-page {
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

.search-card {
  padding: 24px;
}

.quick-filters {
  margin-top: 16px;
}

.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

.knowledge-card {
  padding: 24px;
  border: 1px solid #e5e6eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.knowledge-card:hover {
  border-color: #165dff;
  box-shadow: 0 8px 24px rgba(22, 93, 255, 0.12);
  transform: translateY(-4px);
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.knowledge-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  margin: 0;
  flex: 1;
}

.knowledge-excerpt {
  color: #4e5969;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.knowledge-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #86909c;
  margin-bottom: 12px;
}

.knowledge-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
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
  background: #86909c;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.popular-rank.rank-1 {
  background: linear-gradient(135deg, #f7ba1e 0%, #f9d423 100%);
}

.popular-rank.rank-2 {
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
}

.popular-rank.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #e8a87c 100%);
}

.popular-content {
  flex: 1;
}

.popular-content h4 {
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.popular-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #86909c;
}

.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-content {
  padding: 16px 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e6eb;
}

.detail-date {
  color: #86909c;
  font-size: 14px;
}

.detail-audio {
  margin-bottom: 24px;
}

.detail-body {
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
  margin-bottom: 16px;
}

.detail-actions {
  display: flex;
  justify-content: center;
}

.filled {
  color: #f53f3f;
}

.sidebar-card {
  position: sticky;
  top: 24px;
}
</style>
