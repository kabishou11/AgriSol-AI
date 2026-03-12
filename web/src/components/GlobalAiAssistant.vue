<template>
  <div class="global-ai-assistant">
    <!-- 浮动按钮 -->
    <div v-if="!isOpen" class="ai-fab" @click="toggleChat">
      <span class="ai-icon">🤖</span>
      <span v-if="hasNewMessage" class="notification-dot"></span>
    </div>

    <!-- 聊天窗口 -->
    <div v-if="isOpen" class="ai-chat-window">
      <div class="chat-header">
        <div class="header-left">
          <span class="ai-avatar">🤖</span>
          <div class="header-info">
            <span class="ai-name">AI助手</span>
            <span class="ai-status">{{ currentPageName }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="icon-btn" @click="clearChat" title="清空对话">
            <icon-delete />
          </button>
          <button class="icon-btn" @click="toggleChat" title="关闭">
            <icon-close />
          </button>
        </div>
      </div>

      <div class="chat-body" ref="chatBody">
        <div v-if="messages.length === 0" class="welcome-message">
          <div class="welcome-icon">👋</div>
          <p class="welcome-text">你好！我是AI助手</p>
          <p class="welcome-hint">我可以帮你理解当前页面的数据和功能</p>
          <div class="quick-questions">
            <button
              v-for="q in quickQuestions"
              :key="q"
              class="quick-btn"
              @click="sendMessage(q)"
            >
              {{ q }}
            </button>
          </div>
        </div>

        <div v-for="(msg, idx) in messages" :key="idx" class="message" :class="msg.role">
          <div class="message-avatar">
            {{ msg.role === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(msg.content)"></div>
            <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
          </div>
        </div>

        <div v-if="isLoading" class="message assistant">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-footer">
        <a-textarea
          v-model="inputMessage"
          placeholder="问我关于当前页面的问题..."
          :auto-size="{ minRows: 1, maxRows: 4 }"
          @keydown.enter.prevent="handleEnter"
        />
        <button
          class="send-btn"
          :disabled="!inputMessage.trim() || isLoading"
          @click="handleSend"
        >
          <icon-send v-if="!isLoading" />
          <icon-loading v-else />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { IconDelete, IconClose, IconSend, IconLoading } from '@arco-design/web-vue/es/icon'
import api from '../api.js'

const route = useRoute()
const isOpen = ref(false)
const hasNewMessage = ref(false)
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const chatBody = ref(null)

const pageContextMap = {
  '/': '首页 - 农光智助平台概览',
  '/crop': '作物分析 - AI智能识别作物健康状态',
  '/energy': '能源管理 - 光伏发电数据监控',
  '/carbon': '碳汇记录 - 农业碳汇量计算与管理',
  '/wisdom': '智慧农事 - 农业知识与经验分享',
  '/family': '家庭协作 - 家庭成员任务协作',
  '/profile': '个人中心 - 用户设置与AI配置',
  '/knowledge': '知识库 - 农业知识检索',
  '/environment': '环境监测 - 农田环境数据'
}

const currentPageName = computed(() => {
  return pageContextMap[route.path] || '当前页面'
})

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

watch(() => route.path, () => {
  // 页面切换时，添加上下文提示
  if (messages.value.length > 0 && isOpen.value) {
    messages.value.push({
      role: 'system',
      content: `已切换到：${currentPageName.value}`,
      timestamp: Date.now()
    })
    scrollToBottom()
  }
})

const toggleChat = () => {
  isOpen.value = !isOpen.value
  hasNewMessage.value = false
  if (isOpen.value) {
    nextTick(() => scrollToBottom())
  }
}

const clearChat = () => {
  messages.value = []
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
  scrollToBottom()

  isLoading.value = true

  try {
    // 获取当前页面上下文数据
    const context = await getPageContext()

    // 调用AI接口
    const response = await api.ai.chat({
      question: text,
      context: {
        page: route.path,
        pageName: currentPageName.value,
        data: context
      }
    })

    messages.value.push({
      role: 'assistant',
      content: response.answer || response.data?.answer || '抱歉，我暂时无法回答这个问题。',
      timestamp: Date.now()
    })
  } catch (error) {
    messages.value.push({
      role: 'assistant',
      content: '抱歉，服务暂时不可用，请稍后再试。',
      timestamp: Date.now()
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const getPageContext = async () => {
  try {
    switch (route.path) {
      case '/crop':
        const cropStats = await api.crop.getStatistics()
        const cropHistory = await api.crop.getHistory({ limit: 5 })
        return { statistics: cropStats, recentRecords: cropHistory }

      case '/energy':
        // 能源数据获取逻辑
        return { message: '能源页面数据' }

      case '/carbon':
        const carbonStats = await api.carbon.getStatistics()
        const carbonLedger = await api.carbon.getLedger({ limit: 5 })
        return { statistics: carbonStats, recentRecords: carbonLedger }

      default:
        return {}
    }
  } catch {
    return {}
  }
}

const formatMessage = (content) => {
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
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
</script>

<style scoped>
.global-ai-assistant {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

.ai-fab {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.ai-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6);
}

.ai-icon {
  font-size: 28px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 12px;
  height: 12px;
  background: #f53f3f;
  border-radius: 50%;
  border: 2px solid white;
}

.ai-chat-window {
  width: 400px;
  height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar {
  font-size: 32px;
}

.header-info {
  display: flex;
  flex-direction: column;
}

.ai-name {
  font-size: 16px;
  font-weight: 600;
}

.ai-status {
  font-size: 12px;
  opacity: 0.9;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f7f8fa;
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;
}

.welcome-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.welcome-text {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 8px;
}

.welcome-hint {
  font-size: 14px;
  color: #86909c;
  margin: 0 0 24px;
}

.quick-questions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-btn {
  padding: 12px 16px;
  background: white;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  color: #4e5969;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.quick-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f2f3ff;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  font-size: 32px;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
}

.message.user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 12px;
  padding: 12px 16px;
}

.message.assistant .message-content {
  background: white;
  border-radius: 12px 12px 12px 0;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
}

.message-time {
  font-size: 12px;
  opacity: 0.6;
  margin-top: 4px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #86909c;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
}

.chat-footer {
  padding: 16px;
  background: white;
  border-top: 1px solid #e5e6eb;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-footer :deep(.arco-textarea-wrapper) {
  flex: 1;
}

.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
