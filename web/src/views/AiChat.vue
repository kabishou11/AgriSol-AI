<template>
  <div class="ai-chat-page">
    <div class="chat-container">
      <!-- 左侧会话列表 -->
      <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-header">
          <a-button v-if="!sidebarCollapsed" type="primary" long @click="newChat">
            <icon-plus /> 新对话
          </a-button>
          <a-button v-else type="primary" @click="newChat"><icon-plus /></a-button>
        </div>

        <div v-if="!sidebarCollapsed" class="sessions">
          <div
            v-for="s in sessions"
            :key="s.id"
            class="session"
            :class="{ active: s.id === sessionId }"
            @click="sessionId = s.id"
          >
            <div class="session-title">{{ s.title }}</div>
            <div class="session-time">{{ formatTime(s.time) }}</div>
          </div>
        </div>

        <div class="sidebar-footer">
          <a-button type="text" @click="sidebarCollapsed = !sidebarCollapsed">
            <icon-left v-if="!sidebarCollapsed" />
            <icon-right v-else />
          </a-button>
        </div>
      </div>

      <!-- 主聊天区 -->
      <div class="main-chat">
        <div class="chat-header">
          <div class="header-left">
            <a-select v-model="agentMode" style="width:180px" @change="onAgentChange">
              <a-option value="single">🤖 通用助手</a-option>
              <a-option value="crop">🌾 作物专家</a-option>
              <a-option value="energy">⚡ 能源顾问</a-option>
              <a-option value="carbon">🌿 碳汇专家</a-option>
              <a-option value="multi">🧠 多Agent协作</a-option>
            </a-select>
            <a-tag v-if="agentMode === 'multi'" color="purple" size="small">多专家模式</a-tag>
          </div>
          <div class="header-right">
            <a-button type="text" @click="showPrompts = !showPrompts">
              <icon-file /> 提示词
            </a-button>
            <a-button type="text" @click="exportChat">
              <icon-download /> 导出
            </a-button>
            <a-button type="text" @click="clearChat">
              <icon-delete /> 清空
            </a-button>
          </div>
        </div>

        <div class="messages" ref="msgContainer">
          <!-- 欢迎屏幕 -->
          <div v-if="messages.length === 0" class="welcome">
            <div class="welcome-icon">{{ agentIcons[agentMode] }}</div>
            <h2>{{ agentNames[agentMode] }}</h2>
            <p>{{ agentDescs[agentMode] }}</p>
            <div class="quick-actions">
              <a-button
                v-for="q in quickQuestions[agentMode]"
                :key="q"
                @click="send(q)"
              >{{ q }}</a-button>
            </div>
          </div>

          <!-- 消息列表 -->
          <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
            <div class="msg-avatar">
              <a-avatar v-if="m.role === 'user'" style="background:#667eea">我</a-avatar>
              <a-avatar v-else style="background:#00b42a">{{ agentIcons[agentMode] }}</a-avatar>
            </div>
            <div class="msg-content">
              <div class="msg-header">
                <span class="msg-name">{{ m.role === 'user' ? '我' : agentNames[agentMode] }}</span>
                <span class="msg-time">{{ formatMsgTime(m.time) }}</span>
              </div>
              <div class="msg-text" v-html="renderSimpleMarkdown(m.text)"></div>
              <div v-if="m.role === 'assistant'" class="msg-actions">
                <a-button type="text" size="mini" @click="copy(m.text)">
                  <icon-copy /> 复制
                </a-button>
                <a-button type="text" size="mini" @click="regen(i)">
                  <icon-refresh /> 重新生成
                </a-button>
              </div>
            </div>
          </div>

          <!-- 加载中 -->
          <div v-if="loading" class="msg assistant">
            <div class="msg-avatar">
              <a-avatar style="background:#00b42a">{{ agentIcons[agentMode] }}</a-avatar>
            </div>
            <div class="msg-content">
              <div class="msg-header">
                <span class="msg-name">{{ agentNames[agentMode] }}</span>
                <span class="msg-time">思考中...</span>
              </div>
              <div class="msg-text">
                <div class="thinking"><span></span><span></span><span></span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="input-area">
          <div v-if="showPrompts" class="prompts-bar">
            <a-tag
              v-for="p in presets"
              :key="p.id"
              class="prompt-tag"
              @click="input = p.template; showPrompts = false"
            >{{ p.name }}</a-tag>
          </div>
          <div class="input-row">
            <a-button type="text" @click="showPrompts = !showPrompts" :class="{ active: showPrompts }">
              <icon-file />
            </a-button>
            <a-textarea
              v-model="input"
              placeholder="输入你的问题... (Enter发送，Shift+Enter换行)"
              :auto-size="{ minRows: 2, maxRows: 6 }"
              @keydown.enter.exact.prevent="handleSend"
            />
            <a-button type="primary" :disabled="!input.trim() || loading" @click="handleSend">
              <icon-send v-if="!loading" />
              <icon-loading v-else />
            </a-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconPlus, IconLeft, IconRight, IconFile, IconDownload, IconDelete,
  IconSend, IconLoading, IconCopy, IconRefresh
} from '@arco-design/web-vue/es/icon'
import api from '../api'
import { renderSimpleMarkdown, formatRelativeTime } from '../utils/format.js'

