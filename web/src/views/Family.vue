<template>
  <div class="family-page">
    <div class="page-header">
      <h1>家庭协作</h1>
      <p class="subtitle">一起记录，共同成长</p>
    </div>

    <a-row :gutter="24">
      <a-col :span="24" :lg="16">
        <a-card :bordered="false" class="leaderboard-card">
          <template #title>
            <div class="card-title">
              <icon-trophy />
              <span>贡献排行榜</span>
            </div>
          </template>

          <template #extra>
            <a-radio-group v-model="period" @change="fetchLeaderboard">
              <a-radio value="week">本周</a-radio>
              <a-radio value="month">本月</a-radio>
              <a-radio value="all">全部</a-radio>
            </a-radio-group>
          </template>

          <a-spin :loading="loadingLeaderboard">
            <div class="leaderboard-list">
              <div
                v-for="(member, index) in leaderboard"
                :key="member.id"
                class="leaderboard-item"
                :class="`rank-${index + 1}`"
              >
                <div class="rank-badge">
                  <icon-trophy v-if="index === 0" class="trophy-icon gold" />
                  <icon-trophy v-else-if="index === 1" class="trophy-icon silver" />
                  <icon-trophy v-else-if="index === 2" class="trophy-icon bronze" />
                  <span v-else class="rank-number">{{ index + 1 }}</span>
                </div>

                <a-avatar :size="56" class="member-avatar">
                  <img v-if="member.avatar" :src="member.avatar" />
                  <span v-else>{{ member.name[0] }}</span>
                </a-avatar>

                <div class="member-info">
                  <h3>{{ member.name }}</h3>
                  <p class="member-role">{{ member.role }}</p>
                </div>

                <div class="member-stats">
                  <div class="stat-item">
                    <span class="stat-value">{{ member.period_points || member.total_points }}</span>
                    <span class="stat-label">积分</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ member.contribution_count }}</span>
                    <span class="stat-label">贡献</span>
                  </div>
                </div>
              </div>
            </div>

            <a-empty v-if="!loadingLeaderboard && leaderboard.length === 0" description="还没有成员" />
          </a-spin>
        </a-card>

        <a-card :bordered="false" class="activity-card" style="margin-top: 24px">
          <template #title>
            <div class="card-title">
              <icon-history />
              <span>最近活动</span>
            </div>
          </template>

          <a-spin :loading="loadingActivity">
            <a-timeline>
              <a-timeline-item
                v-for="activity in activities"
                :key="activity.id"
              >
                <template #dot>
                  <a-avatar :size="32">
                    <img v-if="activity.member_avatar" :src="activity.member_avatar" />
                    <span v-else>{{ activity.member_name[0] }}</span>
                  </a-avatar>
                </template>

                <div class="activity-item">
                  <div class="activity-header">
                    <span class="activity-member">{{ activity.member_name }}</span>
                    <span class="activity-action">{{ getActionText(activity.action_type) }}</span>
                  </div>
                  <p class="activity-description">{{ activity.description }}</p>
                  <div class="activity-footer">
                    <span class="activity-points">+{{ activity.points }} 积分</span>
                    <span class="activity-time">{{ formatTime(activity.created_at) }}</span>
                  </div>
                </div>
              </a-timeline-item>
            </a-timeline>

            <a-empty v-if="!loadingActivity && activities.length === 0" description="还没有活动记录" />
          </a-spin>
        </a-card>
      </a-col>

      <a-col :span="24" :lg="8">
        <a-card :bordered="false" class="members-card">
          <template #title>
            <div class="card-title">
              <icon-user-group />
              <span>家庭成员</span>
            </div>
          </template>

          <template #extra>
            <a-button type="primary" @click="showAddMember = true">
              <template #icon><icon-plus /></template>
              添加成员
            </a-button>
          </template>

          <a-spin :loading="loadingMembers">
            <div class="members-list">
              <div
                v-for="member in members"
                :key="member.id"
                class="member-card"
              >
                <a-avatar :size="48">
                  <img v-if="member.avatar" :src="member.avatar" />
                  <span v-else>{{ member.name[0] }}</span>
                </a-avatar>

                <div class="member-details">
                  <h4>{{ member.name }}</h4>
                  <p>{{ member.role }}</p>
                  <div class="member-points">
                    <icon-star /> {{ member.points }} 积分
                  </div>
                </div>
              </div>
            </div>
          </a-spin>
        </a-card>

        <a-card :bordered="false" class="achievements-card" style="margin-top: 16px">
          <template #title>
            <div class="card-title">
              <icon-trophy />
              <span>成就徽章</span>
            </div>
          </template>

          <div class="achievements-grid">
            <div
              v-for="achievement in achievementTypes"
              :key="achievement.type"
              class="achievement-badge"
              :class="{ unlocked: achievement.unlocked }"
            >
              <div class="badge-icon">{{ achievement.icon }}</div>
              <div class="badge-name">{{ achievement.name }}</div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-modal
      v-model:visible="showAddMember"
      title="添加家庭成员"
      @ok="handleAddMember"
      @cancel="resetMemberForm"
    >
      <a-form :model="memberForm" layout="vertical">
        <a-form-item label="姓名" required>
          <a-input v-model="memberForm.name" placeholder="输入成员姓名" />
        </a-form-item>

        <a-form-item label="角色">
          <a-select v-model="memberForm.role" placeholder="选择角色">
            <a-option value="爷爷">爷爷</a-option>
            <a-option value="奶奶">奶奶</a-option>
            <a-option value="爸爸">爸爸</a-option>
            <a-option value="妈妈">妈妈</a-option>
            <a-option value="孩子">孩子</a-option>
            <a-option value="其他">其他</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconTrophy,
  IconHistory,
  IconUserGroup,
  IconPlus,
  IconStar
} from '@arco-design/web-vue/es/icon'
import api from '../api.js'

