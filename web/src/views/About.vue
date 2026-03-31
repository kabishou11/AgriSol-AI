<template>
  <div class="about-page" ref="pageRef">

    <!-- 导航栏 -->
    <nav class="about-nav">
      <div class="nav-logo">
        <span class="logo-icon">🌱</span>
        <span class="logo-text">AgriSol-AI</span>
      </div>
      <div class="nav-pills">
        <a v-for="p in pillars" :key="p.id" :href="'#' + p.id" class="nav-pill" :style="{ '--accent': p.color }">
          <span class="pill-icon">{{ p.icon }}</span>
          <span class="pill-label">{{ p.navLabel }}</span>
        </a>
      </div>
      <button class="nav-back btn-back" @click="$router.push('/')">
        ← 返回首页
      </button>
    </nav>

    <!-- Hero 全屏开场 -->
    <section class="hero-section">
      <div class="hero-particles">
        <div v-for="i in 20" :key="i" class="particle" :style="particleStyle(i)"></div>
      </div>
      <div class="hero-orb hero-orb-1"></div>
      <div class="hero-orb hero-orb-2"></div>
      <div class="hero-orb hero-orb-3"></div>
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          理念 · 愿景 · 使命
        </div>
        <h1 class="hero-title">
          当土地遇见智慧<br/>
          <span class="title-accent">万物生长</span> 便有了答案
        </h1>
        <p class="hero-desc">
          我们相信，每一次数据采集，都是对大地的倾听；<br/>
          每一次算法推演，都是农人经验的延续。
        </p>
        <div class="hero-scroll-hint">
          <span>向下探索</span>
          <div class="scroll-arrow">
            <div class="arrow-line"></div>
            <div class="arrow-line"></div>
            <div class="arrow-line"></div>
          </div>
        </div>
      </div>
      <div class="hero-four-icons">
        <div v-for="p in pillars" :key="p.id" class="hero-icon-item" :style="{ '--accent': p.color }">
          <div class="icon-ring"></div>
          <span class="icon-emoji">{{ p.icon }}</span>
          <span class="icon-name">{{ p.name }}</span>
        </div>
      </div>
    </section>

    <!-- 四大支柱 -->
    <section
      v-for="(pillar, idx) in pillars"
      :key="pillar.id"
      :id="pillar.id"
      class="pillar-section"
      :class="{ 'reverse': idx % 2 === 1 }"
      :style="{ '--accent': pillar.color, '--bg-start': pillar.bgStart, '--bg-end': pillar.bgEnd }"
    >
      <div class="pillar-bg-effect"></div>
      <div class="pillar-number">0{{ idx + 1 }}</div>

      <div class="pillar-visual">
        <div class="visual-card">
          <div class="visual-icon-wrap">
            <div class="visual-glow"></div>
            <span class="visual-emoji">{{ pillar.icon }}</span>
          </div>
          <div class="visual-decoration">
            <div class="deco-circle"></div>
            <div class="deco-circle"></div>
            <div class="deco-circle"></div>
          </div>
        </div>
        <div class="visual-stats">
          <div class="v-stat" v-for="stat in pillar.stats" :key="stat.label">
            <span class="v-stat-value">{{ stat.value }}</span>
            <span class="v-stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </div>

      <div class="pillar-content">
        <div class="pillar-tag">{{ pillar.tag }}</div>
        <h2 class="pillar-title">
          <span class="pillar-title-cn">{{ pillar.name }}</span>
          <span class="pillar-title-en">{{ pillar.nameEn }}</span>
        </h2>
        <p class="pillar-quote">{{ pillar.quote }}</p>
        <div class="pillar-story">
          <p v-for="(para, pi) in pillar.story" :key="pi">{{ para }}</p>
        </div>
        <div class="pillar-values">
          <div class="value-item" v-for="v in pillar.values" :key="v.label">
            <div class="value-icon">{{ v.icon }}</div>
            <div class="value-text">
              <strong>{{ v.label }}</strong>
              <p>{{ v.desc }}</p>
            </div>
          </div>
        </div>
        <a :href="pillar.ctaLink" class="pillar-cta">
          <span>{{ pillar.cta }}</span>
          <span class="cta-arrow">→</span>
        </a>
      </div>
    </section>

    <!-- 融合愿景 -->
    <section class="vision-section">
      <div class="vision-bg"></div>
      <div class="vision-content">
        <div class="vision-badge">融 合</div>
        <h2 class="vision-title">
          四维交织，<br/>织就农业的下一个百年
        </h2>
        <p class="vision-desc">
          我们不追求单一技术的极致，<br/>
          而是在土地、能源、智慧与人文的交汇处，<br/>
          找到一种可持续的共生长路。
        </p>
        <div class="vision-diagram">
          <div class="diagram-center">
            <span class="diagram-icon">🌍</span>
            <span class="diagram-text">农光互补<br/>智能生态</span>
          </div>
          <div
            v-for="(p, i) in pillars"
            :key="p.id"
            class="diagram-node"
            :style="{ '--accent': p.color, '--angle': i * 90 + 'deg' }"
          >
            <span class="diagram-node-icon">{{ p.icon }}</span>
            <span class="diagram-node-name">{{ p.name }}</span>
          </div>
        </div>
        <div class="vision-motto">
          <div class="motto-line"></div>
          <p>「 让每一寸土地都承载数据，<br/>让每一位农人都拥有智慧 」</p>
          <div class="motto-line"></div>
        </div>
        <button class="btn-start" @click="$router.push('/dashboard')">
          <span>开始探索</span>
          <div class="btn-spark"></div>
        </button>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="about-footer">
      <div class="footer-content">
        <div class="footer-logo">
          <span>🌱</span> AgriSol-AI
        </div>
        <p class="footer-sub">农业 · 能源 · 人工智能 · 人文传承</p>
        <div class="footer-links">
          <a @click="$router.push('/crop')">作物分析</a>
          <a @click="$router.push('/energy')">能源监测</a>
          <a @click="$router.push('/carbon')">碳汇管理</a>
          <a @click="$router.push('/wisdom')">智慧传承</a>
          <a @click="$router.push('/graph')">智识网络</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const pageRef = ref(null)