const sidebarCollapsed = ref(false)
const sessionId = ref(1)
const sessions = ref([{ id: 1, title: '新对话', time: Date.now() }])
const sessionMsgs = ref({ 1: [] })
const messages = computed(() => sessionMsgs.value[sessionId.value] || [])

const agentMode = ref('single')
const agentIcons = { single: '🤖', crop: '🌾', energy: '⚡', carbon: '🌿', multi: '🧠' }
const agentNames = { single: '通用助手', crop: '作物专家', energy: '能源顾问', carbon: '碳汇专家', multi: '多Agent协作' }
const agentDescs = {
  single: '我是你的全能农业AI助手，可以回答各类农业问题',
  crop: '专注作物健康诊断、病虫害识别和种植建议',
  energy: '专注能源优化、光伏预测和储能方案',
  carbon: '专注碳汇计算、环境效益和认证指导',
  multi: '多位专家协作，提供全面深入的分析'
}

const quickQuestions = {
  single: ['今天适合种植吗？', '如何提高产量？', '能源如何节省？'],
  crop: ['玉米叶片发黄怎么办？', '如何防治病虫害？', '什么时候施肥？'],
  energy: ['光伏系统能发多少电？', '储能容量多大合适？', '如何降低用电成本？'],
  carbon: ['水稻能固碳多少？', '如何申请碳汇证书？', '减排有哪些方法？'],
  multi: ['分析我的农场情况', '制定发展计划', '如何实现碳中和？']
}

const input = ref('')
const loading = ref(false)
const msgContainer = ref(null)
const showPrompts = ref(false)
const presets = ref([])

const newChat = () => {
  const id = Date.now()
  sessions.value.unshift({ id, title: '新对话', time: id })
  sessionMsgs.value[id] = []
  sessionId.value = id
  save()
}

const handleSend = () => {
  if (!input.value.trim() || loading.value) return
  send(input.value)
  input.value = ''
}

const send = async (text) => {
  const msgs = sessionMsgs.value[sessionId.value]
  msgs.push({ role: 'user', text, time: Date.now() })

  const s = sessions.value.find(x => x.id === sessionId.value)
  if (s && s.title === '新对话') s.title = text.substring(0, 20)

  scroll()
  loading.value = true

  try {
    const res = await api.ai.chat({
      message: text,
      includeData: true,
      history: msgs.slice(-10).map(m => ({ role: m.role, content: m.text }))
    })
    msgs.push({
      role: 'assistant',
      text: res?.answer || '抱歉，暂时无法回答',
      time: Date.now(),
      agents: res?.agents
    })
  } catch {
    msgs.push({ role: 'assistant', text: '服务暂时不可用', time: Date.now() })
  } finally {
    loading.value = false
    scroll()
    save()
  }
}

const regen = async (i) => {
  if (i > 0 && messages.value[i - 1]?.role === 'user') {
    messages.value.splice(i, 1)
    await send(messages.value[i - 1].text)
  }
}

const copy = (text) => {
  navigator.clipboard.writeText(text).then(() => Message.success('已复制'))
}

const clearChat = () => {
  sessionMsgs.value[sessionId.value] = []
  save()
}

