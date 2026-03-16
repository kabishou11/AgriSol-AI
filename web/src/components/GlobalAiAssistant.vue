<template>
  <div class="global-ai-assistant">
    <!-- 浮动按钮 -->
    <div
      v-if="!isOpen"
      ref="fabEl"
      class="ai-fab"
      :style="fabStyle"
      @mousedown="startDrag"
      @click="handleFabClick"
    >
      <div class="fab-inner">
        <span class="ai-icon">🤖</span>
        <div class="fab-pulse"></div>
      </div>
      <span v-if="hasNewMessage" class="notification-dot"></span>
    </div>

    <!-- 聊天窗口 -->
    <transition name="chat-slide">
      <div
        v-if="isOpen"
        ref="chatWindow"
        class="ai-chat-window"
        :style="windowStyle"
      >
        <div class="chat-header" @mousedown="startDrag">
          <div class="header-left">
            <div class="ai-avatar-wrapper">
              <span class="ai-avatar">🤖</span>
              <div class="avatar-glow"></div>
            </div>
            <div class="header-info">
              <span class="ai-name">AI 助手</span>
              <span class="ai-status">
                <span class="status-dot"></span>
                {{ currentPageName }}
              </span>
            </div>
          </div>
          <div class="header-actions">
            <button class="icon-btn" @click.stop="clearChat" title="清空对话">
              <icon-delete />
            </button>
            <button class="icon-btn close-btn" @click.stop="toggleChat" title="关闭">
              <icon-close />
            </button>
          </div>
        </div>

        <div class="chat-body" ref="chatBody">
          <!-- 欢迎界面 -->
          <div v-if="messages.length === 0" class="welcome-message">
            <div class="welcome-animation">
              <div class="welcome-icon">👋</div>
              <div class="welcome-sparkles">
                <span>✨</span>
                <span>✨</span>
                <span>✨</span>
              </div>
            </div>
            <h3 class="welcome-text">你好！我是AI助手</h3>
            <p class="welcome-hint">我可以帮你理解当前页面的数据和功能</p>
            <div class="quick-questions">
              <button
                v-for="(q, i) in quickQuestions"
                :key="q"
                class="quick-btn"
                :style="{ animationDelay: `${i * 0.1}s` }"
                @click="sendMessage(q)"
              >
                <span class="quick-icon">💡</span>
                {{ q }}
              </button>
            </div>
          </div>

          <!-- 消息列表 -->
          <div v-for="(msg, idx) in messages" :key="idx" class="message" :class="msg.role">
            <div class="message-avatar">
              <div class="avatar-circle" :class="msg.role">
                {{ msg.role === 'user' ? '👤' : '🤖' }}
              </div>
            </div>
            <div class="message-content">
              <div class="message-bubble" :class="msg.role">
                <div class="message-text" v-html="renderSimpleMarkdown(msg.content)"></div>
                <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
              </div>
            </div>
          </div>

          <!-- 加载中 -->
          <div v-if="isLoading" class="message assistant">
            <div class="message-avatar">
              <div class="avatar-circle assistant">🤖</div>
            </div>
            <div class="message-content">
              <div class="message-bubble assistant">
                <div class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-footer">
          <div class="input-row">
            <a-textarea
              v-model="inputMessage"
              placeholder="有什么可以帮你的？"
              :auto-size="{ minRows: 1, maxRows: 4 }"
              @keydown.enter.prevent="handleEnter"
              class="chat-input"
            />
          </div>
          <div class="footer-actions">
            <a-upload
              :show-file-list="false"
              accept="image/*"
              :custom-request="handleImageUpload"
              :disabled="isLoading"
            >
              <button class="action-btn" title="上传图片分析">
                <icon-image />
                <span>图片</span>
              </button>
            </a-upload>
            <div class="footer-right">
              <span class="footer-hint">Enter 发送 · Shift+Enter 换行</span>
              <button
                class="send-btn"
                :disabled="!inputMessage.trim() || isLoading"
                @click="handleSend"
              >
                <icon-send v-if="!isLoading" />
                <icon-loading v-else class="loading-spin" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { IconDelete, IconClose, IconSend, IconLoading, IconImage } from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import api from '../api.js'
import { renderSimpleMarkdown } from '../utils/format.js'

const route = useRoute()
const isOpen = ref(false)
const hasNewMessage = ref(false)
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const chatBody = ref(null)
const fabEl = ref(null)
const chatWindow = ref(null)

