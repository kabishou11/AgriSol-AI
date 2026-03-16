// 多Agent协作架构
// 实现智能任务分发和协调的多Agent系统

/**
 * Agent类型定义
 */
export const AgentTypes = {
  COORDINATOR: 'coordinator',      // 协调器Agent - 任务分发和结果整合
  CROP_ANALYST: 'crop_analyst',    // 作物分析Agent - 专注作物健康诊断
  ENERGY_EXPERT: 'energy_expert',  // 能源专家Agent - 能源优化和预测
  CARBON_ADVISOR: 'carbon_advisor', // 碳汇顾问Agent - 碳计算和建议
  KNOWLEDGE_AGENT: 'knowledge_agent', // 知识Agent - 农业知识检索
  DATA_ANALYST: 'data_analyst'     // 数据分析Agent - 统计分析和可视化
};

/**
 * Agent能力定义
 */
export const AgentCapabilities = {
  [AgentTypes.COORDINATOR]: {
    name: '协调器',
    description: '任务分析、Agent调度、结果整合',
    skills: ['task_decomposition', 'agent_selection', 'result_synthesis']
  },
  [AgentTypes.CROP_ANALYST]: {
    name: '作物分析师',
    description: '作物健康诊断、病虫害识别、生长建议',
    skills: ['image_analysis', 'pest_detection', 'health_assessment', 'growth_advice']
  },
  [AgentTypes.ENERGY_EXPERT]: {
    name: '能源专家',
    description: '能源预测、优化建议、储能方案',
    skills: ['energy_forecast', 'optimization', 'storage_design', 'cost_analysis']
  },
  [AgentTypes.CARBON_ADVISOR]: {
    name: '碳汇顾问',
    description: '碳汇计算、环境效益分析、认证指导',
    skills: ['carbon_calculation', 'environmental_impact', 'certification_guidance']
  },
  [AgentTypes.KNOWLEDGE_AGENT]: {
    name: '知识专家',
    description: '农业知识检索、经验总结、最佳实践',
    skills: ['knowledge_retrieval', 'experience_summary', 'best_practices']
  },
  [AgentTypes.DATA_ANALYST]: {
    name: '数据分析师',
    description: '数据统计、趋势分析、报告生成',
    skills: ['statistical_analysis', 'trend_prediction', 'report_generation']
  }
};

/**
 * 协调器Agent - 负责任务分发和结果整合
 */
export class CoordinatorAgent {
  constructor(aiService) {
    this.aiService = aiService;
    this.agents = new Map();
  }

  /**
   * 分析用户请求，确定需要哪些Agent
   */
  async analyzeRequest(userQuery, context) {
    const keywords = {
      [AgentTypes.CROP_ANALYST]: ['作物', '病虫害', '健康', '生长', '诊断', '识别'],
      [AgentTypes.ENERGY_EXPERT]: ['能源', '发电', '用电', '光伏', '储能', '优化'],
      [AgentTypes.CARBON_ADVISOR]: ['碳', '碳汇', '减排', '环境', '认证'],
      [AgentTypes.KNOWLEDGE_AGENT]: ['知识', '经验', '如何', '怎么', '方法'],
      [AgentTypes.DATA_ANALYST]: ['统计', '分析', '趋势', '报告', '数据']
    };

    const selectedAgents = [];
    const queryLower = userQuery.toLowerCase();

    for (const [agentType, words] of Object.entries(keywords)) {
      if (words.some(word => queryLower.includes(word))) {
        selectedAgents.push(agentType);
      }
    }

    // 如果没有匹配，根据页面上下文选择
    if (selectedAgents.length === 0) {
      if (context.page?.includes('crop')) selectedAgents.push(AgentTypes.CROP_ANALYST);
      else if (context.page?.includes('energy')) selectedAgents.push(AgentTypes.ENERGY_EXPERT);
      else if (context.page?.includes('carbon')) selectedAgents.push(AgentTypes.CARBON_ADVISOR);
      else selectedAgents.push(AgentTypes.KNOWLEDGE_AGENT);
    }

    return selectedAgents;
  }

  /**
   * 协调多个Agent执行任务
   */
  async coordinateTasks(userQuery, context) {
    // 1. 分析请求，选择Agent
    const selectedAgents = await this.analyzeRequest(userQuery, context);

    // 2. 并行执行Agent任务
    const tasks = selectedAgents.map(agentType =>
      this.executeAgent(agentType, userQuery, context)
    );

    const results = await Promise.allSettled(tasks);

    // 3. 整合结果
    const successResults = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    // 4. 生成综合回答
    return this.synthesizeResponse(userQuery, successResults, selectedAgents);
  }

  /**
   * 执行单个Agent
   */
  async executeAgent(agentType, query, context) {
    const capability = AgentCapabilities[agentType];

    // 构建Agent专属提示词
    const systemPrompt = `你是${capability.name}，专注于${capability.description}。
你的技能包括：${capability.skills.join('、')}。
请基于你的专业领域回答用户问题。`;

    const userPrompt = `用户问题：${query}\n\n页面上下文：${JSON.stringify(context, null, 2)}`;

    try {
      const response = await this.aiService.chat(systemPrompt, userPrompt);
      return {
        agentType,
        agentName: capability.name,
        response: response.content,
        confidence: 0.85
      };
    } catch (error) {
      return {
        agentType,
        agentName: capability.name,
        response: null,
        error: error.message
      };
    }
  }

  /**
   * 整合多个Agent的回答
   */
  async synthesizeResponse(query, results, agentTypes) {
    if (results.length === 0) {
      return {
        answer: '抱歉，我暂时无法回答这个问题。',
        agents: [],
        confidence: 0
      };
    }

    if (results.length === 1) {
      return {
        answer: results[0].response,
        agents: [results[0].agentName],
        confidence: results[0].confidence
      };
    }

    // 多Agent结果整合
    const combinedAnswer = results.map((r, i) =>
      `**${r.agentName}的观点：**\n${r.response}`
    ).join('\n\n');

    return {
      answer: `我咨询了${results.length}位专家，以下是他们的综合建议：\n\n${combinedAnswer}`,
      agents: results.map(r => r.agentName),
      confidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    };
  }
}

/**
 * 创建Agent实例
 */
export function createAgentSystem(aiService) {
  return new CoordinatorAgent(aiService);
}
