# 作物分析模块测试指南

## 快速测试步骤

### 1. 启动服务器

```bash
cd server
npm install
npm run dev
```

服务器将在 http://localhost:3000 启动

### 2. 启动前端

```bash
cd web
npm install
npm run dev
```

前端将在 http://localhost:5173 启动

### 3. 测试功能

#### 测试图片上传
1. 访问 http://localhost:5173
2. 点击导航栏的"作物分析"
3. 拖拽或点击上传一张作物图片
4. 查看图片预览

#### 测试分析功能
1. 上传图片后,点击"开始智能分析"按钮
2. 观察分析进度条和动画
3. 等待分析完成(约4秒)
4. 查看分析结果:
   - 作物类型
   - 健康评分
   - 病虫害检测
   - 护理建议

#### 测试图表展示
1. 分析完成后,向下滚动
2. 查看四个图表:
   - 健康度趋势
   - 病虫害分布
   - 生长阶段时间线
   - 环境因素雷达图

#### 测试历史记录
1. 继续向下滚动到历史记录表格
2. 查看分析历史
3. 测试"查看详情"按钮
4. 测试"删除"按钮

### 4. API测试

使用curl或Postman测试API:

#### 上传图片
```bash
curl -X POST http://localhost:3000/api/crops/upload \
  -F "image=@/path/to/your/image.jpg"
```

#### 分析图片
```bash
curl -X POST http://localhost:3000/api/crops/analyze \
  -H "Content-Type: application/json" \
  -d '{"imageId": 1}'
```

#### 获取历史记录
```bash
curl http://localhost:3000/api/crops/history?page=1&pageSize=10
```

#### 获取统计数据
```bash
curl http://localhost:3000/api/crops/statistics
```

#### 获取单条记录
```bash
curl http://localhost:3000/api/crops/1
```

#### 删除记录
```bash
curl -X DELETE http://localhost:3000/api/crops/1
```

## 预期结果

### 上传成功响应
```json
{
  "success": true,
  "data": {
    "id": 1,
    "url": "/uploads/crops/crop-1234567890-123456789.jpg",
    "filename": "crop-1234567890-123456789.jpg"
  }
}
```

### 分析成功响应
```json
{
  "success": true,
  "data": {
    "id": 1,
    "cropType": "小麦",
    "growthStage": "拔节期",
    "healthScore": 87,
    "healthStatus": "良好",
    "pests": [
      { "name": "蚜虫", "severity": "轻度" },
      { "name": "白粉病", "severity": "中度" }
    ],
    "recommendations": [
      "建议使用生物农药防治蚜虫",
      "增加通风，降低湿度以预防白粉病",
      "适当增施钾肥，提高抗病能力",
      "定期监测病虫害发展情况"
    ],
    "analyzedAt": "2026-03-11T10:30:00.000Z"
  }
}
```

## 常见问题

### 1. 上传失败
- 检查文件大小是否超过10MB
- 检查文件格式是否为JPG/PNG/WEBP
- 检查uploads/crops目录是否存在且有写入权限

### 2. 分析失败
- 检查ModelScope API配置
- 查看服务器日志
- 确认数据库表已创建

### 3. 图表不显示
- 检查ECharts是否正确安装
- 打开浏览器控制台查看错误
- 确认数据格式正确

### 4. 历史记录为空
- 先完成至少一次分析
- 检查数据库crop_records表
- 确认API返回数据

## 调试技巧

### 前端调试
1. 打开浏览器开发者工具(F12)
2. 查看Console标签页的错误信息
3. 查看Network标签页的API请求
4. 使用Vue DevTools查看组件状态

### 后端调试
1. 查看服务器控制台输出
2. 检查Fastify日志
3. 使用SQLite浏览器查看数据库
4. 添加console.log调试信息

## 性能优化建议

1. 图片压缩质量可调整(默认0.8)
2. 缓存过期时间可配置(默认1小时)
3. 分页大小可根据需求调整
4. 考虑添加Redis缓存
5. 使用CDN加速图片加载

## 安全注意事项

1. 验证上传文件类型
2. 限制文件大小
3. 防止路径遍历攻击
4. 使用HTTPS传输
5. 添加用户认证
6. 实施访问控制
7. 定期备份数据库

## 下一步开发

1. 集成真实AI模型
2. 添加用户系统
3. 实现批量分析
4. 添加导出功能
5. 优化移动端
6. 添加通知系统
7. 实现数据分析
8. 添加报告生成