// 系统提示词
const systemPrompts = ref([])
const selectedPromptId = ref('general')

// 拖动相关
const isDragging = ref(false)
const dragMoved = ref(false)
const hasCustomPosition = ref(false)
const position = ref({ x: 0, y: 0 })
const dragStart = ref({ x: 0, y: 0 })

const pageContextMap = {
  '/': '首页',
  '/dashboard': '数据仪表板',
  '/ai-chat': 'AI问答',
  '/crop': '作物分析',
  '/energy': '能源监测',
  '/carbon': '碳汇计算',
  '/wisdom': '农事记录',
  '/family': '家庭协作',
  '/profile': '个人中心',
  '/knowledge': '知识库',
  '/environment': '环境监测'
}

const currentPageName = computed(() => pageContextMap[route.path] || '当前页面')

const quickQuestions = computed(() => {
  const questions = {
    '/crop': ['这个页面有什么功能？', '如何分析作物健康？', '历史记录在哪里？'],
    '/energy': ['今天发电量是多少？', '如何查看收益？', '什么是光伏预测？'],
    '/carbon': ['总碳汇量是多少？', '如何计算碳汇？', '碳汇证书怎么获取？'],
    '/wisdom': ['如何记录农事经验？', '怎么搜索知识？', '可以语音输入吗？'],
    '/family': ['如何添加家庭成员？', '任务怎么分配？', '积分有什么用？']
  }
  return questions[route.path] || ['这个页面有什么功能？', '如何使用？', '数据从哪里来？']
})

// 计算样式
const fabStyle = computed(() => ({
  ...(hasCustomPosition.value
    ? { left: `${position.value.x}px`, top: `${position.value.y}px`, right: 'auto', bottom: 'auto' }
    : { right: '24px', bottom: '24px' }
  ),
  cursor: isDragging.value ? 'grabbing' : 'grab'
}))

const windowStyle = computed(() => ({
  ...(hasCustomPosition.value
    ? { left: `${position.value.x}px`, top: `${position.value.y}px`, right: 'auto', bottom: 'auto' }
    : { right: '24px', bottom: '24px' }
  )
}))

// 拖动功能
const startDrag = (e) => {
  if (e.target.closest('.icon-btn') || e.target.closest('.send-btn')) return

  dragMoved.value = false

  // 获取当前元素的实际屏幕位置
  const el = isOpen.value ? chatWindow.value : fabEl.value
  if (!el) return
  const rect = el.getBoundingClientRect()

  // 转换为 left/top 坐标系
  position.value = { x: rect.left, y: rect.top }
  hasCustomPosition.value = true

  isDragging.value = true
  dragStart.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  e.preventDefault()
}

const onDrag = (e) => {
  if (!isDragging.value) return

  dragMoved.value = true

  const newX = e.clientX - dragStart.value.x
  const newY = e.clientY - dragStart.value.y

  // 限制在视口内
  const maxX = window.innerWidth - (isOpen.value ? 420 : 64)
  const maxY = window.innerHeight - (isOpen.value ? 640 : 64)

  position.value = {
    x: Math.max(0, Math.min(newX, maxX)),
    y: Math.max(0, Math.min(newY, maxY))
  }
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  if (dragMoved.value) {
    savePosition()
  }
}

// FAB 点击：只有没有拖动时才切换
const handleFabClick = () => {
  if (!dragMoved.value) {
    toggleChat()
  }
}

// 页面切换时不再添加系统消息
watch(() => route.path, () => {
  // 仅更新当前页面名称，不添加消息
})

const toggleChat = () => {
  isOpen.value = !isOpen.value
  hasNewMessage.value = false
  if (isOpen.value) {
    nextTick(() => scrollToBottom())
  }
}

const minimizeChat = () => {
  isOpen.value = false
}

const clearChat = () => {
  if (confirm('确定要清空对话记录吗？')) {
    messages.value = []
    saveMessages()
  }
}

const handleEnter = (e) => {
  if (!e.shiftKey) {
    handleSend()
  }
}

const handleSend = () => {
  if (!inputMessage.value.trim() || isLoading.value) return
  sendMessage(inputMessage.value)
  inputMessage.value = ''
}

