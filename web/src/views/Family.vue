<template>
  <div class="family-page">
    <div class="page-header">
      <div class="header-left">
        <h1>家庭农场协作</h1>
        <p class="subtitle">分工协作，共同管理农光互补农场</p>
      </div>
      <a-button type="primary" @click="showAddTask = true">
        <icon-plus /> 发布农事任务
      </a-button>
    </div>

    <a-row :gutter="24">
      <!-- Left: Tasks + Activity -->
      <a-col :xs="24" :lg="16">

        <!-- Task Board -->
        <a-card :bordered="false" class="task-board">
          <template #title>
            <div class="card-title">📋 农事任务看板</div>
          </template>
          <template #extra>
            <a-radio-group v-model="taskFilter" size="small">
              <a-radio-button value="all">全部</a-radio-button>
              <a-radio-button value="pending">待处理</a-radio-button>
              <a-radio-button value="doing">进行中</a-radio-button>
              <a-radio-button value="done">已完成</a-radio-button>
            </a-radio-group>
          </template>

          <div class="task-columns">
            <div v-for="col in taskColumns" :key="col.status" class="task-col">
              <div class="col-header" :style="{ borderColor: col.color }">
                <span class="col-icon">{{ col.icon }}</span>
                <span class="col-title">{{ col.label }}</span>
                <span class="col-count">{{ filteredTasks(col.status).length }}</span>
              </div>
              <div class="task-list">
                <div
                  v-for="task in filteredTasks(col.status)"
                  :key="task.id"
                  class="task-card"
                  :class="`priority-${task.priority}`"
                >
                  <div class="task-top">
                    <a-tag :color="taskTypeColor(task.type)" size="small">{{ task.type }}</a-tag>
                    <span class="task-priority-dot" :title="task.priority"></span>
                  </div>
                  <div class="task-title">{{ task.title }}</div>
                  <div class="task-desc">{{ task.desc }}</div>
                  <div class="task-footer">
                    <div class="task-assignee">
                      <a-avatar :size="20" style="font-size:11px">{{ task.assignee[0] }}</a-avatar>
                      <span>{{ task.assignee }}</span>
                    </div>
                    <div class="task-due" :class="{ overdue: isOverdue(task.dueDate) }">
                      📅 {{ task.dueDate }}
                    </div>
                  </div>
                  <div class="task-actions">
                    <a-button
                      v-if="col.status !== 'done'"
                      size="mini" type="text"
                      @click="advanceTask(task)"
                    >
                      {{ col.status === 'pending' ? '开始' : '完成' }} →
                    </a-button>
                    <a-button size="mini" type="text" status="danger" @click="deleteTask(task)">删除</a-button>
                  </div>
                </div>
                <div class="empty-col" v-if="filteredTasks(col.status).length === 0">
                  <span>暂无任务</span>
                </div>
              </div>
            </div>
          </div>
        </a-card>

        <!-- Activity Timeline -->
        <a-card :bordered="false" class="activity-card" style="margin-top:20px">
          <template #title><div class="card-title">⏱️ 近期活动</div></template>
          <a-timeline>
            <a-timeline-item v-for="act in recentActivities" :key="act.id" :dot-color="act.color">
              <div class="act-item">
                <span class="act-who">{{ act.member }}</span>
                <span class="act-what">{{ act.action }}</span>
                <span class="act-time">{{ act.time }}</span>
              </div>
              <div class="act-detail">{{ act.detail }}</div>
            </a-timeline-item>
          </a-timeline>
        </a-card>
      </a-col>

      <!-- Right: Members + Leaderboard + Weather -->
      <a-col :xs="24" :lg="8">

        <!-- Members -->
        <a-card :bordered="false" class="members-card">
          <template #title><div class="card-title">👨‍👩‍👧 成员管理</div></template>
          <template #extra>
            <a-button size="small" type="primary" @click="showAddMember = true">
              <icon-plus />
            </a-button>
          </template>
          <div class="member-list">
            <div v-for="m in members" :key="m.id" class="member-row">
              <a-avatar :size="40" :style="{ background: m.color }">{{ m.name[0] }}</a-avatar>
              <div class="member-info">
                <div class="member-name">{{ m.name }}</div>
                <div class="member-role-tag">
                  <a-tag :color="roleColor(m.role)" size="small">{{ m.role }}</a-tag>
                </div>
              </div>
              <div class="member-pts">
                <div class="pts-num">{{ m.points }}</div>
                <div class="pts-lbl">积分</div>
              </div>
            </div>
          </div>
        </a-card>

        <!-- Leaderboard -->
        <a-card :bordered="false" style="margin-top:16px">
          <template #title><div class="card-title">🏆 贡献排行</div></template>
          <template #extra>
            <a-select v-model="period" size="mini" style="width:80px" @change="fetchLeaderboard">
              <a-option value="week">本周</a-option>
              <a-option value="month">本月</a-option>
              <a-option value="all">全部</a-option>
            </a-select>
          </template>
          <div class="leaderboard">
            <div v-for="(m, i) in leaderboard.slice(0, 5)" :key="m.id" class="lb-row">
              <div class="lb-rank" :class="`rank${i+1}`">{{ i < 3 ? ['🥇','🥈','🥉'][i] : i+1 }}</div>
              <a-avatar :size="32" style="font-size:13px">{{ m.name[0] }}</a-avatar>
              <div class="lb-name">{{ m.name }}</div>
              <div class="lb-pts">{{ m.period_points || m.total_points }} 分</div>
            </div>
            <a-empty v-if="!leaderboard.length" description="暂无数据" :image-size="40" />
          </div>
        </a-card>

        <!-- Farm Weather Widget -->
        <a-card :bordered="false" style="margin-top:16px" class="weather-card">
          <template #title><div class="card-title">🌤️ 农场天气</div></template>
          <div class="weather-body">
            <div class="weather-main">
              <span class="weather-icon">{{ weatherIcon }}</span>
              <div>
                <div class="weather-temp">{{ weather.temp }}°C</div>
                <div class="weather-desc">{{ weather.desc }}</div>
              </div>
            </div>
            <div class="weather-details">
              <div class="wd-item"><span>💧</span><span>湿度 {{ weather.humidity }}%</span></div>
              <div class="wd-item"><span>💨</span><span>风速 {{ weather.wind }} m/s</span></div>
              <div class="wd-item"><span>☀️</span><span>日照 {{ weather.sunshine }}h</span></div>
              <div class="wd-item"><span>🌱</span><span>适宜 {{ weather.suitable }}</span></div>
            </div>
            <div class="weather-advice">
              <icon-info-circle style="color:#165dff" />
              {{ weather.advice }}
            </div>
          </div>
        </a-card>

      </a-col>
    </a-row>

    <!-- Add Task Modal -->
    <a-modal v-model:visible="showAddTask" title="发布农事任务" @ok="handleAddTask" @cancel="resetTaskForm">
      <a-form :model="taskForm" layout="vertical">
        <a-form-item label="任务标题" required>
          <a-input v-model="taskForm.title" placeholder="如：给水稻追施分蘖肥" />
        </a-form-item>
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="任务类型">
              <a-select v-model="taskForm.type">
                <a-option value="施肥">施肥</a-option>
                <a-option value="灌溉">灌溉</a-option>
                <a-option value="病虫害防治">病虫害防治</a-option>
                <a-option value="收割">收割</a-option>
                <a-option value="光伏维护">光伏维护</a-option>
                <a-option value="土壤检测">土壤检测</a-option>
                <a-option value="其他">其他</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="优先级">
              <a-select v-model="taskForm.priority">
                <a-option value="high">🔴 紧急</a-option>
                <a-option value="medium">🟡 普通</a-option>
                <a-option value="low">🟢 低优先</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="指派给">
          <a-select v-model="taskForm.assignee">
            <a-option v-for="m in members" :key="m.id" :value="m.name">{{ m.name }}（{{ m.role }}）</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="截止日期">
          <a-date-picker v-model="taskForm.dueDate" style="width:100%" />
        </a-form-item>
        <a-form-item label="任务描述">
          <a-textarea v-model="taskForm.desc" :auto-size="{ minRows: 2 }" placeholder="详细描述任务内容..." />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Add Member Modal -->
    <a-modal v-model:visible="showAddMember" title="添加家庭成员" @ok="handleAddMember" @cancel="showAddMember=false">
      <a-form :model="memberForm" layout="vertical">
        <a-form-item label="姓名" required>
          <a-input v-model="memberForm.name" placeholder="输入成员姓名" />
        </a-form-item>
        <a-form-item label="角色">
          <a-select v-model="memberForm.role">
            <a-option value="主要劳动力">主要劳动力</a-option>
            <a-option value="辅助劳动力">辅助劳动力</a-option>
            <a-option value="技术顾问">技术顾问</a-option>
            <a-option value="管理者">管理者</a-option>
            <a-option value="学习者">学习者</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus, IconInfoCircle } from '@arco-design/web-vue/es/icon'
