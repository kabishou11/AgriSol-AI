import db from '../database.js';
import { getAgriWisdom } from '../services/ai.js';
import { getSystemPromptById } from '../services/prompt-manager.js';

// Simple AI chat using rule-based + knowledge base context
// Falls back gracefully if no OpenAI key configured

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

function buildDailyInsightPayload({ energy, carbon, environment, crop, mode = 'national', regionCode }) {
  const formatNum = (value, digits = 1) => Number(value || 0).toFixed(digits);

  const generation = Number(energy?.total_generation || 0);
  const consumption = Number(energy?.total_consumption || 0);
  const selfSufficiencyPct = consumption > 0 ? Number(((generation / consumption) * 100).toFixed(1)) : 0;

  const envScore = Number(environment?.avg_env_score || 0);
  const cropHealth = Number(crop?.avg_health_score || 0);
  const totalCarbonTons = Number(carbon?.total_carbon_tons || 0);

  const insights = [];

  if (consumption === 0 && generation === 0) {
    insights.push({
      icon: '⚡',
      level: 'info',
      title: '能源数据待完善',
      desc: '今日暂无发用电记录，建议先录入基础能源数据以形成经营结论。',
      category: 'energy',
      actionKey: 'OPEN_ENERGY'
    });
  } else if (selfSufficiencyPct < 70) {
    insights.push({
      icon: '⚠️',
      level: 'warning',
      title: '能源自给率偏低',
      desc: `今日发电 ${formatNum(generation, 1)} kWh，用电 ${formatNum(consumption, 1)} kWh，自给率 ${formatNum(selfSufficiencyPct, 1)}%。建议优化用电时段。`,
      category: 'energy',
      actionKey: 'OPEN_ENERGY'
    });
  } else {
    insights.push({
      icon: '✅',
      level: 'success',
      title: '能源运行平稳',
      desc: `今日能源自给率 ${formatNum(selfSufficiencyPct, 1)}%，可继续保持当前发用电协同策略。`,
      category: 'energy',
      actionKey: 'OPEN_ENERGY'
    });
  }

  if (cropHealth > 0) {
    insights.push({
      icon: cropHealth >= 80 ? '🌾' : '🧪',
      level: cropHealth >= 80 ? 'success' : 'warning',
      title: cropHealth >= 80 ? '作物健康良好' : '作物健康需关注',
      desc: `近30天作物平均健康分 ${formatNum(cropHealth, 1)}，建议结合田间巡检持续跟踪。`,
      category: 'crop',
      actionKey: 'OPEN_CROP'
    });
  }

  if (envScore > 0) {
    insights.push({
      icon: envScore >= 75 ? '🌿' : '🌱',
      level: envScore >= 75 ? 'success' : 'warning',
      title: envScore >= 75 ? '环境指标稳定' : '环境指标有波动',
      desc: `近30天环境评分 ${formatNum(envScore, 0)}，建议关注土壤与水分管理，防止评分下滑。`,
      category: 'environment',
      actionKey: 'OPEN_ENVIRONMENT'
    });
  }

  insights.push({
    icon: totalCarbonTons > 0 ? '🌳' : '📘',
    level: totalCarbonTons > 0 ? 'success' : 'info',
    title: totalCarbonTons > 0 ? '碳账本持续积累' : '碳账本可开始补录',
    desc: totalCarbonTons > 0
      ? `近12个月累计固碳 ${formatNum(totalCarbonTons, 2)} 吨，建议生成月报用于申报准备。`
      : '尚未形成有效碳汇记录，建议先加入本月碳账本并生成月报。',
    category: 'carbon',
    actionKey: 'OPEN_CARBON'
  });

  const regionName = mode === 'shouguang' ? '山东寿光样板' : '全国通用';

  return {
    insights: insights.slice(0, 4),
    meta: {
      generatedAt: new Date().toISOString(),
      regionMode: mode,
      regionName,
      dataWindow: 'energy:1d,crop:30d,environment:30d,carbon:12m',
      regionCode: regionCode || null
    }
  };
}

function getDailyInsightMetrics({ date, userId }) {
  const uid = Number(userId) || 1;
  const params = [uid, date];

  const energy = db.prepare(`
    SELECT
      SUM(generation) AS total_generation,
      SUM(consumption) AS total_consumption
    FROM energy_records
    WHERE user_id = ?
      AND DATE(timestamp) = DATE(?)
  `).get(...params);

  const carbon = db.prepare(`
    SELECT
      SUM(carbon_sequestered) AS total_carbon_tons
    FROM carbon_records
    WHERE user_id = ?
      AND datetime(created_at) >= datetime(?, '-12 months')
  `).get(...params);

  const environment = db.prepare(`
    SELECT
      AVG(environmental_score) AS avg_env_score
    FROM environment_records
    WHERE user_id = ?
      AND datetime(monitoring_date) >= datetime(?, '-30 days')
  `).get(...params);

  const crop = db.prepare(`
    SELECT
      AVG(health_score) AS avg_health_score
    FROM crop_records
    WHERE user_id = ?
      AND datetime(created_at) >= datetime(?, '-30 days')
  `).get(...params);

  return { energy, carbon, environment, crop };
}

