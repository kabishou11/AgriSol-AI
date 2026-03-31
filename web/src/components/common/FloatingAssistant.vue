<template>
  <Teleport to="body">
    <div v-if="!isAiAdvisorPage" class="floating-assistant" :class="{ expanded: isExpanded }">
      <!-- 悬浮气泡按钮 -->
      <div v-if="!isExpanded" class="fab-button" @click="toggleExpanded">
        <div class="fab-glow"></div>
        <span class="fab-icon">🧠</span>
        <div class="fab-pulse"></div>
      </div>

      <!-- 迷你对话窗口 -->
      <div v-else class="fab-panel">
        <!-- 头部 -->
        <div class="fab-header">
          <div class="fab-title">
            <span class="fab-avatar">🧠</span>
            <div class="fab-info">
              <span class="fab-name">AI 智助</span>
              <span class="fab-status">随时待命</span>
            </div>
          </div>
          <div class="fab-actions">
            <button class="fab-btn-expand" @click="$router.push('/ai-advisor')" title="打开完整AI助手">
              <span>&#8599;</span>
            </button>
            <button class="fab-btn-close" @click="toggleExpanded" title="收起">
              <span>&#10005;</span>
            </button>
          </div>
        </div>

        <!-- 模式选择 -->
        <div class="fab-modes">
          <button
            v-for="mode in modes"
            :key="mode.key"
            class="mode-chip"
            :class="{ active: currentMode === mode.key }"
            @click="selectMode(mode.key)"
          >
            <span class="mode-icon">{{ mode.icon }}</span>
            <span class="mode-label">{{ mode.label }}</span>
          </button>
        </div>

        <!-- 消息列表 -->
        <div class="fab-messages" ref="fabMessagesRef">
          <div v-if="fabMessages.length === 0" class="fab-empty">
            <p class="fab-empty-text">问我任何农业、能源或碳汇问题</p>
          </div>
          <div
            v-for="(msg, i) in fabMessages"
            :key="i"
            class="fab-msg"
            :class="msg.role"
          >
            <div class="fab-msg-content">{{ msg.content }}</div>
          </div>
          <div v-if="fabTyping" class="fab-msg assistant">
            <div class="fab-typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="fab-input-row">
          <input
            v-model="fabInput"
            class="fab-input"
            :placeholder="inputPlaceholder"
            @keydown.enter.prevent="sendFabMessage"
          />
          <button class="fab-send" @click="sendFabMessage" :disabled="!fabInput.trim() || fabSending">
            <span v-if="fabSending" class="fab-spinner"></span>
            <span v-else>&#10148;</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api'

const route = useRoute()
const router = useRouter()

const isExpanded = ref(false)
const fabMessages = ref([])
const fabInput = ref('')
const fabSending = ref(false)
const fabTyping = ref(false)
const currentMode = ref('general')
const fabMessagesRef = ref(null)

const isAiAdvisorPage = computed(() => route.path === '/ai-advisor')

const modes = [
  { key: 'general',    systemPromptId: 'general', icon: '💡', label: '综合咨询' },
  { key: 'crop',      systemPromptId: 'crop_expert', icon: '🌾', label: '农事咨询' },
  { key: 'energy',    systemPromptId: 'energy_advisor', icon: '⚡', label: '能源优化' },
  { key: 'carbon',    systemPromptId: 'carbon_expert', icon: '🌱', label: '碳汇建议' },
  { key: 'policy',    systemPromptId: 'general', icon: '📋', label: '政策解读' },
  { key: 'knowledge', systemPromptId: 'general', icon: '📚', label: '农智百科' },
  { key: 'graph',     systemPromptId: 'general', icon: '🕸️', label: '智识网络' }
]

const modePrefixes = {
  general: '请用农业光伏碳汇综合知识回答：',
  crop: '【农事咨询模式】请专注于农业生产和作物管理知识：',
  energy: '【能源优化模式】请专注于光伏发电和能源管理知识：',
  carbon: '【碳汇建议模式】请专注于碳汇计算和碳信用知识：',
  policy: '【政策解读模式】请专注于农业和新能源相关政策知识：',
  knowledge: '【农智百科问答模式】请从以下农智百科内容中查找相关信息回答：',
  graph: '【智识网络问答模式】请从以下智识网络信息中查找相关节点和关系回答：'
}

