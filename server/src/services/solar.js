import axios from 'axios'

const solarCache = new Map()
const CACHE_DURATION = 60 * 60 * 1000 // 1小时缓存

const SOLAR_URL = process.env.OPENMETEO_SOLAR_URL || 'https://api.open-meteo.com/v1/forecast'
const TIMEOUT = parseInt(process.env.OPENMETEO_TIMEOUT) || 10000

/**
 * 获取实时太阳辐射数据
 * @param {number} latitude - 纬度
 * @param {number} longitude - 经度
 * @returns {Promise<Object>} 太阳辐射数据
 */
export async function getSolarRadiation(latitude, longitude) {
  const cacheKey = `${latitude},${longitude}`
  const cached = solarCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    const response = await axios.get(SOLAR_URL, {
      params: {
        latitude,
        longitude,
        current: 'shortwave_radiation,direct_radiation,diffuse_radiation',
        hourly: 'shortwave_radiation,direct_radiation,diffuse_radiation',
        timezone: 'Asia/Shanghai',
        forecast_days: 1
      },
      timeout: TIMEOUT
    })

    const data = {
      current: {
        shortwave_radiation: response.data.current.shortwave_radiation || 0,
        direct_radiation: response.data.current.direct_radiation || 0,
        diffuse_radiation: response.data.current.diffuse_radiation || 0,
        time: response.data.current.time
      },
      hourly: {
        time: response.data.hourly.time,
        shortwave_radiation: response.data.hourly.shortwave_radiation,
        direct_radiation: response.data.hourly.direct_radiation,
        diffuse_radiation: response.data.hourly.diffuse_radiation
      }
    }

    solarCache.set(cacheKey, { data, timestamp: Date.now() })
    return data
  } catch (error) {
    console.error('Solar API error:', error.message)
    if (cached) return cached.data
    return null
  }
}

/**
 * 计算光伏发电量
 * @param {number} solarRadiation - 太阳辐射 (W/m²)
 * @param {number} panelArea - 光伏板面积 (m²)
 * @param {number} efficiency - 光伏板效率 (0-1)
 * @returns {number} 发电量 (kWh)
 */
export function calculatePVGeneration(solarRadiation, panelArea = 100, efficiency = 0.18) {
  if (!solarRadiation || solarRadiation <= 0) return 0

  // 发电量 = 辐射强度 × 面积 × 效率 / 1000
  const powerKw = (solarRadiation * panelArea * efficiency) / 1000
  return Math.round(powerKw * 100) / 100
}

/**
 * 获取每日预计发电量
 * @param {number} latitude - 纬度
 * @param {number} longitude - 经度
 * @param {number} panelArea - 光伏板面积
 * @param {number} efficiency - 光伏板效率
 * @returns {Promise<Object>} 发电数据
 */
export async function getDailyPVForecast(latitude, longitude, panelArea = 100, efficiency = 0.18) {
  const solarData = await getSolarRadiation(latitude, longitude)

  if (!solarData) {
    return {
      current: 0,
      dailyTotal: 0,
      hourly: []
    }
  }

  const currentGeneration = calculatePVGeneration(
    solarData.current.shortwave_radiation,
    panelArea,
    efficiency
  )

  const hourlyGeneration = solarData.hourly.shortwave_radiation.map((radiation, index) => ({
    time: solarData.hourly.time[index],
    radiation,
    generation: calculatePVGeneration(radiation, panelArea, efficiency)
  }))

  const dailyTotal = hourlyGeneration.reduce((sum, h) => sum + h.generation, 0)

  return {
    current: currentGeneration,
    dailyTotal: Math.round(dailyTotal * 100) / 100,
    hourly: hourlyGeneration,
    metadata: {
      location: { latitude, longitude },
      panelArea,
      efficiency,
      timestamp: solarData.current.time
    }
  }
}
