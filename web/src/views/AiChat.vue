<template>
  <div class="page-neo chat-neo">
    <div class="chat-layout">
      <!-- Left Sidebar - Chat History (Collapsible) -->
      <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-header">
          <h2 v-if="!sidebarCollapsed" class="sidebar-title">
            <span class="sidebar-icon">&#128172;</span>
            历史记录
          </h2>
          <button
            class="btn-toggle-sidebar"
            :class="{ collapsed: sidebarCollapsed }"
            @click="sidebarCollapsed = !sidebarCollapsed"
            :title="sidebarCollapsed ? '展开历史记录' : '收起历史记录'"
          >
            <span class="toggle-icon">{{ sidebarCollapsed ? '&#9654;' : '&#9664;' }}</span>
          </button>
          <button v-if="!sidebarCollapsed" class="btn-new-chat" @click="createNewChat">
            <span class="btn-icon">+</span>
            新建对话
          </button>
        </div>

        <div v-if="!sidebarCollapsed" class="history-list" ref="historyListRef">
          <div v-if="chatHistory.length === 0" class="empty-history">
            <div class="empty-icon">&#128203;</div>
            <p>暂无历史对话</p>
            <p class="empty-hint">开始新的对话吧</p>
          </div>

          <div
            v-for="item in chatHistory"
            :key="item.id"
            class="history-item"
            :class="{ active: currentSessionId === item.session_id }"
            @click="loadHistory(item)"
          >
            <div class="history-content">
              <div class="history-title">{{ item.title || '新对话' }}</div>
              <div class="history-meta">
                <span class="history-time">{{ formatTime(item.updated_at) }}</span>
                <span class="history-count">{{ item.messageCount || 0 }} 条消息</span>
              </div>
            </div>
            <button class="btn-delete" @click.stop="deleteHistory(item.id)" title="删除">
              &#128465;
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Chat Area -->
      <main class="chat-main">
        <div class="chat-header">
          <div class="chat-title">
            <span class="ai-avatar">&#129504;</span>
            <div class="ai-info">
              <span class="ai-name">AgriSol AI 智助</span>
              <span class="ai-status">
                <span class="status-dot"></span>
                在线
              </span>
            </div>
          </div>

          <!-- 模式切换标签 -->
          <div class="mode-pills">
            <button
              v-for="mode in modeDescriptions"
              :key="mode.key"
              class="mode-pill"
              :class="{ active: activeMode === mode.key }"
              @click="activeMode = mode.key; onModeChange()"
            >
              <span class="pill-icon">{{ mode.icon }}</span>
              <span class="pill-name">{{ mode.name }}</span>
            </button>
          </div>

          <div class="chat-actions">
            <a-tooltip content="清空对话">
              <button class="btn-action" @click="clearCurrentChat">
                <span>&#128465;</span>
              </button>
            </a-tooltip>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="messages-container" ref="messagesContainer">
          <!-- Welcome Message -->
          <div v-if="messages.length === 0" class="welcome-area">
            <div class="welcome-icon">&#127793;</div>
            <h2 class="welcome-title">欢迎使用 AgriSol AI 智助</h2>
            <p class="welcome-desc">您的农业光伏碳汇智能助手，选择模式后即可获得专业解答。支持多轮对话、文件上传和跨模块分析</p>

            <!-- 模式说明 -->
            <div class="mode-intro">
              <div v-for="mode in modeDescriptions" :key="mode.key" class="mode-intro-item" :class="{ active: activeMode === mode.key }">
                <span class="mode-intro-icon">{{ mode.icon }}</span>
                <div class="mode-intro-text">
                  <span class="mode-intro-name">{{ mode.name }}</span>
                  <span class="mode-intro-desc">{{ mode.desc }}</span>
                </div>
              </div>
            </div>

            <div class="quick-questions">
              <p class="quick-title">快捷问题 · {{ currentModeLabel }}</p>
              <div class="quick-grid">
                <button
                  v-for="(q, i) in currentQuickQuestions"
                  :key="i"
                  class="quick-btn"
                  @click="useQuickQuestion(q)"
                >
                  {{ q }}
                </button>
              </div>
            </div>
          </div>

          <!-- Messages -->
          <div v-for="(msg, index) in messages" :key="index" class="message-wrapper" :class="msg.role">
            <div v-if="msg.role === 'assistant'" class="avatar ai-avatar-small">&#129302;</div>
            <div v-else class="avatar user-avatar-small">&#128100;</div>

            <div class="message-bubble">
              <div class="message-content">
                <div v-if="msg.role === 'assistant'" class="ai-message" v-html="formatMarkdown(msg.content)"></div>
                <div v-else class="user-message">
                  {{ msg.content }}
                  <div v-if="msg.attachments && msg.attachments.length > 0" class="attachment-list">
                    <div v-for="(att, i) in msg.attachments" :key="i" class="attachment-item">
                      <span class="att-icon">&#128206;</span>
                      <span class="att-name">{{ att.originalName || att.filename }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="message-footer">
                <span class="message-time">{{ formatMessageTime(msg.timestamp) }}</span>
                <div v-if="msg.role === 'assistant' && msg.usage" class="ai-usage-info">
                  <span class="usage-item" v-if="msg.usage.reasoningTime">⏱ {{ msg.usage.reasoningTime }}</span>
                  <span class="usage-item" v-if="msg.usage.reasoningSpeed">⚡ {{ msg.usage.reasoningSpeed }}</span>
                  <span class="usage-item" v-if="msg.usage.tokensUsed">🔢 {{ msg.usage.tokensUsed }} tokens</span>
                </div>
                <div class="message-actions">
                  <button class="btn-copy" @click="copyMessage(msg.content)" :title="copied ? '已复制' : '复制'">
                    {{ copied ? '&#10003;' : '&#128203;' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Typing indicator -->
          <div v-if="isTyping" class="message-wrapper assistant">
            <div class="avatar ai-avatar-small">&#129302;</div>
            <div class="message-bubble">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Attachment Preview -->
        <div v-if="pendingAttachments.length > 0" class="attachment-preview">
          <div class="preview-header">
            <span>附件 ({{ pendingAttachments.length }})</span>
            <button class="btn-clear-attachments" @click="clearAttachments">清空</button>
          </div>
          <div class="preview-list">
            <div v-for="(att, i) in pendingAttachments" :key="i" class="preview-item">
              <div class="preview-info">
                <span class="preview-icon">{{ getFileIcon(att.type) }}</span>
                <div class="preview-detail">
                  <span class="preview-name">{{ att.originalName || att.filename }}</span>
                  <span class="preview-size">{{ formatFileSize(att.size) }}</span>
                </div>
              </div>
              <div v-if="att.progress !== undefined && att.progress < 100" class="upload-progress">
                <div class="progress-bar" :style="{ width: att.progress + '%' }"></div>
              </div>
              <button class="btn-remove" @click="removeAttachment(i)">&#10005;</button>
            </div>
          </div>
        </div>

        <!-- Drop Zone Overlay -->
        <div v-if="isDragging" class="drop-zone-overlay">
          <div class="drop-zone-content">
            <div class="drop-icon">&#128206;</div>
            <p>拖拽文件到此处上传</p>
            <p class="drop-hint">支持图片、文档等文件</p>
          </div>
        </div>

        <!-- Input Area -->
        <div
          class="input-container"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <div class="input-wrapper">
            <button class="btn-attach" @click="triggerFileInput" title="上传附件">
              &#128206;
            </button>
            <input
              type="file"
              ref="fileInput"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
              @change="handleFileSelect"
              style="display: none"
            />
            <textarea
              v-model="inputText"
              @keydown.enter.exact.prevent="sendMessage"
              @input="autoResize"
              ref="textareaRef"
              class="chat-input"
              :placeholder="`${currentModeLabel}：输入您的问题...`"
              rows="1"
            ></textarea>
            <button
              class="btn-send"
              @click="sendMessage"
              :disabled="(!inputText.trim() && pendingAttachments.length === 0) || isSending"
            >
              <span v-if="isSending" class="loading-spinner"></span>
              <span v-else>&#10148;</span>
            </button>
          </div>
          <p class="input-hint">
            <span>&#128206;</span> 支持拖拽上传文件，AI 可根据附件内容进行回答
          </p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import api from '../api'

// State
const messages = ref([])
const inputText = ref('')
const isSending = ref(false)
const isTyping = ref(false)
const isDragging = ref(false)
const copied = ref(false)
const currentSessionId = ref(null)
const chatHistory = ref([])
const pendingAttachments = ref([])
const messagesContainer = ref(null)
const historyListRef = ref(null)
const fileInput = ref(null)
const textareaRef = ref(null)
const activeMode = ref('general')
const sidebarCollapsed = ref(false)

// 模式配置（映射到后端 systemPromptId）
const modeDescriptions = [
  { key: 'general', systemPromptId: 'general', icon: '💡', name: '综合咨询', desc: '农业、光伏、碳汇全覆盖解答' },
  { key: 'crop',   systemPromptId: 'crop_expert', icon: '🌾', name: '农事咨询', desc: '作物种植、病虫害、水肥管理' },
  { key: 'energy', systemPromptId: 'energy_advisor', icon: '⚡', name: '能源优化', desc: '光伏发电、储能方案、用能效率' },
  { key: 'carbon', systemPromptId: 'carbon_expert', icon: '🌱', name: '碳汇建议', desc: '碳汇计算、碳信用申报、绿色金融' },
  { key: 'policy', systemPromptId: 'general', icon: '📋', name: '政策解读', desc: '农业补贴、光伏政策、碳交易规则' },
  { key: 'knowledge', systemPromptId: 'general', icon: '📚', name: '农智百科问答', desc: '从农智百科中检索相关知识回答问题' },
  { key: 'graph',   systemPromptId: 'general', icon: '🕸️', name: '智识网络问答', desc: '从智识网络中查找节点和关系回答问题' }
]

const modePrefixes = {
  general: '请用农业光伏碳汇综合知识回答：',
  crop: '【农事咨询模式】请专注于农业生产和作物管理知识：',
  energy: '【能源优化模式】请专注于光伏发电和能源管理知识：',
  carbon: '【碳汇建议模式】请专注于碳汇计算和碳信用知识：',
  policy: '【政策解读模式】请专注于农业和新能源相关政策知识：',
  knowledge: '【农智百科问答模式】请从以下农智百科内容中查找相关信息回答用户问题：',
  graph: '【智识网络问答模式】请从以下智识网络信息中查找相关节点和关系回答用户问题：'
}

const quickQuestionsByMode = {
  general: [
    '农光互补有哪些优势？',
    '光伏板如何提升发电效率？',
    '如何计算碳汇量？',
    '寿光蔬菜大棚的碳汇潜力？',
    '农业废弃物如何资源化利用？'
  ],
  crop: [
    '番茄得了叶霉病怎么办？',
    '黄瓜如何提高产量？',
    '大棚土壤盐碱化如何改良？',
    '水肥一体化技术要点？',
    '春季小麦赤霉病预防措施？'
  ],
  energy: [
    '光伏板最佳倾角如何计算？',
    '储能系统如何选型？',
    '阴天光伏发电如何补充？',
    '如何提高自发自用比例？',
    '农光互补用地政策？'
  ],
  carbon: [
    '碳汇量如何计算？',
    '碳信用可以卖给谁？',
    '如何申请碳减排认证？',
    ' IPCC Tier 1 方法学是什么？',
    '有机肥对土壤碳汇的影响？'
  ],
  policy: [
    '2024年光伏补贴还有吗？',
    '农业碳汇项目申报流程？',
    '农村光伏发电有哪些扶持政策？',
    '绿色信贷申请条件？',
    '设施农业用地政策变化？'
  ],
  knowledge: [
    '农光互补的核心优势是什么？',
    '如何提高光伏板发电效率？',
    '碳汇量的计算方法有哪些？',
    '寿光蔬菜大棚的碳汇潜力？',
    '农业废弃物资源化利用途径？'
  ],
  graph: [
    '光伏板与发电效率之间的关系？',
    '碳汇节点与其他节点有什么联系？',
    '农业活动与环境指标的关系？',
    '智识网络中有哪些关键节点？',
    '碳汇计算涉及哪些输入参数？'
  ]
}

const currentModeLabel = computed(() => {
  return modeDescriptions.find(m => m.key === activeMode.value)?.name || '综合咨询'
})

const currentQuickQuestions = computed(() => {
  return quickQuestionsByMode[activeMode.value] || quickQuestionsByMode.general
})

// Initialize
onMounted(async () => {
  await loadHistoryList()
  initTypingEffect()
})

// Load chat history list
const loadHistoryList = async () => {
  try {
    const res = await api.ai.getHistory({ userId: 1 })
    // 拦截器返回 response.data，res 是 { success, data: [...] } 结构
    chatHistory.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (err) {
    console.error('Failed to load history:', err)
  }
}

// Create new chat
const createNewChat = () => {
  currentSessionId.value = null
  messages.value = []
  pendingAttachments.value = []
  inputText.value = ''
}

// Load history session
const loadHistory = async (item) => {
  try {
    const res = await api.ai.getHistoryDetail(item.id)
    // 拦截器返回 response.data，res 是 { success, data: { session_id, ... } } 结构
    if (res && res.session_id) {
      currentSessionId.value = res.session_id
      messages.value = res.messages || []
      pendingAttachments.value = res.attachments || []
      scrollToBottom()
    }
  } catch (err) {
    Message.error('加载会话失败')
  }
}

// Delete history
const deleteHistory = async (id) => {
  try {
    await api.ai.deleteHistory(id)
    Message.success('删除成功')
    chatHistory.value = chatHistory.value.filter(h => h.id !== id)
    if (currentSessionId.value === id) {
      createNewChat()
    }
  } catch (err) {
    Message.error('删除失败')
  }
}

// Save current chat
const saveCurrentChat = async () => {
  if (messages.value.length === 0) return

  try {
    // Generate title from first message
    let title = '新对话'
    if (messages.value.length > 0) {
      const firstUserMsg = messages.value.find(m => m.role === 'user')
      if (firstUserMsg) {
        title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '')
      }
    }

    await api.ai.saveHistory({
      userId: 1,
      sessionId: currentSessionId.value || `session_${Date.now()}`,
      title,
      messages: messages.value,
      attachments: pendingAttachments.value
    })

    // Update session ID
    if (!currentSessionId.value) {
      currentSessionId.value = `session_${Date.now()}`
      // Refresh history list
      await loadHistoryList()
    }
  } catch (err) {
    console.error('Save failed:', err)
  }
}

// Send message
const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text && pendingAttachments.value.length === 0) return
  if (isSending.value) return

  const userMsg = {
    id: Date.now(),
    role: 'user',
    content: text || '[文件消息]',
    attachments: [...pendingAttachments.value],
    timestamp: new Date().toISOString()
  }
  messages.value.push(userMsg)
  inputText.value = ''
  clearAttachments()
  scrollToBottom()

  isSending.value = true
  isTyping.value = true

  try {
    // Build history for context (last 10 messages)
    const historyContext = messages.value.slice(0, -1).slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }))

    const currentSystemPromptId = modeDescriptions.find(m => m.key === activeMode.value)?.systemPromptId || 'general'
    let promptText = modePrefixes[activeMode.value] + text

    // Pre-search for knowledge and graph modes
    if (activeMode.value === 'knowledge') {
      try {
        const searchRes = await api.wisdom.search({ query: text })
        const results = Array.isArray(searchRes) ? searchRes : (searchRes?.data || [])
        if (results.length > 0) {
          const contextText = results.map(r => {
            const title = r.title || ''
            const content = r.content || r.summary || ''
            const tags = Array.isArray(r.tags) ? r.tags.join('、') : (r.tags || '')
            return `【知识条目】${title}${tags ? '（标签：' + tags + '）' : ''}\n${content}`
          }).join('\n\n')
          promptText = modePrefixes.knowledge + '\n' + contextText + '\n\n用户问题：' + text
        }
      } catch (e) {
        console.warn('Knowledge search failed, falling back to normal mode', e)
      }
    } else if (activeMode.value === 'graph') {
      try {
        const graphRes = await api.graph.getKnowledge()
        const graphData = graphRes?.data || graphRes
        if (graphData && (graphData.nodes?.length > 0 || graphData.edges?.length > 0)) {
          const nodeText = (graphData.nodes || []).map(n =>
            `节点：${n.name || n.label || n.id}（类型：${n.type || 'unknown'}）`
          ).join('\n')
          const edgeText = (graphData.edges || []).map(e =>
            `关系：${e.source} --[${e.label || e.type || 'related'}]--> ${e.target}`
          ).join('\n')
          promptText = modePrefixes.graph + '\n【智识网络节点】\n' + nodeText + '\n\n【智识网络关系】\n' + edgeText + '\n\n用户问题：' + text
        }
      } catch (e) {
        console.warn('Graph fetch failed, falling back to normal mode', e)
      }
    }

    const res = await api.ai.chat({
      message: promptText,
      userId: 1,
      history: historyContext,
      systemPromptId: currentSystemPromptId,
      attachments: pendingAttachments.value
    })

    isTyping.value = false

    if (res.answer) {
      // Add assistant message with typing effect
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        usage: res.usage || null
      }
      messages.value.push(assistantMsg)

      // Typewriter effect
      await typewriterEffect(assistantMsg, res.answer)
    } else {
      Message.error('AI 暂时无法回答，请稍后重试')
    }

    // Save chat
    await saveCurrentChat()
  } catch (err) {
    isTyping.value = false
    isSending.value = false
    Message.error('发送失败：' + (err.message || '请稍后重试'))
  } finally {
    isSending.value = false
    scrollToBottom()
  }
}