const inputPlaceholder = computed(() => {
  const placeholders = {
    general: '综合问题...',
    crop: '作物种植问题...',
    energy: '光伏能源问题...',
    carbon: '碳汇计算问题...',
    policy: '政策法规问题...',
    knowledge: '搜索农智百科问题...',
    graph: '查询智识网络...'
  }
  return placeholders[currentMode.value] || '输入问题...'
})

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const selectMode = (key) => {
  currentMode.value = key
}

const scrollFabToBottom = async () => {
  await nextTick()
  if (fabMessagesRef.value) {
    fabMessagesRef.value.scrollTop = fabMessagesRef.value.scrollHeight
  }
}

const sendFabMessage = async () => {
  const text = fabInput.value.trim()
  if (!text || fabSending.value) return

  fabMessages.value.push({
    role: 'user',
    content: text
  })
  fabInput.value = ''
  fabSending.value = true
  fabTyping.value = true
  await scrollFabToBottom()

  try {
    const currentSystemPromptId = modes.find(m => m.key === currentMode.value)?.systemPromptId || 'general'
    let promptText = modePrefixes[currentMode.value] + text

    // Pre-search for knowledge and graph modes
    if (currentMode.value === 'knowledge') {
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
    } else if (currentMode.value === 'graph') {
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
      history: [],
      systemPromptId: currentSystemPromptId
    })

    fabTyping.value = false
    if (res.answer) {
      fabMessages.value.push({
        role: 'assistant',
        content: res.answer
      })
    } else {
      fabMessages.value.push({
        role: 'assistant',
        content: '抱歉，暂时无法回答您的问题，请稍后重试。'
      })
    }
  } catch (err) {
    fabTyping.value = false
    fabMessages.value.push({
      role: 'assistant',
      content: '网络异常，请检查连接后重试。'
    })
  } finally {
    fabSending.value = false
    await scrollFabToBottom()
  }
}

watch(() => fabMessages.value.length, () => {
  scrollFabToBottom()
})
</script>

<style scoped>
.floating-assistant {
  position: fixed;
  z-index: 9999;
  font-family: var(--font-body);
}

/* 展开前：右下角悬浮球 */
.fab-button {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 255, 157, 0.9) 0%, rgba(0, 200, 120, 0.9) 100%);
  border: 2px solid rgba(0, 255, 157, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 24px rgba(0, 255, 157, 0.4), 0 0 40px rgba(0, 255, 157, 0.2);
  transition: all 0.3s ease;
  animation: fabFloat 3s ease-in-out infinite;
}

.fab-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 32px rgba(0, 255, 157, 0.6), 0 0 60px rgba(0, 255, 157, 0.3);
}

.fab-icon {
  font-size: 1.75rem;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.fab-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(0, 255, 157, 0.3);
  animation: fabPulse 2s ease-out infinite;
}

.fab-glow {
  position: absolute;
  width: 120%;
  height: 120%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 255, 157, 0.15) 0%, transparent 70%);
  animation: fabGlow 3s ease-in-out infinite;
}

@keyframes fabFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes fabPulse {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.8); opacity: 0; }
}

@keyframes fabGlow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

/* 展开后：迷你对话面板 */
.fab-panel {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 380px;
  height: 520px;
  background: linear-gradient(165deg, rgba(15, 20, 40, 0.98) 0%, rgba(10, 14, 30, 0.99) 100%);
  border: 1px solid rgba(0, 255, 157, 0.25);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 255, 157, 0.08), inset 0 1px 0 rgba(255,255,255,0.05);
  animation: panelSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes panelSlideIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* 头部 */
.fab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: linear-gradient(90deg, rgba(0, 255, 157, 0.08) 0%, rgba(0, 255, 157, 0.03) 100%);
  border-bottom: 1px solid rgba(0, 255, 157, 0.1);
  flex-shrink: 0;
}

.fab-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.fab-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, rgba(0, 255, 157, 0.2) 0%, rgba(0, 255, 157, 0.1) 100%);
  border: 1px solid rgba(0, 255, 157, 0.3);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.fab-info {
  display: flex;
  flex-direction: column;
}

.fab-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  font-family: var(--font-display);
}

.fab-status {
  font-size: 0.7rem;
  color: #00ff9d;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.fab-status::before {
  content: '';
  width: 5px;
  height: 5px;
  background: #00ff9d;
  border-radius: 50%;
  animation: fabStatusPulse 2s infinite;
}

