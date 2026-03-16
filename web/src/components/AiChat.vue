<template>
  <div class="ai-chat-wrapper">
    <!-- Floating trigger button -->
    <div class="ai-fab" @click="toggleChat" :class="{ active: isOpen }">
      <span class="ai-fab-icon">{{ isOpen ? '✕' : '🤖' }}</span>
      <span class="ai-fab-label" v-if="!isOpen">AI助手</span>
    </div>

    <!-- Chat panel -->
    <transition name="chat-slide">
      <div class="ai-chat-panel" v-if="isOpen">
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="ai-avatar">🌾</div>
            <div>
              <div class="ai-name">农光智助 AI</div>
              <div class="ai-status">
                <span class="status-dot"></span>
                在线 · 知识库联动
              </div>
            </div>
          </div>
          <div class="chat-header-actions">
            <a-tooltip content="包含平台数据">
              <a-switch v-model="includeData" size="small" />
            </a-tooltip>
            <a-button type="text" size="mini" @click="clearHistory">
              <icon-delete />
            </a-button>
          </div>
        </div>

        <div class="chat-messages" ref="messagesRef">
          <!-- Welcome message -->
          <div class="message ai-message" v-if="messages.length === 0">
            <div class="message-bubble">
              <p>你好！我是农光智助AI，可以帮你解答：</p>
              <ul>
                <li>🌾 农业种植与病虫害防治</li>
                <li>⚡ 光伏能源优化建议</li>
                <li>🌿 碳汇计算与减排方法</li>
                <li>🌍 土壤环境分析</li>
              </ul>
              <p>试试下面的问题，或直接输入你的问题：</p>
            </div>
          </div>

          <!-- Suggestion chips (only when empty) -->
          <div class="suggestions" v-if="messages.length === 0 && suggestions.length">
            <div
              v-for="s in suggestions.slice(0, 4)"
              :key="s"
              class="suggestion-chip"
              @click="sendSuggestion(s)"
            >{{ s }}</div>
          </div>

          <!-- Message history -->
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="message"
            :class="msg.role === 'user' ? 'user-message' : 'ai-message'"
          >
            <div class="message-bubble" v-html="renderSimpleMarkdown(msg.content)"></div>
            <div class="message-meta" v-if="msg.role === 'assistant' && msg.source">
              <span class="source-badge" :class="msg.source">
                {{ sourceLabel(msg.source) }}
              </span>
            </div>
          </div>

          <!-- Loading indicator -->
          <div class="message ai-message" v-if="loading">
            <div class="message-bubble typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <a-textarea
            v-model="inputText"
            placeholder="输入问题，如：水稻分蘖期如何管理？"
            :auto-size="{ minRows: 1, maxRows: 3 }"
            @keydown.enter.exact.prevent="sendMessage"
            :disabled="loading"
          />
          <a-button
            type="primary"
            class="send-btn"
            @click="sendMessage"
            :loading="loading"
            :disabled="!inputText.trim()"
          >
            <icon-send />
          </a-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { IconDelete, IconSend } from '@arco-design/web-vue/es/icon'
import api from '../api.js'
import { renderSimpleMarkdown } from '../utils/format.js'

const isOpen = ref(false)
const inputText = ref('')
const loading = ref(false)
const includeData = ref(true)
const messages = ref([])
const suggestions = ref([])
const messagesRef = ref(null)

const toggleChat = () => { isOpen.value = !isOpen.value }
const clearHistory = () => { messages.value = [] }

