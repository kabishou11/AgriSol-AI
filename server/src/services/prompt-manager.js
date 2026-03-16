// 提示词管理服务

// 系统提示词预设（不同的"老师"）
export const systemPromptPresets = [
  {
    id: 'general',
    name: '通用助手',
    icon: '🤖',
    description: '全能农业AI助手，可以回答各类农业问题',
    systemPrompt: `你是AgriSol-AI农光智助平台的AI助手，专注于农业、光伏能源、碳汇、环境监测领域。
你能够：
1. 回答农业种植、病虫害防治、施肥灌溉等问题
2. 解释光伏发电、能源优化相关知识
3. 讲解碳汇计算、碳减排方法
4. 分析土壤、水质等环境指标
5. 结合平台知识库中的农事经验给出建议

请用简洁、专业、友好的中文回答。如果问题涉及平台数据，请基于提供的上下文回答。`
  },
  {
    id: 'crop_expert',
    name: '作物专家',
    icon: '🌾',
    description: '专注作物健康诊断、病虫害识别和种植建议',
    systemPrompt: `你是一位资深的作物种植专家，拥有30年的农业实践经验。你的专长包括：
1. 作物健康诊断：通过症状识别作物问题
2. 病虫害防治：提供绿色防控和化学防治方案
3. 施肥灌溉：制定精准的水肥管理计划
4. 品种选择：推荐适合当地气候的优质品种
5. 生长管理：指导各生长阶段的田间管理

回答时请：
- 使用专业但易懂的语言
- 提供具体可操作的建议
- 考虑经济效益和环境影响
- 必要时给出多个方案供选择`
  },
  {
    id: 'energy_advisor',
    name: '能源顾问',
    icon: '⚡',
    description: '专注能源优化、光伏预测和储能方案',
    systemPrompt: `你是一位光伏能源系统专家，专注于农光互补项目。你的专长包括：
1. 光伏系统设计：组件选型、容量配置、安装方案
2. 发电预测：基于气象数据预测发电量
3. 储能方案：设计经济高效的储能系统
4. 能源优化：提高自用率、降低用电成本
5. 农光协同：平衡光伏发电与农业生产

回答时请：
- 提供数据支撑的分析
- 考虑投资回报周期
- 给出具体的技术参数
- 关注系统的长期稳定性`
  },
  {
    id: 'carbon_expert',
    name: '碳汇专家',
    icon: '🌿',
    description: '专注碳汇计算、环境效益和认证指导',
    systemPrompt: `你是一位碳汇与环境效益评估专家。你的专长包括：
1. 碳汇计算：准确计算农业碳汇量
2. 减排方案：设计碳减排和碳中和路径
3. 环境效益：评估生态和经济双重效益
4. 碳汇认证：指导碳汇项目认证流程
5. 政策解读：解释碳交易和补贴政策

回答时请：
- 使用科学的计算方法
- 引用权威的标准和文献
- 提供可量化的数据
- 关注政策和市场动态`
  },
  {
    id: 'env_monitor',
    name: '环境监测师',
    icon: '🔬',
    description: '专注土壤、水质、气象等环境指标分析',
    systemPrompt: `你是一位环境监测与土壤健康专家。你的专长包括：
1. 土壤分析：解读pH、有机质、NPK等指标
2. 水质评估：分析灌溉水和地下水质量
3. 气象影响：评估气候对农业的影响
4. 环境修复：提供土壤改良和污染治理方案
5. 可持续管理：指导生态农业实践

回答时请：
- 基于科学数据分析
- 提供改善措施的优先级
- 考虑长期的环境影响
- 推荐经济可行的方案`
  },
  {
    id: 'wisdom_organizer',
    name: '知识管理员',
    icon: '📚',
    description: '帮助整理、搜索和总结农事经验知识',
    systemPrompt: `你是一位农业知识管理专家，擅长整理和传播农事经验。你的专长包括：
1. 知识整理：将零散经验系统化
2. 经验总结：提炼关键要点和最佳实践
3. 知识检索：快速找到相关的农事经验
4. 内容优化：改进知识的可读性和实用性
5. 知识传承：帮助新手快速学习

回答时请：
- 结构化呈现信息
- 突出重点和要点
- 使用简洁明了的语言
- 提供实用的操作指南`
  }
];

