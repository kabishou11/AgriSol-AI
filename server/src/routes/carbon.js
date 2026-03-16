import db from '../database.js';
import {
  calculateCarbonSequestration,
  generateCertificateId,
  getCropTypes
} from '../services/carbon.js';

function toNumber(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

function normalizeCropType(cropType) {
  const map = {
    水稻: 'rice',
    小麦: 'wheat',
    玉米: 'corn',
    大豆: 'soybean',
    蔬菜: 'vegetables',
    果树: 'default',
    rice: 'rice',
    wheat: 'wheat',
    corn: 'corn',
    soybean: 'soybean',
    vegetables: 'vegetables',
    cotton: 'cotton',
    sugarcane: 'sugarcane',
    potato: 'potato'
  };

  return map[cropType] || 'default';
}

function normalizeAreaUnit(unit) {
  const map = {
    亩: 'mu',
    公顷: 'hectare',
    平方米: 'sqm',
    acre: 'acre',
    hectare: 'hectare',
    mu: 'mu',
    sqm: 'sqm'
  };
  return map[unit] || 'hectare';
}

function monthPeriod(month) {
  if (month && /^\d{4}-\d{2}$/.test(month)) return month;
  return new Date().toISOString().slice(0, 7);
}

function shouldUseLegacyFallback(uid) {
  return uid === 1;
}

function hasAnyValue(row, fields) {
  return fields.some((field) => row?.[field] !== null && row?.[field] !== undefined);
}

function summarizeMonthlyReport({ month, userId }) {
  const scope = db.prepare(`
    SELECT
      COUNT(*) AS record_count,
      SUM(carbon_sequestered) AS total_carbon_tons,
      SUM(equivalent_trees) AS total_trees,
      AVG(carbon_sequestered) AS avg_carbon_tons
    FROM carbon_records
    WHERE user_id = ?
      AND strftime('%Y-%m', created_at) = ?
  `).get(userId, month);

  const byCrop = db.prepare(`
    SELECT
      crop_type,
      COUNT(*) AS count,
      SUM(carbon_sequestered) AS total_carbon_tons
    FROM carbon_records
    WHERE user_id = ?
      AND strftime('%Y-%m', created_at) = ?
    GROUP BY crop_type
    ORDER BY total_carbon_tons DESC
  `).all(userId, month);

  return {
    month,
    recordCount: Number(scope?.record_count || 0),
    totalCarbonTons: toNumber(scope?.total_carbon_tons || 0, 3),
    equivalentTrees: Number(scope?.total_trees || 0),
    averagePerRecordTons: toNumber(scope?.avg_carbon_tons || 0, 3),
    byCropType: byCrop.map((item) => ({
      cropType: item.crop_type,
      count: Number(item.count || 0),
      totalCarbonTons: toNumber(item.total_carbon_tons || 0, 3)
    }))
  };
}

export default async function carbonRoutes(fastify) {

  // Calculate carbon sequestration
  fastify.post('/api/carbon/calculate', async (request, reply) => {
    const { cropType, area, areaUnit, duration } = request.body;

    if (!cropType || !area || area <= 0) {
      return reply.code(400).send({ error: 'Invalid input parameters' });
    }

    const normalizedCropType = normalizeCropType(cropType);
    const normalizedAreaUnit = normalizeAreaUnit(areaUnit || 'hectare');

    const calculation = calculateCarbonSequestration(
      normalizedCropType,
      Number(area),
      normalizedAreaUnit,
      duration || 12
    );

    return {
      ...calculation,
      carbon: Number(calculation.totalSequestered || 0),
      trees: Number(calculation.equivalentTrees || 0)
    };
  });

  // Record carbon data
  fastify.post('/api/carbon/record', async (request, reply) => {
    const {
      cropType,
      area,
      areaUnit,
      duration,
      userId = 1
    } = request.body;

    if (!cropType || !area || area <= 0) {
      return reply.code(400).send({ error: 'Invalid input parameters' });
    }

    const normalizedCropType = normalizeCropType(cropType);
    const normalizedAreaUnit = normalizeAreaUnit(areaUnit || 'hectare');

    const calculation = calculateCarbonSequestration(
      normalizedCropType,
      Number(area),
      normalizedAreaUnit,
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
      Number(userId) || 1,
      normalizedCropType,
      Number(area),
      normalizedAreaUnit,
      duration || 12,
      Number(calculation.totalSequestered || 0),
      Number(calculation.equivalentTrees || 0),
      JSON.stringify(calculation.emissionReduction),
      calculation.calculationMethod,
      certificateId
    );

    return {
      success: true,
      data: {
        id: result.lastInsertRowid,
        certificateId,
        ...calculation,
        carbon: Number(calculation.totalSequestered || 0),
        trees: Number(calculation.equivalentTrees || 0)
      },
      message: 'ok'
    };
  });

  // Get carbon ledger
  fastify.get('/api/carbon/ledger', async (request, reply) => {
    const { userId = 1, month, limit = 50, offset = 0 } = request.query;

    const where = ['user_id = ?'];
    const params = [Number(userId) || 1];

    if (month) {
      where.push("strftime('%Y-%m', created_at) = ?");
      params.push(monthPeriod(month));
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const query = `
      SELECT *
      FROM carbon_records
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const finalParams = [...params, Number(limit), Number(offset)];
    const stmt = db.prepare(query);
    let records = stmt.all(...finalParams);

    // fallback for historical rows without user_id
    if (!records.length && shouldUseLegacyFallback(Number(userId) || 1)) {
      const fallbackWhere = ['user_id IS NULL'];
      const fallbackParams = [];
      if (month) {
        fallbackWhere.push("strftime('%Y-%m', created_at) = ?");
        fallbackParams.push(monthPeriod(month));
      }
      const fallbackSql = fallbackWhere.length ? `WHERE ${fallbackWhere.join(' AND ')}` : '';
      records = db.prepare(`
        SELECT *
        FROM carbon_records
        ${fallbackSql}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(...fallbackParams, Number(limit), Number(offset));
    }

    const countWhereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let total = db.prepare(`
      SELECT COUNT(*) as total
      FROM carbon_records
      ${countWhereSql}
    `).get(...params)?.total || 0;

    if (!total && shouldUseLegacyFallback(Number(userId) || 1)) {
      const fallbackCountWhere = ['user_id IS NULL'];
      const fallbackCountParams = [];
      if (month) {
        fallbackCountWhere.push("strftime('%Y-%m', created_at) = ?");
        fallbackCountParams.push(monthPeriod(month));
      }
      const fallbackCountSql = fallbackCountWhere.length ? `WHERE ${fallbackCountWhere.join(' AND ')}` : '';
      total = db.prepare(`
        SELECT COUNT(*) as total
        FROM carbon_records
        ${fallbackCountSql}
      `).get(...fallbackCountParams)?.total || 0;
    }

    return {
      success: true,
      data: {
        records: records.map(record => ({
          ...record,
          emission_reduction: (() => {
            try {
              return JSON.parse(record.emission_reduction);
            } catch {
              return record.emission_reduction;
            }
          })(),
          cropType: record.crop_type,
          carbon: Number(record.carbon_sequestered || 0),
          trees: Number(record.equivalent_trees || 0)
        })),
        total: Number(total),
        limit: Number(limit),
        offset: Number(offset)
      },
      meta: {
        month: month ? monthPeriod(month) : null
      },
      message: 'ok'
    };
  });

  // Get carbon statistics
  fastify.get('/api/carbon/statistics', async (request, reply) => {
    const { userId = 1, period = 'all' } = request.query;
    const uid = Number(userId) || 1;

    let dateFilter = '';
    if (period === 'month') {
      dateFilter = "AND created_at >= date('now', '-1 month')";
    } else if (period === 'year') {
      dateFilter = "AND created_at >= date('now', '-1 year')";
    } else if (period === '12m') {
      dateFilter = "AND created_at >= date('now', '-12 months')";
    }

    let totals = db.prepare(`
      SELECT
        COUNT(*) as total_records,
        SUM(carbon_sequestered) as total_carbon,
        SUM(equivalent_trees) as total_trees
      FROM carbon_records
      WHERE user_id = ? ${dateFilter}
    `).get(uid);

    if (!Number(totals?.total_records || 0) && shouldUseLegacyFallback(uid)) {
      const legacyTotals = db.prepare(`
        SELECT
          COUNT(*) as total_records,
          SUM(carbon_sequestered) as total_carbon,
          SUM(equivalent_trees) as total_trees
        FROM carbon_records
        WHERE user_id IS NULL ${dateFilter}
      `).get();

      if (Number(legacyTotals?.total_records || 0)) {
        totals = legacyTotals;
      }
    }

    let cropStats = db.prepare(`
      SELECT
        crop_type,
        COUNT(*) as total_records,
        SUM(carbon_sequestered) as total_carbon,
        SUM(equivalent_trees) as total_trees,
        AVG(carbon_sequestered) as avg_carbon
      FROM carbon_records
      WHERE user_id = ? ${dateFilter}
      GROUP BY crop_type
      ORDER BY total_carbon DESC
    `).all(uid);

    if (!cropStats.length && shouldUseLegacyFallback(uid)) {
      const legacyCropStats = db.prepare(`
        SELECT
          crop_type,
          COUNT(*) as total_records,
          SUM(carbon_sequestered) as total_carbon,
          SUM(equivalent_trees) as total_trees,
          AVG(carbon_sequestered) as avg_carbon
        FROM carbon_records
        WHERE user_id IS NULL ${dateFilter}
        GROUP BY crop_type
        ORDER BY total_carbon DESC
      `).all();

      if (legacyCropStats.length) {
        cropStats = legacyCropStats;
      }
    }

    let monthlyTrend = db.prepare(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        SUM(carbon_sequestered) as total_carbon_tons,
        SUM(equivalent_trees) as equivalent_trees
      FROM carbon_records
      WHERE user_id = ?
        AND datetime(created_at) >= datetime('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all(uid);

    if (!monthlyTrend.length && shouldUseLegacyFallback(uid)) {
      const legacyMonthlyTrend = db.prepare(`
        SELECT
          strftime('%Y-%m', created_at) as month,
          SUM(carbon_sequestered) as total_carbon_tons,
          SUM(equivalent_trees) as equivalent_trees
        FROM carbon_records
        WHERE user_id IS NULL
          AND datetime(created_at) >= datetime('now', '-12 months')
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month ASC
      `).all();

      if (legacyMonthlyTrend.length) {
        monthlyTrend = legacyMonthlyTrend;
      }
    }

    const currentMonth = monthPeriod();
    const currentMonthValue = monthlyTrend.find((item) => item.month === currentMonth);

    const monthlyCarbonTons = toNumber(currentMonthValue?.total_carbon_tons || 0, 3);
    const totalCarbonTons = toNumber(totals?.total_carbon || 0, 3);
    const equivalentTrees = Number(totals?.total_trees || 0);

    const reportExists = db.prepare(`
      SELECT id
      FROM reports
      WHERE user_id = ?
        AND report_type = 'carbon_monthly_report'
        AND report_period = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(uid, currentMonth);

    const reportStatus = reportExists ? 'generated' : 'not_generated';

    return {
      success: true,
      data: {
        totalCarbonTons,
        monthlyCarbonTons,
        equivalentTrees,
        monthlyTrend: monthlyTrend.map((item) => ({
          month: item.month,
          totalCarbonTons: toNumber(item.total_carbon_tons || 0, 3),
          equivalentTrees: Number(item.equivalent_trees || 0),

          // legacy alias
          value: toNumber(item.total_carbon_tons || 0, 3)
        })),
        reportStatus,

        // legacy payload keepers
        totals: {
          total_records: Number(totals?.total_records || 0),
          total_carbon: Number(totals?.total_carbon || 0),
          total_trees: Number(totals?.total_trees || 0)
        },
        byCropType: cropStats,
        period
      },
      meta: {
        generatedAt: new Date().toISOString(),
        period
      },
      message: 'ok'
    };
  });

  // Generate monthly report snapshot and save to reports table
  fastify.post('/api/carbon/reports/monthly/generate', async (request, reply) => {
    try {
      const { month, userId = 1 } = request.body || {};
      const period = monthPeriod(month);
      const uid = Number(userId) || 1;

      const reportPayload = {
        reportType: 'carbon_monthly_report',
        generatedAt: new Date().toISOString(),
        summary: summarizeMonthlyReport({ month: period, userId: uid })
      };

      const existing = db.prepare(`
        SELECT id
        FROM reports
        WHERE user_id = ?
          AND report_type = 'carbon_monthly_report'
          AND report_period = ?
        ORDER BY created_at DESC
        LIMIT 1
      `).get(uid, period);

      if (existing?.id) {
        db.prepare(`
          UPDATE reports
          SET report_data = ?, created_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(JSON.stringify(reportPayload), existing.id);
      } else {
        db.prepare(`
          INSERT INTO reports (user_id, report_type, report_period, report_data)
          VALUES (?, 'carbon_monthly_report', ?, ?)
        `).run(uid, period, JSON.stringify(reportPayload));
      }

      return {
        success: true,
        data: {
          month: period,
          status: 'generated',
          report: reportPayload
        },
        meta: {
          generatedAt: new Date().toISOString()
        },
        message: 'ok'
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        data: null,
        meta: {
          generatedAt: new Date().toISOString()
        },
        message: 'Failed to generate monthly report'
      });
    }
  });

  // Fetch monthly report from reports table
  fastify.get('/api/carbon/reports/monthly', async (request, reply) => {
    try {
      const { month, userId = 1 } = request.query || {};
      const period = monthPeriod(month);
      const uid = Number(userId) || 1;

      let row = db.prepare(`
        SELECT id, report_data, created_at
        FROM reports
        WHERE user_id = ?
          AND report_type = 'carbon_monthly_report'
          AND report_period = ?
        ORDER BY created_at DESC
        LIMIT 1
      `).get(uid, period);

      if (!row && shouldUseLegacyFallback(uid)) {
        // fallback for historical rows without user_id
        row = db.prepare(`
          SELECT id, report_data, created_at
          FROM reports
          WHERE user_id IS NULL
            AND report_type = 'carbon_monthly_report'
            AND report_period = ?
          ORDER BY created_at DESC
          LIMIT 1
        `).get(period);
      }

      if (!row) {
        return {
          success: true,
          data: {
            month: period,
            status: 'not_generated',
            report: null
          },
          meta: {
            generatedAt: new Date().toISOString()
          },
          message: 'ok'
        };
      }

      let report;
      try {
        report = JSON.parse(row.report_data);
      } catch {
        report = null;
      }

      return {
        success: true,
        data: {
          month: period,
          status: report ? 'generated' : 'invalid',
          report
        },
        meta: {
          generatedAt: row.created_at || new Date().toISOString()
        },
        message: 'ok'
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        data: null,
        meta: {
          generatedAt: new Date().toISOString()
        },
        message: 'Failed to fetch monthly report'
      });
    }
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
      emission_reduction: (() => {
        try {
          return JSON.parse(record.emission_reduction);
        } catch {
          return record.emission_reduction;
        }
      })()
    };
  });

  // Get crop types
  fastify.get('/api/carbon/crop-types', async () => {
    return getCropTypes();
  });
}
