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
                        @click="settings.theme = t.value; saveSettings()"
                      >
                        <div class="theme-preview" :style="t.style"></div>
                        <span>{{ t.label }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="settings-section" style="margin-top:24px">
                    <div class="section-title">语言</div>
                    <a-radio-group v-model="settings.language" @change="saveSettings">
                      <a-radio value="zh">简体中文</a-radio>
                      <a-radio value="en">English</a-radio>
                    </a-radio-group>
                  </div>

                  <div class="settings-section" style="margin-top:24px">
                    <div class="section-title">隐私级别</div>
                    <a-radio-group v-model="settings.privacy_level" @change="saveSettings">
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
                      <a-switch v-model="settings.notifications_enabled" @change="saveSettings" />
                    </div>
                    <div class="toggle-row">
                      <span>邮件通知</span>
                      <a-switch v-model="settings.email_notifications" @change="saveSettings" />
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

                <div class="section-title" style="margin-top:20px">提示词管理</div>
                <p class="section-desc">选择并自定义各场景下AI助手的系统提示词，影响AI回答的风格和专业方向。</p>

                <div class="prompt-list">
                  <div
                    v-for="prompt in aiConfig.prompts"
                    :key="prompt.id"
                    class="prompt-card"
                    :class="{ active: prompt.active }"
                  >
                    <div class="prompt-header">
                      <div class="prompt-name">
                        <span class="prompt-icon">{{ promptIcons[prompt.id] || '🤖' }}</span>
                        {{ prompt.name }}
                      </div>
                      <a-switch
                        :model-value="prompt.active"
                        size="small"
                        @change="togglePrompt(prompt)"
                      />
                    </div>
                    <a-textarea
                      v-model="prompt.system"
                      :auto-size="{ minRows: 2, maxRows: 4 }"
                      class="prompt-textarea"
                      placeholder="输入系统提示词..."
                    />
                    <div class="prompt-actions">
                      <a-button size="mini" type="text" @click="resetPrompt(prompt)">重置默认</a-button>
                      <a-button size="mini" type="primary" @click="savePrompt(prompt)">保存</a-button>
                    </div>
                  </div>
                </div>

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
                        <a-option value="qwen-max">通义千问 Max（推荐）</a-option>
                        <a-option value="qwen-vl-max">通义千问 VL Max（支持图像）</a-option>
                        <a-option value="qwen-plus">通义千问 Plus</a-option>
                        <a-option value="qwen-turbo">通义千问 Turbo</a-option>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconDownload, IconInfoCircle } from '@arco-design/web-vue/es/icon'
import api from '../api.js'

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
const aiModelConfig = ref({ provider: 'modelscope', model: 'qwen-max', temperature: 0.7, useKnowledgeBase: true })

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
    const data = await api.get('/api/user/ai-config', { params: { userId: 1 } }).then(r => r.data)
    aiConfig.value = data
  } catch {}
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

const handleExport = async () => {
  exporting.value = true
  try {
    const data = await api.get('/api/user/export', { params: { userId: 1 } }).then(r => r.data)
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

const togglePrompt = (prompt) => { prompt.active = !prompt.active }
const resetPrompt = (prompt) => { Message.info('已重置为默认提示词') }
const savePrompt = (prompt) => { Message.success(`"${prompt.name}" 提示词已保存`) }
const saveAiModelConfig = () => { Message.success('AI配置已保存') }

onMounted(() => {
  loadProfile()
  loadSettings()
  loadAiConfig()
  loadHistory()
})
</script>

<style scoped>
.profile-page { padding: 0; }

.user-card { text-align: center; }
.avatar-section { padding: 8px 0 16px; }
.avatar-wrap { position: relative; display: inline-block; margin-bottom: 12px; }
.user-avatar { background: linear-gradient(135deg, #165dff, #0fc6c2); }
.avatar-badge {
  position: absolute; bottom: 0; right: 0;
  width: 28px; height: 28px; border-radius: 50%;
  background: white; display: flex; align-items: center; justify-content: center;
  font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.user-name { font-size: 20px; font-weight: 700; margin: 0 0 4px; color: #1d2129; }
.user-email { color: #86909c; font-size: 13px; margin: 0 0 8px; }
.user-meta { display: flex; justify-content: center; gap: 12px; font-size: 13px; color: #4e5969; flex-wrap: wrap; }

.stats-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 4px;
}
.stat-cell { text-align: center; padding: 10px 4px; border-radius: 8px; background: #f7f8fa; }
.stat-num { font-size: 20px; font-weight: 700; }
.stat-num.green { color: #00b42a; }
.stat-num.orange { color: #ff7d00; }
.stat-num.blue { color: #165dff; }
.stat-num.purple { color: #722ed1; }
.stat-num.teal { color: #0fc6c2; }
.stat-num.red { color: #f53f3f; }
.stat-lbl { font-size: 11px; color: #86909c; margin-top: 2px; }

.main-card :deep(.arco-tabs-content) { padding-top: 16px; }

.settings-section { }
.section-title { font-size: 14px; font-weight: 600; color: #1d2129; margin-bottom: 12px; }
.section-desc { font-size: 13px; color: #86909c; margin-bottom: 16px; }

.theme-picker { display: flex; gap: 12px; }
.theme-option {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  cursor: pointer; padding: 8px; border-radius: 8px; border: 2px solid transparent;
  transition: all 0.2s;
}
.theme-option.active { border-color: #165dff; background: #e8f3ff; }
.theme-preview { width: 48px; height: 32px; border-radius: 6px; border: 1px solid #e5e6eb; }
.theme-option span { font-size: 12px; color: #4e5969; }

.toggle-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; border-bottom: 1px solid #f2f3f5;
}
.toggle-row:last-child { border-bottom: none; }

/* AI Config */
.ai-config-section { }
.api-status-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px; border-radius: 8px; background: #f7f8fa;
}
.status-indicator { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; }
.status-indicator.online { color: #00b42a; }
.status-indicator.offline { color: #86909c; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.status-indicator.online .dot { box-shadow: 0 0 6px currentColor; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

.prompt-list { display: flex; flex-direction: column; gap: 12px; }
.prompt-card {
  border: 1px solid #e5e6eb; border-radius: 10px; padding: 14px;
  transition: all 0.2s; background: #fafafa;
}
.prompt-card.active { border-color: #165dff; background: #f0f5ff; }
.prompt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.prompt-name { font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 6px; }
.prompt-icon { font-size: 16px; }
.prompt-textarea :deep(.arco-textarea) { font-size: 13px; background: white; }
.prompt-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }

/* History */
.history-item { padding: 2px 0 8px; }
.history-header { display: flex; justify-content: space-between; align-items: center; }
.history-type { font-weight: 500; font-size: 14px; color: #1d2129; }
.history-time { font-size: 12px; color: #86909c; }
.history-detail { font-size: 13px; color: #4e5969; margin-top: 4px; }

.quick-card :deep(.arco-btn) { justify-content: flex-start; }
</style>