async function generateAiInsights({ energy, carbon, environment, crop, mode, regionCode }) {
  const formatNum = (value, digits = 1) => Number(value || 0).toFixed(digits);
  const generation = Number(energy?.total_generation || 0);
  const consumption = Number(energy?.total_consumption || 0);
  const selfSufficiencyPct = consumption > 0 ? Number(((generation / consumption) * 100).toFixed(1)) : 0;
  const envScore = Number(environment?.avg_env_score || 0);
  const cropHealth = Number(crop?.avg_health_score || 0);
  const totalCarbonTons = Number(carbon?.total_carbon_tons || 0);
  const regionName = mode === 'shouguang' ? '山东寿光样板' : '全国通用';

  const prompt = `你是AgriSol-AI农光智助平台的AI助手，请根据今日经营数据生成4条简明洞察：

能源：发电${formatNum(generation, 1)}kWh 用电${formatNum(consumption, 1)}kWh 自给率${formatNum(selfSufficiencyPct, 1)}%
作物：近30天健康分${formatNum(cropHealth, 1)}
环境：近30天评分${formatNum(envScore, 0)}
碳汇：近12月固碳${formatNum(totalCarbonTons, 2)}吨
地区：${regionName}

格式（每行一条）：
图标|级别|标题|描述|类别
示例：⚡|success|能源平稳|自给率85%保持策略|energy

图标：⚡✅⚠️🌾🧪🌿🌱🌳📘
级别：success/warning/info
类别：energy/crop/environment/carbon
直接输出4行，无其他文字。`;

  try {
    const aiResponse = await getAgriWisdom(prompt);
    if (!aiResponse || aiResponse === 'Unable to provide answer at this time') return null;

    const lines = aiResponse.trim().split('\n').filter(l => l.includes('|'));
    const actionKeyMap = { energy: 'OPEN_ENERGY', crop: 'OPEN_CROP', environment: 'OPEN_ENVIRONMENT', carbon: 'OPEN_CARBON' };
    const insights = lines.slice(0, 4).map(line => {
      const [icon, level, title, desc, category] = line.split('|').map(s => s.trim());
      return { icon, level, title, desc, category, actionKey: actionKeyMap[category] || 'OPEN_ENERGY' };
    });

    return insights.length >= 3 ? insights : null;
  } catch {
    return null;
  }
}