const sendMessage = async (text) => {
  messages.value.push({
    role: 'user',
    content: text,
    timestamp: Date.now()
  })
  saveMessages()
  scrollToBottom()

  isLoading.value = true

  try {
    const context = await getPageContext()
    const response = await api.ai.chat({
      message: text,
      includeData: true,
      systemPromptId: selectedPromptId.value,
      history: messages.value.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content
      })),
      context: {
        page: route.path,
        pageName: currentPageName.value,
        data: context
      }
    })

    messages.value.push({
      role: 'assistant',
      content: response.answer || '抱歉，我暂时无法回答这个问题。',
      timestamp: Date.now()
    })
    saveMessages()
  } catch (error) {
    messages.value.push({
      role: 'assistant',
      content: '抱歉，服务暂时不可用，请稍后再试。',
      timestamp: Date.now()
    })
    saveMessages()
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const getPageContext = async () => {
  try {
    switch (route.path) {
      case '/crop': {
        const [cropStats, cropHistory] = await Promise.all([
          api.crop.getStatistics(),
          api.crop.getHistory({ limit: 5 })
        ])
        return { statistics: cropStats, recentRecords: cropHistory }
      }
      case '/carbon': {
        const [carbonStats, carbonLedger] = await Promise.all([
          api.carbon.getStatistics(),
          api.carbon.getLedger({ limit: 5 })
        ])
        return { statistics: carbonStats, recentRecords: carbonLedger }
      }
      default:
        return {}
    }
  } catch {
    return {}
  }
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBody.value) {
      chatBody.value.scrollTop = chatBody.value.scrollHeight
    }
  })
}

// 持久化
const saveMessages = () => {
  try {
    const toSave = messages.value.slice(-100)
    localStorage.setItem('global_ai_messages', JSON.stringify(toSave))
  } catch {}
}

const loadMessages = () => {
  try {
    const saved = localStorage.getItem('global_ai_messages')
    if (saved) {
      messages.value = JSON.parse(saved)
    }
  } catch {}
}

const savePosition = () => {
  try {
    localStorage.setItem('global_ai_position', JSON.stringify(position.value))
  } catch {}
}

const loadPosition = () => {
  try {
    const saved = localStorage.getItem('global_ai_position')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.x !== undefined && parsed.y !== undefined) {
        position.value = parsed
        hasCustomPosition.value = true
      }
    }
  } catch {}
}

// 加载系统提示词
const loadSystemPrompts = async () => {
  try {
    const res = await api.prompts.getSystem()
    systemPrompts.value = res || []
  } catch {
    // 使用默认提示词
    systemPrompts.value = [{ id: 'general', name: '通用助手', icon: '🤖' }]
  }
}

// 图片上传分析
const handleImageUpload = async ({ file }) => {
  if (!file) return

  messages.value.push({
    role: 'user',
    content: `[上传了图片] ${inputMessage.value || '请分析这张图片'}`,
    timestamp: Date.now()
  })
  inputMessage.value = ''
  saveMessages()
  scrollToBottom()

  isLoading.value = true

  try {
    // 调用作物分析API
    const formData = new FormData()
    formData.append('image', file)
    formData.append('cropType', '未知')

    const response = await api.crop.upload(formData)

    messages.value.push({
      role: 'assistant',
      content: response.analysis || '图片分析完成',
      timestamp: Date.now()
    })
    saveMessages()
  } catch (error) {
    Message.error('图片分析失败')
    messages.value.push({
      role: 'assistant',
      content: '抱歉，图片分析失败，请稍后再试。',
      timestamp: Date.now()
    })
    saveMessages()
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

onMounted(() => {
  loadMessages()
  loadPosition()
  loadSystemPrompts()
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.global-ai-assistant {
  position: fixed;
  z-index: 9999;
  user-select: none;
}

/* 浮动按钮 */
.ai-fab {
  position: fixed;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  cursor: grab;
  transition: transform 0.3s, box-shadow 0.3s;
}

.ai-fab:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.6);
}

.ai-fab:active {
  cursor: grabbing;
}

.fab-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.ai-icon {
  font-size: 32px;
  animation: float 3s ease-in-out infinite;
  position: relative;
  z-index: 2;
}

.fab-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  animation: pulse 2s ease-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.3); opacity: 0; }
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 14px;
  height: 14px;
  background: #f53f3f;
  border-radius: 50%;
  border: 3px solid white;
  animation: bounce-dot 1s infinite;
}