import api from '../api.js'

const period = ref('all')
const taskFilter = ref('all')
const showAddTask = ref(false)
const showAddMember = ref(false)
const leaderboard = ref([])

const taskColumns = [
  { status: 'pending', label: '待处理', icon: '📌', color: '#ff7d00' },
  { status: 'doing',   label: '进行中', icon: '⚙️', color: '#165dff' },
  { status: 'done',    label: '已完成', icon: '✅', color: '#00b42a' }
]

// Local task state (in real app would persist to backend)
const tasks = ref([
  { id: 1, title: '水稻追施分蘖肥', type: '施肥', priority: 'high', status: 'pending', assignee: '张大爷', dueDate: '2026-03-15', desc: '亩施尿素8kg，结合灌水进行' },
  { id: 2, title: '光伏板清洁维护', type: '光伏维护', priority: 'medium', status: 'doing', assignee: '李明', dueDate: '2026-03-14', desc: '清除板面灰尘，检查接线是否松动' },
  { id: 3, title: '土壤pH检测', type: '土壤检测', priority: 'low', status: 'pending', assignee: '王芳', dueDate: '2026-03-20', desc: '取5个采样点，送检测站化验' },
  { id: 4, title: '稻田灌溉', type: '灌溉', priority: 'high', status: 'done', assignee: '张大爷', dueDate: '2026-03-10', desc: '分蘖期保持浅水层3-5cm' },
  { id: 5, title: '纹枯病防治', type: '病虫害防治', priority: 'high', status: 'doing', assignee: '李明', dueDate: '2026-03-16', desc: '喷施井冈霉素，重点防治中下部叶鞘' },
])