const pillars = [
  {
    id: 'agriculture',
    icon: '🌾',
    name: '农业',
    nameEn: 'AGRICULTURE',
    navLabel: '农业',
    tag: '根植大地',
    color: '#4ade80',
    bgStart: 'rgba(74, 222, 128, 0.04)',
    bgEnd: 'rgba(74, 222, 128, 0.01)',
    quote: '「 土地不会说谎，它用收成回答一切。」',
    stats: [
      { value: '∞', label: '作物品种覆盖' },
      { value: '实时', label: '生长监测' },
      { value: 'AI', label: '病虫害识别' }
    ],
    story: [
      '每一株麦穗都承载着季节的秘密，每一片叶子都在诉说光合的故事。',
      '在 AgriSol，我们用计算机视觉解读作物的语言——叶片上的每一道纹路，都可能是丰收的预告，或是病害的警讯。',
      '从山东寿光的蔬菜大棚，到黑龙江的玉米田，数据与土地相拥，算法与农时共振。'
    ],
    values: [
      { icon: '🔬', label: '精准识别', desc: 'AI 病虫害分析，准确率达 95%+' },
      { icon: '📊', label: '生长追踪', desc: '全程记录，数据可追溯' },
      { icon: '🌱', label: '绿色防控', desc: '减少农药，助力有机种植' }
    ],
    cta: '探索作物智慧',
    ctaLink: '/crop'
  },
  {
    id: 'energy',
    icon: '⚡',
    name: '能源',
    nameEn: 'ENERGY',
    navLabel: '能源',
    tag: '追光逐电',
    color: '#fbbf24',
    bgStart: 'rgba(251, 191, 36, 0.04)',
    bgEnd: 'rgba(251, 191, 36, 0.01)',
    quote: '「 阳光是大自然给农业最慷慨的馈赠。」',
    stats: [
      { value: '24h', label: '实时监测' },
      { value: '三端', label: '数据口径' },
      { value: '最优', label: '消纳推荐' }
    ],
    story: [
      '光伏板在田野上排布成行，阳光转化为电能，电能反哺田间机械——这是「农光互补」的浪漫图景。',
      '我们追踪每一瓦电的来去：从光伏阵列的瞬时输出，到农业机械的消耗曲线，让每一道光都不被辜负。',
      '无论是晴空万里的正午，还是落日余晖的傍晚，系统都在默默计算：如何让太阳的能量，流向最需要它的地方。'
    ],
    values: [
      { icon: '☀️', label: '光伏监测', desc: '实时辐照量与发电量分析' },
      { icon: '📈', label: '消耗洞察', desc: '负荷曲线与峰谷优化' },
      { icon: '🔋', label: '储能建议', desc: '智能储能配置推荐' }
    ],
    cta: '探索能源管理',
    ctaLink: '/energy'
  },
  {
    id: 'ai',
    icon: '🤖',
    name: 'AI',
    nameEn: 'ARTIFICIAL INTELLIGENCE',
    navLabel: 'AI',
    tag: '智慧涌现',
    color: '#a78bfa',
    bgStart: 'rgba(167, 139, 250, 0.04)',
    bgEnd: 'rgba(167, 139, 250, 0.01)',
    quote: '「 人工智能的真谛，是让专家的经验复制、传承。」',
    stats: [
      { value: 'LLM', label: '大模型驱动' },
      { value: 'RAG', label: '知识检索增强' },
      { value: '洞察', label: '每日经营简报' }
    ],
    story: [
      '一位老农用五十年读懂了一方土地；我们用 AI 将这份直觉转化为可量化的洞察。',
      'AgriSol 的 AI 不是冰冷的问答机器，它懂得今天的光照适合打药，明天的降温需要提前灌水。它从数据中学习，在智识网络中推理，把分散的智慧节点串联成网。',
      '每一次对话，都是一次知识的碰撞；每一份简报，都是 AI 与土地的无声对话。'
    ],
    values: [
      { icon: '🧠', label: '每日简报', desc: 'AI 生成每日农业经营洞察' },
      { icon: '🕸️', label: '智识网络', desc: '农业知识关系网络可视化' },
      { icon: '💬', label: '智能问答', desc: '农业问题随时解答' }
    ],
    cta: '探索 AI 助手',
    ctaLink: '/ai-advisor'
  },
  {
    id: 'humanity',
    icon: '📜',
    name: '人文',
    nameEn: 'HERITAGE',
    navLabel: '人文',
    tag: '薪火相传',
    color: '#f472b6',
    bgStart: 'rgba(244, 114, 182, 0.04)',
    bgEnd: 'rgba(244, 114, 182, 0.01)',
    quote: '「 农事是写在泥土里的历史，一代代的智慧，需要被铭记。」',
    stats: [
      { value: '向量', label: '语义检索' },
      { value: '分类', label: '经验沉淀' },
      { value: '关联', label: '图谱网络' }
    ],
    story: [
      '二十四节气不是日历上的数字，是祖辈与土地对话的方式；间作套种不是书本里的概念，是几代农人用汗水验证的智慧。',
      '我们为这些无形的知识建一座数字殿堂：录入、分类、向量化和关联，让散落在田间地头的经验，在智识网络中找到彼此。',
      '当一个年轻农人打开系统，发现"这块地二十年前用过什么肥"时，跨越时空的对话便发生了。'
    ],
    values: [
      { icon: '📝', label: '智慧文章', desc: '农事经验记录与分享' },
      { icon: '🏷️', label: '标签体系', desc: '多维度知识分类归档' },
      { icon: '🔗', label: '图谱关联', desc: '知识网络深度链接' }
    ],
    cta: '探索智慧传承',
    ctaLink: '/wisdom'
  }
]