// Typewriter effect
const typewriterEffect = async (msgObj, text) => {
  const chars = text.split('')
  const chunkSize = 3
  let displayText = ''

  for (let i = 0; i < chars.length; i += chunkSize) {
    displayText += chars.slice(i, i + chunkSize).join('')
    msgObj.content = displayText
    await new Promise(r => setTimeout(r, 15))
  }
  msgObj.content = text
}

// Initialize typing effect (pulse animation)
const initTypingEffect = () => {}

// Clear current chat
const clearCurrentChat = () => {
  messages.value = []
  pendingAttachments.value = []
  currentSessionId.value = null
}

// Copy message
const copyMessage = async (content) => {
  try {
    await navigator.clipboard.writeText(content)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (err) {
    Message.error('复制失败')
  }
}

// Scroll to bottom
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Auto resize textarea
const autoResize = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = Math.min(textareaRef.value.scrollHeight, 150) + 'px'
  }
}

// Trigger file input
const triggerFileInput = () => {
  fileInput.value?.click()
}

// Handle file select
const handleFileSelect = async (e) => {
  const files = Array.from(e.target.files || [])
  await uploadFiles(files)
  e.target.value = ''
}

// Handle drop
const handleDrop = async (e) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files)
  await uploadFiles(files)
}

// Upload files
const uploadFiles = async (files) => {
  for (const file of files) {
    // Validate file
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!allowedTypes.includes(file.type)) {
      Message.warning(`不支持的文件类型: ${file.name}`)
      continue
    }

    // Add placeholder
    const placeholder = {
      filename: file.name,
      originalName: file.name,
      size: file.size,
      type: file.name.split('.').pop(),
      progress: 0,
      file: file
    }
    pendingAttachments.value.push(placeholder)

    // Upload
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await api.ai.upload(formData)
      if (res.success) {
        const idx = pendingAttachments.value.findIndex(a => a.filename === file.name)
        if (idx !== -1) {
          pendingAttachments.value[idx] = {
            ...res.data,
            progress: 100
          }
        }
        Message.success(`${file.name} 上传成功`)
      } else {
        Message.error(`${file.name} 上传失败`)
        pendingAttachments.value = pendingAttachments.value.filter(a => a.filename !== file.name)
      }
    } catch (err) {
      Message.error(`${file.name} 上传失败`)
      pendingAttachments.value = pendingAttachments.value.filter(a => a.filename !== file.name)
    }
  }
}

