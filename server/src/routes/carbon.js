import db from '../database.js';
import {
  calculateCarbonSequestration,
  generateCertificateId,
  getCropTypes
} from '../services/carbon.js';

export default async function carbonRoutes(fastify) {

  // Calculate carbon sequestration
  fastify.post('/api/carbon/calculate', async (request, reply) => {
    const { cropType, area, areaUnit, duration } = request.body;

    if (!cropType || !area || area <= 0) {
      return reply.code(400).send({ error: 'Invalid input parameters' });
    }

    const calculation = calculateCarbonSequestration(
      cropType,
      area,
      areaUnit || 'hectare',
      duration || 12
    );

    return calculation;
  });

  // Record carbon data
  fastify.post('/api/carbon/record', async (request, reply) => {
    const {
      cropType,
      area,
      areaUnit,
      duration,
      userId
    } = request.body;

    if (!cropType || !area || area <= 0) {
      return reply.code(400).send({ error: 'Invalid input parameters' });
    }

    const calculation = calculateCarbonSequestration(
      cropType,
      area,
      areaUnit || 'hectare',
      duration || 12
    );

    const certificateId = generateCertificateId();

    const stmt = db.prepare(`
      INSERT INTO carbon_records (
        user_id, crop_type, planting_area, area_unit, planting_duration,
        carbon_sequestered, equivalent_trees, emission_reduction,
        calculation_method, certificate_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId || null,
      cropType,
      area,
      areaUnit || 'hectare',
      duration || 12,
      calculation.totalSequestered,
      calculation.equivalentTrees,
      JSON.stringify(calculation.emissionReduction),
      calculation.calculationMethod,
      certificateId
    );

    return {
      id: result.lastInsertRowid,
      certificateId,
      ...calculation
    };
  });

  // Get carbon ledger
  fastify.get('/api/carbon/ledger', async (request, reply) => {
    const { userId, limit = 50, offset = 0 } = request.query;

    let query = 'SELECT * FROM carbon_records';
    const params = [];

    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const records = stmt.all(...params);

    const countStmt = db.prepare(
      userId
        ? 'SELECT COUNT(*) as total FROM carbon_records WHERE user_id = ?'
        : 'SELECT COUNT(*) as total FROM carbon_records'
    );
    const { total } = userId ? countStmt.get(userId) : countStmt.get();

    return {
      records: records.map(record => ({
        ...record,
        emission_reduction: JSON.parse(record.emission_reduction)
      })),
      total,
      limit,
      offset
    };
  });

  // Get carbon statistics
  fastify.get('/api/carbon/statistics', async (request, reply) => {
    const { userId, period = 'all' } = request.query;

    let dateFilter = '';
    if (period === 'month') {
      dateFilter = "AND created_at >= date('now', '-1 month')";
    } else if (period === 'year') {
      dateFilter = "AND created_at >= date('now', '-1 year')";
    }

    const userFilter = userId ? 'WHERE user_id = ?' : '';
    const params = userId ? [userId] : [];

    const statsQuery = `
      SELECT
        COUNT(*) as total_records,
        SUM(carbon_sequestered) as total_carbon,
        SUM(equivalent_trees) as total_trees,
        AVG(carbon_sequestered) as avg_carbon,
        crop_type
      FROM carbon_records
      ${userFilter} ${dateFilter}
      GROUP BY crop_type
    `;

    const stmt = db.prepare(statsQuery);
    const cropStats = stmt.all(...params);

    const totalQuery = `
      SELECT
        COUNT(*) as total_records,
        SUM(carbon_sequestered) as total_carbon,
        SUM(equivalent_trees) as total_trees
      FROM carbon_records
      ${userFilter} ${dateFilter}
    `;

    const totalStmt = db.prepare(totalQuery);
    const totals = totalStmt.get(...params);

    return {
      totals,
      byCropType: cropStats,
      period
    };
  });

  // Get certificate data
  fastify.get('/api/carbon/certificate/:certificateId', async (request, reply) => {
    const { certificateId } = request.params;

    const stmt = db.prepare('SELECT * FROM carbon_records WHERE certificate_id = ?');
    const record = stmt.get(certificateId);

    if (!record) {
      return reply.code(404).send({ error: 'Certificate not found' });
    }

    return {
      ...record,
      emission_reduction: JSON.parse(record.emission_reduction)
    };
  });

  // Get crop types
  fastify.get('/api/carbon/crop-types', async (request, reply) => {
    return getCropTypes();
  });
}

