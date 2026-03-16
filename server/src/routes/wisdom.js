import db from '../database.js';
import { organizeWisdomText, extractKeywords, calculatePoints } from '../services/knowledge-base.js';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { join } from 'path';

export default async function wisdomRoutes(fastify) {

  fastify.post('/api/wisdom/record', async (request, reply) => {
    const { title, content, tags, category, memberId } = request.body;

    const keywords = extractKeywords(content);
    const tagsArray = tags || keywords;

    const stmt = db.prepare(`
      INSERT INTO wisdom_records (title, content, tags, category, user_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title,
      content,
      JSON.stringify(tagsArray),
      category || 'general',
      memberId || null
    );

    if (memberId) {
      const points = calculatePoints('record_wisdom', { hasAudio: false, hasImages: false });
      const pointsStmt = db.prepare(`
        INSERT INTO points_history (member_id, points, action_type, description)
        VALUES (?, ?, ?, ?)
      `);
      pointsStmt.run(memberId, points, 'record_wisdom', '记录农事经验');

      const updateMemberStmt = db.prepare(`
        UPDATE family_members
        SET points = points + ?, contribution_count = contribution_count + 1, last_active = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateMemberStmt.run(points, memberId);
    }

    return {
      id: result.lastInsertRowid,
      title,
      content,
      tags: tagsArray,
      category,
      keywords
    };
  });

  fastify.post('/api/wisdom/record-audio', async (request, reply) => {
    const data = await request.file();

    const audioPath = `uploads/audio/${Date.now()}.webm`;
    const absoluteAudioPath = join(process.cwd(), audioPath);
    await pipeline(data.file, createWriteStream(absoluteAudioPath));

    const { title, content, tags, category, memberId, duration } = request.body || {};

    const organized = await organizeWisdomText(content || '语音记录');

    const stmt = db.prepare(`
      INSERT INTO wisdom_records (title, content, audio_path, audio_duration, tags, category, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title || organized.title,
      content || organized.content,
      audioPath,
      duration || 0,
      JSON.stringify(tags || organized.keywords),
      category || 'general',
      memberId || null
    );

    if (memberId) {
      const points = calculatePoints('record_wisdom', { hasAudio: true });
      const pointsStmt = db.prepare(`
        INSERT INTO points_history (member_id, points, action_type, description)
        VALUES (?, ?, ?, ?)
      `);
      pointsStmt.run(memberId, points, 'record_wisdom', '语音记录农事经验');

      const updateMemberStmt = db.prepare(`
        UPDATE family_members
        SET points = points + ?, contribution_count = contribution_count + 1, last_active = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateMemberStmt.run(points, memberId);
    }

    return {
      id: result.lastInsertRowid,
      audioPath,
      ...organized
    };
  });

  fastify.get('/api/wisdom/search', async (request, reply) => {
    const { keyword, category, page = 1, pageSize = 20 } = request.query;

    let query = 'SELECT * FROM wisdom_records WHERE 1=1';
    const params = [];

    if (keyword) {
      query += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)';
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

    const stmt = db.prepare(query);
    const records = stmt.all(...params);

    const countQuery = query.split('ORDER BY')[0].replace('SELECT *', 'SELECT COUNT(*) as total');
    const countStmt = db.prepare(countQuery);
    const { total } = countStmt.get(...params.slice(0, -2));

    return {
      records: records.map(r => ({
        ...r,
        tags: (() => { try { return JSON.parse(r.tags || '[]'); } catch { return r.tags ? r.tags.split(',').map(t => t.trim()) : []; } })(),
        imagePaths: (() => { try { return JSON.parse(r.image_paths || '[]'); } catch { return []; } })()
      })),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  });

  fastify.get('/api/wisdom/categories', async (request, reply) => {
    const stmt = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM wisdom_records
      GROUP BY category
      ORDER BY count DESC
    `);

    const categories = stmt.all();

    return categories;
  });

  fastify.post('/api/wisdom/favorite', async (request, reply) => {
    const { wisdomId, memberId } = request.body;

    try {
      const stmt = db.prepare(`
        INSERT INTO wisdom_favorites (wisdom_id, member_id)
        VALUES (?, ?)
      `);
      stmt.run(wisdomId, memberId);

      const updateStmt = db.prepare(`
        UPDATE wisdom_records
        SET favorite_count = favorite_count + 1
        WHERE id = ?
      `);
      updateStmt.run(wisdomId);

      return { success: true };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint')) {
        return { success: false, message: '已经收藏过了' };
      }
      throw error;
    }
  });

  fastify.delete('/api/wisdom/favorite', async (request, reply) => {
    const { wisdomId, memberId } = request.body;

    const stmt = db.prepare(`
      DELETE FROM wisdom_favorites
      WHERE wisdom_id = ? AND member_id = ?
    `);
    stmt.run(wisdomId, memberId);

    const updateStmt = db.prepare(`
      UPDATE wisdom_records
      SET favorite_count = favorite_count - 1
      WHERE id = ?
    `);
    updateStmt.run(wisdomId);

    return { success: true };
  });

  fastify.get('/api/wisdom/popular', async (request, reply) => {
    const { limit = 10 } = request.query;

    const stmt = db.prepare(`
      SELECT * FROM wisdom_records
      ORDER BY (view_count * 1 + favorite_count * 3 + share_count * 2) DESC
      LIMIT ?
    `);

    const records = stmt.all(parseInt(limit));

    return records.map(r => ({
      ...r,
      tags: (() => { try { return JSON.parse(r.tags || '[]'); } catch { return r.tags ? r.tags.split(',').map(t => t.trim()) : []; } })(),
      imagePaths: (() => { try { return JSON.parse(r.image_paths || '[]'); } catch { return []; } })()
    }));
  });

  fastify.get('/api/wisdom/:id', async (request, reply) => {
    const { id } = request.params;

    const stmt = db.prepare('SELECT * FROM wisdom_records WHERE id = ?');
    const record = stmt.get(id);

    if (!record) {
      reply.code(404);
      return { error: 'Wisdom not found' };
    }

    const updateViewStmt = db.prepare(`
      UPDATE wisdom_records
      SET view_count = view_count + 1
      WHERE id = ?
    `);
    updateViewStmt.run(id);

    return {
      ...record,
      tags: (() => { try { return JSON.parse(record.tags || '[]'); } catch { return record.tags ? record.tags.split(',').map(t => t.trim()) : []; } })(),
      imagePaths: (() => { try { return JSON.parse(record.image_paths || '[]'); } catch { return []; } })()
    };
  });
}