// Remove attachment
const removeAttachment = (index) => {
  pendingAttachments.value.splice(index, 1)
}

// Clear attachments
const clearAttachments = () => {
  pendingAttachments.value = []
}

// Use quick question
const useQuickQuestion = (question) => {
  inputText.value = question
  sendMessage()
}

// Mode change
const onModeChange = () => {
  // Mode changed, user can now chat in the new mode
}

// Format time
const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// Format message time
const formatMessageTime = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Get file icon
const getFileIcon = (type) => {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp']
  const docTypes = ['pdf', 'doc', 'docx']
  const excelTypes = ['xls', 'xlsx']

  if (imageTypes.includes(type?.toLowerCase())) return '&#128247;'
  if (docTypes.includes(type?.toLowerCase())) return '&#128196;'
  if (excelTypes.includes(type?.toLowerCase())) return '&#128202;'
  return '&#128206;'
}

// Simple markdown formatting
const formatMarkdown = (text) => {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

// Watch for new messages
watch(() => messages.value.length, () => {
  scrollToBottom()
})
</script>

<style scoped>
/* ==================== Layout ==================== */
.chat-neo {
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 120px);
}

.chat-layout {
  display: flex;
  gap: 0;
  height: calc(100vh - 160px);
  min-height: 600px;
  background: var(--bg-card);
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid var(--border-primary);
}

