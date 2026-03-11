# AgriSol-AI | 农光智助·银青共富平台

> AI-powered agrivoltaic optimization platform for sustainable farming and solar energy management
> 多模态AI驱动的农光互补全年龄段绿色优化助手，农业 + 能源 + 环境 + 人文四位一体

## 项目简介 | Project Overview

本平台以多模态大模型（Qwen3.5系列）为核心，融合**农业+能源+环境+人文**四位一体，实现：

- 🌾 **农业 Agriculture**: 作物全生命周期智能管理 | Intelligent crop lifecycle management
- ⚡ **能源 Energy**: 光伏发电监测与优化 | Solar power monitoring and optimization
- 🌍 **环境 Environment**: 土壤健康与碳汇计算 | Soil health and carbon sequestration tracking
- 👨‍👩‍👧‍👦 **人文 Community**: 老农智慧传承与家庭协作 | Traditional wisdom preservation and family collaboration

## MVP核心功能 | MVP Core Features

### Phase 1: 基础功能 | Basic Features
- ✅ 用户认证与管理 | User authentication and management
- ✅ 作物健康监测 | Crop health monitoring
- ✅ 光伏发电数据展示 | Solar power generation dashboard
- ✅ 基础数据可视化 | Basic data visualization

### Phase 2: AI增强 | AI Enhancement
- 🔄 多模态作物分析 | Multimodal crop analysis
- 🔄 智能病虫害检测 | Intelligent pest detection
- 🔄 发电量预测 | Power generation forecasting
- 🔄 优化建议生成 | Optimization recommendations

## 技术栈

### 前端
- Vue 3 + Vite 5
- Arco Design Vue（字节跳动UI组件库）
- Apache ECharts 5（数据可视化）
- Leaflet（地图）

### 后端
- Node.js 20+ + Fastify 4
- Better-SQLite3（本地数据库）
- ModelScope API（Qwen3.5多模态）
- ONNX Runtime（本地模型推理）

### 包管理
- pnpm 9+

## 快速开始 | Quick Start

### 1. 环境准备 | Prerequisites

确保已安装 | Make sure you have installed:
- Node.js 20+
- pnpm 9+

```bash
# 安装pnpm | Install pnpm
npm install -g pnpm
```

### 2. 克隆项目 | Clone Repository

```bash
git clone https://github.com/kabishou11/AgriSol-AI.git
cd AgriSol-AI
```

### 3. 安装依赖 | Install Dependencies

```bash
# 安装所有依赖 | Install all dependencies
pnpm install:all

# 或分别安装 | Or install separately
pnpm install
cd server && pnpm install
cd ../web && pnpm install
```

### 4. 配置环境变量 | Configure Environment

```bash
# 复制环境变量模板 | Copy environment template
cp .env.example .env

# 编辑.env文件，填入你的配置 | Edit .env file with your configuration
# 重点配置 | Key configuration: MODELSCOPE_API_KEY
```

### 5. 初始化数据库 | Initialize Database

```bash
# 创建数据目录 | Create data directories
mkdir -p data/cache data/uploads data/backups data/knowledge data/policies

# 数据库会在首次启动时自动初始化 | Database will be initialized on first run
```

### 6. 启动开发服务 | Start Development Server

```bash
# 同时启动前后端 | Start both frontend and backend
pnpm dev

# 或分别启动 | Or start separately
pnpm server  # 后端 Backend: http://localhost:3000
pnpm web     # 前端 Frontend: http://localhost:5173
```

### 7. 访问应用 | Access Application

打开浏览器访问 | Open browser and visit: http://localhost:5173

## 项目结构 | Project Structure

```
AgriSol-AI/
├── server/              # 后端服务 | Backend service
│   ├── src/
│   │   ├── routes/      # API路由 | API routes
│   │   ├── services/    # 业务逻辑 | Business logic
│   │   ├── models/      # 数据模型 | Data models
│   │   └── utils/       # 工具函数 | Utility functions
│   └── package.json
├── web/                 # 前端应用 | Frontend application
│   ├── src/
│   │   ├── views/       # 页面组件 | Page components
│   │   ├── components/  # 通用组件 | Common components
│   │   ├── stores/      # 状态管理 | State management
│   │   └── api/         # API封装 | API wrapper
│   └── package.json
├── models/              # 本地AI模型 | Local AI models
├── data/                # 数据存储 | Data storage
│   ├── uploads/         # 上传文件 | Uploaded files
│   ├── cache/           # 缓存数据 | Cache data
│   └── backups/         # 数据库备份 | Database backups
└── docs/                # 文档 | Documentation
```

## 核心功能 | Core Features

### 1. 农业维度 | Agriculture
- ✅ 作物全生命周期管理 | Crop lifecycle management
- ✅ 多模态作物健康分析 | Multimodal crop health analysis
- ✅ 病虫害智能检测 | Intelligent pest detection
- ✅ 二十四节气提醒 | Solar term reminders

### 2. 能源维度 | Energy
- ✅ 光伏发电监测 | Solar power monitoring
- ✅ 发电量预测 | Power generation forecasting
- ✅ 用电优化建议 | Energy optimization recommendations
- ✅ 能源自给率计算 | Energy self-sufficiency calculation

### 3. 环境维度 | Environment
- ✅ 土壤健康监测 | Soil health monitoring
- ✅ 水资源追踪 | Water resource tracking
- ✅ 生物多样性观测 | Biodiversity observation
- ✅ 碳汇自动计算 | Automatic carbon sequestration calculation

### 4. 人文维度 | Community
- ✅ 老农智慧录入 | Traditional wisdom recording
- ✅ 经验知识库RAG | Experience knowledge base with RAG
- ✅ 家庭协作看板 | Family collaboration board
- ✅ 文化记忆保存 | Cultural memory preservation

## 开发指南 | Development Guide

详见 | See: [开发计划文档.md](./开发计划文档.md)

## API文档 | API Documentation

启动服务后访问 | After starting the server, visit: http://localhost:3000/docs

## 部署 | Deployment

### 开发环境 | Development
```bash
pnpm dev
```

### 生产环境 | Production
```bash
# 构建前端 | Build frontend
pnpm build

# 启动后端 | Start backend
cd server && pnpm start
```

## 贡献指南 | Contributing

欢迎提交Issue和Pull Request！| Issues and Pull Requests are welcome!

## 许可证 | License

MIT License

## 联系方式 | Contact

- GitHub: [kabishou11/AgriSol-AI](https://github.com/kabishou11/AgriSol-AI)
- Email: woicyou@gmail.com
- 项目文档 | Documentation: [开发计划文档.md](./开发计划文档.md)

---

**版本 | Version**: v1.0.0-MVP
**更新时间 | Last Updated**: 2026-03-11
