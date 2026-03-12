# 作物智能分析模块开发文档

## 已完成的功能

### 1. 前端组件

#### ImageUpload.vue (图片上传组件)
位置: `F:/1work/农业能源环境/web/src/components/upload/ImageUpload.vue`

功能特性:
- 拖拽上传支持
- 点击上传
- 图片预览和放大查看
- 上传前图片压缩
- 多图上传支持
- 上传进度显示
- 美观的动画效果

使用方法:
```vue
<ImageUpload
  v-model="imageUrl"
  @success="handleSuccess"
  @error="handleError"
  :compress="true"
  :maxSize="10485760"
/>
```

#### CropCharts.vue (图表组件)
位置: `F:/1work/农业能源环境/web/src/components/charts/CropCharts.vue`

包含图表:
- 健康度趋势折线图
- 病虫害分布饼图
- 生长阶段时间线柱状图
- 环境因素雷达图

使用方法:
```vue
<CropCharts
  :health-data="healthData"
  :pest-data="pestData"
  :growth-data="growthData"
  :env-data="envData"
/>
```

#### Crop.vue (作物分析页面)
位置: `F:/1work/农业能源环境/web/src/views/Crop.vue`

功能特性:
- 大型上传区域
- 分析进度显示(进度条+动画)
- 结果展示卡片:
  - 健康评分(大数字+仪表盘)
  - 病虫害检测(带标注的图片)
  - 护理建议(分步骤)
  - 历史对比(折线图)
- 作物档案管理
- 批量分析功能
- 筛选和搜索

### 2. 后端API

#### crop.js (作物路由)
位置: `F:/1work/农业能源环境/server/src/routes/crop.js`

API端点:
- `POST /api/crops/upload` - 上传图片(multipart)
- `POST /api/crops/analyze` - 分析作物图片
- `GET /api/crops/history` - 获取分析历史
- `GET /api/crops/statistics` - 获取统计数据
- `GET /api/crops/:id` - 获取单条记录详情
- `DELETE /api/crops/:id` - 删除记录

#### crop-analysis.js (分析服务)
位置: `F:/1work/农业能源环境/server/src/services/crop-analysis.js`

功能特性:
- ModelScope API集成(用于图像分析)
- 图片预处理(Sharp)
- 健康评分计算
- 病虫害检测逻辑
- 建议生成
- 结果缓存

### 3. 数据库

已添加的表:
- `crop_images` - 存储上传的图片信息
- `crop_records` - 存储分析记录
- `analysis_results` - 存储详细分析结果

已添加的索引:
- `idx_crop_records_created_at` - 按创建时间索引
- `idx_crop_records_crop_type` - 按作物类型索引
- `idx_crop_records_health_score` - 按健康评分索引
- `idx_crop_images_uploaded_at` - 按上传时间索引

### 4. API配置

位置: `F:/1work/农业能源环境/web/src/api.js`

已添加的crop API方法:
```javascript
crop: {
  upload: (formData) => axios.post('/api/crops/upload', formData),
  analyze: (data) => api.post('/crops/analyze', data),
  getHistory: (params) => api.get('/crops/history', { params }),
  getStatistics: () => api.get('/crops/statistics'),
  getDetail: (id) => api.get(`/crops/${id}`),
  delete: (id) => api.delete(`/crops/${id}`)
}
```

## 设计特点

### UI/UX设计
- 美观直观的界面
- 清晰的视觉层次
- 流畅的动画效果
- 响应式设计
- 加载状态提示
- 错误处理
- 空状态展示

### 技术实现
- 使用Arco Design组件(Upload, Card, Progress等)
- 使用ECharts进行数据可视化
- 使用Axios进行API调用
- 优雅的错误处理
- 显示加载状态
- 上传前图片优化
- API响应缓存

## 环境变量配置

在 `.env` 文件中添加:
```
MODELSCOPE_API_KEY=your_api_key_here
MODELSCOPE_ENDPOINT=https://api.modelscope.cn/v1/inference
```

## 使用流程

1. 用户上传作物图片
2. 图片自动压缩和预处理
3. 显示上传进度
4. 点击"开始智能分析"按钮
5. 显示分析进度(多个步骤)
6. 展示分析结果:
   - 作物类型识别
   - 健康评分
   - 病虫害检测
   - 护理建议
7. 查看数据可视化图表
8. 查看历史记录和对比

## 下一步优化建议

1. 集成真实的AI模型API
2. 添加图片裁剪功能
3. 支持批量上传和分析
4. 添加导出报告功能
5. 实现更详细的病虫害标注
6. 添加用户反馈机制
7. 优化移动端体验
8. 添加离线分析支持

## 文件清单

### 前端文件
- `web/src/components/upload/ImageUpload.vue` - 图片上传组件
- `web/src/components/charts/CropCharts.vue` - 图表组件
- `web/src/views/Crop.vue` - 作物分析页面
- `web/src/api.js` - API配置(已更新)

### 后端文件
- `server/src/routes/crop.js` - 作物路由
- `server/src/services/crop-analysis.js` - 分析服务
- `server/src/database.js` - 数据库配置(已更新)
- `server/src/routes.js` - 路由配置(已更新)

## 技术栈

### 前端
- Vue 3
- Arco Design
- ECharts
- Axios

### 后端
- Fastify
- Better-SQLite3
- Sharp (图片处理)
- Axios (API调用)

## 注意事项

1. 确保 `uploads/crops` 目录有写入权限
2. ModelScope API需要有效的API密钥
3. 图片大小限制为10MB
4. 支持的图片格式: JPG, PNG, WEBP
5. 建议使用HTTPS以确保图片传输安全
