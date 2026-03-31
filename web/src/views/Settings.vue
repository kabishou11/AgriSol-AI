<template>
  <div class="page-neo settings-neo">
    <!-- 动态背景粒子 -->
    <div class="bg-particles">
      <div class="particle particle-1"></div>
      <div class="particle particle-2"></div>
      <div class="particle particle-3"></div>
    </div>

    <!-- 页面顶部横幅 -->
    <div class="page-banner">
      <div class="banner-glow"></div>
      <div class="banner-content">
        <div class="banner-icon">&#9881;</div>
        <div class="banner-text">
          <h1 class="banner-title">AI 设置中心</h1>
          <p class="banner-subtitle">配置模型参数与对话行为</p>
        </div>
      </div>
      <div class="banner-decoration">
        <div class="deco-line"></div>
        <div class="deco-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <!-- 设置标签页 -->
    <a-tabs v-model:active-key="activeTab" class="settings-tabs">
      <!-- AI 模型配置 -->
      <a-tab-pane key="ai" title="AI 模型配置">
        <div class="card-neo">
          <div class="card-header">
            <h2 class="title-neo" style="color: #1890ff;">
              <span class="title-icon">&#129302;</span> 模型与连接
            </h2>
            <div class="header-line"></div>
          </div>

          <div class="ai-status">
            <div class="status-badge" :class="{ active: aiConfig.apiKeyConfigured }">
              <span class="status-dot"></span>
              {{ aiConfig.apiKeyConfigured ? 'API Key 已配置' : 'API Key 未配置' }}
            </div>
            <a-button v-if="!aiConfig.apiKeyConfigured" type="primary" size="small" @click="showApiKeyModal = true">
              配置 API Key
            </a-button>
          </div>

          <div class="settings-list">
            <!-- 模型选择 -->
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-icon">&#128296;</div>
                <div class="setting-text">
                  <span class="setting-label">默认模型</span>
                  <span class="setting-desc">选择默认 AI 模型（可被下方应用专属设置覆盖）</span>
                </div>
              </div>
              <a-select v-model="settings.ai_config.model" style="width: 260px" @change="saveSettings">
                <a-option v-for="opt in modelOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                  <span style="font-size: 0.7rem; color: #888; margin-left: 4px;">— {{ opt.desc }}</span>
                </a-option>
              </a-select>
            </div>

            <!-- 应用专属模型配置 -->
            <div class="app-models-section">
              <div class="app-models-header">
                <span class="app-models-icon">&#128187;</span>
                <div class="app-models-info">
                  <span class="setting-label">应用专属模型</span>
                  <span class="setting-desc">不同功能使用最适合的模型，优先使用多模态模型进行图像分析</span>
                </div>
              </div>
              <div class="app-models-list">
                <div v-for="app in appModelOptions" :key="app.app" class="app-model-card">
                  <div class="app-model-header">
                    <span class="app-model-icon">{{ app.appIcon }}</span>
                    <div class="app-model-meta">
                      <span class="app-model-name">{{ app.appLabel }}</span>
                      <span class="app-model-desc">{{ app.appDesc }}</span>
                    </div>
                  </div>
                  <div class="app-model-select">
                    <a-select
                      :model-value="appModelSelections[app.app]"
                      :placeholder="'跟随默认模型'"
                      style="width: 100%"
                      @change="(val) => onAppModelChange(app.app, val)"
                    >
                      <a-option value="" style="color: #888;">
                        <span style="font-size: 0.8rem;">跟随默认模型</span>
                      </a-option>
                      <a-option v-for="m in app.models" :key="m.value" :value="m.value">
                        <span style="font-size: 0.8rem;">{{ m.label }}</span>
                        <span style="font-size: 0.7rem; color: #888; display: block;">{{ m.desc }}</span>
                      </a-option>
                    </a-select>
                  </div>
                </div>
              </div>
            </div>

            <!-- API 端点配置 -->
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-icon">&#127760;</div>
                <div class="setting-text">
                  <span class="setting-label">API 端点</span>
                  <span class="setting-desc">自定义 API 请求地址（可选）</span>
                </div>
              </div>
              <a-input
                v-model="settings.ai_config.api_endpoint"
                placeholder="https://api-inference.modelscope.cn/v1"
                style="width: 260px"
                allow-clear
                @blur="saveSettings"
              />
            </div>

            <!-- 流式输出开关 -->
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-icon">&#128172;</div>
                <div class="setting-text">
                  <span class="setting-label">流式输出</span>
                  <span class="setting-desc">实时逐字显示 AI 回复</span>
                </div>
              </div>
              <a-switch v-model="settings.ai_config.stream" @change="saveSettings" />
            </div>

            <!-- 重试次数 -->
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-icon">&#128257;</div>
                <div class="setting-text">
                  <span class="setting-label">重试次数</span>
                  <span class="setting-desc">请求失败时的最大重试次数</span>
                </div>
              </div>
              <a-input-number
                v-model="settings.ai_config.retries"
                :min="0"
                :max="10"
                :step="1"
                style="width: 100px"
                @change="saveSettings"
              />
            </div>
          </div>
        </div>

        <div class="card-neo" style="margin-top: 1.5rem;">
          <div class="card-header">
            <h2 class="title-neo" style="color: #52c41a;">
              <span class="title-icon">&#9881;</span> 生成参数
            </h2>
            <div class="header-line"></div>
          </div>

          <div class="settings-list">
            <!-- 温度参数 -->
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-icon">&#128293;</div>
                <div class="setting-text">
                  <span class="setting-label">温度参数</span>
                  <span class="setting-desc">控制回复的随机性与创造性 (0=确定, 1=随机)</span>
                </div>
              </div>
              <div class="slider-control">
                <a-slider
                  v-model="settings.ai_config.temperature"
                  :min="0"
                  :max="1"
                  :step="0.05"
                  :style="{ width: '140px' }"
                  @change="saveSettings"
                />
                <span class="slider-value">{{ settings.ai_config.temperature.toFixed(2) }}</span>
              </div>
            </div>

            <!-- 思考深度 top_p -->
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-icon">&#128172;</div>
                <div class="setting-text">
                  <span class="setting-label">思考深度 (Top P)</span>
                  <span class="setting-desc">核采样阈值，控制候选词范围 (0-1)</span>
                </div>
              </div>
              <div class="slider-control">
                <a-slider
                  v-model="settings.ai_config.top_p"
                  :min="0"
                  :max="1"
                  :step="0.05"
                  :style="{ width: '140px' }"
                  @change="saveSettings"
                />
                <span class="slider-value">{{ settings.ai_config.top_p.toFixed(2) }}</span>
              </div>
            </div>

            <!-- 最大回复长度 -->
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-icon">&#128195;</div>
                <div class="setting-text">
                  <span class="setting-label">最大回复长度</span>
                  <span class="setting-desc">AI 回复的最大 token 数</span>
                </div>
              </div>
              <a-input-number
                v-model="settings.ai_config.max_tokens"
                :min="100"
                :max="8000"
                :step="100"
                style="width: 120px"
              />
            </div>

            <!-- 上下文窗口大小 -->
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-icon">&#128196;</div>
                <div class="setting-text">
                  <span class="setting-label">上下文窗口</span>
                  <span class="setting-desc">会话保留的最大历史消息条数</span>
                </div>
              </div>
              <a-input-number
                v-model="settings.ai_config.context_window"
                :min="1"
                :max="100"
                :step="1"
                style="width: 100px"
              />
            </div>
          </div>
        </div>

        <div class="card-neo" style="margin-top: 1.5rem;">
          <div class="card-header">
            <h2 class="title-neo" style="color: #722ed1;">
              <span class="title-icon">&#128221;</span> 提示词管理
            </h2>
            <div class="header-line"></div>
          </div>

          <div class="settings-list">
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-icon">&#128221;</div>
                <div class="setting-text">
                  <span class="setting-label">系统提示词</span>
                  <span class="setting-desc">设置 AI 的角色定位、行为规范与专业领域</span>
                </div>
              </div>
              <a-button type="outline" size="small" @click="$router.push('/prompts')">
                管理提示词
              </a-button>
            </div>
          </div>
        </div>

        <div class="action-bar">
          <a-button type="primary" :loading="saving" @click="saveSettings">
            保存 AI 配置
          </a-button>
          <a-button @click="resetAiConfig">
            重置为默认
          </a-button>
        </div>
      </a-tab-pane>

      <!-- 数据管理 -->
      <a-tab-pane key="data" title="数据管理">
        <div class="card-neo">
          <div class="card-header">
            <h2 class="title-neo" style="color: #ff4d4f;">
              <span class="title-icon">&#128465;</span> 数据管理
            </h2>
            <div class="header-line"></div>
          </div>

          <!-- 数据来源说明 -->
          <div class="data-source-info">
            <h3 style="color: rgba(255,255,255,0.85); margin-bottom: 1rem;">各页面数据来源说明</h3>
            <div class="source-table">
              <div class="source-row header">
                <span>页面</span>
                <span>数据类型</span>
                <span>来源</span>
                <span>可否实时</span>
                <span>原因</span>
              </div>
              <div class="source-row">
                <span>环境监测</span>
                <span><span class="tag realtime">实时数据</span></span>
                <span>Open-Meteo API（气象 + 空气质量）</span>
                <span><span class="status-ok">&#10003;</span></span>
                <span>免费公开接口，无需认证</span>
              </div>
              <div class="source-row">
                <span>能源监测</span>
                <span><span class="tag model">模型估算</span> <span class="tag realtime">用户录入</span></span>
                <span>太阳辐射计算 + 历史记录 + 寿光样板参考</span>
                <span><span class="status-partial">&#8208;</span></span>
                <span>发电量由辐射推算（非真实电表）；用电量需用户录入</span>
              </div>
              <div class="source-row">
                <span>碳汇监测</span>
                <span><span class="tag historical">历史记录</span></span>
                <span>基于作物分析记录和能源记录自动计算</span>
                <span><span class="status-no">&#10005;</span></span>
                <span>碳汇由历史碳汇公式推导，本身就是历史数据</span>
              </div>
              <div class="source-row">
                <span>作物分析</span>
                <span><span class="tag user-input">用户录入</span></span>
                <span>AI 分析结果，存储于数据库</span>
                <span><span class="status-no">&#10005;</span></span>
                <span>需用户上传照片 + AI 模型推理，无法自动实时</span>
              </div>
              <div class="source-row">
                <span>Dashboard</span>
                <span><span class="tag realtime">实时</span> + <span class="tag historical">历史</span></span>
                <span>综合各模块实时数据与缓存洞察</span>
                <span><span class="status-partial">&#8208;</span></span>
                <span>依赖各子模块数据源，部分为历史/估算数据</span>
              </div>
            </div>
          </div>

          <!-- 重置数据 -->
          <div class="reset-section">
            <h3 style="color: rgba(255,255,255,0.85); margin-bottom: 0.75rem;">重置所有数据</h3>
            <p style="color: rgba(255,255,255,0.5); font-size: 0.875rem; margin-bottom: 1rem;">
              点击下方按钮清除所有用户数据（作物记录、能源记录、碳汇记录、环境记录、农事记录）。<br>
              此操作不可撤销，请谨慎操作。
            </p>
            <a-button
              danger
              size="large"
              :loading="resetting"
              @click="handleResetData"
            >
              🗑️ 重置所有用户数据
            </a-button>
          </div>
        </div>
      </a-tab-pane>

      <!-- 系统配置 -->
      <a-tab-pane key="system" title="系统配置">
        <div class="card-neo">
          <div class="card-header">
            <h2 class="title-neo" style="color: #722ed1;">
              <span class="title-icon">&#9881;</span> 系统配置
            </h2>
            <div class="header-line"></div>
          </div>

          <div class="config-note">
            <span>&#9432;</span>
            以下配置读取自服务器 <code>.env</code> 文件，修改后需重启服务器方可生效。
            <a-button type="text" size="small" @click="loadSystemConfig">
              <span>&#8635;</span> 刷新
            </a-button>
          </div>

          <div v-if="sysConfig" class="config-sections">
            <!-- 应用信息 -->
            <div class="config-section">
              <div class="config-section-title">&#127968; 应用信息</div>
              <div class="config-grid">
                <div class="config-item">
                  <span class="config-label">应用名称</span>
                  <span class="config-value">{{ sysConfig.app?.name }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">版本号</span>
                  <span class="config-value mono">{{ sysConfig.app?.version }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">运行环境</span>
                  <span class="config-value">
                    <span class="env-tag" :class="sysConfig.app?.env === 'development' ? 'dev' : 'prod'">
                      {{ sysConfig.app?.env }}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <!-- 地理位置 -->
            <div class="config-section">
              <div class="config-section-title">&#128205; 地理位置</div>
              <div class="config-grid">
                <div class="config-item">
                  <span class="config-label">默认经纬度</span>
                  <span class="config-value mono">{{ sysConfig.location?.default }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">城市</span>
                  <span class="config-value">{{ sysConfig.location?.label }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">城市ID</span>
                  <span class="config-value mono">{{ sysConfig.location?.cityId }}</span>
                </div>
              </div>
            </div>

            <!-- 补贴配置 -->
            <div class="config-section">
              <div class="config-section-title">&#128176; 补贴政策</div>
              <div class="config-grid">
                <div class="config-item">
                  <span class="config-label">补贴省份</span>
                  <span class="config-value">{{ sysConfig.subsidy?.province }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">光伏补贴比例</span>
                  <span class="config-value mono">{{ (sysConfig.subsidy?.pvRate * 100).toFixed(0) }}%</span>
                </div>
                <div class="config-item">
                  <span class="config-label">有机认证奖金</span>
                  <span class="config-value mono">¥{{ sysConfig.subsidy?.organicCertBonus?.toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <!-- 碳普惠配置 -->
            <div class="config-section">
              <div class="config-section-title">&#127793; 碳普惠</div>
              <div class="config-grid">
                <div class="config-item">
                  <span class="config-label">碳普惠平台</span>
                  <span class="config-value">{{ sysConfig.carbon?.platform }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">碳价格</span>
                  <span class="config-value mono">¥{{ sysConfig.carbon?.pricePerTon }}/吨</span>
                </div>
              </div>
            </div>

            <!-- 碳汇计算依据（新增） -->
            <div class="config-section carbon-basis">
              <div class="config-section-title">&#127807; 碳汇计算依据</div>
              <p class="carbon-basis-intro">
                本系统碳汇预测基于 IPCC 2006 指南第四卷第5章（农业）Tier 1 方法，结合中国农业实际数据，
                综合考虑作物类型、种植面积、季节因子与历史趋势进行估算。
              </p>
              <div class="ipcc-coeff-table">
                <div class="ipcc-row ipcc-header">
                  <span>作物类型</span>
                  <span>CO₂固碳系数</span>
                  <span>备注</span>
                </div>
                <div class="ipcc-row" v-for="crop in ipccCoefficients" :key="crop.name">
                  <span>{{ crop.name }}</span>
                  <span class="mono">{{ crop.coeff }} t CO₂/ha/季</span>
                  <span>{{ crop.note }}</span>
                </div>
              </div>
              <div class="carbon-basis-notes">
                <div class="note-item">
                  <span class="note-label">方法学</span>
                  <span class="note-val">IPCC 2006 Vol.4 Ch.5 Tier 1</span>
                </div>
                <div class="note-item">
                  <span class="note-label">不确定性</span>
                  <span class="note-val">历史≥6个月: ±20% | 3–5个月: ±25% | &lt;3个月: ±40%</span>
                </div>
                <div class="note-item">
                  <span class="note-label">等效植树换算</span>
                  <span class="note-val">按成年乔木年固碳量 ≈ 21.77 kg CO₂/棵/年 估算</span>
                </div>
                <div class="note-item">
                  <span class="note-label">碳价格</span>
                  <span class="note-val">当前使用 ¥50/吨（可在碳普惠配置中调整）</span>
                </div>
              </div>
            </div>

            <!-- AI 配置 -->
            <div class="config-section">
              <div class="config-section-title">&#129302; AI 模型</div>
              <div class="config-grid">
                <div class="config-item">
                  <span class="config-label">轻量模型</span>
                  <span class="config-value mono small">{{ sysConfig.ai?.model }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">复杂模型</span>
                  <span class="config-value mono small">{{ sysConfig.ai?.complexModel }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">API Key</span>
                  <span class="config-value">
                    <span class="env-tag" :class="sysConfig.ai?.apiKeyConfigured ? 'ok' : 'no'">
                      {{ sysConfig.ai?.apiKeyConfigured ? '已配置' : '未配置' }}
                    </span>
                  </span>
                </div>
                <div class="config-item">
                  <span class="config-label">作物图像分析</span>
                  <span class="config-value"><span class="env-tag ok">多模态大模型</span></span>
                </div>
                <div class="config-item" style="grid-column: span 2">
                  <span class="config-label">说明</span>
                  <span class="config-value" style="font-size:0.8rem;color:rgba(255,255,255,0.5)">{{ sysConfig.ai?.note }}</span>
                </div>
              </div>
            </div>

            <!-- 功能开关 -->
            <div class="config-section">
              <div class="config-section-title">&#128737; 功能开关</div>
              <div class="config-grid">
                <div class="config-item" v-for="(val, key) in featureLabels" :key="key">
                  <span class="config-label">{{ featureLabels[key] }}</span>
                  <span class="config-value">
                    <span class="env-tag" :class="sysConfig.features?.[key] ? 'ok' : 'no'">
                      {{ sysConfig.features?.[key] ? '启用' : '禁用' }}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <!-- 适老化配置 -->
            <div class="config-section">
              <div class="config-section-title">&#128104; 适老化</div>
              <div class="config-grid">
                <div class="config-item">
                  <span class="config-label">最小字号</span>
                  <span class="config-value mono">{{ sysConfig.accessibility?.fontSizeMin }}px</span>
                </div>
                <div class="config-item">
                  <span class="config-label">对比度</span>
                  <span class="config-value mono">{{ sysConfig.accessibility?.contrastRatio }}:1</span>
                </div>
                <div class="config-item">
                  <span class="config-label">语音速度</span>
                  <span class="config-value mono">{{ sysConfig.accessibility?.voiceSpeed }}x</span>
                </div>
              </div>
            </div>

            <!-- 数据库 -->
            <div class="config-section">
              <div class="config-section-title">&#128451; 数据库</div>
              <div class="config-grid">
                <div class="config-item">
                  <span class="config-label">路径</span>
                  <span class="config-value mono small">{{ sysConfig.database?.path }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">自动备份</span>
                  <span class="config-value">
                    <span class="env-tag" :class="sysConfig.database?.autoBackup ? 'ok' : 'no'">
                      {{ sysConfig.database?.autoBackup ? '已启用' : '未启用' }}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="sysConfigLoading" class="config-loading">
            <span>&#8987;</span> 正在加载系统配置...
          </div>
          <div v-else class="config-loading error">
            <span>&#9888;</span> 加载失败，请检查服务器连接
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- API Key 配置弹窗 -->
    <a-modal v-model:visible="showApiKeyModal" title="配置 API Key" @ok="saveApiKey" @cancel="showApiKeyModal = false">
      <a-form :model="apiKeyForm" layout="vertical">
        <a-form-item label="ModelScope API Key" required>
          <a-input-password v-model="apiKeyForm.key" placeholder="请输入您的 ModelScope API Key" />
        </a-form-item>
        <div class="api-hint">
          <span>&#9432;</span> 请前往 <a-link>ModelScope</a-link> 获取 API Key
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import api from '../api'

const activeTab = ref('ai')
const showApiKeyModal = ref(false)
const loading = ref(false)
const saving = ref(false)
const resetting = ref(false)
const sysConfig = ref(null)
const sysConfigLoading = ref(false)

// IPCC 碳汇计算系数（与后端 carbon.js 保持同步）
const ipccCoefficients = [
  { name: '水稻',     coeff: '4.50', note: '水稻田甲烷排放较高，固碳含土壤碳汇' },
  { name: '小麦',     coeff: '3.20', note: '华北冬小麦，一年一熟或两熟' },
  { name: '玉米',     coeff: '3.80', note: '春玉米/夏玉米，含秸秆还田贡献' },
  { name: '大豆',     coeff: '2.80', note: '豆科固氮效应，额外+0.6 t CO₂/ha' },
  { name: '蔬菜',     coeff: '2.20', note: '设施蔬菜（温室大棚），复种指数高' },
  { name: '棉花',     coeff: '2.50', note: '西北/华北棉区，秸秆利用方式影响大' },
  { name: '马铃薯',   coeff: '1.80', note: '块茎作物，地下部碳汇比例较高' },
  { name: '甘蔗',     coeff: '5.00', note: '热带/南亚热带，高生物量作物' },
  { name: '其他作物', coeff: '3.00', note: '默认参考值，根据实际品种调整' }
]

const featureLabels = {
  cropLifecycle: '作物生命周期',
  solarTerms: '农时节气',
  pvMonitoring: '光伏监测',
  energyOptimization: '能源优化',
  soilMonitoring: '土壤监测',
  wisdomInheritance: '智慧传承',
  familyCollaboration: '家庭协作'
}

const loadSystemConfig = async () => {
  sysConfigLoading.value = true
  try {
    const res = await api.user.getSystemConfig()
    sysConfig.value = res?.data || res || null
  } catch (err) {
    console.error('System config load failed:', err)
    sysConfig.value = null
  } finally {
    sysConfigLoading.value = false
  }
}

const handleResetData = async () => {
  Modal.confirm({
    title: '确认重置所有数据？',
    content: '此操作将清除所有用户数据（作物记录、能源记录、碳汇记录、环境记录、农事记录），且不可撤销。确定要继续吗？',
    okText: '确认重置',
    cancelText: '取消',
    okButtonProps: { status: 'danger' },
    onOk: async () => {
      resetting.value = true
      try {
        await api.statistics.resetData({ confirm: true })
        Message.success('所有数据已清除')
      } catch (err) {
        Message.error('重置失败: ' + (err.message || '未知错误'))
      } finally {
        resetting.value = false
      }
    }
  })
}

// 模型选项：从 .env 配置动态读取，支持按应用选择模型
const modelOptions = computed(() => {
  const simpleModel = sysConfig.value?.ai?.model || 'Qwen/Qwen3-8B'
  const complexModel = sysConfig.value?.ai?.complexModel || 'Qwen/Qwen3.5-122B-A10B'
  const multimodalModel = 'Qwen/Qwen2.5-VL-7B-Instruct'
  return [
    { value: simpleModel, label: simpleModel.replace('Qwen/', ''), desc: '通用对话·快速响应' },
    { value: complexModel, label: complexModel.replace('Qwen/', ''), desc: '高精度推理·复杂分析' },
    { value: multimodalModel, label: 'Qwen2.5-VL-7B', desc: '多模态·图像识别（作物分析专用）' }
  ]
})

// 按应用场景选择模型
const appModelOptions = computed(() => [
  {
    app: 'crop',
    appIcon: '🌾',
    appLabel: '作物图像分析',
    appDesc: '上传作物照片，AI 识别病虫害与生长状态',
    modelKey: 'crop_model',
    models: [
      { value: 'Qwen/Qwen2.5-VL-7B-Instruct', label: 'Qwen2.5-VL-7B（多模态·推荐）', desc: '图像+文本联合推理，精准病虫害识别' },
      { value: 'Qwen/Qwen2.5-VL-32B-Instruct', label: 'Qwen2.5-VL-32B（高精度）', desc: '超大杯多模态，适合专业农艺分析' },
      { value: 'Qwen/Qwen3-8B', label: 'Qwen3-8B（通用备选）', desc: '无多模态能力，图像分析受限' }
    ]
  },
  {
    app: 'chat',
    appIcon: '💬',
    appLabel: '综合对话咨询',
    appDesc: '农事、能源、碳汇等综合问题解答',
    modelKey: 'chat_model',
    models: [
      { value: 'Qwen/Qwen3-8B', label: 'Qwen3-8B（快速）', desc: '响应快，适合日常咨询' },
      { value: 'Qwen/Qwen3.5-122B-A10B', label: 'Qwen3.5-122B（高精度）', desc: '深度推理，适合复杂问题' }
    ]
  },
  {
    app: 'knowledge',
    appIcon: '📚',
    appLabel: '农智百科与智识网络',
    appDesc: '基于农智百科的精准问答与智识网络关联分析',
    modelKey: 'knowledge_model',
    models: [
      { value: 'Qwen/Qwen3-8B', label: 'Qwen3-8B（推荐）', desc: '知识检索与匹配效果好' },
      { value: 'Qwen/Qwen3.5-122B-A10B', label: 'Qwen3.5-122B（深度）', desc: '适合复杂知识关联推理' }
    ]
  }
])

// 当前各应用选中的模型（从 settings.ai_config 读取，默认为空表示跟随全局）
const appModelSelections = computed(() => {
  const cfg = settings.ai_config.app_models || {}
  return {
    crop: cfg.crop || '',
    chat: cfg.chat || '',
    knowledge: cfg.knowledge || ''
  }
})

// 监听应用模型选择变化时自动保存
const onAppModelChange = (app, model) => {
  if (!settings.ai_config.app_models) {
    settings.ai_config.app_models = {}
  }
  settings.ai_config.app_models[app] = model
  // 防抖：延迟200ms保存，避免频繁请求
  clearTimeout(appModelSaveTimer)
  appModelSaveTimer = setTimeout(() => {
    saveSettings()
  }, 200)
}

let appModelSaveTimer = null

const defaultAiConfig = {
  model: 'Qwen/Qwen3-8B',
  temperature: 0.7,
  top_p: 0.9,
  max_tokens: 1000,
  stream: true,
  retries: 3,
  context_window: 20,
  api_endpoint: ''
}

const settings = reactive({
  ai_config: { ...defaultAiConfig }
})

const aiConfig = reactive({
  apiKeyConfigured: false,
  prompts: []
})

const apiKeyForm = reactive({
  key: ''
})

const loadSettings = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/user/settings?userId=1')
      .then(r => r.json())
    if (res) {
      if (res.ai_config && typeof res.ai_config === 'object') {
        Object.assign(settings.ai_config, { ...defaultAiConfig, ...res.ai_config })
      }
    }
  } catch (err) {
    console.error('Failed to load settings:', err)
  } finally {
    loading.value = false
  }
}

const loadAiConfig = async () => {
  try {
    const res = await fetch('/api/user/ai-config?userId=1')
      .then(r => r.json())
    if (res) {
      aiConfig.apiKeyConfigured = res.apiKeyConfigured || false
      aiConfig.prompts = res.prompts || []
    }
  } catch (err) {
    console.error('Failed to load AI config:', err)
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const payload = {
      userId: 1,
      theme: settings.ai_config.theme,
      language: settings.ai_config.language,
      notifications_enabled: settings.ai_config.notifications_enabled,
      email_notifications: settings.ai_config.email_notifications,
      privacy_level: settings.ai_config.privacy_level,
      ai_config: settings.ai_config
    }
    await api.user.updateSettings(payload)
    Message.success('AI 配置已保存')
  } catch (err) {
    console.error('Save failed:', err)
    Message.error('保存失败: ' + (err.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

const saveApiKey = () => {
  if (!apiKeyForm.key) {
    Message.warning('请输入 API Key')
    return
  }
  // 实际应用中这里会调用后端接口保存
  Message.success('API Key 已配置')
  aiConfig.apiKeyConfigured = true
  showApiKeyModal.value = false
}

const resetAiConfig = () => {
  Object.assign(settings.ai_config, { ...defaultAiConfig })
  Message.info('已重置为默认配置')
}

onMounted(() => {
  loadSettings()
  loadAiConfig()
  loadSystemConfig()
})
</script>

<style scoped>
/* 动态背景粒子 */
.bg-particles { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; overflow: hidden; }
.particle { position: absolute; border-radius: 50%; background: rgba(24, 144, 255, 0.1); animation: float-particle 15s ease-in-out infinite; }
.particle-1 { width: 300px; height: 300px; top: 10%; left: 10%; animation-delay: 0s; }
.particle-2 { width: 200px; height: 200px; top: 60%; right: 10%; animation-delay: -3s; background: rgba(114, 46, 209, 0.08); }
.particle-3 { width: 150px; height: 150px; bottom: 20%; left: 30%; animation-delay: -6s; background: rgba(82, 196, 26, 0.06); }
@keyframes float-particle {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(20px, -30px) rotate(90deg); }
  50% { transform: translate(-10px, 20px) rotate(180deg); }
  75% { transform: translate(30px, 10px) rotate(270deg); }
}

/* 页面顶部横幅 */
.page-banner {
  position: relative; z-index: 1; margin-bottom: 2rem;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.15) 0%, rgba(114, 46, 209, 0.05) 100%);
  border: 1px solid rgba(24, 144, 255, 0.3);
  border-radius: 24px; padding: 2.5rem 3rem;
  backdrop-filter: blur(20px);
  animation: slideDown 0.6s ease-out;
  overflow: hidden;
}
.banner-glow {
  position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
  background: radial-gradient(circle at 30% 50%, rgba(24, 144, 255, 0.25) 0%, transparent 50%);
  animation: glow-rotate 12s linear infinite;
  pointer-events: none;
}
@keyframes glow-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.banner-content { position: relative; z-index: 1; display: flex; align-items: center; gap: 2rem; }
.banner-icon { font-size: 4rem; filter: drop-shadow(0 0 20px rgba(24, 144, 255, 0.5)); }
.banner-text { flex: 1; }
.banner-title {
  font-family: var(--font-display); font-size: 2rem; font-weight: 700;
  color: #1890ff; margin: 0 0 0.5rem;
  text-shadow: 0 0 30px rgba(24, 144, 255, 0.4);
  letter-spacing: 0.05em;
}
.banner-subtitle { font-size: 1rem; color: rgba(255, 255, 255, 0.7); margin: 0; }
.banner-decoration { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; display: flex; align-items: center; gap: 1rem; padding: 0 3rem; }
.deco-line { flex: 1; height: 2px; background: linear-gradient(90deg, #1890ff, transparent); }
.deco-dots { display: flex; gap: 0.5rem; }
.deco-dots span { width: 6px; height: 6px; background: #1890ff; border-radius: 50%; opacity: 0.6; }
@keyframes slideDown {
  0% { opacity: 0; transform: translateY(-30px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* 设置标签页 */
.settings-tabs {
  position: relative; z-index: 1;
  animation: fadeInUp 0.6s ease-out 0.2s both;
}
.settings-tabs :deep(.arco-tabs-nav) {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 8px;
  margin-bottom: 1.5rem;
}
.settings-tabs :deep(.arco-tabs-nav-tab) {
  border-radius: 12px;
  padding: 8px 20px;
  font-weight: 500;
}
.settings-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active) {
  background: rgba(24, 144, 255, 0.2);
}
.settings-tabs :deep(.arco-tabs-nav-ink) {
  display: none;
}
@keyframes fadeInUp {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* 卡片 */
.card-neo {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.75rem;
  backdrop-filter: blur(20px);
}

/* 卡片头部 */
.card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
.title-neo { font-family: var(--font-display); font-size: 1.125rem; color: #1890ff; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
.title-icon { font-size: 1.25rem; }
.header-line { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(24, 144, 255, 0.3), transparent); }

/* 设置列表 */
.settings-list { display: flex; flex-direction: column; gap: 0.75rem; }
.setting-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem;
  background: rgba(24, 144, 255, 0.05);
  border: 1px solid rgba(24, 144, 255, 0.15);
  border-radius: 12px;
  transition: all 0.3s ease;
}
.setting-item:hover {
  background: rgba(24, 144, 255, 0.08);
  border-color: rgba(24, 144, 255, 0.25);
  transform: translateX(5px);
}
.setting-info { display: flex; align-items: center; gap: 1rem; }
.setting-icon { font-size: 1.5rem; opacity: 0.9; }
.setting-text { display: flex; flex-direction: column; gap: 0.25rem; }
.setting-label { font-weight: 600; color: var(--text-primary); font-size: 0.9375rem; }
.setting-desc { font-size: 0.8125rem; color: var(--text-tertiary); }

/* AI 状态 */
.ai-status {
  display: flex; align-items: center; gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(82, 196, 26, 0.1);
  border: 1px solid rgba(82, 196, 26, 0.2);
  border-radius: 12px;
}
.status-badge {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 77, 79, 0.1);
  border-radius: 20px;
  font-size: 0.875rem;
  color: #ff4d4f;
}
.status-badge.active { color: #52c41a; background: rgba(82, 196, 26, 0.1); }
.status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #ff4d4f;
  box-shadow: 0 0 8px #ff4d4f;
}
.status-badge.active .status-dot {
  background: #52c41a;
  box-shadow: 0 0 8px #52c41a;
}

/* 滑块控制 */
.slider-control { display: flex; align-items: center; gap: 0.75rem; }
.slider-value { font-family: var(--font-mono); font-weight: 600; color: #1890ff; min-width: 36px; }

/* 操作栏 */
.action-bar { display: flex; gap: 1rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1); }

/* API Key 提示 */
.api-hint {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(24, 144, 255, 0.1);
  border-radius: 8px;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

/* 碳汇计算依据区块 */
.config-section.carbon-basis {
  border-color: rgba(82, 196, 26, 0.25);
  background: rgba(82, 196, 26, 0.03);
}

.carbon-basis-intro {
  font-size: 0.825rem;
  color: rgba(255,255,255,0.65);
  line-height: 1.7;
  margin: 0 0 1rem;
  padding: 0.75rem;
  background: rgba(82,196,26,0.06);
  border-radius: 8px;
  border: 1px solid rgba(82,196,26,0.15);
}

.ipcc-coeff-table {
  border: 1px solid rgba(82,196,26,0.2);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.ipcc-row {
  display: grid;
  grid-template-columns: 90px 150px 1fr;
  padding: 0.6rem 0.85rem;
  gap: 0.75rem;
  font-size: 0.8rem;
  border-bottom: 1px solid rgba(82,196,26,0.1);
  color: rgba(255,255,255,0.75);
}

.ipcc-row:last-child { border-bottom: none; }

.ipcc-row.ipcc-header {
  background: rgba(82,196,26,0.12);
  color: rgba(255,255,255,0.5);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.carbon-basis-notes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.note-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.78rem;
}

.note-label {
  min-width: 90px;
  color: rgba(255,255,255,0.45);
  font-weight: 600;
}

.note-val {
  color: rgba(255,255,255,0.7);
  line-height: 1.5;
}

/* 应用专属模型配置 */
.app-models-section {
  background: rgba(24, 144, 255, 0.05);
  border: 1px solid rgba(24, 144, 255, 0.2);
  border-radius: 14px;
  padding: 1.25rem;
  margin-top: 0.5rem;
}
.app-models-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.app-models-icon { font-size: 1.5rem; opacity: 0.9; }
.app-models-info { display: flex; flex-direction: column; gap: 0.2rem; }
.app-models-list { display: flex; flex-direction: column; gap: 0.75rem; }
.app-model-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  transition: all 0.3s ease;
}
.app-model-card:hover {
  background: rgba(24, 144, 255, 0.06);
  border-color: rgba(24, 144, 255, 0.2);
}
.app-model-header { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; }
.app-model-icon { font-size: 1.25rem; flex-shrink: 0; }
.app-model-meta { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.app-model-name { font-weight: 600; color: var(--text-primary); font-size: 0.9rem; }
.app-model-desc { font-size: 0.75rem; color: var(--text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px; }
.app-model-select { width: 280px; flex-shrink: 0; }

@media (max-width: 768px) {
  .setting-item { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .page-banner { padding: 1.5rem; }
  .app-model-card { flex-direction: column; align-items: flex-start; }
  .app-model-select { width: 100%; }
}

/* 数据来源说明 */
.data-source-info {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 2rem;
}

.source-table {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.source-row {
  display: grid;
  grid-template-columns: 140px 200px 1fr;
  padding: 0.75rem 1rem;
  gap: 1rem;
  align-items: center;
  font-size: 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.source-row:last-child { border-bottom: none; }
.source-row.header {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.source-row:not(.header) {
  color: rgba(255, 255, 255, 0.75);
}

.tag {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-right: 0.25rem;
}

.tag.realtime {
  background: rgba(82, 196, 26, 0.2);
  color: #52c41a;
  border: 1px solid rgba(82, 196, 26, 0.3);
}

.tag.model {
  background: rgba(255, 200, 0, 0.15);
  color: #ffc800;
  border: 1px solid rgba(255, 200, 0, 0.25);
}

.tag.user-input {
  background: rgba(24, 144, 255, 0.15);
  color: #1890ff;
  border: 1px solid rgba(24, 144, 255, 0.25);
}

.tag.historical {
  background: rgba(114, 46, 209, 0.15);
  color: #722ed1;
  border: 1px solid rgba(114, 46, 209, 0.25);
}

.reset-section {
  padding: 1.5rem;
  background: rgba(255, 77, 79, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 77, 79, 0.2);
}

/* 系统配置 */
.config-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: rgba(114, 46, 209, 0.08);
  border: 1px solid rgba(114, 46, 209, 0.2);
  border-radius: 10px;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
}
.config-note code {
  font-family: var(--font-mono);
  color: #d3adf7;
  background: rgba(114, 46, 209, 0.15);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.8rem;
}
.config-note .arco-btn-text {
  margin-left: auto;
  color: #d3adf7;
}

.config-sections { display: flex; flex-direction: column; gap: 1.25rem; }
.config-section {
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}
.config-section-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.config-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
.config-item { display: flex; flex-direction: column; gap: 0.25rem; }
.config-label { font-size: 0.7rem; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 0.05em; }
.config-value { font-size: 0.9375rem; color: rgba(255, 255, 255, 0.9); font-weight: 500; }
.config-value.mono { font-family: var(--font-mono); }
.config-value.small { font-size: 0.8125rem; }

.env-tag {
  display: inline-block;
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}
.env-tag.ok { background: rgba(82, 196, 26, 0.15); color: #52c41a; border: 1px solid rgba(82, 196, 26, 0.3); }
.env-tag.no { background: rgba(255, 77, 79, 0.12); color: #ff4d4f; border: 1px solid rgba(255, 77, 79, 0.25); }
.env-tag.dev { background: rgba(255, 200, 0, 0.12); color: #ffc800; border: 1px solid rgba(255, 200, 0, 0.25); }
.env-tag.prod { background: rgba(82, 196, 26, 0.12); color: #52c41a; border: 1px solid rgba(82, 196, 26, 0.25); }

.config-loading {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9375rem;
}
.config-loading span { font-size: 1.5rem; margin-right: 0.5rem; }
.config-loading.error { color: rgba(255, 77, 79, 0.7); }

/* 来源说明表扩展 */
.source-row {
  grid-template-columns: 130px 180px 1fr 70px 200px;
}
.status-ok { color: #52c41a; font-weight: 700; font-size: 1rem; }
.status-partial { color: #ffc800; font-weight: 700; font-size: 1rem; }
.status-no { color: #ff4d4f; font-weight: 700; font-size: 1rem; }
</style>