const sourceLabel = (source) => {
  const map = { ai: '🤖 AI回答', knowledge: '📚 知识库', fallback: '💡 建议' }
  return map[source] || source
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const sendSuggestion = (text) => {
  inputText.value = text
  sendMessage()
}

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  loading.value = true
  await scrollToBottom()

  try {
    const history = messages.value.slice(-8).map(m => ({ role: m.role, content: m.content }))
    const res = await api.ai.chat({ message: text, history, includeData: includeData.value })
    messages.value.push({
      role: 'assistant',
      content: res.answer,
      source: res.source
    })
  } catch (err) {
    messages.value.push({
      role: 'assistant',
      content: '抱歉，AI服务暂时不可用，请稍后再试。',
      source: 'error'
    })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

onMounted(async () => {
  try {
    const res = await api.ai.getSuggestions()
    suggestions.value = res.suggestions || []
  } catch {}
})
</script>

<style scoped>
.ai-chat-wrapper {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 1000;
}

.ai-fab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #165dff 0%, #0fc6c2 100%);
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(22, 93, 255, 0.4);
  transition: all 0.3s ease;
  user-select: none;
}

.ai-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(22, 93, 255, 0.5);
}

.ai-fab.active {
  background: linear-gradient(135deg, #f53f3f 0%, #ff7d00 100%);
  box-shadow: 0 4px 20px rgba(245, 63, 63, 0.4);
}

.ai-fab-icon { font-size: 20px; }
.ai-fab-label { color: white; font-weight: 600; font-size: 14px; }

.ai-chat-panel {
  position: absolute;
  bottom: 64px;
  right: 0;
  width: 380px;
  height: 560px;
  background: #1a1d2e;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.chat-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #1e2235 0%, #252a3d 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header-info { display: flex; align-items: center; gap: 12px; }
.ai-avatar { font-size: 28px; }
.ai-name { color: #e8f4fd; font-weight: 600; font-size: 15px; }
.ai-status { color: #86909c; font-size: 12px; display: flex; align-items: center; gap: 4px; }
.status-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #00d4aa;
  box-shadow: 0 0 6px #00d4aa;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.chat-header-actions { display: flex; align-items: center; gap: 8px; }

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}

.message { display: flex; flex-direction: column; max-width: 90%; }
.user-message { align-self: flex-end; align-items: flex-end; }
.ai-message { align-self: flex-start; align-items: flex-start; }

.message-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13.5px;
  line-height: 1.6;
}

.user-message .message-bubble {
  background: linear-gradient(135deg, #165dff 0%, #0fc6c2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-message .message-bubble {
  background: rgba(255, 255, 255, 0.06);
  color: #c9d1d9;
  border-bottom-left-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.ai-message .message-bubble :deep(strong) { color: #79c0ff; }
.ai-message .message-bubble :deep(p) { margin: 4px 0; }
.ai-message .message-bubble :deep(ul) { margin: 6px 0; padding-left: 16px; }
.ai-message .message-bubble :deep(li) { margin: 2px 0; }

.message-meta { margin-top: 4px; }
.source-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255,255,255,0.06);
  color: #86909c;
}
.source-badge.ai { color: #79c0ff; }
.source-badge.knowledge { color: #f472b6; }

/* Typing animation */
.typing { display: flex; gap: 4px; align-items: center; padding: 14px 18px; }
.typing span {
  width: 6px; height: 6px; border-radius: 50%;
  background: #86909c;
  animation: typing-bounce 1.2s infinite;
}
.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0;
}

.suggestion-chip {
  padding: 6px 12px;
  background: rgba(22, 93, 255, 0.15);
  border: 1px solid rgba(22, 93, 255, 0.3);
  border-radius: 20px;
  color: #79c0ff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.suggestion-chip:hover {
  background: rgba(22, 93, 255, 0.3);
  transform: translateY(-1px);
}

.chat-input-area {
  padding: 12px 16px;
  background: rgba(255,255,255,0.03);
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.chat-input-area :deep(.arco-textarea) {
  background: rgba(255,255,255,0.06) !important;
  border-color: rgba(255,255,255,0.1) !important;
  color: #c9d1d9 !important;
  border-radius: 10px;
  font-size: 13px;
}

.send-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Transition */
.chat-slide-enter-active, .chat-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.chat-slide-enter-from, .chat-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

@media (max-width: 480px) {
  .ai-chat-wrapper { bottom: 16px; right: 16px; }
  .ai-chat-panel { width: calc(100vw - 32px); right: 0; }
}
</style>
