<template>
  <div class="profile-container">
    <a-page-header title="个人中心" subtitle="管理您的账户和设置" />

    <a-row :gutter="16">
      <a-col :span="8">
        <a-card title="个人信息" :bordered="false">
          <div class="profile-avatar">
            <a-avatar :size="80">
              <icon-user />
            </a-avatar>
            <a-button type="text" size="small" style="margin-top: 8px">更换头像</a-button>
          </div>

          <a-form :model="profile" layout="vertical" style="margin-top: 24px">
            <a-form-item label="用户名" field="username">
              <a-input v-model="profile.username" :disabled="!editMode" />
            </a-form-item>
            <a-form-item label="邮箱" field="email">
              <a-input v-model="profile.email" :disabled="!editMode" />
            </a-form-item>
            <a-form-item label="注册时间">
              <a-input :model-value="formatDate(profile.created_at)" disabled />
            </a-form-item>
            <a-form-item>
              <a-space>
                <a-button v-if="!editMode" type="primary" @click="editMode = true">
                  编辑资料
                </a-button>
                <template v-else>
                  <a-button type="primary" @click="saveProfile">保存</a-button>
                  <a-button @click="cancelEdit">取消</a-button>
                </template>
              </a-space>
            </a-form-item>
          </a-form>
        </a-card>

        <a-card title="数据统计" :bordered="false" style="margin-top: 16px">
          <a-descriptions :column="1" bordered>
            <a-descriptions-item label="作物分析">
              <a-tag color="green">{{ profile.stats?.totalCrops || 0 }} 次</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="能源预测">
              <a-tag color="orange">{{ profile.stats?.totalEnergy || 0 }} 次</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="碳计算">
              <a-tag color="blue">{{ profile.stats?.totalCarbon || 0 }} 次</a-tag>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>

      <a-col :span="16">
        <a-card title="系统设置" :bordered="false">
          <a-tabs default-active-key="general">
            <a-tab-pane key="general" title="常规设置">
              <a-form :model="settings" layout="vertical">
                <a-form-item label="主题" field="theme">
                  <a-radio-group v-model="settings.theme" @change="saveSettings">
                    <a-radio value="light">浅色</a-radio>
                    <a-radio value="dark">深色</a-radio>
                    <a-radio value="auto">跟随系统</a-radio>
                  </a-radio-group>
                </a-form-item>

                <a-form-item label="语言" field="language">
                  <a-select v-model="settings.language" @change="saveSettings">
                    <a-option value="zh">简体中文</a-option>
                    <a-option value="en">English</a-option>
                  </a-select>
                </a-form-item>
              </a-form>
            </a-tab-pane>

            <a-tab-pane key="notifications" title="通知设置">
              <a-form :model="settings" layout="vertical">
                <a-form-item label="启用通知">
                  <a-switch v-model="settings.notifications_enabled" @change="saveSettings" />
                </a-form-item>

                <a-form-item label="邮件通知">
                  <a-switch v-model="settings.email_notifications" @change="saveSettings" />
                </a-form-item>
              </a-form>
            </a-tab-pane>

            <a-tab-pane key="privacy" title="隐私设置">
              <a-form :model="settings" layout="vertical">
                <a-form-item label="隐私级别" field="privacy_level">
                  <a-radio-group v-model="settings.privacy_level" @change="saveSettings">
                    <a-radio value="public">公开</a-radio>
                    <a-radio value="friends">仅好友</a-radio>
                    <a-radio value="private">私密</a-radio>
                  </a-radio-group>
                </a-form-item>
              </a-form>
            </a-tab-pane>

            <a-tab-pane key="data" title="数据管理">
              <a-space direction="vertical" fill>
                <a-button type="primary" long @click="exportData('json')">
                  <icon-download /> 导出数据 (JSON)
                </a-button>
                <a-button type="primary" long @click="exportData('csv')">
                  <icon-download /> 导出数据 (CSV)
                </a-button>
                <a-button type="primary" long @click="generateReport">
                  <icon-file /> 生成报告
                </a-button>
              </a-space>
            </a-tab-pane>
          </a-tabs>
        </a-card>

        <a-card title="活动历史" :bordered="false" style="margin-top: 16px">
          <a-table :data="history" :pagination="pagination" @page-change="onPageChange">
            <template #columns>
              <a-table-column title="活动类型" data-index="activity_type" />
              <a-table-column title="时间" data-index="created_at">
                <template #cell="{ record }">
                  {{ formatDateTime(record.created_at) }}
                </template>
              </a-table-column>
              <a-table-column title="详情" data-index="activity_data">
                <template #cell="{ record }">
                  <a-tag>{{ getActivityLabel(record.activity_type) }}</a-tag>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import api from '../api';