function getReportCache({ userId, reportType, reportPeriod }) {
  const row = db.prepare(`
    SELECT id, report_data, created_at
    FROM reports
    WHERE user_id = ? AND report_type = ? AND report_period = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(userId, reportType, reportPeriod);

  if (!row) return null;

  try {
    return {
      id: row.id,
      payload: JSON.parse(row.report_data),
      createdAt: row.created_at
    };
  } catch {
    return null;
  }
}

function upsertReportCache({ userId, reportType, reportPeriod, payload }) {
  const existing = db.prepare(`
    SELECT id
    FROM reports
    WHERE user_id = ? AND report_type = ? AND report_period = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(userId, reportType, reportPeriod);

  const serialized = JSON.stringify(payload);

  if (existing?.id) {
    db.prepare(`
      UPDATE reports
      SET report_data = ?, created_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(serialized, existing.id);
    return existing.id;
  }

  const result = db.prepare(`
    INSERT INTO reports (user_id, report_type, report_period, report_data)
    VALUES (?, ?, ?, ?)
  `).run(userId, reportType, reportPeriod, serialized);

  return result.lastInsertRowid;
}

export default async function aiRoutes(fastify) {
  // Dashboard daily briefing insights (server-side daily cache)
  fastify.get('/api/ai/insights/daily', async (request, reply) => {
    try {
      const {
        date,
        forceRefresh = false,
        mode = 'national',
        regionCode,
        userId = 1
      } = request.query || {};

      const targetDate = date || new Date().toISOString().slice(0, 10);
      const shouldForce = String(forceRefresh) === 'true' || forceRefresh === true;

      const reportType = `ai_daily_insights_${mode}`;
      const reportPeriod = targetDate;

      if (!shouldForce) {
        const cached = getReportCache({ userId: Number(userId), reportType, reportPeriod });
        if (cached?.payload?.insights) {
          const meta = {
            ...(cached.payload.meta || {}),
            generatedAt: cached.payload.meta?.generatedAt || cached.createdAt,
            cached: true,
            regionMode: mode,
            regionName: mode === 'shouguang' ? '山东寿光样板' : '全国通用',
            dataWindow: cached.payload.meta?.dataWindow || 'energy:1d,crop:30d,environment:30d,carbon:12m'
          };

          return {
            success: true,
            data: {
              insights: (cached.payload.insights || []).map(({ icon, level, title, desc, category, actionKey }) => ({
                icon,
                level,
                title,
                desc,
                category,
                actionKey
              }))
            },
            meta,
            message: 'ok'
          };
        }
      }

      const metrics = getDailyInsightMetrics({
        date: targetDate,
        userId: Number(userId)
      });

      // 尝试AI生成洞察
      const aiInsights = await generateAiInsights({
        ...metrics,
        mode,
        regionCode
      });

      let payload;
      if (aiInsights && aiInsights.length >= 3) {
        // AI生成成功
        payload = {
          insights: aiInsights,
          meta: {
            generatedAt: new Date().toISOString(),
            regionMode: mode,
            regionName: mode === 'shouguang' ? '山东寿光样板' : '全国通用',
            dataWindow: 'energy:1d,crop:30d,environment:30d,carbon:12m',
            source: 'ai'
          }
        };
      } else {
        // AI失败，回退到规则生成
        payload = buildDailyInsightPayload({
          ...metrics,
          mode,
          regionCode
        });
        payload.meta = { ...payload.meta, source: 'rule' };
      }

      upsertReportCache({
        userId: Number(userId),
        reportType,
        reportPeriod,
        payload
      });

      return {
        success: true,
        data: {
          insights: (payload.insights || []).map(({ icon, level, title, desc, category, actionKey }) => ({
            icon,
            level,
            title,
            desc,
            category,
            actionKey
          }))
        },
        meta: {
          ...(payload.meta || {}),
          cached: false,
          regionMode: mode,
          regionName: mode === 'shouguang' ? '山东寿光样板' : '全国通用',
          dataWindow: payload.meta?.dataWindow || 'energy:1d,crop:30d,environment:30d,carbon:12m'
        },
        message: 'ok'
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        data: { insights: [] },
        meta: {
          generatedAt: new Date().toISOString(),
          cached: false,
          regionMode: 'national',
          regionName: '全国通用',
          dataWindow: 'energy:1d,crop:30d,environment:30d,carbon:12m'
        },
        message: 'Failed to generate daily insights'
      });
    }
  });

  // Chat endpoint
  fastify.post('/api/ai/chat', async (request, reply) => {
    const {
      message,
      history = [],
      includeData = false,
      systemPromptId,
      customSystemPrompt,
      context
    } = request.body;

    if (!message || message.trim().length === 0) {
      return reply.status(400).send({ error: '消息不能为空' });
    }

    // 选择系统提示词
    const defaultPreset = getSystemPromptById('general');
    let activeSystemPrompt = defaultPreset?.systemPrompt || '你是AgriSol-AI农光智助平台的AI助手。';
    if (customSystemPrompt) {
      activeSystemPrompt = customSystemPrompt;
    } else if (systemPromptId) {
      const preset = getSystemPromptById(systemPromptId);
      if (preset) activeSystemPrompt = preset.systemPrompt;
    }

    const knowledgeCtx = getKnowledgeContext(message);
    const dataCtx = includeData ? getDataContext() : '';
    const historyCtx = Array.isArray(history) && history.length
      ? `\n\n【最近对话摘要】\n${history.slice(-5).map((item) => {
        const role = item?.role === 'assistant' ? '助手' : '用户';
        return `${role}：${String(item?.content || '').slice(0, 120)}`;
      }).join('\n')}`
      : '';
    const pageCtx = context?.pageName
      ? `\n\n【页面上下文】\n当前页面：${context.pageName}${context.page ? ` (${context.page})` : ''}`
      : '';

    // Try ModelScope AI (via services/ai.js)
    try {
      const fullPrompt = activeSystemPrompt + knowledgeCtx + dataCtx + historyCtx + pageCtx + '\n\n用户问题：' + message;
      const answer = await getAgriWisdom(fullPrompt);

      if (answer && answer !== 'Unable to provide answer at this time') {
        try {
          db.prepare(`INSERT INTO activity_logs (user_id, action_type, action_data) VALUES (1, 'ai_chat', ?)`).run(
            JSON.stringify({ question: message.slice(0, 100), answer: answer.slice(0, 200) })
          );
        } catch {}
        return { answer, source: 'ai', hasKnowledge: knowledgeCtx.length > 0, agents: [] };
      }
    } catch (err) {
      fastify.log.warn('ModelScope AI call failed, using rule-based fallback:', err.message);
    }

    // Rule-based fallback
    const ruleAnswer = getRuleBasedAnswer(message, knowledgeCtx + historyCtx + pageCtx);
    if (ruleAnswer) {
      return { answer: ruleAnswer, source: 'knowledge', hasKnowledge: true, agents: [] };
    }

    // Generic fallback
    const genericAnswer = `感谢您的提问！关于"${message.slice(0, 20)}..."，建议您：\n\n` +
      `1. 查阅平台**知识库**中的相关农事经验\n` +
      `2. 在**作物分析**页上传图片获取AI诊断\n` +
      `3. 查看**环境监测**数据了解当前田间状况\n` +
      (knowledgeCtx ? '\n' + knowledgeCtx.replace('【相关知识库内容】\n', '**相关知识库内容：**\n') : '') +
      `\n\n如需更精准的AI回答，请配置API密钥（支持OpenAI或阿里云百炼）。`;

    return { answer: genericAnswer, source: 'fallback', hasKnowledge: knowledgeCtx.length > 0, agents: [] };
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
