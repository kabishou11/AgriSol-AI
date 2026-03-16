<template>
  <div class="profile-page">
    <a-row :gutter="24">
      <!-- Left: User Card -->
      <a-col :xs="24" :lg="7">
        <a-card :bordered="false" class="user-card">
          <div class="avatar-section">
            <div class="avatar-wrap">
              <a-avatar :size="88" class="user-avatar">
                <span style="font-size:36px">{{ profile.username?.[0] || '农' }}</span>
              </a-avatar>
              <div class="avatar-badge">🌾</div>
            </div>
            <h2 class="user-name">{{ profile.username || '加载中...' }}</h2>
            <p class="user-email">{{ profile.email }}</p>
            <div class="user-meta">
              <span v-if="profile.location">📍 {{ profile.location }}</span>
              <span v-if="profile.farm_area">🌱 {{ profile.farm_area }} 亩</span>
            </div>
            <a-tag color="green" style="margin-top:8px">注册于 {{ formatDate(profile.created_at) }}</a-tag>
          </div>

          <a-divider style="margin: 16px 0" />

          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-cell">
              <div class="stat-num green">{{ profile.stats?.totalCrops || 0 }}</div>
              <div class="stat-lbl">作物分析</div>
            </div>
            <div class="stat-cell">
              <div class="stat-num orange">{{ profile.stats?.totalGeneration || 0 }}</div>
              <div class="stat-lbl">总发电(kWh)</div>
            </div>
            <div class="stat-cell">
              <div class="stat-num blue">{{ profile.stats?.totalCarbonSeq || 0 }}</div>
              <div class="stat-lbl">碳汇(吨)</div>
            </div>
            <div class="stat-cell">
              <div class="stat-num purple">{{ profile.stats?.totalWisdom || 0 }}</div>
              <div class="stat-lbl">农事记录</div>
            </div>
            <div class="stat-cell">
              <div class="stat-num teal">{{ profile.stats?.avgHealthScore || 0 }}</div>
              <div class="stat-lbl">平均健康分</div>
            </div>
            <div class="stat-cell">
              <div class="stat-num red">{{ profile.stats?.totalEnvRecords || 0 }}</div>
              <div class="stat-lbl">环境监测</div>
            </div>
          </div>
        </a-card>

        <!-- Quick Actions -->
        <a-card :bordered="false" class="quick-card" style="margin-top:16px">
          <template #title><span style="font-size:14px;font-weight:600">快捷操作</span></template>
          <a-space direction="vertical" fill>
            <a-button long @click="$router.push('/crop')">🌾 作物分析</a-button>
            <a-button long @click="$router.push('/energy')">⚡ 能源监测</a-button>
            <a-button long @click="$router.push('/graph')">🕸️ 知识图谱</a-button>
            <a-button long type="primary" @click="handleExport" :loading="exporting">
              <icon-download /> 导出我的数据
            </a-button>
          </a-space>
        </a-card>
      </a-col>

      <!-- Right: Tabs -->
      <a-col :xs="24" :lg="17">
        <a-card :bordered="false" class="main-card">
          <a-tabs v-model:active-key="activeTab">

            <!-- 基本信息 -->
            <a-tab-pane key="info" title="基本信息">
              <a-form :model="profile" layout="vertical" style="max-width:560px">
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item label="用户名">
                      <a-input v-model="profile.username" :disabled="!editMode" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="邮箱">
                      <a-input v-model="profile.email" :disabled="!editMode" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="手机号">
                      <a-input v-model="profile.phone" :disabled="!editMode" placeholder="未填写" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="所在地区">
                      <a-input v-model="profile.location" :disabled="!editMode" placeholder="如：湖南省长沙市" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="农场面积（亩）">
                      <a-input-number v-model="profile.farm_area" :disabled="!editMode" :min="0" style="width:100%" />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-space>
                  <a-button v-if="!editMode" type="primary" @click="editMode=true">编辑资料</a-button>
                  <template v-else>
                    <a-button type="primary" @click="saveProfile" :loading="saving">保存</a-button>
                    <a-button @click="cancelEdit">取消</a-button>
                  </template>
                </a-space>
              </a-form>
            </a-tab-pane>

            <!-- 系统设置 -->
            <a-tab-pane key="settings" title="系统设置">
              <a-row :gutter="24">
                <a-col :span="12">
                  <div class="settings-section">
                    <div class="section-title">界面主题</div>
                    <div class="theme-picker">
                      <div
                        v-for="t in themes"
                        :key="t.value"
                        class="theme-option"
                        :class="{ active: settings.theme === t.value }"
                        @click="settings.theme = t.value; saveSettingsDebounced()"
                      >
                        <div class="theme-preview" :style="t.style"></div>
                        <span>{{ t.label }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="settings-section" style="margin-top:24px">
                    <div class="section-title">语言</div>
                    <a-radio-group v-model="settings.language" @change="saveSettingsDebounced">
                      <a-radio value="zh">简体中文</a-radio>
                      <a-radio value="en">English</a-radio>
                    </a-radio-group>
                  </div>

                  <div class="settings-section" style="margin-top:24px">
                    <div class="section-title">隐私级别</div>
                    <a-radio-group v-model="settings.privacy_level" @change="saveSettingsDebounced">
                      <a-radio value="public">公开</a-radio>
                      <a-radio value="friends">仅好友</a-radio>
                      <a-radio value="private">私密</a-radio>
                    </a-radio-group>
                  </div>
                </a-col>

                <a-col :span="12">
                  <div class="settings-section">
                    <div class="section-title">通知设置</div>
                    <div class="toggle-row">
                      <span>系统通知</span>
                      <a-switch v-model="settings.notifications_enabled" @change="saveSettingsDebounced" />
                    </div>
                    <div class="toggle-row">
                      <span>邮件通知</span>
                      <a-switch v-model="settings.email_notifications" @change="saveSettingsDebounced" />
                    </div>
                  </div>

                  <div class="settings-section" style="margin-top:24px">
                    <div class="section-title">数据管理</div>
                    <a-space direction="vertical" fill>
                      <a-button long @click="handleExport" :loading="exporting">
                        <icon-download /> 导出全部数据 (JSON)
                      </a-button>
                      <a-popconfirm content="确认清除本地缓存？不会删除数据库数据。" @ok="clearCache">
                        <a-button long status="warning">清除本地缓存</a-button>
                      </a-popconfirm>
                    </a-space>
                  </div>
                </a-col>
              </a-row>
            </a-tab-pane>

            <!-- AI配置 -->
            <a-tab-pane key="ai" title="AI 配置">
              <div class="ai-config-section">
                <div class="api-status-bar">
                  <div class="status-indicator" :class="aiConfig.apiKeyConfigured ? 'online' : 'offline'">
                    <span class="dot"></span>
                    {{ aiConfig.apiKeyConfigured ? 'AI服务已连接' : 'AI服务未配置（使用规则引擎）' }}
                  </div>
                  <a-tooltip content="在服务器 .env 文件中配置 MODELSCOPE_API_KEY">
                    <a-button type="text" size="mini"><icon-info-circle /></a-button>
                  </a-tooltip>
                </div>

                <div class="section-title" style="margin-top:20px">
                  系统提示词管理
                  <a-button
                    size="mini"
                    type="primary"
                    style="margin-left: 12px;"
                    @click="showGeneratePromptModal = true"
                  >
                    <icon-robot /> AI生成提示词
                  </a-button>
                </div>
                <p class="section-desc">选择并自定义各场景下AI助手的系统提示词，影响AI回答的风格和专业方向。</p>

                <div class="prompt-list">
                  <div
                    v-for="prompt in systemPrompts"
                    :key="prompt.id"
                    class="prompt-card"
                  >
                    <div class="prompt-header">
                      <div class="prompt-name">
                        <span class="prompt-icon">{{ prompt.icon || '🤖' }}</span>
                        {{ prompt.name }}
                      </div>
                      <a-tag size="small" color="blue">系统预设</a-tag>
                    </div>
                    <div class="prompt-desc">{{ prompt.description }}</div>
                    <a-textarea
                      :model-value="prompt.systemPrompt"
                      :auto-size="{ minRows: 3, maxRows: 6 }"
                      class="prompt-textarea"
                      readonly
                      placeholder="系统提示词..."
                    />
                  </div>
                </div>

                <div class="section-title" style="margin-top:24px">
                  自定义提示词
                  <a-button
                    size="mini"
                    style="margin-left: 12px;"
                    @click="showCreatePromptModal = true"
                  >
                    <icon-plus /> 新建
                  </a-button>
                </div>

                <div class="prompt-list" v-if="customPrompts.length > 0">
                  <div
                    v-for="prompt in customPrompts"
                    :key="prompt.id"
                    class="prompt-card"
                  >
                    <div class="prompt-header">
                      <div class="prompt-name">
                        <span class="prompt-icon">✨</span>
                        {{ prompt.name }}
                      </div>
                      <a-space size="mini">
                        <a-button size="mini" type="text" @click="editCustomPrompt(prompt)">
                          <icon-edit />
                        </a-button>
                        <a-button size="mini" type="text" status="danger" @click="deleteCustomPrompt(prompt.id)">
                          <icon-delete />
                        </a-button>
                      </a-space>
                    </div>
                    <a-textarea
                      :model-value="prompt.template"
                      :auto-size="{ minRows: 2, maxRows: 4 }"
                      class="prompt-textarea"
                      readonly
                    />
                  </div>
                </div>
                <a-empty v-else description="暂无自定义提示词" style="margin: 20px 0;" />

                <div class="section-title" style="margin-top:24px">模型配置</div>
                <a-form layout="vertical" style="max-width:480px">
                  <a-form-item label="AI服务商">
                    <a-select v-model="aiModelConfig.provider" @change="saveAiModelConfig">
                      <a-option value="modelscope">ModelScope 魔搭 (通义千问)</a-option>
                      <a-option value="local">本地规则引擎（无需API）</a-option>
                    </a-select>
                  </a-form-item>
                  <a-form-item label="模型">
                    <a-select v-model="aiModelConfig.model" @change="saveAiModelConfig">
                      <template v-if="aiModelConfig.provider === 'modelscope'">
                        <a-option value="Qwen/Qwen3.5-122B-A10B">Qwen3.5-122B（推荐，支持多模态）</a-option>
                        <a-option value="Qwen/Qwen3.5-35B-A3B">Qwen3.5-35B（高性能）</a-option>
                        <a-option value="Qwen/Qwen3-32B">Qwen3-32B（均衡）</a-option>
                        <a-option value="Qwen/Qwen3-8B">Qwen3-8B（快速）</a-option>
                        <a-option value="Qwen/QwQ-32B">QwQ-32B（深度推理）</a-option>
                      </template>
                      <template v-else>
                        <a-option value="rule-engine">规则引擎 v1.0</a-option>
                      </template>
                    </a-select>
                  </a-form-item>
                  <a-form-item label="回答温度（创造性）">
                    <a-slider
                      v-model="aiModelConfig.temperature"
                      :min="0" :max="1" :step="0.1"
                      :marks="{ 0: '严谨', 0.5: '均衡', 1: '创意' }"
                      @change="saveAiModelConfig"
                    />
                  </a-form-item>
                  <a-form-item label="知识库联动">
                    <a-switch v-model="aiModelConfig.useKnowledgeBase" @change="saveAiModelConfig" />
                    <span style="margin-left:8px;color:#86909c;font-size:13px">开启后AI回答将自动检索平台知识库</span>
                  </a-form-item>
                </a-form>
              </div>
            </a-tab-pane>

            <!-- 活动历史 -->
            <a-tab-pane key="history" title="活动历史">
              <a-timeline>
                <a-timeline-item
                  v-for="item in history"
                  :key="item.id"
                  :dot-color="getActivityColor(item.action_type)"
                >
                  <div class="history-item">
                    <div class="history-header">
                      <span class="history-type">{{ getActivityLabel(item.action_type) }}</span>
                      <span class="history-time">{{ formatDateTime(item.created_at) }}</span>
                    </div>
                    <div class="history-detail" v-if="item.action_data">
                      {{ formatActionData(item.action_data) }}
                    </div>
                  </div>
                </a-timeline-item>
              </a-timeline>
              <a-empty v-if="!history.length" description="暂无活动记录" />
              <div style="text-align:center;margin-top:16px" v-if="historyTotal > history.length">
                <a-button @click="loadMoreHistory">加载更多</a-button>
              </div>
            </a-tab-pane>

          </a-tabs>
        </a-card>
      </a-col>
    </a-row>

    <!-- AI生成提示词模态框 -->
    <a-modal
      v-model:visible="showGeneratePromptModal"
      title="AI生成提示词"
      @ok="generatePrompt"
      :ok-loading="generating"
      ok-text="生成"
      width="600px"
    >
      <a-form layout="vertical">
        <a-form-item label="提示词用途" required>
          <a-input
            v-model="generateForm.purpose"
            placeholder="例如：专业的农业病虫害诊断专家"
          />
        </a-form-item>
        <a-form-item label="背景信息（可选）">
          <a-textarea
            v-model="generateForm.context"
            :auto-size="{ minRows: 3, maxRows: 6 }"
            placeholder="提供更多背景信息，帮助AI生成更精准的提示词..."
          />
        </a-form-item>
        <a-form-item label="生成结果" v-if="generatedPrompt">
          <a-textarea
            v-model="generatedPrompt"
            :auto-size="{ minRows: 4, maxRows: 10 }"
            class="generated-prompt"
          />
          <a-button
            size="small"
            type="primary"
            style="margin-top: 8px;"
            @click="saveGeneratedAsCustom"
          >
            <icon-save /> 保存为自定义提示词
          </a-button>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 创建/编辑自定义提示词模态框 -->
    <a-modal
      v-model:visible="showCreatePromptModal"
      :title="editingPrompt ? '编辑提示词' : '创建自定义提示词'"
      @ok="saveCustomPrompt"
      :ok-loading="saving"
      ok-text="保存"
      width="600px"
    >
      <a-form layout="vertical">
        <a-form-item label="名称" required>
          <a-input v-model="customPromptForm.name" placeholder="提示词名称" />
        </a-form-item>
        <a-form-item label="分类">
          <a-input v-model="customPromptForm.category" placeholder="例如：作物分析" />
        </a-form-item>
        <a-form-item label="提示词内容" required>
          <a-textarea
            v-model="customPromptForm.template"
            :auto-size="{ minRows: 6, maxRows: 12 }"
            placeholder="输入系统提示词内容..."
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconDownload, IconInfoCircle, IconRobot, IconPlus, IconEdit, IconDelete, IconSave } from '@arco-design/web-vue/es/icon'
import { debounce } from '../utils/format.js'
import axios from 'axios'
import api from '../api.js'