@keyframes bounce-dot {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

/* 聊天窗口 */
.ai-chat-window {
  position: fixed;
  width: 420px;
  height: 640px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

/* 头部 */
.chat-header {
  padding: 14px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: grab;
  flex-shrink: 0;
}

.chat-header:active {
  cursor: grabbing;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-avatar-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-avatar {
  font-size: 22px;
  position: relative;
  z-index: 2;
}

.avatar-glow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  filter: blur(6px);
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ai-name {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.ai-status {
  font-size: 13px;
  opacity: 0.95;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #00b42a;
  border-radius: 50%;
  animation: blink 2s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.header-actions {
  display: flex;
  gap: 6px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 14px;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.28);
}

.icon-btn.close-btn:hover {
  background: rgba(245, 63, 63, 0.85);
}

/* 消息区域 */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: linear-gradient(to bottom, #f7f8fa 0%, #ffffff 100%);
}

.chat-body::-webkit-scrollbar {
  width: 6px;
}

.chat-body::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.chat-body::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

/* 欢迎界面 */
.welcome-message {
  text-align: center;
  padding: 40px 20px;
}

.welcome-animation {
  position: relative;
  margin-bottom: 24px;
}

.welcome-icon {
  font-size: 56px;
  animation: wave 2s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(20deg); }
  75% { transform: rotate(-20deg); }
}

.welcome-sparkles {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
}

.welcome-sparkles span {
  font-size: 20px;
  animation: sparkle 1.5s ease-in-out infinite;
}

.welcome-sparkles span:nth-child(2) { animation-delay: 0.3s; }
.welcome-sparkles span:nth-child(3) { animation-delay: 0.6s; }

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
}

.welcome-text {
  font-size: 20px;
  font-weight: 700;
  color: #1d2129;
  margin: 0 0 8px;
}

.welcome-hint {
  font-size: 14px;
  color: #86909c;
  margin: 0 0 28px;
  line-height: 1.6;
}

.quick-questions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-btn {
  padding: 14px 18px;
  background: white;
  border: 2px solid #e5e6eb;
  border-radius: 12px;
  color: #4e5969;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slideIn 0.5s ease-out backwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.quick-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: linear-gradient(135deg, #f2f3ff 0%, #faf5ff 100%);
  transform: translateX(4px);
}

.quick-icon {
  font-size: 16px;
}

/* 消息 */
.message {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;  /* 缩小间距从20px到12px */
  animation: messageIn 0.3s ease-out;
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  flex-direction: row-reverse;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.avatar-circle.user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.avatar-circle.assistant {
  background: linear-gradient(135deg, #00b42a 0%, #0fc6c2 100%);
  box-shadow: 0 4px 12px rgba(0, 180, 42, 0.3);
}

.message-content {
  max-width: 70%;
}

.message-bubble {
  padding: 14px 16px;
  border-radius: 16px;
  line-height: 1.5;  /* 缩小行间距从1.6到1.5 */
  font-size: 14px;
  position: relative;
}

.message-bubble.user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px 16px 4px 16px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.message-bubble.assistant {
  background: white;
  color: #1d2129;
  border-radius: 16px 16px 16px 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

.message-text {
  word-wrap: break-word;
}

.message-text :deep(strong) {
  font-weight: 600;
}

.message-text :deep(code) {
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-size: 13px;
}

.message-bubble.user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

/* Markdown 列表样式 */
.message-text :deep(.md-list-item) {
  margin: 4px 0;  /* 缩小列表项间距从6px到4px */
  padding-left: 4px;
  line-height: 1.5;
}

.message-text :deep(em) {
  font-style: italic;
  opacity: 0.95;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 6px;
}

/* 打字动画 */
.typing-indicator {
  display: flex;
  gap: 5px;
  padding: 4px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #86909c;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
  30% { transform: translateY(-10px); opacity: 1; }
}

/* 输入区域 */
.chat-footer {
  padding: 12px 16px 14px;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.input-row {
  margin-bottom: 10px;
}

.chat-input :deep(.arco-textarea) {
  border-radius: 12px;
  border: 1.5px solid #e5e6eb;
  padding: 10px 14px;
  font-size: 14px;
  transition: all 0.2s;
  background: #f7f8fa;
  resize: none;
}

.chat-input :deep(.arco-textarea:focus) {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: 1.5px solid #e5e6eb;
  border-radius: 8px;
  background: white;
  color: #4e5969;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f0f5ff;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.footer-hint {
  font-size: 11px;
  color: #c2c7d0;
}

.send-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 16px;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.loading-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
