<template>
  <a-modal
    v-model:visible="visible"
    title="提示词管理"
    width="900px"
    :footer="false"
    @cancel="$emit('close')"
  >
    <a-tabs v-model:active-key="activeTab">
      <a-tab-pane key="presets" title="预设模板">
        <a-input-search
          v-model="searchText"
          placeholder="搜索提示词..."
          style="margin-bottom: 16px"
        />
        <a-row :gutter="16">
          <a-col
            v-for="preset in filteredPresets"
            :key="preset.id"
            :xs="24"
            :sm="12"
            :lg="8"
          >
            <a-card
              class="prompt-card"
              hoverable
              @click="selectPrompt(preset)"
            >
              <template #title>
                <div class="card-title">
                  <span>{{ preset.name }}</span>
                  <a-tag size="small" color="blue">{{ preset.category }}</a-tag>
                </div>
              </template>
              <div class="prompt-preview">{{ preset.template.substring(0, 100) }}...</div>
              <template #actions>
                <a-button type="text" size="small" @click.stop="usePrompt(preset)">
                  使用
                </a-button>
              </template>
            </a-card>
          </a-col>
        </a-row>
      </a-tab-pane>

      <a-tab-pane key="custom" title="自定义">
        <a-button type="primary" @click="showCreateModal = true" style="margin-bottom: 16px">
          <icon-plus /> 新建提示词
        </a-button>
        <a-list :data="customPrompts" :loading="loading">
          <template #item="{ item }">
            <a-list-item>
              <a-list-item-meta :title="item.name" :description="item.category">
                <template #avatar>
                  <a-avatar>
                    <icon-file />
                  </a-avatar>
                </template>
              </a-list-item-meta>
              <template #actions>
                <a-button type="text" size="small" @click="useCustomPrompt(item)">
                  使用
                </a-button>
                <a-button type="text" size="small" @click="editCustomPrompt(item)">
                  编辑
                </a-button>
                <a-popconfirm
                  content="确定删除此提示词吗？"
                  @ok="deleteCustomPrompt(item.id)"
                >
                  <a-button type="text" size="small" status="danger">
                    删除
                  </a-button>
                </a-popconfirm>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </a-tab-pane>
    </a-tabs>

    <!-- Create/Edit Modal -->
    <a-modal
      v-model:visible="showCreateModal"
      :title="editingPrompt ? '编辑提示词' : '新建提示词'"
      @ok="saveCustomPrompt"
      @cancel="cancelEdit"
    >
      <a-form :model="formData" layout="vertical">
        <a-form-item label="名称" required>
          <a-input v-model="formData.name" placeholder="输入提示词名称" />
        </a-form-item>
        <a-form-item label="分类">
          <a-input v-model="formData.category" placeholder="输入分类" />
        </a-form-item>
        <a-form-item label="模板内容" required>
          <a-textarea
            v-model="formData.template"
            placeholder="输入提示词模板，使用 {{变量名}} 表示变量"
            :rows="6"
          />
        </a-form-item>
        <a-form-item label="变量">
          <a-space direction="vertical" fill>
            <a-input
              v-for="(variable, index) in formData.variables"
              :key="index"
              v-model="formData.variables[index]"
              placeholder="变量名"
            >
              <template #suffix>
                <icon-close @click="removeVariable(index)" style="cursor: pointer" />
              </template>
            </a-input>
            <a-button type="dashed" @click="addVariable">
              <icon-plus /> 添加变量
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-modal>
  </a-modal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus, IconFile, IconClose } from '@arco-design/web-vue/es/icon'
import api from '../api'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'select'])

const activeTab = ref('presets')
const searchText = ref('')
const presets = ref([])
const customPrompts = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const editingPrompt = ref(null)

const formData = ref({
  name: '',
  category: '',
  template: '',
  variables: []
})

const filteredPresets = computed(() => {
  if (!searchText.value) return presets.value
  const search = searchText.value.toLowerCase()
  return presets.value.filter(p =>
    p.name.toLowerCase().includes(search) ||
    p.template.toLowerCase().includes(search)
  )
})

const loadPresets = async () => {
  try {
    const res = await api.prompts.getPresets()
    presets.value = res || []
  } catch (e) {
    Message.error('加载预设失败')
  }
}

const loadCustomPrompts = async () => {
  loading.value = true
  try {
    const res = await api.prompts.getCustom()
    customPrompts.value = res || []
  } catch (e) {
    Message.error('加载自定义提示词失败')
  } finally {
    loading.value = false
  }
}

const selectPrompt = (prompt) => {
  emit('select', prompt)
}

const usePrompt = (prompt) => {
  emit('select', prompt)
  emit('close')
}

const useCustomPrompt = (prompt) => {
  emit('select', {
    ...prompt,
    variables: JSON.parse(prompt.variables || '[]')
  })
  emit('close')
}

const editCustomPrompt = (prompt) => {
  editingPrompt.value = prompt
  formData.value = {
    name: prompt.name,
    category: prompt.category,
    template: prompt.template,
    variables: JSON.parse(prompt.variables || '[]')
  }
  showCreateModal.value = true
}

const deleteCustomPrompt = async (id) => {
  try {
    await api.prompts.deleteCustom(id)
    Message.success('删除成功')
    loadCustomPrompts()
  } catch (e) {
    Message.error('删除失败')
  }
}

const saveCustomPrompt = async () => {
  if (!formData.value.name || !formData.value.template) {
    Message.warning('请填写名称和模板')
    return
  }

  try {
    if (editingPrompt.value) {
      await api.prompts.updateCustom(editingPrompt.value.id, formData.value)
      Message.success('更新成功')
    } else {
      await api.prompts.createCustom(formData.value)
      Message.success('创建成功')
    }
    showCreateModal.value = false
    cancelEdit()
    loadCustomPrompts()
  } catch (e) {
    Message.error('保存失败')
  }
}

const cancelEdit = () => {
  editingPrompt.value = null
  formData.value = { name: '', category: '', template: '', variables: [] }
}

const addVariable = () => {
  formData.value.variables.push('')
}

const removeVariable = (index) => {
  formData.value.variables.splice(index, 1)
}

onMounted(() => {
  loadPresets()
  loadCustomPrompts()
})
</script>

<style scoped>
.prompt-card {
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.prompt-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prompt-preview {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
</style>