@keyframes fabStatusPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.fab-actions {
  display: flex;
  gap: 0.4rem;
}

.fab-btn-expand,
.fab-btn-close {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.fab-btn-expand:hover {
  background: rgba(0, 255, 157, 0.15);
  border-color: rgba(0, 255, 157, 0.3);
  color: #00ff9d;
}

.fab-btn-close:hover {
  background: rgba(255, 77, 79, 0.15);
  border-color: rgba(255, 77, 79, 0.3);
  color: #ff4d4f;
}

/* 模式选择 */
.fab-modes {
  display: flex;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  overflow-x: auto;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.fab-modes::-webkit-scrollbar { height: 0; }

.mode-chip {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
}

.mode-chip:hover {
  background: rgba(0, 255, 157, 0.08);
  border-color: rgba(0, 255, 157, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

.mode-chip.active {
  background: linear-gradient(90deg, rgba(0, 255, 157, 0.2) 0%, rgba(0, 255, 157, 0.1) 100%);
  border-color: rgba(0, 255, 157, 0.4);
  color: #00ff9d;
  font-weight: 600;
}

.mode-icon { font-size: 0.8rem; }
.mode-label { font-size: 0.7rem; }

/* 消息列表 */
.fab-messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 255, 157, 0.2) transparent;
}

.fab-messages::-webkit-scrollbar { width: 4px; }
.fab-messages::-webkit-scrollbar-thumb { background: rgba(0, 255, 157, 0.2); border-radius: 2px; }

.fab-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-empty-text {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.35);
  text-align: center;
  line-height: 1.6;
}

.fab-msg {
  max-width: 85%;
  animation: fabMsgIn 0.3s ease;
}

@keyframes fabMsgIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.fab-msg.user {
  align-self: flex-end;
}

.fab-msg.assistant {
  align-self: flex-start;
}

.fab-msg-content {
  padding: 0.6rem 0.85rem;
  border-radius: 14px;
  font-size: 0.82rem;
  line-height: 1.6;
  word-break: break-all;
}

.fab-msg.user .fab-msg-content {
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.2) 0%, rgba(24, 144, 255, 0.1) 100%);
  border: 1px solid rgba(24, 144, 255, 0.3);
  color: #fff;
  border-radius: 14px 14px 4px 14px;
}

.fab-msg.assistant .fab-msg-content {
  background: linear-gradient(135deg, rgba(0, 255, 157, 0.1) 0%, rgba(0, 255, 157, 0.04) 100%);
  border: 1px solid rgba(0, 255, 157, 0.15);
  color: rgba(255, 255, 255, 0.88);
  border-radius: 14px 14px 14px 4px;
}

.fab-typing {
  display: flex;
  gap: 4px;
  padding: 0.6rem 0.85rem;
  background: rgba(0, 255, 157, 0.05);
  border: 1px solid rgba(0, 255, 157, 0.1);
  border-radius: 14px;
  width: fit-content;
}

.fab-typing span {
  width: 6px;
  height: 6px;
  background: #00ff9d;
  border-radius: 50%;
  animation: fabTypingDot 1.4s infinite ease-in-out;
}

.fab-typing span:nth-child(1) { animation-delay: 0s; }
.fab-typing span:nth-child(2) { animation-delay: 0.2s; }
.fab-typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes fabTypingDot {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-5px); opacity: 1; }
}

/* 输入行 */
.fab-input-row {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.fab-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.6rem 0.85rem;
  color: #fff;
  font-family: var(--font-body);
  font-size: 0.82rem;
  outline: none;
  transition: all 0.2s ease;
}

.fab-input:focus {
  border-color: rgba(0, 255, 157, 0.35);
  box-shadow: 0 0 0 2px rgba(0, 255, 157, 0.08);
  background: rgba(255, 255, 255, 0.07);
}

.fab-input::placeholder { color: rgba(255, 255, 255, 0.3); }

.fab-send {
  width: 36px;
  height: 36px;
  min-width: 36px;
  background: linear-gradient(135deg, #00ff9d 0%, #00c87d 100%);
  border: none;
  border-radius: 10px;
  color: #0a0e27;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.fab-send:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 255, 157, 0.4);
}

.fab-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.fab-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top-color: #0a0e27;
  border-radius: 50%;
  animation: fabSpin 0.7s linear infinite;
}

@keyframes fabSpin {
  to { transform: rotate(360deg); }
}
</style>
