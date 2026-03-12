import db from '../database.js';

export default async function statisticsRoutes(fastify) {

  // 综合概览数据
  fastify.get('/api/statistics/overview', async (request, reply) => {
    try {
      const userId = 1;

      // 作物统计
      const cropTotal = db.prepare(`SELECT COUNT(*) as total, AVG(health_score) as avgHealth FROM crop_records WHERE user_id = ?`).get(userId);
      const cropMonth = db.prepare(`SELECT COUNT(*) as total FROM crop_records WHERE user_id = ? AND created_at >= datetime('now', '-30 days')`).get(userId);

      // 能源统计
      const energyTotal = db.prepare(`SELECT SUM(generation) as totalGen, AVG(generation) as avgGen, COUNT(*) as total FROM energy_records WHERE user_id = ?`).get(userId);
      const energyToday = db.prepare(`SELECT generation, consumption, grid_export FROM energy_records WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1`).get(userId);

      // 碳汇统计
      const carbonTotal = db.prepare(`SELECT SUM(carbon_sequestered) as totalCarbon, SUM(equivalent_trees) as totalTrees FROM carbon_records WHERE user_id = ?`).get(userId);
      const carbonMonth = db.prepare(`SELECT SUM(carbon_sequestered) as monthCarbon FROM carbon_records WHERE user_id = ? AND created_at >= datetime('now', '-30 days')`).get(userId);

      // 智慧记录统计
      const wisdomTotal = db.prepare(`SELECT COUNT(*) as total FROM wisdom_records WHERE user_id = ?`).get(userId);
      const wisdomMonth = db.prepare(`SELECT COUNT(*) as total FROM wisdom_records WHERE user_id = ? AND created_at >= datetime('now', '-30 days')`).get(userId);
      const wisdomCategories = db.prepare(`SELECT category, COUNT(*) as count FROM wisdom_records WHERE user_id = ? GROUP BY category ORDER BY count DESC LIMIT 1`).get(userId);

      // 环境统计
      const envLatest = db.prepare(`SELECT environmental_score, biodiversity_score FROM environment_records WHERE user_id = ? ORDER BY monitoring_date DESC LIMIT 1`).get(userId);

      return {
        success: true,
        data: {
          agriculture: {
            totalAnalysis: cropTotal?.total || 0,
            avgHealthScore: Math.round((cropTotal?.avgHealth || 0) * 10) / 10,
            monthlyNew: cropMonth?.total || 0,
            trend: 5.2
          },
          energy: {
            totalGeneration: Math.round((energyTotal?.totalGen || 0) * 10) / 10,
            avgGeneration: Math.round((energyTotal?.avgGen || 0) * 10) / 10,
            totalRecords: energyTotal?.total || 0,
            todayGeneration: energyToday?.generation || 0,
            todayConsumption: energyToday?.consumption || 0,
            todayExport: energyToday?.grid_export || 0,
            trend: 3.8
          },
          carbon: {
            totalSequestered: Math.round((carbonTotal?.totalCarbon || 0) * 100) / 100,
            equivalentTrees: carbonTotal?.totalTrees || 0,
            monthlyNew: Math.round((carbonMonth?.monthCarbon || 0) * 100) / 100,
            trend: 12.5
          },
          wisdom: {
            totalRecords: wisdomTotal?.total || 0,
            monthlyNew: wisdomMonth?.total || 0,
            topCategory: wisdomCategories?.category || '种植经验',
            trend: 8.3
          },
          environment: {
            envScore: Math.round((envLatest?.environmental_score || 0) * 10) / 10,
            biodiversityScore: Math.round((envLatest?.biodiversity_score || 0) * 10) / 10,
            trend: 4.5
          }
        }
      };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message });
    }
  });

  // 趋势数据
  fastify.get('/api/statistics/trends', async (request, reply) => {
    try {
      const { period = '30d' } = request.query;
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      const userId = 1;

      // 作物健康趋势
      const cropTrend = db.prepare(`
        SELECT DATE(created_at) as date, AVG(health_score) as avgScore, COUNT(*) as count
        FROM crop_records
        WHERE user_id = ? AND created_at >= datetime('now', '-${days} days')
        GROUP BY DATE(created_at)
        ORDER BY date
      `).all(userId);

      // 能源趋势
      const energyTrend = db.prepare(`
        SELECT DATE(timestamp) as date, SUM(generation) as generation, SUM(consumption) as consumption
        FROM energy_records
        WHERE user_id = ? AND timestamp >= date('now', '-${days} days')
        GROUP BY DATE(timestamp)
        ORDER BY date
      `).all(userId);

      // 碳汇趋势（按月）
      const carbonTrend = db.prepare(`
        SELECT strftime('%Y-%m', created_at) as month, SUM(carbon_sequestered) as total
        FROM carbon_records
        WHERE user_id = ? AND created_at >= datetime('now', '-180 days')
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month
      `).all(userId);

      // 智慧记录分类分布
      const wisdomDist = db.prepare(`
        SELECT category, COUNT(*) as count
        FROM wisdom_records
        WHERE user_id = ?
        GROUP BY category
        ORDER BY count DESC
      `).all(userId);

      return {
        success: true,
        data: {
          period,
          cropTrend,
          energyTrend,
          carbonTrend,
          wisdomDist
        }
      };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message });
    }
  });

  // 首页摘要
  fastify.get('/api/statistics/summary', async (request, reply) => {
    try {
      const userId = 1;

      const cropCount = db.prepare(`SELECT COUNT(*) as total FROM crop_records WHERE user_id = ?`).get(userId);
      const energyGen = db.prepare(`SELECT SUM(generation) as total FROM energy_records WHERE user_id = ?`).get(userId);
      const carbonSeq = db.prepare(`SELECT SUM(carbon_sequestered) as total FROM carbon_records WHERE user_id = ?`).get(userId);
      const wisdomCount = db.prepare(`SELECT COUNT(*) as total FROM wisdom_records WHERE user_id = ?`).get(userId);

      // 最近活动
      const recentActivities = db.prepare(`
        SELECT action_type, action_data, created_at
        FROM activity_logs
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `).all(userId);

      return {
        success: true,
        data: {
          stats: {
            cropAnalysis: cropCount?.total || 0,
            totalGeneration: Math.round((energyGen?.total || 0)),
            carbonReduction: Math.round((carbonSeq?.total || 0) * 10) / 10,
            wisdomRecords: wisdomCount?.total || 0
          },
          recentActivities
        }
      };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message });
    }
  });

  // 活动日志
  fastify.get('/api/statistics/activities', async (request, reply) => {
    try {
      const userId = 1;
      const { limit = 20 } = request.query;

      const activities = db.prepare(`
        SELECT action_type, action_data, created_at
        FROM activity_logs
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).all(userId, parseInt(limit));

      return { success: true, data: activities };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message });
    }
  });

  // 记录活动
  fastify.post('/api/statistics/activity', async (request, reply) => {
    try {
      const { actionType, actionData } = request.body;
      const userId = 1;

      db.prepare(`
        INSERT INTO activity_logs (user_id, action_type, action_data)
        VALUES (?, ?, ?)
      `).run(userId, actionType, actionData);

      return { success: true, message: '活动记录成功' };
    } catch (error) {
      reply.code(500).send({ success: false, message: error.message });
    }
  });
}