/* ==================== Sidebar ==================== */
.sidebar {
  width: 260px;
  min-width: 260px;
  background: linear-gradient(180deg, rgba(8, 12, 32, 0.98) 0%, rgba(15, 20, 42, 0.98) 100%);
  border-right: 1px solid rgba(0, 255, 157, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(0, 255, 157, 0.3) 50%, transparent 100%);
}

.sidebar-header {
  padding: 1.25rem 1rem 1rem;
  border-bottom: 1px solid rgba(0, 255, 157, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  position: relative;
  z-index: 1;
}

.sidebar.collapsed {
  width: 52px;
  min-width: 52px;
}

.sidebar.collapsed .sidebar-header {
  padding: 1.25rem 0.5rem 1rem;
  align-items: center;
}

.sidebar-title {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-carbon);
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sidebar-icon {
  font-size: 1.25rem;
}

.btn-new-chat {
  width: 100%;
  padding: 0.65rem 1rem;
  background: linear-gradient(135deg, rgba(0, 255, 157, 0.15) 0%, rgba(0, 255, 157, 0.05) 100%);
  border: 1px solid rgba(0, 255, 157, 0.3);
  border-radius: 12px;
  color: var(--color-carbon);
  font-family: var(--font-body);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-new-chat:hover {
  background: linear-gradient(135deg, rgba(0, 255, 157, 0.25) 0%, rgba(0, 255, 157, 0.1) 100%);
  border-color: var(--color-carbon);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 255, 157, 0.2);
}

.btn-icon {
  font-size: 1.25rem;
  font-weight: 700;
}

.btn-toggle-sidebar {
  background: rgba(0, 255, 157, 0.08);
  border: 1px solid rgba(0, 255, 157, 0.2);
  border-radius: 8px;
  color: rgba(0, 255, 157, 0.6);
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  font-size: 0.7rem;
  transition: all 0.25s ease;
  align-self: flex-end;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.btn-toggle-sidebar:hover {
  background: rgba(0, 255, 157, 0.18);
  border-color: rgba(0, 255, 157, 0.45);
  color: #00ff9d;
  box-shadow: 0 0 12px rgba(0, 255, 157, 0.2);
}

.btn-toggle-sidebar.collapsed {
  align-self: center;
  padding: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.toggle-icon {
  font-size: 0.625rem;
  line-height: 1;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.empty-history {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-tertiary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-hint {
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-item:hover {
  background: rgba(0, 255, 157, 0.05);
  border-color: rgba(0, 255, 157, 0.2);
}

.history-item.active {
  background: linear-gradient(135deg, rgba(0, 255, 157, 0.15) 0%, rgba(0, 255, 157, 0.05) 100%);
  border-color: rgba(0, 255, 157, 0.4);
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-title {
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.btn-delete {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  opacity: 0;
}

.history-item:hover .btn-delete {
  opacity: 1;
}

.btn-delete:hover {
  background: rgba(255, 77, 79, 0.2);
  color: var(--color-error);
}

/* ==================== Main Chat ==================== */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(160deg, rgba(12, 16, 30, 0.95) 0%, rgba(8, 10, 22, 0.98) 100%);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.5rem;
  border-bottom: 1px solid rgba(0, 255, 157, 0.08);
  background: rgba(0, 0, 0, 0.15);
  gap: 1rem;
  flex-shrink: 0;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.ai-avatar {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, rgba(0, 255, 157, 0.25) 0%, rgba(0, 255, 157, 0.1) 100%);
  border: 1.5px solid rgba(0, 255, 157, 0.4);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  box-shadow: 0 0 16px rgba(0, 255, 157, 0.15);
}

.ai-info {
  display: flex;
  flex-direction: column;
}

.ai-name {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  font-size: 0.9375rem;
}

.ai-status {
  font-size: 0.72rem;
  color: rgba(0, 255, 157, 0.6);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #00ff9d;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(0, 255, 157, 0.6);
  animation: statusPulse 2s ease infinite;
}

@keyframes statusPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.85); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ==================== Mode Pills ==================== */
.mode-pills {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex: 1;
  justify-content: center;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 0.25rem 0;
}

.mode-pills::-webkit-scrollbar {
  display: none;
}

.mode-pill {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.45);
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.mode-pill:hover {
  background: rgba(0, 255, 157, 0.06);
  border-color: rgba(0, 255, 157, 0.25);
  color: rgba(0, 255, 157, 0.8);
  transform: translateY(-1px);
}

.mode-pill.active {
  background: rgba(0, 255, 157, 0.12);
  border-color: rgba(0, 255, 157, 0.4);
  color: #00ff9d;
  box-shadow: 0 0 12px rgba(0, 255, 157, 0.15), inset 0 1px 0 rgba(0, 255, 157, 0.1);
}

.pill-icon {
  font-size: 0.9rem;
  line-height: 1;
}

.pill-name {
  font-size: 0.78rem;
}

/* ==================== Chat Actions ==================== */
.chat-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-action {
  padding: 0.5rem 0.875rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.5);
  font-family: var(--font-body);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.btn-action:hover {
  background: rgba(255, 77, 79, 0.12);
  border-color: rgba(255, 77, 79, 0.3);
  color: #ff4d4f;
}

/* ==================== Messages ==================== */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.welcome-area {
  text-align: center;
  padding: 2.5rem 2rem 1.5rem;
  animation: fadeIn 0.5s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.welcome-icon {
  font-size: 3.5rem;
  margin-bottom: 1.25rem;
  filter: drop-shadow(0 0 16px rgba(0, 255, 157, 0.3));
}

.welcome-title {
  font-family: var(--font-display);
  font-size: 1.375rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 0.75rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.welcome-desc {
  color: rgba(255, 255, 255, 0.45);
  max-width: 460px;
  margin: 0 auto 1.75rem;
  line-height: 1.65;
  font-size: 0.875rem;
}

/* 模式说明区 */
.mode-intro {
  display: flex;
  gap: 0.625rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 1.75rem;
  max-width: 720px;
  width: 100%;
}

.mode-intro-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  min-width: 160px;
}

.mode-intro-item:hover {
  background: rgba(0, 255, 157, 0.07);
  border-color: rgba(0, 255, 157, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 255, 157, 0.08);
}

.mode-intro-item.active {
  background: linear-gradient(135deg, rgba(0, 255, 157, 0.12) 0%, rgba(0, 255, 157, 0.04) 100%);
  border-color: rgba(0, 255, 157, 0.35);
  box-shadow: 0 0 16px rgba(0, 255, 157, 0.1), inset 0 1px 0 rgba(0, 255, 157, 0.1);
}

.mode-intro-icon {
  font-size: 1.375rem;
  flex-shrink: 0;
}

.mode-intro-text {
  display: flex;
  flex-direction: column;
}

.mode-intro-name {
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  font-family: var(--font-display);
}

.mode-intro-desc {
  font-size: 0.67rem;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 0.1rem;
}

.quick-questions {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}

.quick-title {
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.78rem;
  margin-bottom: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.quick-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  justify-content: center;
}

.quick-btn {
  padding: 0.6rem 1.1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 255, 157, 0.15);
  border-radius: 18px;
  color: rgba(255, 255, 255, 0.5);
  font-family: var(--font-display);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.25s ease;
}

.quick-btn:hover {
  background: rgba(0, 255, 157, 0.1);
  border-color: rgba(0, 255, 157, 0.4);
  color: #00ff9d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 157, 0.12);
}

/* Message Wrapper */
.message-wrapper {
  display: flex;
  gap: 0.875rem;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-wrapper.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.ai-avatar-small {
  background: linear-gradient(135deg, rgba(0, 255, 157, 0.25) 0%, rgba(0, 255, 157, 0.08) 100%);
  border: 1px solid rgba(0, 255, 157, 0.3);
  box-shadow: 0 0 12px rgba(0, 255, 157, 0.1);
}

.user-avatar-small {
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.25) 0%, rgba(24, 144, 255, 0.08) 100%);
  border: 1px solid rgba(24, 144, 255, 0.3);
}

.message-bubble {
  max-width: 68%;
  min-width: 180px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 0.875rem 1.125rem;
}

.message-wrapper.assistant .message-bubble {
  background: linear-gradient(135deg, rgba(0, 255, 157, 0.06) 0%, rgba(0, 255, 157, 0.02) 100%);
  border-color: rgba(0, 255, 157, 0.12);
  border-radius: 4px 16px 16px 16px;
}

.message-wrapper.user .message-bubble {
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(24, 144, 255, 0.04) 100%);
  border-color: rgba(24, 144, 255, 0.18);
  border-radius: 16px 4px 16px 16px;
}

.message-content {
  color: var(--text-primary);
  line-height: 1.7;
  font-size: 0.9375rem;
}

.ai-message :deep(strong) {
  color: var(--color-carbon);
  font-weight: 600;
}

.ai-message :deep(code) {
  background: rgba(0, 255, 157, 0.1);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.875em;
}

.user-message {
  color: var(--text-primary);
}

.attachment-list {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 0.875rem;
}

.att-icon {
  font-size: 1rem;
}

.att-name {
  color: var(--text-secondary);
}

.message-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.message-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.message-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message-bubble:hover .message-actions {
  opacity: 1;
}

/* AI 推理信息 */
.ai-usage-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.usage-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: rgba(0, 255, 157, 0.7);
  background: rgba(0, 255, 157, 0.08);
  border: 1px solid rgba(0, 255, 157, 0.2);
  border-radius: 12px;
  padding: 0.15rem 0.6rem;
  font-family: var(--font-mono);
}

.btn-copy {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.btn-copy:hover {
  background: rgba(0, 255, 157, 0.1);
  color: var(--color-carbon);
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  gap: 0.375rem;
  padding: 0.5rem 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: var(--color-carbon);
  border-radius: 50%;
  animation: typingBounce 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* ==================== Attachment Preview ==================== */
.attachment-preview {
  padding: 0.75rem 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid var(--border-primary);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.btn-clear-attachments {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-clear-attachments:hover {
  color: var(--color-error);
}

.preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 255, 157, 0.05);
  border: 1px solid rgba(0, 255, 157, 0.15);
  border-radius: 8px;
  position: relative;
  min-width: 150px;
}

.preview-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-icon {
  font-size: 1.25rem;
}

.preview-detail {
  display: flex;
  flex-direction: column;
}

.preview-name {
  font-size: 0.8125rem;
  color: var(--text-primary);
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-size {
  font-size: 0.6875rem;
  color: var(--text-tertiary);
}

.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(0, 255, 157, 0.1);
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-carbon) 0%, var(--color-primary-light) 100%);
  transition: width 0.3s ease;
}

.btn-remove {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.btn-remove:hover {
  background: rgba(255, 77, 79, 0.2);
  color: var(--color-error);
}

/* Drop Zone */
.drop-zone-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.2s ease;
}

.drop-zone-content {
  text-align: center;
  padding: 3rem;
  border: 2px dashed var(--color-carbon);
  border-radius: 24px;
  background: rgba(0, 255, 157, 0.05);
}

.drop-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.drop-hint {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  margin-top: 0.5rem;
}

/* ==================== Input Area ==================== */
.input-container {
  padding: 0.875rem 1.5rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(0, 255, 157, 0.06);
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.625rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 0.625rem 0.75rem;
  transition: all 0.25s ease;
}

.input-wrapper:focus-within {
  border-color: rgba(0, 255, 157, 0.35);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 0 3px rgba(0, 255, 157, 0.07), 0 4px 20px rgba(0, 0, 0, 0.2);
}

.btn-attach {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 8px;
  font-size: 1.2rem;
  transition: all 0.2s ease;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-attach:hover {
  background: rgba(0, 255, 157, 0.1);
  color: rgba(0, 255, 157, 0.7);
}

.chat-input {
  flex: 1;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.85);
  font-family: var(--font-display);
  font-size: 0.9rem;
  resize: none;
  max-height: 140px;
  line-height: 1.55;
  outline: none;
  padding: 0.25rem 0;
}

.chat-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.btn-send {
  width: 38px;
  height: 38px;
  min-width: 38px;
  background: linear-gradient(135deg, #00ff9d 0%, #00cc7a 100%);
  border: none;
  border-radius: 10px;
  color: #060912;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.btn-send:hover:not(:disabled) {
  transform: scale(1.06);
  box-shadow: 0 4px 16px rgba(0, 255, 157, 0.35);
}

.btn-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: rgba(0, 255, 157, 0.2);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: #060912;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.input-hint {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.625rem;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.2);
}

/* ==================== Responsive ==================== */
@media (max-width: 768px) {
  .chat-layout {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 160px);
  }

  .sidebar {
    width: 100%;
    min-width: 100%;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid var(--border-primary);
  }

  .message-bubble {
    max-width: 85%;
  }
}
</style>