import { IconUser, IconDownload, IconFile } from '@arco-design/web-vue/es/icon';

const profile = ref({
  id: 1,
  username: '',
  email: '',
  created_at: '',
  stats: { totalCrops: 0, totalEnergy: 0, totalCarbon: 0 }
});

const originalProfile = ref({});
const editMode = ref(false);

const settings = ref({
  theme: 'light',
  language: 'zh',
  notifications_enabled: true,
  email_notifications: true,
  privacy_level: 'public'
});

const history = ref([]);
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
});

const loadProfile = async () => {
  try {
    const response = await api.get('/api/user/profile', { params: { userId: 1 } });
    profile.value = response.data;
    originalProfile.value = { ...response.data };
  } catch (error) {
    Message.error('加载个人信息失败');
  }
};

const loadSettings = async () => {
  try {
    const response = await api.get('/api/user/settings', { params: { userId: 1 } });
    settings.value = response.data;
  } catch (error) {
    Message.error('加载设置失败');
  }
};

const loadHistory = async (page = 1) => {
  try {
    const response = await api.get('/api/user/history', {
      params: {
        userId: 1,
        limit: pagination.value.pageSize,
        offset: (page - 1) * pagination.value.pageSize
      }
    });
    history.value = response.data.history;
    pagination.value.total = response.data.total;
    pagination.value.current = page;
  } catch (error) {
    Message.error('加载历史记录失败');
  }
};

const saveProfile = async () => {
  try {
    await api.put('/api/user/profile', {
      userId: profile.value.id,
      username: profile.value.username,
      email: profile.value.email
    });
    Message.success('保存成功');
    editMode.value = false;
    originalProfile.value = { ...profile.value };
  } catch (error) {
    Message.error('保存失败');
  }
};

const cancelEdit = () => {
  profile.value = { ...originalProfile.value };
  editMode.value = false;
};

const saveSettings = async () => {
  try {
    await api.put('/api/user/settings', {
      userId: 1,
      ...settings.value
    });
    Message.success('设置已保存');
  } catch (error) {
    Message.error('保存设置失败');
  }
};

const exportData = async (format) => {
  try {
    const response = await api.post('/api/statistics/export', {
      type: 'all',
      format,
      userId: 1
    });
    Message.success(`数据导出成功 (${format.toUpperCase()})`);
    console.log('Exported data:', response.data);
  } catch (error) {
    Message.error('导出失败');
  }
};

const generateReport = async () => {
  try {
    const response = await api.get('/api/statistics/report', {
      params: { type: 'weekly', userId: 1 }
    });
    Message.success('报告生成成功');
    console.log('Report:', response.data);
  } catch (error) {
    Message.error('生成报告失败');
  }
};

const onPageChange = (page) => {
  loadHistory(page);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('zh-CN');
};

const getActivityLabel = (type) => {
  const labels = {
    'profile_update': '更新资料',
    'settings_update': '更新设置',
    'crop_analysis': '作物分析',
    'energy_prediction': '能源预测',
    'carbon_calculation': '碳计算'
  };
  return labels[type] || type;
};

onMounted(() => {
  loadProfile();
  loadSettings();
  loadHistory();
});
</script>

<style scoped>
.profile-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.profile-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

:deep(.arco-descriptions-item-label) {
  font-weight: 500;
}
</style>
