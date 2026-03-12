import db from '../database.js';

export default async function userRoutes(fastify) {

  fastify.get('/api/user/profile', async (request, reply) => {
    try {
      const userId = request.query.userId || 1;

      const stmt = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?');
      const user = stmt.get(userId);

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      const cropsStmt = db.prepare('SELECT COUNT(*) as count FROM crops WHERE user_id = ?');
      const energyStmt = db.prepare('SELECT COUNT(*) as count FROM energy WHERE user_id = ?');
      const carbonStmt = db.prepare('SELECT COUNT(*) as count FROM carbon WHERE user_id = ?');

      const stats = {
        totalCrops: cropsStmt.get(userId).count,
        totalEnergy: energyStmt.get(userId).count,
        totalCarbon: carbonStmt.get(userId).count
      };

      return { ...user, stats };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.put('/api/user/profile', async (request, reply) => {
    try {
      const { userId, username, email } = request.body;

      const stmt = db.prepare('UPDATE users SET username = ?, email = ? WHERE id = ?');
      const result = stmt.run(username, email, userId);

      if (result.changes === 0) {
        return reply.code(404).send({ error: 'User not found' });
      }

      const userStmt = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?');
      const user = userStmt.get(userId);

      const logStmt = db.prepare('INSERT INTO activity_logs (user_id, activity_type, activity_data) VALUES (?, ?, ?)');
      logStmt.run(userId, 'profile_update', JSON.stringify({ username, email }));

      return { success: true, user };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/api/user/settings', async (request, reply) => {
    try {
      const userId = request.query.userId || 1;

      let stmt = db.prepare('SELECT * FROM user_settings WHERE user_id = ?');
      let settings = stmt.get(userId);

      if (!settings) {
        const insertStmt = db.prepare('INSERT INTO user_settings (user_id) VALUES (?)');
        insertStmt.run(userId);
        settings = stmt.get(userId);
      }

      return settings;
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.put('/api/user/settings', async (request, reply) => {
    try {
      const { userId, theme, language, notifications_enabled, email_notifications, privacy_level } = request.body;

      const stmt = db.prepare(`
        UPDATE user_settings
        SET theme = ?, language = ?, notifications_enabled = ?, email_notifications = ?, privacy_level = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `);
      const result = stmt.run(theme, language, notifications_enabled, email_notifications, privacy_level, userId);

      if (result.changes === 0) {
        const insertStmt = db.prepare('INSERT INTO user_settings (user_id, theme, language, notifications_enabled, email_notifications, privacy_level) VALUES (?, ?, ?, ?, ?, ?)');
        insertStmt.run(userId, theme, language, notifications_enabled, email_notifications, privacy_level);
      }

      const logStmt = db.prepare('INSERT INTO activity_logs (user_id, activity_type, activity_data) VALUES (?, ?, ?)');
      logStmt.run(userId, 'settings_update', JSON.stringify({ theme, language, privacy_level }));

      const selectStmt = db.prepare('SELECT * FROM user_settings WHERE user_id = ?');
      const settings = selectStmt.get(userId);

      return { success: true, settings };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/api/user/history', async (request, reply) => {
    try {
      const { userId = 1, limit = 50, offset = 0 } = request.query;

      const stmt = db.prepare(`
        SELECT * FROM activity_logs
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `);
      const history = stmt.all(userId, limit, offset);

      const countStmt = db.prepare('SELECT COUNT(*) as total FROM activity_logs WHERE user_id = ?');
      const { total } = countStmt.get(userId);

      return { history, total, limit, offset };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });
}
