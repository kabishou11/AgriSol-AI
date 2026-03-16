import axios from 'axios';

const weatherCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const QWEATHER_KEY = process.env.QWEATHER_API_KEY;
const QWEATHER_URL = process.env.QWEATHER_BASE_URL || 'https://devapi.qweather.com/v7';

export async function getWeatherData(latitude, longitude) {
  const cacheKey = `${latitude},${longitude}`;
  const cached = weatherCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const location = `${longitude},${latitude}`;
    const [nowRes, dailyRes] = await Promise.all([
      axios.get(`${QWEATHER_URL}/weather/now`, {
        params: { location, key: QWEATHER_KEY },
        timeout: 10000
      }),
      axios.get(`${QWEATHER_URL}/weather/7d`, {
        params: { location, key: QWEATHER_KEY },
        timeout: 10000
      })
    ]);

    if (nowRes.data.code === '200' && dailyRes.data.code === '200') {
      const data = {
        current: {
          temperature_2m: parseFloat(nowRes.data.now.temp),
          wind_speed_10m: parseFloat(nowRes.data.now.windSpeed),
          cloud_cover: parseFloat(nowRes.data.now.cloud || 0),
          relative_humidity_2m: parseInt(nowRes.data.now.humidity)
        },
        daily: {
          temperature_2m_max: dailyRes.data.daily.map(d => parseFloat(d.tempMax)),
          temperature_2m_min: dailyRes.data.daily.map(d => parseFloat(d.tempMin)),
          wind_speed_10m_max: dailyRes.data.daily.map(d => parseFloat(d.windSpeedDay)),
          precipitation_sum: dailyRes.data.daily.map(d => parseFloat(d.precip || 0)),
          cloud_cover_mean: dailyRes.data.daily.map(d => parseFloat(d.cloud || 50))
        }
      };

      weatherCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    }
    throw new Error('Weather API error');
  } catch (error) {
    console.error('Weather API error:', error);
    if (cached) return cached.data;
    return null;
  }
}

export function calculateSolarPotential(weatherData) {
  if (!weatherData?.daily) return 0;
  const avgSunshine = weatherData.daily.sunshine_duration.reduce((a, b) => a + b, 0) / weatherData.daily.sunshine_duration.length;
  return (avgSunshine / 3600 / 12 * 100).toFixed(2);
}

export function calculateWindPotential(weatherData) {
  if (!weatherData?.daily) return 0;
  const avgWind = weatherData.daily.wind_speed_10m_max.reduce((a, b) => a + b, 0) / weatherData.daily.wind_speed_10m_max.length;
  return Math.min((avgWind / 15 * 100), 100).toFixed(2);
}

/**
 * Calculate solar radiation potential
 * @param {Object} weatherData - Weather data
 * @returns {number} Solar radiation potential percentage
 */
export function calculateSolarRadiation(weatherData) {
  if (!weatherData?.hourly?.shortwave_radiation) return 0;

  const avgRadiation = weatherData.hourly.shortwave_radiation
    .filter(r => r > 0)
    .reduce((a, b) => a + b, 0) / weatherData.hourly.shortwave_radiation.filter(r => r > 0).length;

  const maxPossibleRadiation = 1000;
  return Math.min((avgRadiation / maxPossibleRadiation * 100), 100).toFixed(2);
}

/**
 * Clear weather cache
 */
export function clearWeatherCache() {
  weatherCache.clear();
}

/**
 * Get air quality data from QWeather
 */
export async function getAirQuality(latitude, longitude) {
  const cacheKey = `air:${latitude},${longitude}`;
  const cached = weatherCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const location = `${longitude},${latitude}`;
    const res = await axios.get(`${QWEATHER_URL}/air/now`, {
      params: { location, key: QWEATHER_KEY },
      timeout: 10000
    });

    if (res.data.code === '200') {
      const data = {
        aqi: parseInt(res.data.now.aqi),
        category: res.data.now.category,
        pm25: parseInt(res.data.now.pm2p5),
        pm10: parseInt(res.data.now.pm10),
        no2: parseInt(res.data.now.no2),
        so2: parseInt(res.data.now.so2),
        co: parseFloat(res.data.now.co),
        o3: parseInt(res.data.now.o3)
      };

      weatherCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    }
    throw new Error('Air quality API error');
  } catch (error) {
    console.error('Air quality API error:', error);
    if (cached) return cached.data;
    return null;
  }
}
