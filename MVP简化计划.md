# AgriSol-AI MVP 简化计划

## 核心理念：大道至简

将原20周计划简化为**核心MVP**，专注最小可行产品，快速验证核心价值。

## 简化原则

1. **一个核心场景**：农光互补智能分析
2. **四个核心功能**：作物分析 + 能源监测 + 碳汇计算 + 智慧传承
3. **两周交付**：快速迭代，持续优化

---

## MVP功能范围

### 1. 作物智能分析（农业维度）
- 📸 拍照上传作物图片
- 🤖 AI多模态分析（健康状态、病虫害识别）
- 📊 简单的健康评分展示
- 💡 基础养护建议

### 2. 光伏能源监测（能源维度）
- ⚡ 手动输入光伏面板参数
- 📈 基于气象API的发电量预测
- 💰 简单的收益计算
- 🔋 能源自给率展示

### 3. 碳汇快速计算（环境维度）
- 🌱 基于种植面积的碳汇估算
- 📉 碳排放简单记录
- 🌳 等效植树可视化
- 📄 简易碳汇报告

### 4. 经验语音记录（人文维度）
- 🎤 语音录入农事经验
- 📝 AI自动整理为文字
- 🔍 简单的关键词检索
- 📚 经验卡片展示

---

## 技术栈（最小化）

### 前端
- Vue 3 + Vite
- Arco Design Vue（仅核心组件）
- ECharts（仅必需图表）
- Axios

### 后端
- Fastify 4
- Better-SQLite3
- ModelScope API（Qwen3.5）
- Sharp（图片处理）

### 数据库
- SQLite（5张核心表）

---

## 项目结构（精简版）

```
AgriSol-AI/
├── server/
│   ├── src/
│   │   ├── index.js           # 入口
│   │   ├── config.js          # 配置
│   │   ├── database.js        # 数据库
│   │   ├── routes.js          # 路由
│   │   └── services/
│   │       ├── ai.js          # AI服务
│   │       ├── weather.js     # 气象服务
│   │       └── carbon.js      # 碳汇计算
│   └── package.json
├── web/
│   ├── src/
│   │   ├── main.js
│   │   ├── App.vue
│   │   ├── router.js
│   │   ├── api.js
│   │   └── views/
│   │       ├── Home.vue       # 首页
│   │       ├── Crop.vue       # 作物分析
│   │       ├── Energy.vue     # 能源监测
│   │       ├── Carbon.vue     # 碳汇计算
│   │       └── Wisdom.vue     # 智慧记录
│   └── package.json
├── data/
│   ├── database.sqlite
│   └── uploads/
├── .env
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 数据库设计（5张表）

### 1. users（用户表）
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. crops（作物记录）
```sql
CREATE TABLE crops (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  image_path TEXT,
  health_score INTEGER,
  ai_analysis TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. energy（能源记录）
```sql
CREATE TABLE energy (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  panel_area REAL,
  daily_generation REAL,
  daily_consumption REAL,
  created_at DATE
);
```

### 4. carbon（碳汇记录）
```sql
CREATE TABLE carbon (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  crop_area REAL,
  carbon_sequestration REAL,
  equivalent_trees INTEGER,
  created_at DATE
);
```

### 5. wisdom（经验记录）
```sql
CREATE TABLE wisdom (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  audio_path TEXT,
  transcription TEXT,
  keywords TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 开发任务分解

### Phase 1: 基础架构（2天）
- [ ] 初始化项目结构
- [ ] 配置pnpm workspace
- [ ] 搭建Fastify后端
- [ ] 搭建Vue前端
- [ ] 创建SQLite数据库

### Phase 2: 作物分析（2天）
- [ ] 图片上传接口
- [ ] ModelScope AI集成
- [ ] 作物分析页面
- [ ] 结果展示

### Phase 3: 能源监测（2天）
- [ ] 气象API集成
- [ ] 发电量计算
- [ ] 能源监测页面
- [ ] 图表展示

### Phase 4: 碳汇计算（1天）
- [ ] 碳汇计算逻辑
- [ ] 碳汇页面
- [ ] 简单可视化

### Phase 5: 智慧记录（2天）
- [ ] 语音录入（Web Speech API）
- [ ] AI转写
- [ ] 经验展示页面

### Phase 6: 集成优化（1天）
- [ ] 首页导航
- [ ] 样式统一
- [ ] 基础测试

---

## API设计（最小化）

### 作物分析
```
POST /api/crop/analyze
Body: { image: File }
Response: { healthScore, analysis, recommendations }
```

### 能源预测
```
POST /api/energy/predict
Body: { panelArea, location }
Response: { dailyGeneration, monthlyRevenue }
```

### 碳汇计算
```
POST /api/carbon/calculate
Body: { cropArea, cropType }
Response: { carbonSequestration, equivalentTrees }
```

### 智慧记录
```
POST /api/wisdom/record
Body: { audio: File }
Response: { transcription, keywords }
```

---

## 环境变量（.env）

```env
# 服务配置
PORT=3000
NODE_ENV=development

# ModelScope API
MODELSCOPE_API_KEY=your_api_key_here
MODELSCOPE_BASE_URL=https://api-inference.modelscope.cn/v1
MODELSCOPE_MODEL=Qwen/Qwen3.5-VL-7B-Instruct

# 数据库
SQLITE_DB_PATH=./data/database.sqlite

# 气象API（Open-Meteo免费）
WEATHER_API_URL=https://api.open-meteo.com/v1/forecast
```

---

## 部署方案

### 开发环境
```bash
pnpm install
pnpm dev
```

### 生产环境
```bash
pnpm build
pnpm start
```

### 硬件要求（最小化）
- CPU: 2核
- 内存: 4GB
- 存储: 10GB
- 网络: 4G即可

---

## 成功标准

### 功能标准
- ✅ 能上传图片并获得AI分析
- ✅ 能输入参数并预测发电量
- ✅ 能计算碳汇并生成报告
- ✅ 能录音并转为文字

### 性能标准
- ✅ 图片分析<5秒
- ✅ 页面加载<2秒
- ✅ 移动端适配

### 用户体验
- ✅ 界面简洁美观
- ✅ 操作流程清晰
- ✅ 错误提示友好

---

## 后续迭代方向

### v1.1（+2周）
- 数据可视化增强
- 历史记录查询
- 用户系统完善

### v1.2（+2周）
- 本地模型集成
- 离线模式支持
- 性能优化

### v2.0（+4周）
- 社区功能
- 政策匹配
- 移动端App

---

**版本**: MVP v1.0
**预计交付**: 2周
**核心价值**: 快速验证农光互补AI助手的可行性
