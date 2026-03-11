import axios from 'axios';

export async function getWeatherData(latitude, longitude) {
  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude,
        longitude,
        current: 'temperature_2m,wind_speed_10m,cloud_cover',
        daily: 'temperature_2m_max,temperature_2m_min,sunshine_duration,wind_speed_10m_max',
        timezone: 'auto',
        forecast_days: 7
      }
    });
    return response.data;
  } catch (error) {
    console.error('Weather API error:', error);
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
