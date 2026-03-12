import db from '../database.js';
import { getAgriWisdom } from '../services/ai.js';

// Simple AI chat using rule-based + knowledge base context
// Falls back gracefully if no OpenAI key configured

const SYSTEM_PROMPT = `你是AgriSol-AI农光智助平台的AI助手，专注于农业、光伏能源、碳汇、环境监测领域。
你能够：
1. 回答农业种植、病虫害防治、施肥灌溉等问题
2. 解释光伏发电、能源优化相关知识
3. 讲解碳汇计算、碳减排方法
4. 分析土壤、水质等环境指标
5. 结合平台知识库中的农事经验给出建议

请用简洁、专业、友好的中文回答。如果问题涉及平台数据，请基于提供的上下文回答。`;

function getKnowledgeContext(question) {
  try {
    // Search wisdom records for relevant content
    const keywords = question
      .replace(/[，。！？；：""''（）【】《》、\s]/g, ' ')
      .split(' ')
      .filter(w => w.length >= 2)
      .slice(0, 3);

    if (keywords.length === 0) return '';

    const placeholders = keywords.map(() => '(title LIKE ? OR content LIKE ? OR tags LIKE ?)').join(' OR ');
    const params = keywords.flatMap(k => [`%${k}%`, `%${k}%`, `%${k}%`]);

    const stmt = db.prepare(`
      SELECT title, content, category, tags
      FROM wisdom_records
      WHERE ${placeholders}
      ORDER BY favorite_count DESC, view_count DESC
      LIMIT 3
    `);
    const records = stmt.all(...params);

    if (records.length === 0) return '';

    return '\n\n【相关知识库内容】\n' + records.map(r =>
      `- ${r.title}：${r.content.slice(0, 150)}...`
    ).join('\n');
  } catch {
    return '';
  }
}

function getDataContext() {
  try {
    const energyStmt = db.prepare(`
      SELECT AVG(generation) as avg_gen, AVG(consumption) as avg_con,
             SUM(generation) as total_gen
      FROM energy_records
      WHERE datetime(timestamp) >= datetime('now', '-7 days')
    `);
    const energy = energyStmt.get();

    const envStmt = db.prepare(`
      SELECT AVG(soil_ph) as ph, AVG(soil_organic_matter) as organic,
             AVG(environmental_score) as env_score
      FROM environment_records
      WHERE datetime(monitoring_date) >= datetime('now', '-30 days')
    `);
    const env = envStmt.get();

    const carbonStmt = db.prepare(`
      SELECT SUM(carbon_sequestered) as total_carbon
      FROM carbon_records
      WHERE datetime(created_at) >= datetime('now', '-30 days')
    `);
    const carbon = carbonStmt.get();

    let ctx = '\n\n【平台近期数据摘要】\n';
    if (energy?.avg_gen) {
      ctx += `- 近7天平均日发电量：${Number(energy.avg_gen).toFixed(1)} kWh，平均用电：${Number(energy.avg_con).toFixed(1)} kWh\n`;
    }
    if (env?.ph) {
      ctx += `- 近30天平均土壤pH：${Number(env.ph).toFixed(1)}，有机质：${Number(env.organic).toFixed(1)}%，环境评分：${Number(env.env_score).toFixed(0)}\n`;
    }
    if (carbon?.total_carbon) {
      ctx += `- 近30天碳汇总量：${Number(carbon.total_carbon).toFixed(1)} 吨CO₂\n`;
    }
    return ctx;
  } catch {
    return '';
  }
}