// 直接axios实例用于特殊请求
const axiosApi = axios.create({ baseURL: '/api', timeout: 30000 })

const activeTab = ref('info')
const editMode = ref(false)
const saving = ref(false)
const exporting = ref(false)

const profile = ref({
  id: 1, username: '', email: '', phone: '', location: '', farm_area: 0, created_at: '',
  stats: { totalCrops: 0, totalEnergy: 0, totalCarbon: 0, totalWisdom: 0, totalEnvRecords: 0, avgHealthScore: 0, totalCarbonSeq: 0, totalGeneration: 0 }
})
const originalProfile = ref({})

const settings = ref({
  theme: 'light', language: 'zh', notifications_enabled: true, email_notifications: true, privacy_level: 'public'
})

const aiConfig = ref({ prompts: [], apiKeyConfigured: false })
const aiModelConfig = ref({ provider: 'modelscope', model: 'Qwen/Qwen3.5-122B-A10B', temperature: 0.7, useKnowledgeBase: true })

// 系统提示词和自定义提示词
const systemPrompts = ref([])
const customPrompts = ref([])

// AI生成提示词
const showGeneratePromptModal = ref(false)
const generating = ref(false)
const generateForm = ref({ purpose: '', context: '' })
const generatedPrompt = ref('')

// 自定义提示词
const showCreatePromptModal = ref(false)
const editingPrompt = ref(null)
const customPromptForm = ref({ name: '', category: '', template: '' })

