import db from '../database.js';
import { formatRecordDates, formatRecordsDates } from '../utils/date-formatter.js';
import {
  getEnergyPrediction,
  calculateRevenue,
  generateOptimizationRecommendations,
  calculateStorageRecommendations
} from '../services/energy-prediction.js';

export default async function energyRoutes(fastify) {

  // Record energy data
  fastify.post('/api/energy/record', async (request, reply) => {
    const {
      generation,
      consumption,
      gridImport = 0,
      gridExport = 0,
      batteryCharge = 0,
      batteryDischarge = 0,
      deviceType = 'solar'
    } = request.body;

    if (generation === undefined || consumption === undefined) {
      return reply.code(400).send({ error: 'Generation and consumption are required' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO energy_records
        (generation, consumption, grid_import, grid_export, battery_charge, battery_discharge, device_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        generation,
        consumption,
        gridImport,
        gridExport,
        batteryCharge,
        batteryDischarge,
        deviceType
      );

      return {
        success: true,
        id: result.lastInsertRowid,
        message: 'Energy data recorded successfully'
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to record energy data' });
    }
  });

  // Get today's energy data
  fastify.get('/api/energy/today', async (request, reply) => {
    try {
      const stmt = db.prepare(`
        SELECT
          SUM(generation) as total_generation,
          SUM(consumption) as total_consumption,
          SUM(grid_import) as total_import,
          SUM(grid_export) as total_export,
          AVG(generation) as avg_generation,
          AVG(consumption) as avg_consumption
        FROM energy_records
        WHERE DATE(timestamp) = DATE('now')
      `);

      const todayData = stmt.get();

      const selfSufficiency = todayData.total_generation > 0
        ? Number(((todayData.total_generation / todayData.total_consumption) * 100).toFixed(2))
        : 0;

      const revenue = calculateRevenue(
        todayData.total_generation || 0,
        todayData.total_consumption || 0
      );

      return {
        generation: Number((todayData.total_generation || 0).toFixed(2)),
        consumption: Number((todayData.total_consumption || 0).toFixed(2)),
        gridImport: Number((todayData.total_import || 0).toFixed(2)),
        gridExport: Number((todayData.total_export || 0).toFixed(2)),
        selfSufficiency,
        savings: typeof revenue.netSavings === 'number' ? Number(revenue.netSavings.toFixed(2)) : Number(revenue.netSavings),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch today\'s data' });
    }
  });

  // Get energy forecast
  fastify.get('/api/energy/forecast', async (request, reply) => {
    const { latitude = 39.9, longitude = 116.4, capacity = 10 } = request.query;

    try {
      const historyStmt = db.prepare(`
        SELECT timestamp, consumption
        FROM energy_records
        WHERE timestamp >= datetime('now', '-30 days')
        ORDER BY timestamp DESC
      `);

      const historicalData = historyStmt.all();

      const prediction = await getEnergyPrediction(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(capacity),
        historicalData
      );

      return prediction;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to generate forecast' });
    }
  });

  // Get energy statistics
  fastify.get('/api/energy/statistics', async (request, reply) => {
    const { period = 'week' } = request.query;

    let dateFilter = '';
    switch (period) {
      case 'day':
        dateFilter = "DATE(timestamp) = DATE('now')";
        break;
      case 'week':
        dateFilter = "timestamp >= datetime('now', '-7 days')";
        break;
      case 'month':
        dateFilter = "timestamp >= datetime('now', '-30 days')";
        break;
      case 'year':
        dateFilter = "timestamp >= datetime('now', '-365 days')";
        break;
      default:
        dateFilter = "timestamp >= datetime('now', '-7 days')";
    }

    try {
      const dailyStmt = db.prepare(`
        SELECT
          DATE(timestamp) as date,
          SUM(generation) as generation,
          SUM(consumption) as consumption,
          SUM(grid_export) as export,
          SUM(grid_import) as import
        FROM energy_records
        WHERE ${dateFilter}
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      `);

      const dailyData = dailyStmt.all();

      const totalStmt = db.prepare(`
        SELECT
          SUM(generation) as total_generation,
          SUM(consumption) as total_consumption,
          SUM(grid_export) as total_export,
          SUM(grid_import) as total_import
        FROM energy_records
        WHERE ${dateFilter}
      `);

      const totals = totalStmt.get();

      return {
        period,
        daily: dailyData,
        totals,
        selfSufficiency: totals.total_generation > 0
          ? ((totals.total_generation / totals.total_consumption) * 100).toFixed(2)
          : 0
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch statistics' });
    }
  });

  // Get optimization suggestions
  fastify.post('/api/energy/optimize', async (request, reply) => {
    const { generation, consumption, peakConsumption } = request.body;

    if (!generation || !consumption) {
      return reply.code(400).send({ error: 'Generation and consumption are required' });
    }

    try {
      const recommendations = generateOptimizationRecommendations(
        {
          generation: parseFloat(generation),
          consumption: parseFloat(consumption),
          peakConsumption: parseFloat(peakConsumption) || parseFloat(consumption) * 1.5
        },
        { averageDaily: generation }
      );

      const storage = calculateStorageRecommendations({
        generation: parseFloat(generation),
        consumption: parseFloat(consumption)
      });

      return {
        recommendations,
        storage
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to generate optimization suggestions' });
    }
  });

  // Manage energy devices
  fastify.post('/api/energy/devices', async (request, reply) => {
    const { deviceName, deviceType, capacity } = request.body;

    if (!deviceName || !deviceType) {
      return reply.code(400).send({ error: 'Device name and type are required' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO energy_devices (device_name, device_type, capacity)
        VALUES (?, ?, ?)
      `);

      const result = stmt.run(deviceName, deviceType, capacity || 0);

      return {
        success: true,
        id: result.lastInsertRowid,
        message: 'Device added successfully'
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to add device' });
    }
  });

  // Get all devices
  fastify.get('/api/energy/devices', async (request, reply) => {
    try {
      const stmt = db.prepare(`
        SELECT * FROM energy_devices
        WHERE status = 'active'
        ORDER BY installed_at DESC
      `);

      const devices = stmt.all();

      return { devices };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch devices' });
    }
  });
}