const members = ref([
  { id: 1, name: '张大爷', role: '主要劳动力', points: 320, color: '#165dff' },
  { id: 2, name: '李明',   role: '技术顾问',   points: 280, color: '#00b42a' },
  { id: 3, name: '王芳',   role: '辅助劳动力', points: 195, color: '#ff7d00' },
  { id: 4, name: '小张',   role: '学习者',     points: 88,  color: '#722ed1' },
])

const recentActivities = ref([
  { id: 1, member: '李明', action: '完成了', detail: '光伏板清洁，发电效率提升约8%', time: '2小时前', color: 'green' },
  { id: 2, member: '张大爷', action: '记录了', detail: '水稻分蘖期长势良好，亩穗数预计22万', time: '5小时前', color: 'blue' },
  { id: 3, member: '王芳', action: '上传了', detail: '土壤检测报告：pH 6.2，有机质2.8%', time: '昨天', color: 'orange' },
  { id: 4, member: '小张', action: '学习了', detail: '农光互补系统运维知识，获得10积分', time: '2天前', color: 'purple' },
])

const weather = ref({
  temp: 18, desc: '多云转晴', humidity: 72, wind: 3.2, sunshine: 6.5,
  suitable: '施肥、灌溉',
  advice: '今日天气适宜农事操作，上午10点前完成施肥效果最佳'
})

const weatherIcon = computed(() => {
  const t = weather.value.temp
  if (t > 30) return '🌞'
  if (t > 20) return '⛅'
  if (t > 10) return '🌤️'
  return '🌥️'
})

const taskForm = ref({ title: '', type: '施肥', priority: 'medium', assignee: '', dueDate: '', desc: '' })
const memberForm = ref({ name: '', role: '主要劳动力' })

const filteredTasks = (status) => {
  if (taskFilter.value !== 'all' && taskFilter.value !== status) return []
  return tasks.value.filter(t => t.status === status)
}

