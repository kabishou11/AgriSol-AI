# 作物智能分析模块 - 快速启动指南

## 🚀 5分钟快速启动

### 前置要求
- Node.js 18+
- pnpm (推荐) 或 npm

### 步骤1: 安装依赖

```bash
# 在项目根目录
cd F:/1work/农业能源环境

# 安装所有依赖
pnpm install

# 或者分别安装
cd server && npm install
cd ../web && npm install
```

### 步骤2: 配置环境变量(可选)

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件(可选,使用Mock数据可跳过)
# MODELSCOPE_API_KEY=your_key_here
```

### 步骤3: 启动服务

```bash
# 终端1 - 启动后端
cd server
npm run dev

# 终端2 - 启动前端
cd web
npm run dev
```

### 步骤4: 访问应用

打开浏览器访问: http://localhost:5173

点击导航栏的"作物分析"即可开始使用!

## 📸 快速测试

1. **上传图片**: 拖拽或点击上传任意作物图片
2. **开始分析**: 点击"开始智能分析"按钮
3. **查看结果**: 等待4秒后查看分析结果
4. **浏览图表**: 向下滚动查看数据可视化
5. **历史记录**: 查看所有分析历史

## 🎯 核心功能

### ✅ 已实现
- 图片上传(拖拽/点击)
- 图片自动压缩
- 智能分析(Mock数据)
- 健康评分计算
- 病虫害检测
- 护理建议生成
- 数据可视化(4种图表)
- 历史记录管理
- 统计数据展示

### 🔄 使用Mock数据
当前版本使用模拟数据进行演示,无需配置AI API即可体验完整功能。

## 📁 项目结构

```
农业能源环境/
├── web/                          # 前端项目
│   └── src/
│       ├── components/
│       │   ├── upload/
│       │   │   └── ImageUpload.vue    # 图片上传组件
│       │   └── charts/
│       │       └── CropCharts.vue     # 图表组件
│       ├── views/
│       │   └── Crop.vue               # 作物分析页面
│       └── api.js                     # API配置
│
├── server/                       # 后端项目
│   └── src/
│       ├── routes/
│       │   └── crop.js                # 作物路由
│       ├── services/
│       │   └── crop-analysis.js       # 分析服务
│       ├── database.js                # 数据库配置
│       └── routes.js                  # 路由配置
│
└── uploads/                      # 上传文件目录
    └── crops/                    # 作物图片
```

## 🔧 常用命令

### 开发
```bash
# 启动开发服务器(带热重载)
npm run dev

# 前端开发
cd web && npm run dev

# 后端开发
cd server && npm run dev
```

### 构建
```bash
# 构建前端
cd web && npm run build

# 预览构建结果
cd web && npm run preview
```

### 数据库
```bash
# 查看数据库
sqlite3 server/data/agrisol.db

# 查看作物记录
sqlite3 server/data/agrisol.db "SELECT * FROM crop_records;"

# 清空数据
sqlite3 server/data/agrisol.db "DELETE FROM crop_records;"
```

## 🐛 故障排除

### 问题1: 端口被占用
```bash
# 修改端口
# server/src/config.js - 修改port
# web/vite.config.js - 修改server.port
```

### 问题2: 上传失败
```bash
# 检查目录权限
mkdir -p server/uploads/crops
chmod 755 server/uploads/crops
```

### 问题3: 数据库错误
```bash
# 删除并重建数据库
rm server/data/agrisol.db
# 重启服务器会自动创建
```

### 问题4: 依赖安装失败
```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm install
```

## 📚 相关文档

- `CROP_MODULE_README.md` - 详细开发文档
- `CROP_MODULE_TEST.md` - 测试指南
- `CROP_MODULE_SUMMARY.md` - 完成报告

## 🎨 界面预览

### 上传界面
- 大型拖拽区域
- 实时预览
- 进度显示

### 分析结果
- 健康评分(大数字)
- 作物信息卡片
- 病虫害列表
- 护理建议

### 数据可视化
- 健康度趋势图
- 病虫害分布图
- 生长阶段图
- 环境因素图

### 历史记录
- 分页表格
- 筛选功能
- 详情查看
- 删除操作

## 💡 使用技巧

1. **图片格式**: 支持JPG、PNG、WEBP
2. **图片大小**: 建议5MB以内,最大10MB
3. **分析时间**: 约4秒完成
4. **历史记录**: 自动保存所有分析
5. **数据导出**: 可查看详细JSON数据

## 🔐 安全提示

- 上传的图片存储在本地
- 数据库文件在server/data目录
- 建议定期备份数据
- 生产环境请配置HTTPS

## 📞 技术支持

遇到问题?
1. 查看浏览器控制台错误
2. 查看服务器日志
3. 检查数据库状态
4. 参考测试文档

## 🎉 开始使用

现在你已经准备好了!

```bash
# 一键启动(需要两个终端)
cd server && npm run dev
cd web && npm run dev
```

访问 http://localhost:5173 开始体验作物智能分析!

---

**提示**: 首次使用建议先阅读 `CROP_MODULE_README.md` 了解完整功能。
