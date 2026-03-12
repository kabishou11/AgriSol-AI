import axios from 'axios';

const weatherCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function getWeatherData(latitude, longitude) {
  const cacheKey = `${latitude},${longitude}`;
  const cached = weatherCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude,
        longitude,
        current: 'temperature_2m,wind_speed_10m,cloud_cover,relative_humidity_2m',
        hourly: 'temperature_2m,cloud_cover,wind_speed_10m,shortwave_radiation',
        daily: 'temperature_2m_max,temperature_2m_min,sunshine_duration,wind_speed_10m_max,precipitation_sum,cloud_cover',
        timezone: 'auto',
        forecast_days: 7
      }
    });

    weatherCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });

    return response.data;
  } catch (error) {
    console.error('Weather API error:', error);
    if (cached) {
      return cached.data;
    }
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
