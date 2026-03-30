<template>
  <div class="page-neo prompts-page">
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <!-- 页面横幅 -->
    <div class="page-banner">
      <div class="banner-glow"></div>
      <div class="banner-content">
        <div class="banner-icon">&#128221;</div>
        <div class="banner-text">
          <h1 class="banner-title">提示词管理</h1>
          <p class="banner-subtitle">配置 AI 系统提示词，定制平台行为与专业领域</p>
        </div>
      </div>
      <div class="banner-decoration">
        <div class="deco-line"></div>
        <div class="deco-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <!-- 提示词分类 -->
    <a-tabs v-model:active-key="activeTab" class="prompts-tabs">
      <a-tab-pane key="system" title="系统提示词">
        <div class="card-neo">
          <div class="card-header">
            <h2 class="title-neo" style="color: #1890ff;">
              <span class="title-icon">&#128295;</span> 系统角色配置
            </h2>
            <div class="header-line"></div>
          </div>
          <div class="prompt-tip">
            <span>&#9432;</span>
            系统提示词定义 AI 助手的基础角色定位与行为规范。修改前请确认理解其作用范围。
          </div>

          <div class="prompt-list">
            <div
              v-for="prompt in systemPrompts"
              :key="prompt.id"
              class="prompt-card"
              :class="{ active: editingId === prompt.id }"
              @click="editPrompt(prompt)"
            >
              <div class="prompt-card-header">
                <span class="prompt-tag">{{ prompt.category }}</span>
                <span class="prompt-name">{{ prompt.name }}</span>
              </div>
              <p class="prompt-preview">{{ prompt.content.substring(0, 120) }}{{ prompt.content.length > 120 ? '...' : '' }}</p>
              <div class="prompt-card-footer">
                <span class="prompt-date">上次更新: {{ prompt.updatedAt }}</span>
                <button class="btn-edit" @click.stop="editPrompt(prompt)">
                  {{ editingId === prompt.id ? '取消' : '编辑' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 编辑区域 -->
        <div v-if="editingId" class="card-neo edit-card">
          <div class="card-header">
            <h2 class="title-neo" style="color: #52c41a;">
              <span class="title-icon">&#9998;</span> 编辑提示词
            </h2>
            <div class="header-line"></div>
          </div>
          <div class="edit-form">
            <div class="form-item">
              <label>提示词名称</label>
              <a-input v-model="editingPrompt.name" placeholder="给提示词起个名字" />
            </div>
            <div class="form-item">
              <label>提示词内容</label>
              <a-textarea
                v-model="editingPrompt.content"
                :rows="8"
                placeholder="输入系统提示词内容..."
                :max-length="2000"
                show-word-limit
              />
            </div>
            <div class="form-item">
              <label>适用场景</label>
              <a-select v-model="editingPrompt.category" style="width: 200px">
                <a-option value="农业">农业咨询</a-option>
                <a-option value="能源">能源管理</a-option>
                <a-option value="碳汇">碳汇计算</a-option>
                <a-option value="通用">通用对话</a-option>
                <a-option value="专业">专业分析</a-option>
              </a-select>
            </div>
            <div class="form-actions">
              <a-button type="primary" :loading="saving" @click="savePrompt">
                保存修改
              </a-button>
              <a-button @click="editingId = null">
                取消
              </a-button>
            </div>
          </div>
        </div>
      </a-tab-pane>

      <a-tab-pane key="preset" title="预设模板">
        <div class="card-neo">
          <div class="card-header">
            <h2 class="title-neo" style="color: #a78bfa;">
              <span class="title-icon">&#127873;</span> 快捷模板
            </h2>
            <div class="header-line"></div>
          </div>
          <div class="prompt-tip">
            <span>&#9432;</span>
            预设模板可在对话时快速切换 AI 的回答风格与专业方向。
          </div>
          <div class="template-list">
            <div
              v-for="tpl in templates"
              :key="tpl.id"
              class="template-card"
              @click="applyTemplate(tpl)"
            >
              <div class="tpl-icon">{{ tpl.icon }}</div>
              <div class="tpl-info">
                <div class="tpl-name">{{ tpl.name }}</div>
                <div class="tpl-desc">{{ tpl.desc }}</div>
              </div>
              <button class="btn-use">使用</button>
            </div>
          </div>
        </div>
      </a-tab-pane>

      <a-tab-pane key="history" title="历史版本">
        <div class="card-neo">
          <div class="card-header">
            <h2 class="title-neo" style="color: #ffc800;">
              <span class="title-icon">&#128337;</span> 版本记录
            </h2>
            <div class="header-line"></div>
          </div>
          <a-table
            :columns="historyColumns"
            :data="historyList"
            :pagination="false"
            :bordered="false"
            row-key="id"
          >
            <template #cell="{ record, column }">
              <template v-if="column.dataIndex === 'action'">
                <a-button type="text" size="small" @click="restoreVersion(record)">
                  恢复此版本
                </a-button>
              </template>
              <template v-else-if="column.dataIndex === 'status'">
                <span class="version-badge" :class="record.status">
                  {{ record.status === 'current' ? '当前版本' : record.status === 'restored' ? '已恢复' : '历史版本' }}
                </span>
              </template>
            </template>
          </a-table>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import api from '../api'

const activeTab = ref('system')
const editingId = ref(null)
const editingPrompt = reactive({ name: '', content: '', category: '通用' })
const saving = ref(false)

const systemPrompts = ref([
  {
    id: 1,
    name: '农业专家助手',
    category: '农业',
    content: '你是一位资深农业专家，精通作物栽培、病虫害防治、农时节气等多个领域。请用通俗易懂的语言为用户解答农业生产中的各类问题，结合当地气候和土壤条件给出实用建议。',
    updatedAt: '2026-03-20'
  },
  {
    id: 2,
    name: '能源管理顾问',
    category: '能源',
    content: '你是一位光伏与农业互补系统专家，专注于农光互补项目的能源优化管理。请结合太阳能发电特性、农业用电需求和储能策略，为用户提供科学的能源管理建议。',
    updatedAt: '2026-03-18'
  },
  {
    id: 3,
    name: '碳汇计算专家',
    category: '碳汇',
    content: '你是一位碳汇计算与农业碳交易咨询专家，熟悉国内外碳汇计算方法学（如IPCC指南）。请为用户提供作物碳汇量估算、碳交易政策解读和减排建议。',
    updatedAt: '2026-03-15'
  },
  {
    id: 4,
    name: '综合智能助手',
    category: '通用',
    content: '你是一位友善的智能助手，服务于 AgriSol-AI 农业能源环境智能平台。请综合农业、能源、环境等多维度知识，为用户提供全面、准确的解答和建议。',
    updatedAt: '2026-03-10'
  }
])

const templates = ref([
  { id: 1, icon: '&#128104;', name: '老农口吻', desc: '用经验丰富的老农语气回答，带有农谚和实际操作经验' },
  { id: 2, icon: '&#128300;', name: '专业分析', desc: '以农业科学家视角，提供严谨的数据分析与学术依据' },
  { id: 3, icon: '&#128161;', name: '简明易懂', desc: '用最简洁直白的语言，适合农业新手快速理解' },
  { id: 4, icon: '&#128187;', name: '数据驱动', desc: '侧重数据分析和图表解读，适合有技术背景的用户' }
])

const historyColumns = [
  { title: '版本', dataIndex: 'version', width: 100 },
  { title: '修改内容', dataIndex: 'change' },
  { title: '修改时间', dataIndex: 'time', width: 160 },
  { title: '状态', dataIndex: 'status', width: 100 },
  { title: '操作', dataIndex: 'action', width: 100 }
]

const historyList = ref([
  { id: 1, version: 'v1.4', change: '更新农业专家提示词，增加病虫害识别示例', time: '2026-03-20 14:30', status: 'current' },
  { id: 2, version: 'v1.3', change: '增加碳汇计算专业术语说明', time: '2026-03-15 09:20', status: 'history' },
  { id: 3, version: 'v1.2', change: '优化能源顾问语气，更专业', time: '2026-03-10 16:45', status: 'restored' },
  { id: 4, version: 'v1.1', change: '初始版本上线', time: '2026-03-01 10:00', status: 'history' }
])

const editPrompt = (prompt) => {
  if (editingId.value === prompt.id) {
    editingId.value = null
    return
  }
  editingId.value = prompt.id
  Object.assign(editingPrompt, {
    name: prompt.name,
    content: prompt.content,
    category: prompt.category
  })
}

const savePrompt = async () => {
  saving.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    const idx = systemPrompts.value.findIndex(p => p.id === editingId.value)
    if (idx !== -1) {
      Object.assign(systemPrompts.value[idx], {
        name: editingPrompt.name,
        content: editingPrompt.content,
        category: editingPrompt.category,
        updatedAt: new Date().toISOString().slice(0, 10)
      })
    }
    editingId.value = null
    Message.success('提示词已保存')
  } catch (err) {
    Message.error('保存失败')
  } finally {
    saving.value = false
  }
}

const applyTemplate = (tpl) => {
  Message.info(`已将回答风格切换为"${tpl.name}"`)
}

const restoreVersion = (record) => {
  Message.success(`已恢复到 ${record.version} 版本`)
}

onMounted(() => {
  // 加载提示词数据
})
</script>

<style scoped>
/* 背景 */
.prompts-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem;
}

