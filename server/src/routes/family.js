import db from '../database.js';
import { calculatePoints } from '../services/knowledge-base.js';

export default async function familyRoutes(fastify) {

  fastify.get('/api/family/members', async (request, reply) => {
    const stmt = db.prepare(`
      SELECT * FROM family_members
      ORDER BY points DESC
    `);

    const members = stmt.all();

    return members;
  });

  fastify.post('/api/family/member', async (request, reply) => {
    const { name, role, avatar } = request.body;

    const stmt = db.prepare(`
      INSERT INTO family_members (name, role, avatar)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(name, role || '家庭成员', avatar || null);

    const points = calculatePoints('first_contribution');
    const pointsStmt = db.prepare(`
      INSERT INTO points_history (member_id, points, action_type, description)
      VALUES (?, ?, ?, ?)
    `);
    pointsStmt.run(result.lastInsertRowid, points, 'first_contribution', '加入家庭');

    const updateStmt = db.prepare(`
      UPDATE family_members
      SET points = points + ?
      WHERE id = ?
    `);
    updateStmt.run(points, result.lastInsertRowid);

    return {
      id: result.lastInsertRowid,
      name,
      role,
      avatar,
      points
    };
  });

  fastify.get('/api/family/leaderboard', async (request, reply) => {
    const { period = 'all' } = request.query;

    let leaderboard;

    if (period === 'all') {
      const stmt = db.prepare(`
        SELECT id, name, role, avatar,
               points as total_points,
               contribution_count,
               points as period_points
        FROM family_members
        ORDER BY total_points DESC
      `);
      leaderboard = stmt.all();
    } else {
      const days = period === 'week' ? 7 : 30;
      const stmt = db.prepare(`
        SELECT fm.id, fm.name, fm.role, fm.avatar,
               fm.points as total_points,
               fm.contribution_count,
               COALESCE(SUM(ph.points), 0) as period_points
        FROM family_members fm
        LEFT JOIN points_history ph
          ON fm.id = ph.member_id
          AND datetime(ph.created_at) >= datetime('now', '-' || ? || ' days')
        GROUP BY fm.id
        ORDER BY period_points DESC, total_points DESC
      `);
      leaderboard = stmt.all(days);
    }

    return leaderboard;
  });

  fastify.post('/api/family/points', async (request, reply) => {
    const { memberId, points, actionType, description } = request.body;

    const stmt = db.prepare(`
      INSERT INTO points_history (member_id, points, action_type, description)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(memberId, points, actionType, description);

    const updateStmt = db.prepare(`
      UPDATE family_members
      SET points = points + ?, last_active = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(points, memberId);

    return { success: true, points };
  });

  fastify.get('/api/family/achievements/:memberId', async (request, reply) => {
    const { memberId } = request.params;

    const stmt = db.prepare(`
      SELECT * FROM achievements
      WHERE member_id = ?
      ORDER BY earned_at DESC
    `);

    const achievements = stmt.all(memberId);

    return achievements;
  });

  fastify.post('/api/family/achievement', async (request, reply) => {
    const { memberId, achievementType, achievementName, description, icon } = request.body;

    const stmt = db.prepare(`
      INSERT INTO achievements (member_id, achievement_type, achievement_name, description, icon)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(memberId, achievementType, achievementName, description, icon);

    return {
      id: result.lastInsertRowid,
      achievementName,
      description
    };
  });

  fastify.get('/api/family/activity', async (request, reply) => {
    const { limit = 20 } = request.query;

    const stmt = db.prepare(`
      SELECT
        ph.id,
        ph.points,
        ph.action_type,
        ph.description,
        ph.created_at,
        fm.name as member_name,
        fm.avatar as member_avatar
      FROM points_history ph
      JOIN family_members fm ON ph.member_id = fm.id
      ORDER BY ph.created_at DESC
      LIMIT ?
    `);

    const activities = stmt.all(parseInt(limit));

    return activities;
  });
}