// Rule-based fallback responses
const RULE_RESPONSES = [
  {
    keywords: ['水稻', '插秧', '种植'],
    answer: '水稻种植关键要点：\n1. **选种**：选择适合本地气候的优质品种\n2. **育秧**：播种前晒种2-3天，浸种催芽\n3. **插秧**：秧龄25-30天，行距20cm×20cm\n4. **水管**：浅水插秧，深水活棵，薄水分蘖\n5. **施肥**：基肥+追肥，氮磷钾合理配比\n\n结合光伏农业，可利用光伏板下的漫射光，适当密植。'
  },
  {
    keywords: ['光伏', '发电', '太阳能', '能源'],
    answer: '农光互补光伏系统优化建议：\n1. **朝向**：面向正南，倾角与纬度相近\n2. **清洁**：定期清洁组件，提升发电效率5-10%\n3. **监控**：实时监测发电量，及时发现故障\n4. **储能**：配置储能系统，提高自用率\n5. **农业协同**：光伏板下种植耐阴作物（如茶叶、食用菌）\n\n当前平台已记录您的发电数据，可在能源管理页查看详细分析。'
  },
  {
    keywords: ['碳汇', '碳减排', '碳中和', '碳'],
    answer: '农业碳汇提升方法：\n1. **秸秆还田**：增加土壤有机碳，每亩可固碳0.1-0.3吨/年\n2. **绿肥种植**：豆科绿肥固氮，减少化肥用量\n3. **保护性耕作**：减少翻耕，保持土壤碳库\n4. **光伏替代**：光伏发电替代化石能源，直接减排\n5. **精准施肥**：减少N₂O排放\n\n平台碳汇计算模块可帮您量化碳减排成果，生成碳汇证书。'
  },
  {
    keywords: ['土壤', '肥力', 'pH', '有机质'],
    answer: '土壤健康管理要点：\n1. **pH调节**：偏酸（<6.0）施石灰，偏碱（>7.5）施硫磺\n2. **有机质提升**：施用有机肥、堆肥，目标>2%\n3. **氮磷钾平衡**：根据土测结果精准施肥\n4. **生物多样性**：减少农药，保护土壤微生物\n5. **水分管理**：避免过度灌溉导致养分流失\n\n建议每季度进行一次土壤检测，在环境监测页记录数据。'
  },
  {
    keywords: ['病虫害', '防治', '农药', '病害'],
    answer: '病虫害绿色防控策略：\n1. **农业防治**：轮作换茬，清洁田园，选用抗病品种\n2. **物理防治**：黄板诱虫、杀虫灯、防虫网\n3. **生物防治**：释放天敌（赤眼蜂等），使用生物农药\n4. **化学防治**：优先低毒低残留农药，严格安全间隔期\n5. **AI识别**：上传作物图片，平台AI可辅助识别病虫害\n\n光伏农业中，光伏板可减少部分害虫，但需注意通风防湿。'
  }
];

function getRuleBasedAnswer(question, knowledgeCtx) {
  for (const rule of RULE_RESPONSES) {
    if (rule.keywords.some(k => question.includes(k))) {
      return rule.answer + (knowledgeCtx ? '\n\n' + knowledgeCtx.replace('【相关知识库内容】\n', '**相关经验：**\n') : '');
    }
  }
  return null;
}

export default async function aiRoutes(fastify) {
  // Chat endpoint
  fastify.post('/api/ai/chat', async (request, reply) => {
    const { message, history = [], includeData = false } = request.body;

    if (!message || message.trim().length === 0) {
      return reply.status(400).send({ error: '消息不能为空' });
    }

    const knowledgeCtx = getKnowledgeContext(message);
    const dataCtx = includeData ? getDataContext() : '';

    // Try ModelScope AI (via services/ai.js)
    try {
      const fullPrompt = SYSTEM_PROMPT + knowledgeCtx + dataCtx + '\n\n用户问题：' + message;
      const answer = await getAgriWisdom(fullPrompt);

      if (answer && answer !== 'Unable to provide answer at this time') {
        try {
          db.prepare(`INSERT INTO activity_logs (user_id, action_type, action_data) VALUES (1, 'ai_chat', ?)`).run(
            JSON.stringify({ question: message.slice(0, 100), answer: answer.slice(0, 200) })
          );
        } catch {}
        return { answer, source: 'ai', hasKnowledge: knowledgeCtx.length > 0 };
      }
    } catch (err) {
      fastify.log.warn('ModelScope AI call failed, using rule-based fallback:', err.message);
    }

    // Rule-based fallback
    const ruleAnswer = getRuleBasedAnswer(message, knowledgeCtx);
    if (ruleAnswer) {
      return { answer: ruleAnswer, source: 'knowledge', hasKnowledge: true };
    }

    // Generic fallback
    const genericAnswer = `感谢您的提问！关于"${message.slice(0, 20)}..."，建议您：\n\n` +
      `1. 查阅平台**知识库**中的相关农事经验\n` +
      `2. 在**作物分析**页上传图片获取AI诊断\n` +
      `3. 查看**环境监测**数据了解当前田间状况\n` +
      (knowledgeCtx ? '\n' + knowledgeCtx.replace('【相关知识库内容】\n', '**相关知识库内容：**\n') : '') +
      `\n\n如需更精准的AI回答，请配置API密钥（支持OpenAI或阿里云百炼）。`;

    return { answer: genericAnswer, source: 'fallback', hasKnowledge: knowledgeCtx.length > 0 };
  });

  // Get suggested questions based on current data
  fastify.get('/api/ai/suggestions', async () => {
    const suggestions = [
      '当前土壤pH偏低，如何调节？',
      '光伏板下适合种植哪些作物？',
      '如何提高碳汇量？',
      '水稻分蘖期需要注意什么？',
      '近期天气对发电量有什么影响？',
      '如何防治水稻纹枯病？',
      '有机肥和化肥如何配合使用？',
      '农光互补系统如何优化收益？'
    ];
    return { suggestions };
  });
}