.bg-grid {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image:
    linear-gradient(rgba(0, 255, 157, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 157, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}

.bg-glow {
  position: fixed;
  top: -30%; left: -10%;
  width: 60%; height: 60%;
  background: radial-gradient(circle, rgba(0, 255, 157, 0.06) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* 横幅 */
.page-banner {
  position: relative;
  z-index: 1;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.15) 0%, rgba(114, 46, 209, 0.05) 100%);
  border: 1px solid rgba(24, 144, 255, 0.3);
  border-radius: 24px;
  padding: 2.5rem 3rem;
  backdrop-filter: blur(20px);
  animation: slideDown 0.6s ease-out;
  overflow: hidden;
}

.banner-glow {
  position: absolute;
  top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(circle at 30% 50%, rgba(24, 144, 255, 0.25) 0%, transparent 50%);
  animation: glow-rotate 12s linear infinite;
  pointer-events: none;
}

@keyframes glow-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.banner-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.banner-icon {
  font-size: 4rem;
  filter: drop-shadow(0 0 20px rgba(24, 144, 255, 0.5));
}

.banner-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1890ff;
  margin: 0 0 0.5rem;
  text-shadow: 0 0 30px rgba(24, 144, 255, 0.4);
  letter-spacing: 0.05em;
}

.banner-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.banner-decoration {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 3px;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 3rem;
}

.deco-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, #1890ff, transparent);
}