const exportChat = () => {
  const s = sessions.value.find(x => x.id === sessionId.value)
  const text = messages.value.map(m => `[${m.role === 'user' ? '我' : 'AI'}] ${m.text}`).join('\n\n')
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${s?.title || 'chat'}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

const onAgentChange = () => {
  const s = sessions.value.find(x => x.id === sessionId.value)
  if (s && messages.value.length === 0) {
    s.title = agentNames[agentMode.value]
  }
}

const scroll = () => nextTick(() => {
  if (msgContainer.value) msgContainer.value.scrollTop = msgContainer.value.scrollHeight
})

const save = () => {
  try {
    const recentSessions = sessions.value.slice(-20)
    const msgEntries = Object.entries(sessionMsgs.value)
      .map(([id, msgs]) => [id, msgs.slice(-100)])
      .reduce((acc, [id, msgs]) => ({ ...acc, [id]: msgs }), {})
    localStorage.setItem('ai_chat_sessions', JSON.stringify(recentSessions))
    localStorage.setItem('ai_chat_messages', JSON.stringify(msgEntries))
  } catch {}
}

const load = () => {
  try {
    const s = localStorage.getItem('ai_chat_sessions')
    const m = localStorage.getItem('ai_chat_messages')
    if (s) sessions.value = JSON.parse(s)
    if (m) sessionMsgs.value = JSON.parse(m)
    if (sessions.value.length === 0) newChat()
  } catch { newChat() }
}

const loadPresets = async () => {
  try {
    const res = await api.prompts.getPresets()
    presets.value = (res || []).slice(0, 10)
  } catch {}
}

const formatTime = (ts) => {
  const d = Date.now() - ts
  const m = Math.floor(d / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m}分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}小时前`
  return formatRelativeTime(new Date(ts).toISOString())
}

const formatMsgTime = (ts) => new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

onMounted(() => {
  load()
  loadPresets()
})
</script>

<style scoped>
.ai-chat-page {
  height: calc(100vh - 64px);
  background: #f5f5f5;
}

.chat-container {
  display: flex;
  height: 100%;
}

.sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid #e5e6eb;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e5e6eb;
}

.sessions {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: all 0.2s;
}

.session:hover {
  background: #f7f8fa;
}

.session.active {
  background: #e8f3ff;
  border-left: 3px solid #165dff;
}

.session-title {
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-time {
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid #e5e6eb;
  text-align: center;
}

.main-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e5e6eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.welcome {
  text-align: center;
  padding: 60px 20px;
}

.welcome-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.welcome h2 {
  font-size: 24px;
  margin: 0 0 8px;
  color: #1d2129;
}

.welcome p {
  color: #86909c;
  margin: 0 0 32px;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  max-width: 600px;
  margin: 0 auto;
}

.msg {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;  /* 缩小间距从24px到16px */
}

.msg.user {
  flex-direction: row-reverse;
}

.msg-avatar {
  flex-shrink: 0;
}

.msg-content {
  max-width: 70%;
}

.msg-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
}

.msg-name {
  font-weight: 600;
  color: #1d2129;
}

.msg-time {
  color: #86909c;
}

.msg-text {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;  /* 缩小行间距 */
  font-size: 14px;
}

.msg.user .msg-text {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 12px 12px 0 12px;
}

.msg.assistant .msg-text {
  background: #f7f8fa;
  color: #1d2129;
  border-radius: 12px 12px 12px 0;
}

/* Markdown 样式 */
.msg-text :deep(code) {
  background: rgba(0, 0, 0, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-size: 13px;
}

.msg.user .msg-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

.msg-text :deep(.md-list-item) {
  margin: 4px 0;  /* 缩小列表项间距 */
  padding-left: 4px;
  line-height: 1.5;
}

.msg-text :deep(em) {
  font-style: italic;
  opacity: 0.95;
}

.msg-text :deep(strong) {
  font-weight: 600;
}

.msg-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.thinking {
  display: flex;
  gap: 4px;
}

.thinking span {
  width: 8px;
  height: 8px;
  background: #86909c;
  border-radius: 50%;
  animation: bounce 1.4s infinite;
}

.thinking span:nth-child(2) { animation-delay: 0.2s; }
.thinking span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-8px); }
}

.input-area {
  border-top: 1px solid #e5e6eb;
  padding: 16px 24px;
  background: white;
}

.prompts-bar {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.prompt-tag {
  cursor: pointer;
}

.input-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-row :deep(.arco-textarea-wrapper) {
  flex: 1;
}

.input-row .arco-btn.active {
  color: #165dff;
}
</style>
