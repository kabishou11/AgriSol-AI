import db from '../database.js';
import { formatRecordDates } from '../utils/date-formatter.js';

function toNumber(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

function resolveUserId(queryUserId) {
  return Number(queryUserId) || 1;
}

function shouldUseLegacyFallback(uid) {
  return uid === 1;
}

function hasAnyValue(row, fields) {
  return fields.some((field) => row?.[field] !== null && row?.[field] !== undefined);
}

export default async function statisticsRoutes(fastify) {

  // 综合概览数据（与 energy/carbon 同口径）
  fastify.get('/api/statistics/overview', async (request, reply) => {
    try {
      const userId = resolveUserId(request.query?.userId);

      // 作物统计
      let cropTotal = db.prepare(`
        SELECT COUNT(*) as total, AVG(health_score) as avgHealth
        FROM crop_records
        WHERE user_id = ?
      `).get(userId);

      let cropMonth = db.prepare(`
        SELECT COUNT(*) as total
        FROM crop_records
        WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
      `).get(userId);

      if (!Number(cropTotal?.total || 0) && shouldUseLegacyFallback(userId)) {
        const legacyCropTotal = db.prepare(`
          SELECT COUNT(*) as total, AVG(health_score) as avgHealth
          FROM crop_records
          WHERE user_id IS NULL
        `).get();

        if (Number(legacyCropTotal?.total || 0)) {
          cropTotal = legacyCropTotal;
          cropMonth = db.prepare(`
            SELECT COUNT(*) as total
            FROM crop_records
            WHERE user_id IS NULL AND created_at >= datetime('now', '-30 days')
          `).get();
        }
      }

      // 能源统计
      let energyTotal = db.prepare(`
        SELECT SUM(generation) as totalGen, AVG(generation) as avgGen, COUNT(*) as total
        FROM energy_records
        WHERE user_id = ?
      `).get(userId);

      let energyToday = db.prepare(`
        SELECT generation, consumption, grid_export
        FROM energy_records
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
      `).get(userId);

      if (!Number(energyTotal?.total || 0) && shouldUseLegacyFallback(userId)) {
        const legacyEnergyTotal = db.prepare(`
          SELECT SUM(generation) as totalGen, AVG(generation) as avgGen, COUNT(*) as total
          FROM energy_records
          WHERE user_id IS NULL
        `).get();

        if (Number(legacyEnergyTotal?.total || 0)) {
          energyTotal = legacyEnergyTotal;
          energyToday = db.prepare(`
            SELECT generation, consumption, grid_export
            FROM energy_records
            WHERE user_id IS NULL
            ORDER BY timestamp DESC
            LIMIT 1
          `).get();
        }
      }

      // 碳汇统计
      let carbonTotal = db.prepare(`
        SELECT SUM(carbon_sequestered) as totalCarbon, SUM(equivalent_trees) as totalTrees
        FROM carbon_records
        WHERE user_id = ?
      `).get(userId);

      let carbonMonth = db.prepare(`
        SELECT SUM(carbon_sequestered) as monthCarbon
        FROM carbon_records
        WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
      `).get(userId);

      if (!hasAnyValue(carbonTotal, ['totalCarbon', 'totalTrees']) && shouldUseLegacyFallback(userId)) {
        const legacyCarbonTotal = db.prepare(`
          SELECT SUM(carbon_sequestered) as totalCarbon, SUM(equivalent_trees) as totalTrees
          FROM carbon_records
          WHERE user_id IS NULL
        `).get();

        if (hasAnyValue(legacyCarbonTotal, ['totalCarbon', 'totalTrees'])) {
          carbonTotal = legacyCarbonTotal;
          carbonMonth = db.prepare(`
            SELECT SUM(carbon_sequestered) as monthCarbon
            FROM carbon_records
            WHERE user_id IS NULL AND created_at >= datetime('now', '-30 days')
          `).get();
        }
      }

      // 智慧记录统计
      let wisdomTotal = db.prepare(`
        SELECT COUNT(*) as total
        FROM wisdom_records
        WHERE user_id = ?
      `).get(userId);

      let wisdomMonth = db.prepare(`
        SELECT COUNT(*) as total
        FROM wisdom_records
        WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
      `).get(userId);

      let wisdomCategories = db.prepare(`
        SELECT category, COUNT(*) as count
        FROM wisdom_records
        WHERE user_id = ?
        GROUP BY category
        ORDER BY count DESC
        LIMIT 1
      `).get(userId);

      if (!Number(wisdomTotal?.total || 0) && shouldUseLegacyFallback(userId)) {
        const legacyWisdomTotal = db.prepare(`
          SELECT COUNT(*) as total
          FROM wisdom_records
          WHERE user_id IS NULL
        `).get();

        if (Number(legacyWisdomTotal?.total || 0)) {
          wisdomTotal = legacyWisdomTotal;
          wisdomMonth = db.prepare(`
            SELECT COUNT(*) as total
            FROM wisdom_records
            WHERE user_id IS NULL AND created_at >= datetime('now', '-30 days')
          `).get();
          wisdomCategories = db.prepare(`
            SELECT category, COUNT(*) as count
            FROM wisdom_records
            WHERE user_id IS NULL
            GROUP BY category
            ORDER BY count DESC
            LIMIT 1
          `).get();
        }
      }

      // 环境统计
      let envLatest = db.prepare(`
        SELECT environmental_score, biodiversity_score
        FROM environment_records
        WHERE user_id = ?
        ORDER BY monitoring_date DESC
        LIMIT 1
      `).get(userId);

      if (!envLatest && shouldUseLegacyFallback(userId)) {
        envLatest = db.prepare(`
          SELECT environmental_score, biodiversity_score
          FROM environment_records
          WHERE user_id IS NULL
          ORDER BY monitoring_date DESC
          LIMIT 1
        `).get();
      }

      const data = {
        agriculture: {
          totalAnalysis: Number(cropTotal?.total || 0),
          avgHealthScore: toNumber(cropTotal?.avgHealth || 0, 1),
          monthlyNew: Number(cropMonth?.total || 0),
          trend: 5.2
        },
        energy: {
          totalGeneration: toNumber(energyTotal?.totalGen || 0, 1),
          avgGeneration: toNumber(energyTotal?.avgGen || 0, 1),
          totalRecords: Number(energyTotal?.total || 0),
          todayGeneration: Number(energyToday?.generation || 0),
          todayConsumption: Number(energyToday?.consumption || 0),
          todayExport: Number(energyToday?.grid_export || 0),
          trend: 3.8,

          // unified aliases
          generationKwh: toNumber(energyTotal?.totalGen || 0, 1),
          consumptionKwh: toNumber(energyToday?.consumption || 0, 1)
        },
        carbon: {
          totalSequestered: toNumber(carbonTotal?.totalCarbon || 0, 2),
          equivalentTrees: Number(carbonTotal?.totalTrees || 0),
          monthlyNew: toNumber(carbonMonth?.monthCarbon || 0, 2),
          trend: 12.5,

          // unified aliases
          totalCarbonTons: toNumber(carbonTotal?.totalCarbon || 0, 2),
          monthlyCarbonTons: toNumber(carbonMonth?.monthCarbon || 0, 2)
        },
        wisdom: {
          totalRecords: Number(wisdomTotal?.total || 0),
          monthlyNew: Number(wisdomMonth?.total || 0),
          topCategory: wisdomCategories?.category || '种植经验',
          trend: 8.3
        },
        environment: {
          envScore: toNumber(envLatest?.environmental_score || 0, 1),
          biodiversityScore: toNumber(envLatest?.biodiversity_score || 0, 1),
          trend: 4.5
        }
      };

      return {
        success: true,
        data,
        meta: {
          userId,
          generatedAt: new Date().toISOString(),
          scope: 'aligned'
        },
        message: 'ok'
      };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message, data: null });
    }
  });

  // 趋势数据
  fastify.get('/api/statistics/trends', async (request, reply) => {
    try {
      const { period = '30d' } = request.query;
      const userId = resolveUserId(request.query?.userId);
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;

      let cropTrend = db.prepare(`
        SELECT DATE(created_at) as date, AVG(health_score) as avgScore, COUNT(*) as count
        FROM crop_records
        WHERE user_id = ? AND created_at >= datetime('now', '-${days} days')
        GROUP BY DATE(created_at)
        ORDER BY date
      `).all(userId);

      let energyTrend = db.prepare(`
        SELECT DATE(timestamp) as date, SUM(generation) as generation, SUM(consumption) as consumption
        FROM energy_records
        WHERE user_id = ? AND timestamp >= date('now', '-${days} days')
        GROUP BY DATE(timestamp)
        ORDER BY date
      `).all(userId);

      let carbonTrend = db.prepare(`
        SELECT strftime('%Y-%m', created_at) as month, SUM(carbon_sequestered) as total
        FROM carbon_records
        WHERE user_id = ? AND created_at >= datetime('now', '-12 months')
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month
      `).all(userId);

      const wisdomDistStmt = db.prepare(`
        SELECT category, COUNT(*) as count
        FROM wisdom_records
        WHERE user_id = ?
        GROUP BY category
        ORDER BY count DESC
      `);
      let wisdomDist = wisdomDistStmt.all(userId);

      if (!cropTrend.length && !energyTrend.length && !carbonTrend.length && !wisdomDist.length && shouldUseLegacyFallback(userId)) {
        cropTrend = db.prepare(`
          SELECT DATE(created_at) as date, AVG(health_score) as avgScore, COUNT(*) as count
          FROM crop_records
          WHERE user_id IS NULL AND created_at >= datetime('now', '-${days} days')
          GROUP BY DATE(created_at)
          ORDER BY date
        `).all();

        energyTrend = db.prepare(`
          SELECT DATE(timestamp) as date, SUM(generation) as generation, SUM(consumption) as consumption
          FROM energy_records
          WHERE user_id IS NULL AND timestamp >= date('now', '-${days} days')
          GROUP BY DATE(timestamp)
          ORDER BY date
        `).all();

        carbonTrend = db.prepare(`
          SELECT strftime('%Y-%m', created_at) as month, SUM(carbon_sequestered) as total
          FROM carbon_records
          WHERE user_id IS NULL AND created_at >= datetime('now', '-12 months')
          GROUP BY strftime('%Y-%m', created_at)
          ORDER BY month
        `).all();

        wisdomDist = db.prepare(`
          SELECT category, COUNT(*) as count
          FROM wisdom_records
          WHERE user_id IS NULL
          GROUP BY category
          ORDER BY count DESC
        `).all();
      }

      // 简化环境趋势：按日环境分数（之前前端为空）
      let environmentTrend = db.prepare(`
        SELECT DATE(monitoring_date) as date, AVG(environmental_score) as score
        FROM environment_records
        WHERE user_id = ? AND monitoring_date >= datetime('now', '-${days} days')
        GROUP BY DATE(monitoring_date)
        ORDER BY date
      `).all(userId);

      if (!environmentTrend.length && shouldUseLegacyFallback(userId)) {
        environmentTrend = db.prepare(`
          SELECT DATE(monitoring_date) as date, AVG(environmental_score) as score
          FROM environment_records
          WHERE user_id IS NULL AND monitoring_date >= datetime('now', '-${days} days')
          GROUP BY DATE(monitoring_date)
          ORDER BY date
        `).all();
      }

      return {
        success: true,
        data: {
          period,
          cropTrend,
          energyTrend,
          carbonTrend,
          environmentTrend,
          wisdomDist,

          // unified aliases
          monthlyTrend: carbonTrend.map((it) => ({ month: it.month, totalCarbonTons: toNumber(it.total || 0, 3) }))
        },
        meta: {
          userId,
          generatedAt: new Date().toISOString(),
          scope: 'aligned'
        },
        message: 'ok'
      };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message, data: null });
    }
  });

  // 首页摘要
  fastify.get('/api/statistics/summary', async (request, reply) => {
    try {
      const userId = resolveUserId(request.query?.userId);

      let cropCount = db.prepare(`SELECT COUNT(*) as total FROM crop_records WHERE user_id = ?`).get(userId);
      let energyGen = db.prepare(`SELECT SUM(generation) as total FROM energy_records WHERE user_id = ?`).get(userId);
      let carbonSeq = db.prepare(`SELECT SUM(carbon_sequestered) as total FROM carbon_records WHERE user_id = ?`).get(userId);
      let wisdomCount = db.prepare(`SELECT COUNT(*) as total FROM wisdom_records WHERE user_id = ?`).get(userId);

      if (
        !hasAnyValue(cropCount, ['total'])
        && !hasAnyValue(energyGen, ['total'])
        && !hasAnyValue(carbonSeq, ['total'])
        && shouldUseLegacyFallback(userId)
      ) {
        const legacyCropCount = db.prepare(`SELECT COUNT(*) as total FROM crop_records WHERE user_id IS NULL`).get();
        const legacyEnergyGen = db.prepare(`SELECT SUM(generation) as total FROM energy_records WHERE user_id IS NULL`).get();
        const legacyCarbonSeq = db.prepare(`SELECT SUM(carbon_sequestered) as total FROM carbon_records WHERE user_id IS NULL`).get();

        if (
          hasAnyValue(legacyCropCount, ['total'])
          || hasAnyValue(legacyEnergyGen, ['total'])
          || hasAnyValue(legacyCarbonSeq, ['total'])
        ) {
          cropCount = legacyCropCount;
          energyGen = legacyEnergyGen;
          carbonSeq = legacyCarbonSeq;
          wisdomCount = db.prepare(`SELECT COUNT(*) as total FROM wisdom_records WHERE user_id IS NULL`).get();
        }
      }

      // 最近活动
      let recentActivities = db.prepare(`
        SELECT action_type, action_data, created_at
        FROM activity_logs
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `).all(userId);

      if (!recentActivities.length && shouldUseLegacyFallback(userId)) {
        recentActivities = db.prepare(`
          SELECT action_type, action_data, created_at
          FROM activity_logs
          WHERE user_id IS NULL
          ORDER BY created_at DESC
          LIMIT 10
        `).all();
      }

      return {
        success: true,
        data: {
          stats: {
            cropAnalysis: Number(cropCount?.total || 0),
            totalGeneration: Math.round(Number(energyGen?.total || 0)),
            carbonReduction: toNumber(Number(carbonSeq?.total || 0), 1),
            wisdomRecords: Number(wisdomCount?.total || 0)
          },
          recentActivities: recentActivities.map(formatRecordDates)
        },
        meta: {
          userId,
          generatedAt: new Date().toISOString(),
          scope: 'aligned'
        },
        message: 'ok'
      };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message, data: null });
    }
  });

  // 活动日志
  fastify.get('/api/statistics/activities', async (request, reply) => {
    try {
      const userId = resolveUserId(request.query?.userId);
      const { limit = 20 } = request.query || {};

      let activities = db.prepare(`
        SELECT action_type, action_data, created_at
        FROM activity_logs
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).all(userId, parseInt(limit));

      if (!activities.length && shouldUseLegacyFallback(userId)) {
        activities = db.prepare(`
          SELECT action_type, action_data, created_at
          FROM activity_logs
          WHERE user_id IS NULL
          ORDER BY created_at DESC
          LIMIT ?
        `).all(parseInt(limit));
      }

      return {
        success: true,
        data: activities,
        meta: {
          userId,
          generatedAt: new Date().toISOString(),
          scope: 'aligned'
        },
        message: 'ok'
      };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message, data: null });
    }
  });

  // 记录活动
  fastify.post('/api/statistics/activity', async (request, reply) => {
    try {
      const { actionType, actionData, userId } = request.body;
      const uid = resolveUserId(userId);

      db.prepare(`
        INSERT INTO activity_logs (user_id, action_type, action_data)
        VALUES (?, ?, ?)
      `).run(uid, actionType, actionData);

      return {
        success: true,
        data: null,
        meta: {
          generatedAt: new Date().toISOString()
        },
        message: '活动记录成功'
      };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message, data: null });
    }
  });
}