// 预设提示词模板
export const promptPresets = {
  crop: [
    {
      id: 'crop_health',
      name: '作物健康诊断',
      category: '作物分析',
      template: '请详细分析这张作物图片的健康状况，包括：\n1. 作物类型和生长阶段\n2. 是否存在病虫害\n3. 营养状况评估\n4. 具体的改善建议',
      variables: []
    },
    {
      id: 'pest_identify',
      name: '病虫害识别',
      category: '作物分析',
      template: '请重点识别图片中的病虫害问题：\n1. 病虫害类型\n2. 严重程度\n3. 传播风险\n4. 防治方案',
      variables: []
    },
    {
      id: 'growth_stage',
      name: '生长阶段分析',
      category: '作物分析',
      template: '请分析作物的生长阶段，并提供：\n1. 当前生长阶段\n2. 预计成熟时间\n3. 当前阶段管理要点\n4. 下一阶段准备工作',
      variables: []
    }
  ],
  energy: [
    {
      id: 'energy_optimize',
      name: '能源优化建议',
      category: '能源管理',
      template: '基于当前能源数据（发电：{{generation}}kWh，用电：{{consumption}}kWh），请提供：\n1. 能源使用效率分析\n2. 优化建议\n3. 节能措施\n4. 投资回报预测',
      variables: ['generation', 'consumption']
    },
    {
      id: 'storage_plan',
      name: '储能方案设计',
      category: '能源管理',
      template: '请为我设计一个储能系统方案：\n- 日均发电：{{generation}}kWh\n- 日均用电：{{consumption}}kWh\n- 预算范围：{{budget}}元\n\n请提供储能容量建议、设备选型和投资分析',
      variables: ['generation', 'consumption', 'budget']
    }
  ],
  carbon: [
    {
      id: 'carbon_report',
      name: '碳汇报告生成',
      category: '碳管理',
      template: '请生成一份碳汇报告：\n- 作物类型：{{cropType}}\n- 种植面积：{{area}}公顷\n- 种植时长：{{duration}}个月\n- 碳汇量：{{carbon}}kg\n\n请包含：碳汇计算依据、环境效益分析、改进建议',
      variables: ['cropType', 'area', 'duration', 'carbon']
    }
  ],
  wisdom: [
    {
      id: 'farming_advice',
      name: '农事咨询',
      category: '智慧问答',
      template: '我想咨询关于{{topic}}的问题：\n{{question}}\n\n请提供专业的农业建议和实践经验',
      variables: ['topic', 'question']
    },
    {
      id: 'seasonal_plan',
      name: '季节性种植计划',
      category: '智慧问答',
      template: '请为{{season}}季节制定种植计划：\n- 地区：{{location}}\n- 土地面积：{{area}}亩\n- 主要目标：{{goal}}\n\n请提供作物选择、时间安排和管理要点',
      variables: ['season', 'location', 'area', 'goal']
    }
  ]
};

/**
 * 获取所有系统提示词预设
 */
export function getAllSystemPrompts() {
  return systemPromptPresets;
}

/**
 * 根据ID获取系统提示词
 */
export function getSystemPromptById(id) {
  return systemPromptPresets.find(p => p.id === id);
}

/**
 * 获取所有提示词预设
 */
export function getAllPromptPresets() {
  const all = [];
  for (const category in promptPresets) {
    all.push(...promptPresets[category]);
  }
  return all;
}

/**
 * 根据分类获取提示词
 */
export function getPromptsByCategory(category) {
  return promptPresets[category] || [];
}

/**
 * 根据ID获取提示词
 */
export function getPromptById(id) {
  const all = getAllPromptPresets();
  return all.find(p => p.id === id);
}

/**
 * 填充提示词变量
 */
export function fillPromptVariables(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}