const isOverdue = (dateStr) => {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

const taskTypeColor = (type) => {
  const map = { '施肥': 'orange', '灌溉': 'blue', '病虫害防治': 'red', '收割': 'gold', '光伏维护': 'purple', '土壤检测': 'green', '其他': 'gray' }
  return map[type] || 'gray'
}

const roleColor = (role) => {
  const map = { '主要劳动力': 'blue', '辅助劳动力': 'green', '技术顾问': 'orange', '管理者': 'red', '学习者': 'purple' }
  return map[role] || 'gray'
}

const advanceTask = (task) => {
  if (task.status === 'pending') task.status = 'doing'
  else if (task.status === 'doing') {
    task.status = 'done'
    const m = members.value.find(m => m.name === task.assignee)
    if (m) { m.points += 20; Message.success(`${task.assignee} 完成任务，获得20积分！`) }
  }
}

const deleteTask = (task) => {
  tasks.value = tasks.value.filter(t => t.id !== task.id)
  Message.success('任务已删除')
}

const handleAddTask = () => {
  if (!taskForm.value.title) { Message.warning('请输入任务标题'); return }
  tasks.value.unshift({
    id: Date.now(), ...taskForm.value,
    dueDate: taskForm.value.dueDate ? new Date(taskForm.value.dueDate).toISOString().slice(0, 10) : '待定',
    status: 'pending'
  })
  Message.success('任务已发布')
  showAddTask.value = false
  resetTaskForm()
}

const resetTaskForm = () => {
  taskForm.value = { title: '', type: '施肥', priority: 'medium', assignee: '', dueDate: '', desc: '' }
}

const handleAddMember = async () => {
  if (!memberForm.value.name) { Message.warning('请输入姓名'); return }
  try {
    await api.family.addMember(memberForm.value)
    members.value.push({ id: Date.now(), ...memberForm.value, points: 0, color: '#86909c' })
    Message.success('成员添加成功')
    showAddMember.value = false
    memberForm.value = { name: '', role: '主要劳动力' }
  } catch { Message.error('添加失败') }
}

const fetchLeaderboard = async () => {
  try {
    leaderboard.value = await api.family.getLeaderboard({ period: period.value })
  } catch {}
}

onMounted(() => {
  fetchLeaderboard()
})
</script>

<style scoped>
.family-page { max-width: 1400px; margin: 0 auto; padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-header h1 { font-size: 24px; font-weight: 700; margin: 0 0 4px; }
.subtitle { color: #86909c; font-size: 14px; margin: 0; }
.card-title { font-size: 15px; font-weight: 600; }

/* Task Board */
.task-board :deep(.arco-card-body) { padding: 16px; }
.task-columns { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.task-col { min-height: 200px; }
.col-header {
  display: flex; align-items: center; gap: 6px; padding: 8px 12px;
  border-radius: 8px; background: #f7f8fa; margin-bottom: 12px;
  border-left: 3px solid;
}
.col-icon { font-size: 16px; }
.col-title { font-weight: 600; font-size: 14px; flex: 1; }
.col-count {
  background: #e5e6eb; color: #4e5969; border-radius: 10px;
  padding: 1px 8px; font-size: 12px; font-weight: 600;
}

.task-list { display: flex; flex-direction: column; gap: 10px; }
.task-card {
  padding: 12px; border-radius: 8px; background: white;
  border: 1px solid #e5e6eb; transition: all 0.2s;
  border-left: 3px solid transparent;
}
.task-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }
.task-card.priority-high { border-left-color: #f53f3f; }
.task-card.priority-medium { border-left-color: #ff7d00; }
.task-card.priority-low { border-left-color: #00b42a; }

.task-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.task-priority-dot { width: 8px; height: 8px; border-radius: 50%; background: #e5e6eb; }
.priority-high .task-priority-dot { background: #f53f3f; box-shadow: 0 0 4px #f53f3f; }
.priority-medium .task-priority-dot { background: #ff7d00; }
.priority-low .task-priority-dot { background: #00b42a; }

.task-title { font-weight: 600; font-size: 13px; color: #1d2129; margin-bottom: 4px; }
.task-desc { font-size: 12px; color: #86909c; margin-bottom: 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.task-footer { display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-bottom: 8px; }
.task-assignee { display: flex; align-items: center; gap: 4px; color: #4e5969; }
.task-due { color: #86909c; }
.task-due.overdue { color: #f53f3f; font-weight: 600; }
.task-actions { display: flex; justify-content: flex-end; gap: 4px; }
.empty-col { text-align: center; padding: 24px; color: #c9cdd4; font-size: 13px; }

/* Activity */
.act-item { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.act-who { font-weight: 600; color: #1d2129; }
.act-what { color: #4e5969; }
.act-time { color: #86909c; font-size: 12px; margin-left: auto; }
.act-detail { font-size: 13px; color: #86909c; margin-top: 2px; }

/* Members */
.member-list { display: flex; flex-direction: column; gap: 10px; }
.member-row { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 8px; transition: background 0.2s; }
.member-row:hover { background: #f7f8fa; }
.member-info { flex: 1; }
.member-name { font-weight: 600; font-size: 14px; color: #1d2129; }
.member-role-tag { margin-top: 2px; }
.member-pts { text-align: center; }
.pts-num { font-size: 18px; font-weight: 700; color: #165dff; }
.pts-lbl { font-size: 11px; color: #86909c; }

/* Leaderboard */
.leaderboard { display: flex; flex-direction: column; gap: 8px; }
.lb-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; }
.lb-rank { width: 28px; text-align: center; font-size: 18px; }
.lb-name { flex: 1; font-size: 14px; font-weight: 500; }
.lb-pts { font-weight: 700; color: #165dff; font-size: 14px; }

/* Weather */
.weather-body { }
.weather-main { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.weather-icon { font-size: 40px; }
.weather-temp { font-size: 28px; font-weight: 700; color: #1d2129; }
.weather-desc { color: #86909c; font-size: 13px; }
.weather-details { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
.wd-item { display: flex; gap: 6px; font-size: 13px; color: #4e5969; align-items: center; }
.weather-advice {
  display: flex; gap: 8px; align-items: flex-start;
  padding: 10px; background: #e8f3ff; border-radius: 8px;
  font-size: 13px; color: #165dff; line-height: 1.5;
}

@media (max-width: 768px) {
  .task-columns { grid-template-columns: 1fr; }
}
</style>
