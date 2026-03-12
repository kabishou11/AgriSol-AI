import db from '../database.js';
import { calculateEnvironmentalScore } from '../services/carbon.js';

export default async function environmentRoutes(fastify) {

  // Record environmental data
  fastify.post('/api/environment/record', async (request, reply) => {
    const {
      userId,
      soilPh,
      soilOrganicMatter,
      soilNitrogen,
      soilPhosphorus,
      soilPotassium,
      waterUsage,
      waterEfficiency,
      biodiversityScore,
      location,
      notes
    } = request.body;

    const indicators = {
      soilPh,
      soilOrganicMatter,
      soilNitrogen,
      soilPhosphorus,
      soilPotassium,
      waterEfficiency,
      biodiversityScore
    };

    const scoreResult = calculateEnvironmentalScore(indicators);

    const stmt = db.prepare(`
      INSERT INTO environment_records (
        user_id, soil_ph, soil_organic_matter, soil_nitrogen,
        soil_phosphorus, soil_potassium, water_usage, water_efficiency,
        biodiversity_score, environmental_score, location, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId || null,
      soilPh,
      soilOrganicMatter,
      soilNitrogen,
      soilPhosphorus,
      soilPotassium,
      waterUsage,
      waterEfficiency,
      biodiversityScore,
      scoreResult.totalScore,
      location,
      notes
    );

    return {
      id: result.lastInsertRowid,
      ...scoreResult,
      indicators
    };
  });

  // Get environmental indicators
  fastify.get('/api/environment/indicators', async (request, reply) => {
    const { userId, limit = 50, offset = 0 } = request.query;

    let query = 'SELECT * FROM environment_records';
    const params = [];

    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY monitoring_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const records = stmt.all(...params);

    return {
      records,
      limit,
      offset
    };
  });

  // Calculate environmental score
  fastify.post('/api/environment/score', async (request, reply) => {
    const indicators = request.body;

    if (!indicators || typeof indicators !== 'object') {
      return reply.code(400).send({ error: 'Invalid indicators data' });
    }

    const scoreResult = calculateEnvironmentalScore(indicators);

    return scoreResult;
  });

  // Get environmental statistics
  fastify.get('/api/environment/statistics', async (request, reply) => {
    const { userId, period = 'all' } = request.query;

    let dateFilter = '';
    if (period === 'month') {
      dateFilter = "AND monitoring_date >= date('now', '-1 month')";
    } else if (period === 'year') {
      dateFilter = "AND monitoring_date >= date('now', '-1 year')";
    }

    const userFilter = userId ? 'WHERE user_id = ?' : '';
    const params = userId ? [userId] : [];

    const statsQuery = `
      SELECT
        COUNT(*) as total_records,
        AVG(environmental_score) as avg_score,
        AVG(soil_ph) as avg_ph,
        AVG(soil_organic_matter) as avg_organic_matter,
        AVG(water_efficiency) as avg_water_efficiency,
        AVG(biodiversity_score) as avg_biodiversity
      FROM environment_records
      ${userFilter} ${dateFilter}
    `;

    const stmt = db.prepare(statsQuery);
    const stats = stmt.get(...params);

    return {
      ...stats,
      period
    };
  });

  // Get latest environmental data
  fastify.get('/api/environment/latest', async (request, reply) => {
    const { userId } = request.query;

    const query = userId
      ? 'SELECT * FROM environment_records WHERE user_id = ? ORDER BY monitoring_date DESC LIMIT 1'
      : 'SELECT * FROM environment_records ORDER BY monitoring_date DESC LIMIT 1';

    const stmt = db.prepare(query);
    const record = userId ? stmt.get(userId) : stmt.get();

    if (!record) {
      return reply.code(404).send({ error: 'No environmental data found' });
    }

    return record;
  });
}

