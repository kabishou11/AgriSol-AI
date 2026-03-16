import db from '../database.js'
import { CROP_SEQUESTRATION_RATES } from './carbon.js'

const ELECTRICITY_EMISSION_FACTOR = 0.5 // kg CO2 per kWh

/**
 * 从作物记录自动计算碳固存
 */
export function calculateCropCarbonFromRecords(userId, startDate, endDate) {
  const records = db.prepare(`
    SELECT
      cr.crop_type,
      COUNT(*) as record_count,
      AVG(cr.health_score) as avg_health
    FROM crop_records cr
    WHERE cr.created_at >= ? AND cr.created_at <= ?
    GROUP BY cr.crop_type
  `).all(startDate, endDate)

  let totalCarbon = 0
  const details = []

  records.forEach(record => {
    const cropKey = record.crop_type?.toLowerCase() || 'default'
    const rate = CROP_SEQUESTRATION_RATES[cropKey] || CROP_SEQUESTRATION_RATES.default

    // 假设每次记录代表0.1公顷作物，健康度影响固碳效率
    const estimatedArea = record.record_count * 0.1
    const healthFactor = (record.avg_health || 70) / 100
    const carbonTons = estimatedArea * rate.rate * healthFactor * (1/12) // 月度估算

    totalCarbon += carbonTons
    details.push({
      cropType: record.crop_type,
      recordCount: record.record_count,
      estimatedArea,
      carbonTons: Number(carbonTons.toFixed(3))
    })
  })

  return {
    totalCarbonTons: Number(totalCarbon.toFixed(3)),
    details,
    source: 'crop_records'
  }
}

/**
 * 从能源记录自动计算碳减排
 */
export function calculateEnergyCarbonFromRecords(userId, startDate, endDate) {
  const energy = db.prepare(`
    SELECT
      SUM(generation) as total_generation,
      SUM(consumption) as total_consumption,
      COUNT(*) as record_count
    FROM energy_records
    WHERE user_id = ? AND timestamp >= ? AND timestamp <= ?
  `).get(userId, startDate, endDate)

  const generation = Number(energy?.total_generation || 0)
  const carbonReduced = (generation * ELECTRICITY_EMISSION_FACTOR) / 1000 // 转为吨

  return {
    totalCarbonTons: Number(carbonReduced.toFixed(3)),
    generationKwh: Number(generation.toFixed(2)),
    recordCount: Number(energy?.record_count || 0),
    source: 'energy_records'
  }
}

/**
 * 自动汇总计算总碳汇
 */
export function autoCalculateTotalCarbon(userId, startDate, endDate) {
  const cropCarbon = calculateCropCarbonFromRecords(userId, startDate, endDate)
  const energyCarbon = calculateEnergyCarbonFromRecords(userId, startDate, endDate)

  const totalCarbon = cropCarbon.totalCarbonTons + energyCarbon.totalCarbonTons
  const equivalentTrees = Math.round((totalCarbon * 1000) / 21.77)

  return {
    totalCarbonTons: Number(totalCarbon.toFixed(3)),
    equivalentTrees,
    breakdown: {
      cropSequestration: cropCarbon,
      emissionReduction: energyCarbon
    },
    period: { startDate, endDate },
    calculatedAt: new Date().toISOString()
  }
}
