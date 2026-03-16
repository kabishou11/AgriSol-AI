import db from '../database.js';
import { formatRecordDates } from '../utils/date-formatter.js';
import { getAllSystemPrompts } from '../services/prompt-manager.js';

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

      return formatRecordDates({ ...user, ...extUser, stats });
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
      return { history: history.map(formatRecordDates), total, limit, offset };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // AI config management
  fastify.get('/api/user/ai-config', async (request, reply) => {
    try {
      const userId = request.query.userId || 1;
      const prompts = getAllSystemPrompts();
      return { prompts, apiKeyConfigured: !!process.env.MODELSCOPE_API_KEY };
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
