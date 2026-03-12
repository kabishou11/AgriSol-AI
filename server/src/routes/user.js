import db from '../database.js';

const normalizeDates = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const r = { ...obj };
  for (const k of Object.keys(r)) {
    if (typeof r[k] === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(r[k])) {
      r[k] = r[k].replace(' ', 'T') + 'Z';
    }
  }
  return r;
};

export default async function userRoutes(fastify) {

  fastify.get('/api/user/profile', async (request, reply) => {
    try {
      const userId = request.query.userId || 1;
      const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(userId);
      if (!user) return reply.code(404).send({ error: 'User not found' });

      const stats = {
        totalCrops:   db.prepare('SELECT COUNT(*) as c FROM crop_records WHERE user_id = ?').get(userId)?.c || 0,
        totalEnergy:  db.prepare('SELECT COUNT(*) as c FROM energy_records WHERE user_id = ?').get(userId)?.c || 0,
        totalCarbon:  db.prepare('SELECT COUNT(*) as c FROM carbon_records WHERE user_id = ?').get(userId)?.c || 0,
        totalWisdom:  db.prepare('SELECT COUNT(*) as c FROM wisdom_records WHERE user_id = ?').get(userId)?.c || 0,
        totalEnvRecords: db.prepare('SELECT COUNT(*) as c FROM environment_records WHERE user_id = ?').get(userId)?.c || 0,
        avgHealthScore: Math.round((db.prepare('SELECT AVG(health_score) as v FROM crop_records WHERE user_id = ?').get(userId)?.v || 0) * 10) / 10,
        totalCarbonSeq: Math.round((db.prepare('SELECT SUM(carbon_sequestered) as v FROM carbon_records WHERE user_id = ?').get(userId)?.v || 0) * 10) / 10,
        totalGeneration: Math.round((db.prepare('SELECT SUM(generation) as v FROM energy_records WHERE user_id = ?').get(userId)?.v || 0) * 10) / 10,
      };

      // Extended user fields from seed
      const extUser = db.prepare('SELECT phone, location, farm_area, avatar FROM users WHERE id = ?').get(userId);

      return normalizeDates({ ...user, ...extUser, stats });
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.put('/api/user/profile', async (request, reply) => {
    try {
      const { userId = 1, username, email, phone, location, farm_area } = request.body;

      // Try extended update first, fall back to basic
      try {
        db.prepare('UPDATE users SET username=?, email=?, phone=?, location=?, farm_area=? WHERE id=?')
          .run(username, email, phone || null, location || null, farm_area || 0, userId);
      } catch {
        db.prepare('UPDATE users SET username=?, email=? WHERE id=?').run(username, email, userId);
      }

      db.prepare('INSERT INTO activity_logs (user_id, action_type, action_data) VALUES (?,?,?)')
        .run(userId, 'profile_update', JSON.stringify({ username, email }));

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      return { success: true, user };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/api/user/settings', async (request, reply) => {
    try {
      const userId = request.query.userId || 1;
      let settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
      if (!settings) {
        db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(userId);
        settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
      }
      // Parse ai_config if stored as JSON
      if (settings?.ai_config && typeof settings.ai_config === 'string') {
        try { settings.ai_config = JSON.parse(settings.ai_config); } catch {}
      }
      return settings;
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.put('/api/user/settings', async (request, reply) => {
    try {
      const { userId = 1, theme, language, notifications_enabled, email_notifications, privacy_level, ai_config } = request.body;

      const aiConfigStr = ai_config ? JSON.stringify(ai_config) : null;

      // Try with ai_config column, fall back without
      try {
        const r = db.prepare(`
          UPDATE user_settings
          SET theme=?, language=?, notifications_enabled=?, email_notifications=?, privacy_level=?,
              ai_config=COALESCE(?, ai_config), updated_at=CURRENT_TIMESTAMP
          WHERE user_id=?
        `).run(theme, language, notifications_enabled ? 1 : 0, email_notifications ? 1 : 0, privacy_level, aiConfigStr, userId);

        if (r.changes === 0) {
          db.prepare('INSERT INTO user_settings (user_id, theme, language, notifications_enabled, email_notifications, privacy_level) VALUES (?,?,?,?,?,?)')
            .run(userId, theme, language, notifications_enabled ? 1 : 0, email_notifications ? 1 : 0, privacy_level);
        }
      } catch {
        const r = db.prepare(`
          UPDATE user_settings SET theme=?, language=?, notifications_enabled=?, email_notifications=?, privacy_level=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?
        `).run(theme, language, notifications_enabled ? 1 : 0, email_notifications ? 1 : 0, privacy_level, userId);
        if (r.changes === 0) {
          db.prepare('INSERT INTO user_settings (user_id, theme, language, notifications_enabled, email_notifications, privacy_level) VALUES (?,?,?,?,?,?)')
            .run(userId, theme, language, notifications_enabled ? 1 : 0, email_notifications ? 1 : 0, privacy_level);
        }
      }

      db.prepare('INSERT INTO activity_logs (user_id, action_type, action_data) VALUES (?,?,?)')
        .run(userId, 'settings_update', JSON.stringify({ theme, language, privacy_level }));

      const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
      return { success: true, settings };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/api/user/history', async (request, reply) => {
    try {
      const { userId = 1, limit = 50, offset = 0 } = request.query;
      const history = db.prepare(`
        SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
      `).all(userId, parseInt(limit), parseInt(offset));
      const { total } = db.prepare('SELECT COUNT(*) as total FROM activity_logs WHERE user_id = ?').get(userId);
      return { history: history.map(normalizeDates), total, limit, offset };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // AI config management
  fastify.get('/api/user/ai-config', async (request, reply) => {
    try {
      const userId = request.query.userId || 1;
      // Return current AI config + available prompts
      const prompts = [
        { id: 'crop_analysis', name: '作物分析助手', system: '你是专业的农业作物分析AI，擅长识别病虫害、评估作物健康状态，给出精准的农业建议。', active: true },
        { id: 'energy_advisor', name: '能源优化顾问', system: '你是光伏农业能源管理专家，专注于农光互补系统的发电优化、储能配置和能源效率提升。', active: true },
        { id: 'carbon_expert', name: '碳汇计算专家', system: '你是农业碳汇领域专家，熟悉碳汇计算方法、碳交易政策，能帮助农户最大化碳汇收益。', active: true },
        { id: 'env_monitor', name: '环境监测分析师', system: '你是农业生态环境专家，专注于土壤健康、水资源管理、生物多样性保护，提供科学的环境改善建议。', active: true },
        { id: 'wisdom_organizer', name: '农事经验整理师', system: '你是农业知识管理专家，擅长将口述农事经验整理成结构化知识，提炼关键技术要点。', active: false },
        { id: 'general', name: '通用农业助手', system: '你是AgriSol-AI农光智助平台的综合AI助手，覆盖农业、能源、碳汇、环境等全领域，为农户提供一站式智慧农业服务。', active: false }
      ];
      return { prompts, apiKeyConfigured: !!(process.env.OPENAI_API_KEY || process.env.DASHSCOPE_API_KEY) };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Export data
  fastify.get('/api/user/export', async (request, reply) => {
    try {
      const userId = request.query.userId || 1;
      const crops = db.prepare('SELECT * FROM crop_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(userId);
      const energy = db.prepare('SELECT * FROM energy_records WHERE user_id = ? ORDER BY timestamp DESC LIMIT 100').all(userId);
      const carbon = db.prepare('SELECT * FROM carbon_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(userId);
      const wisdom = db.prepare('SELECT id, title, category, tags, created_at FROM wisdom_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(userId);
      return { crops, energy, carbon, wisdom, exportedAt: new Date().toISOString() };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });
}