const particleStyle = (i) => {
  const size = 4 + (i % 5) * 2
  const x = (i * 137.5) % 100
  const y = (i * 97.3) % 100
  const dur = 8 + (i % 8) * 2
  const delay = (i * 1.3) % dur
  return {
    width: size + 'px',
    height: size + 'px',
    left: x + '%',
    top: y + '%',
    animationDuration: dur + 's',
    animationDelay: '-' + delay + 's',
    opacity: 0.1 + (i % 4) * 0.1
  }
}

onMounted(() => {
  // 滚动动画观察器
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
        }
      })
    },
    { threshold: 0.1 }
  )
  document.querySelectorAll('.pillar-section').forEach(el => observer.observe(el))
})
</script>

<style scoped>
/* ===== 全局 ===== */
.about-page {
  background: #060912;
  color: white;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

/* ===== 导航 ===== */
.about-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 3rem;
  background: rgba(6, 9, 18, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.1rem;
  color: white;
}

.logo-icon { font-size: 1.5rem; }
.logo-text { background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

.nav-pills {
  display: flex;
  gap: 0.5rem;
}

.nav-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 1rem;
  border-radius: 100px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  font-size: 0.85rem;
  transition: all 0.3s;
}
.nav-pill:hover {
  background: rgba(var(--accent), 0.15);
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-2px);
}

