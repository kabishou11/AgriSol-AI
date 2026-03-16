import db from '../database.js';
import {
  getEnergyPrediction,
  calculateRevenue,
  generateOptimizationRecommendations,
  calculateStorageRecommendations
} from '../services/energy-prediction.js';

function toFixedNumber(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

function getRegionProfile(mode = 'national', regionCode) {
  if (mode === 'shouguang') {
    return {
      regionName: '山东寿光样板',
      latitude: 36.88,
      longitude: 118.74,
      capacityKw: 12,
      estimateGeneration: 31.5,
      estimateConsumption: 24.2,
      sampleGeneration: 36.8,
      sampleConsumption: 23.4
    };
  }

  const regionName = regionCode ? `${regionCode}（全国口径）` : '全国通用';
  return {
    regionName,
    latitude: 35.86,
    longitude: 104.19,
    capacityKw: 10,
    estimateGeneration: 26.4,
    estimateConsumption: 21.1,
    sampleGeneration: 36.8,
    sampleConsumption: 23.4
  };
}

function buildStatusLabel({
  sourceType,
  mode,
  regionCode,
  generationKwh,
  consumptionKwh,
  hasUserInput,
  isNight
}) {
  if (sourceType === 'user_input') {
    return hasUserInput ? '已录入今日数据' : '尚未录入今日数据';
  }

  if (sourceType === 'estimated') {
    if (!regionCode && mode === 'national') {
      return '未选择地区，已使用全国通用估算';
    }
    if (generationKwh === 0 && consumptionKwh === 0) {
      return '该地区暂无估算结果';
    }
    if (isNight) {
      return '当前为夜间时段';
    }
    return '模型估算可用';
  }

  return mode === 'shouguang' ? '寿光样板参考值' : '寿光样板参考（跨区对照）';
}

function shouldUseLegacyFallback(uid) {
  return uid === 1;
}

function getTodayForUser(uid) {
  return db.prepare(`
    SELECT
      SUM(generation) as total_generation,
      SUM(consumption) as total_consumption,
      SUM(grid_import) as total_import,
      SUM(grid_export) as total_export,
      AVG(generation) as avg_generation,
      AVG(consumption) as avg_consumption
    FROM energy_records
    WHERE user_id = ? AND DATE(timestamp) = DATE('now')
  `).get(uid);
}

function getTodayLegacyFallback() {
  return db.prepare(`
    SELECT
      SUM(generation) as total_generation,
      SUM(consumption) as total_consumption,
      SUM(grid_import) as total_import,
      SUM(grid_export) as total_export,
      AVG(generation) as avg_generation,
      AVG(consumption) as avg_consumption
    FROM energy_records
    WHERE user_id IS NULL AND DATE(timestamp) = DATE('now')
  `).get();
}

function getStatsDailyForUser(uid, dateFilter) {
  return db.prepare(`
    SELECT
      DATE(timestamp) as date,
      SUM(generation) as generation,
      SUM(consumption) as consumption,
      SUM(grid_export) as export,
      SUM(grid_import) as import
    FROM energy_records
    WHERE user_id = ? AND ${dateFilter}
    GROUP BY DATE(timestamp)
    ORDER BY date ASC
  `).all(uid);
}

function getStatsDailyLegacyFallback(dateFilter) {
  return db.prepare(`
    SELECT
      DATE(timestamp) as date,
      SUM(generation) as generation,
      SUM(consumption) as consumption,
      SUM(grid_export) as export,
      SUM(grid_import) as import
    FROM energy_records
    WHERE user_id IS NULL AND ${dateFilter}
    GROUP BY DATE(timestamp)
    ORDER BY date ASC
  `).all();
}

function getStatsTotalsForUser(uid, dateFilter) {
  return db.prepare(`
    SELECT
      SUM(generation) as total_generation,
      SUM(consumption) as total_consumption,
      SUM(grid_export) as total_export,
      SUM(grid_import) as total_import
    FROM energy_records
    WHERE user_id = ? AND ${dateFilter}
  `).get(uid);
}

function getStatsTotalsLegacyFallback(dateFilter) {
  return db.prepare(`
    SELECT
      SUM(generation) as total_generation,
      SUM(consumption) as total_consumption,
      SUM(grid_export) as total_export,
      SUM(grid_import) as total_import
    FROM energy_records
    WHERE user_id IS NULL AND ${dateFilter}
  `).get();
}

function getUserInputForDate(uid, targetDate) {
  return db.prepare(`
    SELECT
      SUM(generation) AS generation,
      SUM(consumption) AS consumption,
      MAX(timestamp) AS updated_at,
      COUNT(*) AS record_count
    FROM energy_records
    WHERE user_id = ? AND DATE(timestamp) = DATE(?)
  `).get(uid, targetDate);
}

function getUserInputLegacyFallback(targetDate) {
  return db.prepare(`
    SELECT
      SUM(generation) AS generation,
      SUM(consumption) AS consumption,
      MAX(timestamp) AS updated_at,
      COUNT(*) AS record_count
    FROM energy_records
    WHERE user_id IS NULL AND DATE(timestamp) = DATE(?)
  `).get(targetDate);
}

function getEstimateBaseForDate(uid, targetDate) {
  return db.prepare(`
    SELECT
      AVG(generation) AS avg_generation,
      AVG(consumption) AS avg_consumption,
      MAX(timestamp) AS updated_at
    FROM energy_records
    WHERE user_id = ? AND datetime(timestamp) >= datetime(?, '-30 days')
  `).get(uid, targetDate);
}

function getEstimateBaseLegacyFallback(targetDate) {
  return db.prepare(`
    SELECT
      AVG(generation) AS avg_generation,
      AVG(consumption) AS avg_consumption,
      MAX(timestamp) AS updated_at
    FROM energy_records
    WHERE user_id IS NULL AND datetime(timestamp) >= datetime(?, '-30 days')
  `).get(targetDate);
}

function getActiveDevicesForUser(uid) {
  return db.prepare(`
    SELECT * FROM energy_devices
    WHERE user_id = ? AND status = 'active'
    ORDER BY installed_at DESC
  `).all(uid);
}

function getActiveDevicesLegacyFallback() {
  return db.prepare(`
    SELECT * FROM energy_devices
    WHERE user_id IS NULL AND status = 'active'
    ORDER BY installed_at DESC
  `).all();
}

function getForecastHistoryForUser(uid) {
  return db.prepare(`
    SELECT timestamp, consumption
    FROM energy_records
    WHERE user_id = ? AND timestamp >= datetime('now', '-30 days')
    ORDER BY timestamp DESC
  `).all(uid);
}

function getForecastHistoryLegacyFallback() {
  return db.prepare(`
    SELECT timestamp, consumption
    FROM energy_records
    WHERE user_id IS NULL AND timestamp >= datetime('now', '-30 days')
    ORDER BY timestamp DESC
  `).all();
}

const overviewPredictionCache = new Map();
const MAX_OVERVIEW_CACHE_SIZE = 200;

function getPredictionCacheKey({ mode, regionCode, targetDate }) {
  return `${mode || 'national'}::${regionCode || 'default'}::${targetDate}`;
}

function getCachedPrediction(key) {
  const cached = overviewPredictionCache.get(key);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    overviewPredictionCache.delete(key);
    return null;
  }

  return cached.value;
}

