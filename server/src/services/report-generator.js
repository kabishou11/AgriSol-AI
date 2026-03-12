import db from '../database.js';

export function generateDailyReport(userId = null) {
  const stmt = db.prepare(`
    SELECT
      COUNT(*) as totalActivities,
      (SELECT COUNT(*) FROM crops WHERE user_id = ? OR ? IS NULL AND DATE(created_at) = DATE('now')) as cropsToday,
      (SELECT COUNT(*) FROM energy WHERE user_id = ? OR ? IS NULL AND DATE(created_at) = DATE('now')) as energyToday,
      (SELECT COUNT(*) FROM carbon WHERE user_id = ? OR ? IS NULL AND DATE(created_at) = DATE('now')) as carbonToday
  `);

  const data = stmt.get(userId, userId, userId, userId, userId, userId);

  return {
    reportType: 'daily',
    date: new Date().toISOString().split('T')[0],
    summary: {
      totalActivities: data.totalActivities,
      crops: data.cropsToday,
      energy: data.energyToday,
      carbon: data.carbonToday
    },
    generatedAt: new Date().toISOString()
  };
}

export function generateWeeklyReport(userId = null) {
  const cropsStmt = db.prepare(`
    SELECT COUNT(*) as count, AVG(health_score) as avgHealth
    FROM crops
    WHERE (user_id = ? OR ? IS NULL) AND created_at >= datetime('now', '-7 days')
  `);
  const cropsData = cropsStmt.get(userId, userId);

  const energyStmt = db.prepare(`
    SELECT COUNT(*) as count, AVG(solar_potential) as avgSolar, AVG(wind_potential) as avgWind
    FROM energy
    WHERE (user_id = ? OR ? IS NULL) AND created_at >= datetime('now', '-7 days')
  `);
  const energyData = energyStmt.get(userId, userId);

  const carbonStmt = db.prepare(`
    SELECT SUM(carbon_amount) as total
    FROM carbon
    WHERE (user_id = ? OR ? IS NULL) AND created_at >= datetime('now', '-7 days')
  `);
  const carbonData = carbonStmt.get(userId, userId);

  return {
    reportType: 'weekly',
    period: 'Last 7 days',
    summary: {
      crops: {
        count: cropsData.count || 0,
        avgHealth: cropsData.avgHealth || 0
      },
      energy: {
        count: energyData.count || 0,
        avgSolar: energyData.avgSolar || 0,
        avgWind: energyData.avgWind || 0
      },
      carbon: {
        total: carbonData.total || 0
      }
    },
    generatedAt: new Date().toISOString()
  };
}

export function generateMonthlyReport(userId = null) {
  const cropsStmt = db.prepare(`
    SELECT COUNT(*) as count, AVG(health_score) as avgHealth
    FROM crops
    WHERE (user_id = ? OR ? IS NULL) AND created_at >= datetime('now', '-30 days')
  `);
  const cropsData = cropsStmt.get(userId, userId);

  const energyStmt = db.prepare(`
    SELECT COUNT(*) as count, AVG(solar_potential) as avgSolar, AVG(wind_potential) as avgWind
    FROM energy
    WHERE (user_id = ? OR ? IS NULL) AND created_at >= datetime('now', '-30 days')
  `);
  const energyData = energyStmt.get(userId, userId);

  const carbonStmt = db.prepare(`
    SELECT SUM(carbon_amount) as total
    FROM carbon
    WHERE (user_id = ? OR ? IS NULL) AND created_at >= datetime('now', '-30 days')
  `);
  const carbonData = carbonStmt.get(userId, userId);

  const carbonSeqStmt = db.prepare(`
    SELECT SUM(carbon_sequestered) as totalSequestered
    FROM carbon_records
    WHERE (user_id = ? OR ? IS NULL) AND created_at >= datetime('now', '-30 days')
  `);
  const carbonSeqData = carbonSeqStmt.get(userId, userId);

  return {
    reportType: 'monthly',
    period: 'Last 30 days',
    summary: {
      crops: {
        count: cropsData.count || 0,
        avgHealth: cropsData.avgHealth || 0
      },
      energy: {
        count: energyData.count || 0,
        avgSolar: energyData.avgSolar || 0,
        avgWind: energyData.avgWind || 0
      },
      carbon: {
        emissions: carbonData.total || 0,
        sequestered: carbonSeqData.totalSequestered || 0,
        net: (carbonSeqData.totalSequestered || 0) - (carbonData.total || 0)
      }
    },
    generatedAt: new Date().toISOString()
  };
}

export function aggregateData(type, period, userId = null) {
  const days = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;

  if (type === 'crops') {
    const stmt = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count, AVG(health_score) as avgScore
      FROM crops
      WHERE (user_id = ? OR ? IS NULL) AND created_at >= datetime('now', '-${days} days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    return stmt.all(userId, userId);
  } else if (type === 'energy') {
    const stmt = db.prepare(`
      SELECT DATE(created_at) as date, AVG(solar_potential) as solar, AVG(wind_potential) as wind
      FROM energy
      WHERE (user_id = ? OR ? IS NULL) AND created_at >= datetime('now', '-${days} days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    return stmt.all(userId, userId);
  } else if (type === 'carbon') {
    const stmt = db.prepare(`
      SELECT DATE(created_at) as date, SUM(carbon_amount) as total
      FROM carbon
      WHERE (user_id = ? OR ? IS NULL) AND created_at >= datetime('now', '-${days} days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    return stmt.all(userId, userId);
  }

  return [];
}