.pill-icon { font-size: 1rem; }

.nav-back {
  background: none;
  border: 1px solid rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.6);
  padding: 0.5rem 1.2rem;
  border-radius: 100px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s;
}
.nav-back:hover {
  background: rgba(255,255,255,0.08);
  color: white;
  border-color: rgba(255,255,255,0.3);
}

/* ===== Hero ===== */
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 8rem 2rem 4rem;
}

.hero-particles { position: absolute; inset: 0; pointer-events: none; }
.particle {
  position: absolute;
  border-radius: 50%;
  background: white;
  animation: float-particle linear infinite;
}
@keyframes float-particle {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
  50% { transform: translateY(-40px) scale(1.5); opacity: 0.5; }
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  animation: orb-drift 12s ease-in-out infinite;
}
.hero-orb-1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%);
  top: -10%; left: -10%;
}
.hero-orb-2 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%);
  bottom: -5%; right: -5%;
  animation-delay: -4s;
}
.hero-orb-3 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%);
  top: 40%; left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -8s;
}
@keyframes orb-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 30px) scale(0.95); }
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 800px;
  animation: fade-up 1s ease-out;
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1.2rem;
  border-radius: 100px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.7);
  font-size: 0.85rem;
  margin-bottom: 2rem;
  letter-spacing: 0.1em;
}
.badge-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 8px #4ade80;
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.hero-title {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 800;
  line-height: 1.15;
  color: white;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
}
.title-accent {
  background: linear-gradient(135deg, #4ade80, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: gradient-shift 5s ease infinite;
}
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.hero-desc {
  font-size: 1.15rem;
  color: rgba(255,255,255,0.6);
  line-height: 1.8;
  margin-bottom: 3rem;
}

.hero-scroll-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255,255,255,0.3);
  font-size: 0.8rem;
  animation: fade-up 1s ease-out 0.5s both;
}
.scroll-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.arrow-line {
  width: 1px;
  height: 20px;
  background: linear-gradient(to bottom, rgba(255,255,255,0.4), transparent);
  animation: scroll-down 2s ease-in-out infinite;
}
.arrow-line:nth-child(2) { animation-delay: 0.2s; }
.arrow-line:nth-child(3) { animation-delay: 0.4s; height: 14px; }
@keyframes scroll-down {
  0%, 100% { opacity: 0.3; transform: scaleY(1); }
  50% { opacity: 0.8; transform: scaleY(1.2); }
}

.hero-four-icons {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 3rem;
  margin-top: 4rem;
  animation: fade-up 1s ease-out 0.3s both;
}
.hero-icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}
.icon-ring {
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  border: 1px solid var(--accent);
  opacity: 0.2;
  animation: ring-pulse 3s ease-in-out infinite;
}
.hero-icon-item:nth-child(2) .icon-ring { animation-delay: -1s; }
.hero-icon-item:nth-child(3) .icon-ring { animation-delay: -2s; }
.hero-icon-item:nth-child(4) .icon-ring { animation-delay: -3s; }
@keyframes ring-pulse {
  0%, 100% { transform: scale(1); opacity: 0.2; }
  50% { transform: scale(1.15); opacity: 0.4; }
}
.icon-emoji { font-size: 2.5rem; filter: drop-shadow(0 0 12px var(--accent)); }
.icon-name {
  font-size: 0.85rem;
  color: var(--accent);
  font-weight: 600;
  letter-spacing: 0.05em;
}