function setCachedPrediction(key, value) {
  if (overviewPredictionCache.size >= MAX_OVERVIEW_CACHE_SIZE) {
    let oldestKey = null;
    let oldestExpiresAt = Infinity;

    for (const [cacheKey, cacheValue] of overviewPredictionCache.entries()) {
      if ((cacheValue?.expiresAt || 0) < oldestExpiresAt) {
        oldestExpiresAt = cacheValue.expiresAt;
        oldestKey = cacheKey;
      }
    }

    if (oldestKey) {
      overviewPredictionCache.delete(oldestKey);
    }
  }

  overviewPredictionCache.set(key, {
    value,
    expiresAt: Date.now() + 10 * 60 * 1000
  });
}

function hasAnyValue(row, fields) {
  return fields.some((field) => row?.[field] !== null && row?.[field] !== undefined);
}

function buildCaliberSnapshot(generationKwh, consumptionKwh, statusLabel) {
  const safeGeneration = Number(generationKwh || 0);
  const safeConsumption = Number(consumptionKwh || 0);
  const selfSufficiencyPct = safeConsumption > 0
    ? toFixedNumber((safeGeneration / safeConsumption) * 100, 1)
    : 0;

  const revenue = calculateRevenue(safeGeneration, safeConsumption);
  const savingsYuan = toFixedNumber(Number(revenue?.netSavings || 0), 2);

  return {
    generationKwh: toFixedNumber(safeGeneration, 2),
    consumptionKwh: toFixedNumber(safeConsumption, 2),
    selfSufficiencyPct,
    savingsYuan,
    statusLabel,

    // Legacy aliases (P1 compatibility)
    generation: toFixedNumber(safeGeneration, 2),
    consumption: toFixedNumber(safeConsumption, 2),
    selfSufficiency: selfSufficiencyPct,
    savings: savingsYuan
  };
}

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
      deviceType = 'solar',
      userId = 1
    } = request.body;

    if (generation === undefined || consumption === undefined) {
      return reply.code(400).send({ error: 'Generation and consumption are required' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO energy_records
        (user_id, generation, consumption, grid_import, grid_export, battery_charge, battery_discharge, device_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        Number(userId) || 1,
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
    const { userId = 1 } = request.query || {};

    try {
      const uid = Number(userId) || 1;
      let todayData = getTodayForUser(uid);

      if (!hasAnyValue(todayData, ['total_generation', 'total_consumption', 'total_import', 'total_export']) && shouldUseLegacyFallback(uid)) {
        const legacyTodayData = getTodayLegacyFallback();
        if (hasAnyValue(legacyTodayData, ['total_generation', 'total_consumption', 'total_import', 'total_export'])) {
          todayData = legacyTodayData;
        }
      }

      const totalGeneration = Number(todayData?.total_generation || 0);
      const totalConsumption = Number(todayData?.total_consumption || 0);
      const selfSufficiency = totalConsumption > 0
        ? Number(((totalGeneration / totalConsumption) * 100).toFixed(2))
        : 0;

      const revenue = calculateRevenue(totalGeneration, totalConsumption);

      return {
        generation: toFixedNumber(totalGeneration, 2),
        consumption: toFixedNumber(totalConsumption, 2),
        gridImport: toFixedNumber(todayData?.total_import || 0, 2),
        gridExport: toFixedNumber(todayData?.total_export || 0, 2),
        selfSufficiency,
        savings: toFixedNumber(revenue?.netSavings || 0, 2),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch today\'s data' });
    }
  });

  // Energy overview for decision-first page
  fastify.get('/api/energy/overview', async (request, reply) => {
    try {
      const {
        date,
        mode = 'national',
        regionCode,
        userId = 1
      } = request.query || {};

      const targetDate = date || new Date().toISOString().slice(0, 10);
      const profile = getRegionProfile(mode, regionCode);
      const uid = Number(userId) || 1;
      const isNight = (() => {
        const hour = new Date().getHours();
        return hour < 6 || hour >= 19;
      })();

      // 用户录入口径
      let userInputRaw = getUserInputForDate(uid, targetDate);

      if (!Number(userInputRaw?.record_count || 0) && shouldUseLegacyFallback(uid)) {
        // fallback: 兼容历史无 user_id
        const legacyUserInputRaw = getUserInputLegacyFallback(targetDate);
        if (Number(legacyUserInputRaw?.record_count || 0)) {
          userInputRaw = legacyUserInputRaw;
        }
      }

      const hasUserInput = Number(userInputRaw?.record_count || 0) > 0;
      const userInputGeneration = Number(userInputRaw?.generation || 0);
      const userInputConsumption = Number(userInputRaw?.consumption || 0);

      // 模型估算口径（近期平均 + 天气预测融合）
      let estimateBase = getEstimateBaseForDate(uid, targetDate);

      if (!hasAnyValue(estimateBase, ['avg_generation', 'avg_consumption']) && shouldUseLegacyFallback(uid)) {
        const legacyEstimateBase = getEstimateBaseLegacyFallback(targetDate);
        if (hasAnyValue(legacyEstimateBase, ['avg_generation', 'avg_consumption'])) {
          estimateBase = legacyEstimateBase;
        }
      }

      let estimateGeneration = Number(estimateBase?.avg_generation || 0);
      let estimateConsumption = Number(estimateBase?.avg_consumption || 0);
      let estimateConfidence = estimateGeneration > 0 || estimateConsumption > 0 ? 0.66 : 0.52;
      let estimateUpdatedAt = estimateBase?.updated_at || null;

      const predictionCacheKey = getPredictionCacheKey({ mode, regionCode, targetDate });
      const cachedPrediction = getCachedPrediction(predictionCacheKey);

      if (cachedPrediction) {
        const predictedGeneration = Number(cachedPrediction?.forecast?.averageDaily || 0);

        if (predictedGeneration > 0) {
          estimateGeneration = estimateGeneration > 0
            ? (estimateGeneration * 0.5 + predictedGeneration * 0.5)
            : predictedGeneration;
          estimateConsumption = estimateConsumption > 0
            ? estimateConsumption
            : Math.max(predictedGeneration * 0.72, 10);
          estimateConfidence = 0.74;
          estimateUpdatedAt = cachedPrediction?.generatedAt || new Date().toISOString();
        }
      } else {
        try {
          const prediction = await getEnergyPrediction(
            profile.latitude,
            profile.longitude,
            profile.capacityKw,
            []
          );

          if (prediction) {
            setCachedPrediction(predictionCacheKey, prediction);
          }

          const predictedGeneration = Number(prediction?.forecast?.averageDaily || 0);

          if (predictedGeneration > 0) {
            estimateGeneration = estimateGeneration > 0
              ? (estimateGeneration * 0.5 + predictedGeneration * 0.5)
              : predictedGeneration;
            estimateConsumption = estimateConsumption > 0
              ? estimateConsumption
              : Math.max(predictedGeneration * 0.72, 10);
            estimateConfidence = 0.74;
            estimateUpdatedAt = new Date().toISOString();
          }
        } catch {
          // 天气预测失败时继续使用统计估算
        }
      }

      if (estimateGeneration === 0 && estimateConsumption === 0) {
        estimateGeneration = profile.estimateGeneration;
        estimateConsumption = profile.estimateConsumption;
        estimateConfidence = 0.56;
      }

      // 寿光样板参考口径
      const sampleGeneration = profile.sampleGeneration;
      const sampleConsumption = profile.sampleConsumption;

      const estimateStatus = buildStatusLabel({
        sourceType: 'estimated',
        mode,
        regionCode,
        generationKwh: estimateGeneration,
        consumptionKwh: estimateConsumption,
        hasUserInput: false,
        isNight
      });

      const sampleStatus = buildStatusLabel({
        sourceType: 'sample',
        mode,
        regionCode,
        generationKwh: sampleGeneration,
        consumptionKwh: sampleConsumption,
        hasUserInput: false,
        isNight
      });

      const userStatus = buildStatusLabel({
        sourceType: 'user_input',
        mode,
        regionCode,
        generationKwh: userInputGeneration,
        consumptionKwh: userInputConsumption,
        hasUserInput,
        isNight
      });

      const estimate = buildCaliberSnapshot(estimateGeneration, estimateConsumption, estimateStatus);
      const sample = buildCaliberSnapshot(sampleGeneration, sampleConsumption, sampleStatus);
      const userInput = buildCaliberSnapshot(userInputGeneration, userInputConsumption, userStatus);

      return {
        success: true,
        data: {
          date: targetDate,
          mode,
          regionCode: regionCode || null,
          regionName: profile.regionName,
          estimate,
          sample,
          userInput,
          sourceMeta: {
            estimate: {
              sourceType: 'estimated',
              updatedAt: estimateUpdatedAt || new Date().toISOString(),
              confidence: estimateConfidence,
              regionName: profile.regionName,
              mode,
              caliberLabel: '全国通用估算'
            },
            sample: {
              sourceType: 'sample',
              updatedAt: new Date().toISOString(),
              confidence: 0.8,
              regionName: '山东寿光样板',
              mode,
              caliberLabel: '寿光样板参考'
            },
            userInput: {
              sourceType: 'user_input',
              updatedAt: userInputRaw?.updated_at || null,
              confidence: hasUserInput ? 1 : 0,
              regionName: profile.regionName,
              mode,
              caliberLabel: '用户录入'
            }
          }
        },
        meta: {
          generatedAt: new Date().toISOString(),
          regionMode: mode,
          regionName: profile.regionName,
          dataWindow: 'daily'
        },
        message: 'ok'
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        data: null,
        meta: {
          generatedAt: new Date().toISOString(),
          regionMode: 'national',
          regionName: '全国通用',
          dataWindow: 'daily'
        },
        message: 'Failed to fetch energy overview'
      });
    }
  });

  // Get energy forecast
  fastify.get('/api/energy/forecast', async (request, reply) => {
    const { latitude = 39.9, longitude = 116.4, capacity = 10, userId = 1 } = request.query;

    try {
      const uid = Number(userId) || 1;
      let historicalData = getForecastHistoryForUser(uid);

      if (!historicalData.length && shouldUseLegacyFallback(uid)) {
        const legacyHistoricalData = getForecastHistoryLegacyFallback();
        if (legacyHistoricalData.length) {
          historicalData = legacyHistoricalData;
        }
      }

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
    const { period = 'week', userId = 1 } = request.query;

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
      const uid = Number(userId) || 1;

      let dailyData = getStatsDailyForUser(uid, dateFilter);

      if (!dailyData.length && shouldUseLegacyFallback(uid)) {
        const legacyDailyData = getStatsDailyLegacyFallback(dateFilter);
        if (legacyDailyData.length) {
          dailyData = legacyDailyData;
        }
      }

      let totals = getStatsTotalsForUser(uid, dateFilter);

      if (!hasAnyValue(totals, ['total_generation', 'total_consumption', 'total_export', 'total_import']) && shouldUseLegacyFallback(uid)) {
        const legacyTotals = getStatsTotalsLegacyFallback(dateFilter);
        if (hasAnyValue(legacyTotals, ['total_generation', 'total_consumption', 'total_export', 'total_import'])) {
          totals = legacyTotals;
        }
      }

      const totalGeneration = Number(totals?.total_generation || 0);
      const totalConsumption = Number(totals?.total_consumption || 0);
      const selfSufficiency = totalConsumption > 0
        ? Number(((totalGeneration / totalConsumption) * 100).toFixed(2))
        : 0;

      return {
        period,
        daily: dailyData,
        totals,
        selfSufficiency,

        // 统一字段别名
        totalGeneration: toFixedNumber(totalGeneration, 2),
        totalConsumption: toFixedNumber(totalConsumption, 2),
        selfSufficiencyPct: selfSufficiency
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
    const { deviceName, deviceType, capacity, userId = 1 } = request.body;

    if (!deviceName || !deviceType) {
      return reply.code(400).send({ error: 'Device name and type are required' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO energy_devices (user_id, device_name, device_type, capacity)
        VALUES (?, ?, ?, ?)
      `);

      const result = stmt.run(Number(userId) || 1, deviceName, deviceType, capacity || 0);

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
    const { userId = 1 } = request.query || {};

    try {
      const uid = Number(userId) || 1;
      let devices = getActiveDevicesForUser(uid);

      if (!devices.length && shouldUseLegacyFallback(uid)) {
        const legacyDevices = getActiveDevicesLegacyFallback();
        if (legacyDevices.length) {
          devices = legacyDevices;
        }
      }

      return { devices };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch devices' });
    }
  });
}