const history = ref([])
const historyTotal = ref(0)
const historyPage = ref(1)

const themes = [
  { value: 'light', label: '浅色', style: { background: 'linear-gradient(135deg,#fff 50%,#f0f2f5 50%)' } },
  { value: 'dark', label: '深色', style: { background: 'linear-gradient(135deg,#1d2129 50%,#2a2f3d 50%)' } },
  { value: 'green', label: '农业绿', style: { background: 'linear-gradient(135deg,#e8f5e9 50%,#c8e6c9 50%)' } },
]

const promptIcons = {
  crop_analysis: '🌾', energy_advisor: '⚡', carbon_expert: '🌿',
  env_monitor: '🌍', wisdom_organizer: '📝', general: '🤖'
}

// Safe date parser — handles SQLite "YYYY-MM-DD HH:MM:SS" format
const parseDate = (str) => {
  if (!str) return null
  // Replace space with T for ISO compatibility
  const iso = String(str).replace(' ', 'T')
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

const formatDate = (str) => {
  const d = parseDate(str)
  if (!d) return '未知'
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

const formatDateTime = (str) => {
  const d = parseDate(str)
  if (!d) return '未知时间'
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const getActivityLabel = (type) => {
  const map = {
    profile_update: '更新了个人资料', settings_update: '修改了系统设置',
    crop_analysis: '进行了作物分析', energy_prediction: '查看了能源预测',
    carbon_calculation: '计算了碳汇', ai_chat: 'AI问答', wisdom_record: '记录农事经验',
    login: '登录系统'
  }
  return map[type] || type
}

const getActivityColor = (type) => {
  const map = {
    crop_analysis: 'green', energy_prediction: 'orange', carbon_calculation: 'teal',
    ai_chat: 'blue', wisdom_record: 'purple', profile_update: 'gray'
  }
  return map[type] || 'gray'
}

const formatActionData = (data) => {
  try {
    const obj = typeof data === 'string' ? JSON.parse(data) : data
    if (obj.question) return `问：${obj.question}`
    if (obj.username) return `用户名：${obj.username}`
    return ''
  } catch { return '' }
}

const loadProfile = async () => {
  try {
    const data = await api.user.getProfile()
    profile.value = data
    originalProfile.value = { ...data }
  } catch { Message.error('加载个人信息失败') }
}

const loadSettings = async () => {
  try {
    const data = await api.user.getSettings()
    settings.value = {
      theme: data.theme || 'light',
      language: data.language || 'zh',
      notifications_enabled: !!data.notifications_enabled,
      email_notifications: !!data.email_notifications,
      privacy_level: data.privacy_level || 'public'
    }
  } catch {}
}

const loadAiConfig = async () => {
  try {
    // 加载系统提示词
    const systemRes = await api.prompts.getSystem()
    systemPrompts.value = systemRes || []

    // 加载自定义提示词
    const customRes = await api.prompts.getCustom()
    customPrompts.value = customRes || []

    aiConfig.value.apiKeyConfigured = Boolean(systemPrompts.value.length || customPrompts.value.length)
  } catch (e) {
    aiConfig.value.apiKeyConfigured = false
    console.error('加载AI配置失败:', e)
  }
}

const loadHistory = async (page = 1) => {
  try {
    const data = await api.user.getHistory({ userId: 1, limit: 20, offset: (page - 1) * 20 })
    if (page === 1) history.value = data.history || []
    else history.value.push(...(data.history || []))
    historyTotal.value = data.total || 0
    historyPage.value = page
  } catch {}
}

const loadMoreHistory = () => loadHistory(historyPage.value + 1)

const saveProfile = async () => {
  saving.value = true
  try {
    await api.user.updateProfile({ userId: 1, ...profile.value })
    Message.success('保存成功')
    editMode.value = false
    originalProfile.value = { ...profile.value }
  } catch { Message.error('保存失败') }
  finally { saving.value = false }
}

const cancelEdit = () => {
  profile.value = { ...originalProfile.value }
  editMode.value = false
}

const saveSettings = async () => {
  try {
    await api.user.updateSettings({ userId: 1, ...settings.value })
    Message.success('设置已保存')
  } catch { Message.error('保存设置失败') }
}

const saveSettingsDebounced = debounce(saveSettings, 600)

const handleExport = async () => {
  exporting.value = true
  try {
    const res = await axiosApi.get('/user/export', { params: { userId: 1 } })
    const data = res.data
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agrisol-data-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    Message.success('数据导出成功')
  } catch { Message.error('导出失败') }
  finally { exporting.value = false }
}

const clearCache = () => {
  localStorage.clear()
  sessionStorage.clear()
  Message.success('本地缓存已清除')
}

// AI生成提示词
const generatePrompt = async () => {
  if (!generateForm.value.purpose) {
    Message.warning('请输入提示词用途')
    return
  }

  generating.value = true
  try {
    const res = await api.prompts.generate({
      purpose: generateForm.value.purpose,
      context: generateForm.value.context
    })

    if (res?.prompt) {
      generatedPrompt.value = res.prompt
      Message.success('提示词生成成功')
    } else {
      Message.error('生成失败，请重试')
    }
  } catch (error) {
    Message.error('生成失败：' + (error.message || '服务暂时不可用'))
  } finally {
    generating.value = false
  }
}

// 保存生成的提示词为自定义
const saveGeneratedAsCustom = () => {
  customPromptForm.value = {
    name: generateForm.value.purpose,
    category: '自定义',
    template: generatedPrompt.value
  }
  showGeneratePromptModal.value = false
  showCreatePromptModal.value = true
  generateForm.value = { purpose: '', context: '' }
  generatedPrompt.value = ''
}

// 保存自定义提示词
const saveCustomPrompt = async () => {
  if (!customPromptForm.value.name || !customPromptForm.value.template) {
    Message.warning('请填写名称和内容')
    return
  }

  saving.value = true
  try {
    if (editingPrompt.value) {
      await api.prompts.updateCustom(editingPrompt.value.id, customPromptForm.value)
      Message.success('提示词已更新')
    } else {
      await api.prompts.createCustom(customPromptForm.value)
      Message.success('提示词已创建')
    }

    showCreatePromptModal.value = false
    customPromptForm.value = { name: '', category: '', template: '' }
    editingPrompt.value = null
    await loadAiConfig()
  } catch (error) {
    Message.error('保存失败：' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

// 编辑自定义提示词
const editCustomPrompt = (prompt) => {
  editingPrompt.value = prompt
  customPromptForm.value = {
    name: prompt.name,
    category: prompt.category || '',
    template: prompt.template
  }
  showCreatePromptModal.value = true
}

// 删除自定义提示词
const deleteCustomPrompt = async (id) => {
  try {
    await api.prompts.deleteCustom(id)
    Message.success('提示词已删除')
    await loadAiConfig()
  } catch (error) {
    Message.error('删除失败')
  }
}

const saveAiModelConfig = () => { Message.success('AI配置已保存') }

onMounted(() => {
  loadProfile()
  loadSettings()
  loadAiConfig()
  loadHistory()
})
</script>

<style scoped>
.profile-page {
  padding: 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 100%);
  min-height: calc(100vh - 64px);
}

/* 用户卡片 */
.user-card {
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  border: none;
}

.user-card :deep(.arco-card-body) {
  padding: 32px 24px;
}

.avatar-section {
  padding: 8px 0 20px;
}

.avatar-wrap {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.user-avatar {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.avatar-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00b42a, #0fc6c2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 3px solid white;
}

.user-name {
  font-size: 24px;
  font-weight: 700;
  margin: 8px 0;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-email {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 4px 0 12px;
}

.user-meta {
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.95);
  margin-top: 8px;
}

.user-meta span {
  background: rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.user-card :deep(.arco-tag) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.user-card :deep(.arco-divider) {
  border-color: rgba(255, 255, 255, 0.2);
  margin: 24px 0;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.stat-cell {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 16px 12px;
  border-radius: 12px;
  transition: all 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-cell:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-num {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
  color: white;
}

.stat-lbl {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

/* 快捷操作卡片 */
.quick-card {
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: none;
  background: white;
}

.quick-card :deep(.arco-card-header) {
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 20px;
}

.quick-card :deep(.arco-card-body) {
  padding: 16px 20px;
}

.quick-card :deep(.arco-btn) {
  justify-content: flex-start;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.3s;
}

.quick-card :deep(.arco-btn:hover) {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.quick-card :deep(.arco-btn-primary) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
}

/* 主卡片 */
.main-card {
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: none;
  background: white;
}

.main-card :deep(.arco-card-body) {
  padding: 0;
}

.main-card :deep(.arco-tabs) {
  padding: 0;
}

.main-card :deep(.arco-tabs-nav) {
  padding: 0 24px;
  background: linear-gradient(to bottom, #fafafa, white);
}

.main-card :deep(.arco-tabs-content) {
  padding: 24px;
}

.main-card :deep(.arco-tabs-tab) {
  font-weight: 600;
  font-size: 15px;
  padding: 16px 20px;
}

/* 表单样式 */
.main-card :deep(.arco-form-item-label-col) {
  font-weight: 600;
  color: #1d2129;
}

.main-card :deep(.arco-input),
.main-card :deep(.arco-input-number),
.main-card :deep(.arco-select-view) {
  border-radius: 8px;
  border-color: #e5e6eb;
}

.main-card :deep(.arco-input:focus),
.main-card :deep(.arco-input-number:focus),
.main-card :deep(.arco-select-view-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.main-card :deep(.arco-btn-primary) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 8px;
  font-weight: 600;
}

/* 设置部分 */
.settings-section {
  background: #fafafa;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e6eb;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1d2129;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 18px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 2px;
}

.section-desc {
  font-size: 13px;
  color: #86909c;
  margin-bottom: 12px;
  line-height: 1.6;
}

.theme-picker {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.theme-option {
  flex: 1;
  padding: 12px;
  border: 2px solid #e5e6eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.theme-option:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.theme-option.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #f0f5ff, #faf5ff);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.theme-preview {
  width: 100%;
  height: 60px;
  border-radius: 6px;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.theme-option span {
  font-size: 13px;
  font-weight: 600;
  color: #4e5969;
}

.theme-option.active span {
  color: #667eea;
}

/* AI配置 */
.ai-config-section {
  background: linear-gradient(to bottom, #fafafa, white);
  padding: 24px;
  border-radius: 12px;
  margin: -24px;
}

.api-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-radius: 12px;
  background: white;
  border: 2px solid #e5e6eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
}

.status-indicator.online {
  color: #00b42a;
}

.status-indicator.offline {
  color: #86909c;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
}

.status-indicator.online .dot {
  box-shadow: 0 0 8px currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

.prompt-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.prompt-card {
  border: 2px solid #e5e6eb;
  border-radius: 12px;
  padding: 18px;
  transition: all 0.3s;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.prompt-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.prompt-name {
  font-weight: 700;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1d2129;
}

.prompt-icon {
  font-size: 20px;
}

.prompt-desc {
  font-size: 13px;
  color: #86909c;
  margin-bottom: 12px;
  line-height: 1.6;
  padding-left: 28px;
}

.prompt-textarea :deep(.arco-textarea) {
  font-size: 13px;
  background: #f7f8fa;
  line-height: 1.6;
  border-radius: 8px;
  border-color: #e5e6eb;
  font-family: 'Consolas', 'Monaco', monospace;
}

.prompt-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.generated-prompt :deep(.arco-textarea) {
  background: linear-gradient(135deg, #f0f5ff, #faf5ff);
  border-color: #667eea;
  font-family: 'Consolas', monospace;
  line-height: 1.6;
}

/* 历史记录 */
.history-item {
  padding: 4px 0 12px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-type {
  font-weight: 600;
  font-size: 14px;
  color: #1d2129;
}

.history-time {
  font-size: 12px;
  color: #86909c;
}

.history-detail {
  font-size: 13px;
  color: #4e5969;
  margin-top: 6px;
  padding-left: 12px;
  border-left: 3px solid #e5e6eb;
}

/* 响应式 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .theme-picker {
    flex-direction: column;
  }
}
</style>