.deco-dots {
  display: flex;
  gap: 0.5rem;
}

.deco-dots span {
  width: 6px;
  height: 6px;
  background: #1890ff;
  border-radius: 50%;
  opacity: 0.6;
}

@keyframes slideDown {
  0% { opacity: 0; transform: translateY(-30px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* Tabs */
.prompts-tabs {
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

.prompts-tabs :deep(.arco-tabs-nav) {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 8px;
  margin-bottom: 1.5rem;
}

.prompts-tabs :deep(.arco-tabs-nav-tab) {
  border-radius: 12px;
  padding: 8px 20px;
  font-weight: 500;
}

.prompts-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active) {
  background: rgba(24, 144, 255, 0.2);
}

@keyframes fadeInUp {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* Card */
.card-neo {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.75rem;
  backdrop-filter: blur(20px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.title-neo {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-icon {
  font-size: 1.25rem;
}

.header-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(24, 144, 255, 0.3), transparent);
}

/* 提示 */
.prompt-tip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: rgba(24, 144, 255, 0.08);
  border: 1px solid rgba(24, 144, 255, 0.2);
  border-radius: 10px;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
}

/* 提示词卡片列表 */
.prompt-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.prompt-card {
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.prompt-card:hover {
  border-color: rgba(0, 255, 157, 0.25);
  background: rgba(0, 255, 157, 0.04);
  transform: translateX(4px);
}

.prompt-card.active {
  border-color: rgba(0, 255, 157, 0.4);
  background: rgba(0, 255, 157, 0.06);
  box-shadow: 0 0 20px rgba(0, 255, 157, 0.1);
}

.prompt-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.prompt-tag {
  padding: 0.2rem 0.6rem;
  background: rgba(0, 255, 157, 0.15);
  color: #00ff9d;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.prompt-name {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9375rem;
}

.prompt-preview {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
  margin: 0 0 0.75rem;
}

.prompt-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.prompt-date {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.3);
  font-family: monospace;
}

.btn-edit {
  padding: 0.3rem 0.875rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit:hover {
  background: rgba(0, 255, 157, 0.15);
  border-color: rgba(0, 255, 157, 0.4);
  color: #00ff9d;
}

/* 编辑卡片 */
.edit-card {
  margin-top: 1.5rem;
  border-color: rgba(82, 196, 26, 0.25);
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-item label {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

/* 模板列表 */
.template-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.template-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.template-card:hover {
  border-color: rgba(167, 139, 250, 0.3);
  background: rgba(167, 139, 250, 0.05);
  transform: translateX(4px);
}

.tpl-icon {
  font-size: 1.75rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(167, 139, 250, 0.1);
  border-radius: 10px;
  flex-shrink: 0;
}

.tpl-info {
  flex: 1;
}

.tpl-name {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.25rem;
}

.tpl-desc {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.45);
}

.btn-use {
  padding: 0.4rem 1rem;
  background: rgba(167, 139, 250, 0.15);
  border: 1px solid rgba(167, 139, 250, 0.3);
  border-radius: 8px;
  color: #a78bfa;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-use:hover {
  background: rgba(167, 139, 250, 0.25);
  border-color: rgba(167, 139, 250, 0.5);
}

/* 版本标签 */
.version-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 600;
}

.version-badge.current {
  background: rgba(82, 196, 26, 0.15);
  color: #52c41a;
  border: 1px solid rgba(82, 196, 26, 0.3);
}

.version-badge.restored {
  background: rgba(255, 200, 0, 0.12);
  color: #ffc800;
  border: 1px solid rgba(255, 200, 0, 0.25);
}

.version-badge.history {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