/* ===== 支柱通用 ===== */
.pillar-section {
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 6rem;
  padding: 6rem 8rem;
  overflow: hidden;
}
.pillar-section.reverse { direction: rtl; }
.pillar-section.reverse > * { direction: ltr; }

.pillar-bg-effect {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 60% 60% at 30% 50%, var(--bg-start) 0%, var(--bg-end) 60%, transparent 100%);
  pointer-events: none;
}

.pillar-number {
  position: absolute;
  top: 4rem;
  left: 4rem;
  font-size: 8rem;
  font-weight: 900;
  font-family: var(--font-mono);
  color: var(--accent);
  opacity: 0.04;
  line-height: 1;
  pointer-events: none;
  user-select: none;
}

/* ===== 视觉区 ===== */
.pillar-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
}

.visual-card {
  position: relative;
  width: 280px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.visual-glow {
  position: absolute;
  inset: -20px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
  opacity: 0.15;
  animation: glow-breathe 4s ease-in-out infinite;
}
@keyframes glow-breathe {
  0%, 100% { transform: scale(1); opacity: 0.15; }
  50% { transform: scale(1.1); opacity: 0.25; }
}
.visual-icon-wrap {
  position: relative;
  z-index: 2;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
  border: 2px solid var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 40px rgba(0,0,0,0.3), inset 0 0 30px rgba(255,255,255,0.03);
}
.visual-emoji {
  font-size: 4rem;
  filter: drop-shadow(0 0 20px var(--accent));
  animation: icon-float 6s ease-in-out infinite;
}
@keyframes icon-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.visual-decoration {
  position: absolute;
  inset: 0;
}
.deco-circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid var(--accent);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: deco-rotate linear infinite;
}
.deco-circle:nth-child(1) { width: 200px; height: 200px; opacity: 0.15; animation-duration: 20s; }
.deco-circle:nth-child(2) { width: 250px; height: 250px; opacity: 0.08; animation-duration: 30s; animation-direction: reverse; }
.deco-circle:nth-child(3) { width: 300px; height: 300px; opacity: 0.04; animation-duration: 40s; }
@keyframes deco-rotate {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

.visual-stats {
  display: flex;
  gap: 2rem;
}
.v-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}
.v-stat-value {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--accent);
  font-family: var(--font-mono);
}
.v-stat-label {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ===== 内容区 ===== */
.pillar-content {
  position: relative;
  z-index: 2;
}

.pillar-tag {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 1rem;
  opacity: 0.8;
}

.pillar-title {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
}
.pillar-title-cn {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  color: white;
  line-height: 1.1;
}
.pillar-title-en {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.3em;
  color: var(--accent);
  opacity: 0.7;
  text-transform: uppercase;
}

.pillar-quote {
  font-size: 1.1rem;
  color: var(--accent);
  margin-bottom: 2rem;
  padding-left: 1rem;
  border-left: 2px solid var(--accent);
  font-style: italic;
  opacity: 0.85;
}

.pillar-story {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2.5rem;
}
.pillar-story p {
  font-size: 1rem;
  color: rgba(255,255,255,0.65);
  line-height: 1.9;
}

.pillar-values {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 2.5rem;
}
.value-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem 1.25rem;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.06);
  transition: all 0.3s;
}
.value-item:hover {
  background: rgba(255,255,255,0.06);
  border-color: var(--accent);
  transform: translateX(8px);
}
.value-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.value-text strong {
  display: block;
  font-size: 0.95rem;
  color: white;
  margin-bottom: 0.25rem;
}
.value-text p {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.45);
  line-height: 1.5;
  margin: 0;
}

.pillar-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 2rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--accent);
  border-radius: 100px;
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s;
  cursor: pointer;
}
.pillar-cta:hover {
  background: var(--accent);
  color: #060912;
  box-shadow: 0 0 30px var(--accent);
  transform: translateY(-3px);
}
.cta-arrow {
  transition: transform 0.3s;
}
.pillar-cta:hover .cta-arrow {
  transform: translateX(4px);
}

/* ===== 融合愿景 ===== */
.vision-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rem 2rem;
  overflow: hidden;
}