const period = ref('all')
const loadingLeaderboard = ref(false)
const loadingActivity = ref(false)
const loadingMembers = ref(false)
const leaderboard = ref([])
const activities = ref([])
const members = ref([])
const showAddMember = ref(false)

const memberForm = ref({
  name: '',
  role: '家庭成员'
})

const achievementTypes = ref([
  { type: 'first_record', name: '初次记录', icon: '🌱', unlocked: true },
  { type: 'ten_records', name: '记录达人', icon: '📝', unlocked: false },
  { type: 'voice_master', name: '语音专家', icon: '🎤', unlocked: false },
  { type: 'share_king', name: '分享之王', icon: '🤝', unlocked: false },
  { type: 'month_active', name: '月度活跃', icon: '⭐', unlocked: false },
  { type: 'year_contributor', name: '年度贡献', icon: '🏆', unlocked: false }
])

const getActionText = (actionType) => {
  const actionMap = {
    'record_wisdom': '记录了农事经验',
    'add_audio': '添加了语音记录',
    'add_image': '上传了图片',
    'receive_favorite': '获得了收藏',
    'receive_share': '获得了分享',
    'daily_login': '每日签到',
    'first_contribution': '首次贡献'
  }
  return actionMap[actionType] || actionType
}

const fetchLeaderboard = async () => {
  loadingLeaderboard.value = true
  try {
    leaderboard.value = await api.family.getLeaderboard({ period: period.value })
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
  } finally {
    loadingLeaderboard.value = false
  }
}

const fetchActivity = async () => {
  loadingActivity.value = true
  try {
    activities.value = await api.family.getActivity({ limit: 20 })
  } catch (error) {
    console.error('Failed to fetch activity:', error)
  } finally {
    loadingActivity.value = false
  }
}

const fetchMembers = async () => {
  loadingMembers.value = true
  try {
    members.value = await api.family.getMembers()
  } catch (error) {
    console.error('Failed to fetch members:', error)
  } finally {
    loadingMembers.value = false
  }
}

const handleAddMember = async () => {
  if (!memberForm.value.name) {
    Message.warning('请输入成员姓名')
    return
  }

  try {
    await api.family.addMember(memberForm.value)
    Message.success('成员添加成功！')
    showAddMember.value = false
    resetMemberForm()
    fetchMembers()
    fetchLeaderboard()
  } catch (error) {
    Message.error('添加失败，请重试')
  }
}

const resetMemberForm = () => {
  memberForm.value = {
    name: '',
    role: '家庭成员'
  }
}

const formatTime = (time) => {
  const now = new Date()
  const date = new Date(time)
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchLeaderboard()
  fetchActivity()
  fetchMembers()
})
</script>

<style scoped>
.family-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  color: #86909c;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  background: #f7f8fa;
  transition: all 0.3s ease;
}

.leaderboard-item:hover {
  background: #f2f3f5;
  transform: translateX(4px);
}

.leaderboard-item.rank-1 {
  background: linear-gradient(135deg, #fff9e6 0%, #fff4d9 100%);
  border: 2px solid #f7ba1e;
}

.leaderboard-item.rank-2 {
  background: linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%);
  border: 2px solid #c0c0c0;
}

.leaderboard-item.rank-3 {
  background: linear-gradient(135deg, #fff0e6 0%, #ffe8d9 100%);
  border: 2px solid #cd7f32;
}

.rank-badge {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
}

.trophy-icon {
  font-size: 32px;
}

.trophy-icon.gold {
  color: #f7ba1e;
}

.trophy-icon.silver {
  color: #c0c0c0;
}

.trophy-icon.bronze {
  color: #cd7f32;
}

.rank-number {
  color: #86909c;
}

.member-avatar {
  flex-shrink: 0;
}

.member-info {
  flex: 1;
}

.member-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 4px 0;
}

.member-role {
  font-size: 14px;
  color: #86909c;
  margin: 0;
}

.member-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #165dff;
}

.stat-label {
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
}

.activity-item {
  padding: 12px 0;
}

.activity-header {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.activity-member {
  font-weight: 600;
  color: #1d2129;
}

.activity-action {
  color: #4e5969;
}

.activity-description {
  color: #86909c;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.activity-footer {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.activity-points {
  color: #00b42a;
  font-weight: 600;
}

.activity-time {
  color: #86909c;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: #f7f8fa;
  transition: background 0.3s ease;
}

.member-card:hover {
  background: #f2f3f5;
}

.member-details {
  flex: 1;
}

.member-details h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 4px 0;
}

.member-details p {
  font-size: 13px;
  color: #86909c;
  margin: 0 0 8px 0;
}

.member-points {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #165dff;
  font-weight: 600;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.achievement-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  background: #f7f8fa;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.achievement-badge.unlocked {
  opacity: 1;
  background: linear-gradient(135deg, #fff9e6 0%, #fff4d9 100%);
  border: 2px solid #f7ba1e;
}

.badge-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.badge-name {
  font-size: 12px;
  color: #4e5969;
  text-align: center;
}
</style>