.vision-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 50% 50% at 50% 50%, rgba(74,222,128,0.05) 0%, transparent 50%),
    radial-gradient(ellipse 50% 50% at 30% 30%, rgba(251,191,36,0.04) 0%, transparent 50%),
    radial-gradient(ellipse 50% 50% at 70% 70%, rgba(167,139,250,0.04) 0%, transparent 50%);
}

.vision-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 900px;
  animation: fade-up 1s ease-out;
}

.vision-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.4);
  margin-bottom: 2rem;
}

.vision-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  color: white;
  line-height: 1.2;
  margin-bottom: 1.5rem;
}

.vision-desc {
  font-size: 1.1rem;
  color: rgba(255,255,255,0.55);
  line-height: 2;
  margin-bottom: 4rem;
}

.vision-diagram {
  position: relative;
  width: 420px;
  height: 420px;
  margin: 0 auto 4rem;
}

.diagram-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
  border: 2px solid rgba(255,255,255,0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  z-index: 2;
  animation: diagram-pulse 4s ease-in-out infinite;
}
@keyframes diagram-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(255,255,255,0.05); }
  50% { box-shadow: 0 0 40px rgba(255,255,255,0.1); }
}
.diagram-icon { font-size: 2rem; }
.diagram-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  text-align: center;
  line-height: 1.3;
}

.diagram-node {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
  border: 1.5px solid var(--accent);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  transform-origin: center;
  transform: rotate(var(--angle)) translateY(-160px) rotate(calc(-1 * var(--angle)));
  transition: all 0.3s;
  cursor: pointer;
}
.diagram-node:hover {
  background: rgba(255,255,255,0.08);
  box-shadow: 0 0 30px var(--accent);
  transform: rotate(var(--angle)) translateY(-160px) rotate(calc(-1 * var(--angle))) scale(1.1);
}
.diagram-node-icon { font-size: 1.8rem; }
.diagram-node-name {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.05em;
}

.vision-motto {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 3rem;
}
.motto-line {
  width: 60px;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent);
}
.vision-motto p {
  font-size: 1.2rem;
  color: rgba(255,255,255,0.6);
  line-height: 1.8;
  font-style: italic;
}

.btn-start {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 3rem;
  background: linear-gradient(135deg, #4ade80, #60a5fa);
  border: none;
  border-radius: 100px;
  color: #060912;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s;
}
.btn-start:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 40px rgba(74,222,128,0.3);
}
.btn-spark {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent, rgba(255,255,255,0.3), transparent);
  transform: translateX(-100%);
  animation: btn-shine 3s ease-in-out infinite;
}
@keyframes btn-shine {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

/* ===== 页脚 ===== */
.about-footer {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 3rem 2rem;
  text-align: center;
}
.footer-content {
  max-width: 600px;
  margin: 0 auto;
}
.footer-logo {
  font-size: 1.2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.footer-sub {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.3);
  margin-bottom: 1.5rem;
  letter-spacing: 0.1em;
}
.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}
.footer-links a {
  padding: 0.35rem 1rem;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 100px;
  color: rgba(255,255,255,0.5);
  font-size: 0.8rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s;
}
.footer-links a:hover {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.25);
  color: white;
}

/* ===== 响应式 ===== */
@media (max-width: 1024px) {
  .pillar-section,
  .pillar-section.reverse {
    grid-template-columns: 1fr;
    direction: ltr;
    padding: 4rem 2rem;
    gap: 3rem;
  }
  .pillar-visual { flex-direction: row; gap: 2rem; }
  .about-nav { padding: 1rem 1.5rem; }
  .nav-pills { display: none; }
  .hero-four-icons { gap: 1.5rem; }
  .vision-diagram { width: 320px; height: 320px; }
}

@media (max-width: 640px) {
  .hero-title { font-size: 2rem; }
  .hero-four-icons { display: none; }
  .pillar-title-cn { font-size: 2.2rem; }
  .pillar-visual { flex-direction: column; }
  .visual-card { width: 200px; height: 200px; }
  .visual-icon-wrap { width: 120px; height: 120px; }
  .visual-emoji { font-size: 3rem; }
  .vision-diagram { width: 260px; height: 260px; }
  .diagram-center { width: 100px; height: 100px; }
  .diagram-node { width: 70px; height: 70px; }
  .vision-motto { flex-direction: column; gap: 1rem; }
}
</style>
