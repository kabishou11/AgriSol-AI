import { getWeatherData } from './weather.js';

/**
 * Calculate solar generation forecast based on weather data
 * @param {Object} weatherData - Weather data from Open-Meteo API
 * @param {number} installedCapacity - Installed solar capacity in kW
 * @returns {Object} Generation forecast
 */
export function calculateSolarForecast(weatherData, installedCapacity = 10) {
  if (!weatherData?.daily) {
    return { daily: [], total: 0 };
  }

  const forecast = weatherData.daily.sunshine_duration.map((sunshine, index) => {
    const sunshineHours = sunshine / 3600;
    const cloudCover = weatherData.daily.cloud_cover_mean?.[index] ?? 50;
    const cloudFactor = 1 - (cloudCover / 100) * 0.7;

    const efficiency = 0.18;
    const performanceRatio = 0.85;

    const generation = sunshineHours * installedCapacity * efficiency * performanceRatio * cloudFactor;

    return {
      date: weatherData.daily.time[index],
      generation: Math.max(0, generation).toFixed(2),
      sunshineHours: sunshineHours.toFixed(1),
      cloudCover: cloudCover
    };
  });

  const total = forecast.reduce((sum, day) => sum + parseFloat(day.generation), 0);

  return {
    daily: forecast,
    total: total.toFixed(2),
    averageDaily: (total / forecast.length).toFixed(2)
  };
}

/**
 * Analyze consumption patterns and predict peak times
 * @param {Array} historicalData - Historical consumption data
 * @returns {Object} Consumption analysis
 */
export function analyzeConsumptionPattern(historicalData) {
  if (!historicalData || historicalData.length === 0) {
    return {
      peakHours: [],
      averageConsumption: 0,
      pattern: 'insufficient_data'
    };
  }

  const hourlyConsumption = new Array(24).fill(0);
  const hourlyCounts = new Array(24).fill(0);

  historicalData.forEach(record => {
    const hour = new Date(record.timestamp).getHours();
    hourlyConsumption[hour] += record.consumption;
    hourlyCounts[hour]++;
  });

  const hourlyAverage = hourlyConsumption.map((total, hour) => ({
    hour,
    average: hourlyCounts[hour] > 0 ? total / hourlyCounts[hour] : 0
  }));

  const sortedHours = [...hourlyAverage].sort((a, b) => b.average - a.average);
  const peakHours = sortedHours.slice(0, 3).map(h => h.hour);

  const totalConsumption = historicalData.reduce((sum, r) => sum + r.consumption, 0);
  const averageConsumption = totalConsumption / historicalData.length;

  return {
    peakHours,
    averageConsumption: averageConsumption.toFixed(2),
    hourlyAverage,
    pattern: 'analyzed'
  };
}

/**
 * Generate optimization recommendations
 * @param {Object} energyData - Current energy data
 * @param {Object} forecast - Generation forecast
 * @returns {Array} Optimization recommendations
 */
export function generateOptimizationRecommendations(energyData, forecast) {
  const recommendations = [];

  const selfSufficiency = energyData.generation / energyData.consumption;

  if (selfSufficiency < 0.5) {
    recommendations.push({
      type: 'warning',
      priority: 'high',
      title: '自给率偏低',
      description: '当前能源自给率低于50%，建议增加太阳能板容量或优化用电时段',
      action: 'increase_capacity'
    });
  }

  if (energyData.peakConsumption > energyData.generation * 1.5) {
    recommendations.push({
      type: 'alert',
      priority: 'high',
      title: '峰值用电过高',
      description: '用电高峰期超过发电能力，建议配置储能系统或调整用电时间',
      action: 'add_storage'
    });
  }

  if (forecast.averageDaily > energyData.consumption * 1.2) {
    recommendations.push({
      type: 'success',
      priority: 'medium',
      title: '发电充足',
      description: '预计发电量充足，可考虑将多余电力并网或用于其他用途',
      action: 'grid_connection'
    });
  }

  const currentHour = new Date().getHours();
  if (currentHour >= 10 && currentHour <= 15) {
    recommendations.push({
      type: 'info',
      priority: 'low',
      title: '最佳用电时段',
      description: '当前为太阳能发电高峰期，建议安排高耗能设备运行',
      action: 'schedule_tasks'
    });
  }

  return recommendations;
}

/**
 * Calculate energy storage recommendations
 * @param {Object} energyData - Current energy data
 * @returns {Object} Storage recommendations
 */
export function calculateStorageRecommendations(energyData) {
  const generation = parseFloat(energyData.generation) || 0;
  const consumption = parseFloat(energyData.consumption) || 0;

  // Use realistic defaults when no real data yet
  const effectiveGen = generation > 0 ? generation : 28.5;   // typical 10kW system daily avg
  const effectiveCon = consumption > 0 ? consumption : 22.0; // typical farm household

  const excessGeneration = Math.max(0, effectiveGen - effectiveCon);
  const deficit = Math.max(0, effectiveCon - effectiveGen);
  const recommendedCapacity = Math.max(excessGeneration, deficit, 5) * 1.5;

  // Storage cost ~1500 yuan/kWh, annual savings from storing excess
  const annualSavings = excessGeneration * 365 * 0.58; // 0.58 yuan/kWh residential rate
  const storageCost = recommendedCapacity * 1500;
  const payback = annualSavings > 0 ? storageCost / annualSavings : 8.5;

  return {
    recommendedCapacity: recommendedCapacity.toFixed(1),
    excessGeneration: excessGeneration.toFixed(2),
    deficit: deficit.toFixed(2),
    paybackPeriod: Math.min(payback, 15).toFixed(1),
    estimatedSavings: annualSavings.toFixed(2)
  };
}

/**
 * Calculate revenue from energy generation
 * @param {number} generation - Generation in kWh
 * @param {number} consumption - Consumption in kWh
 * @param {Object} rates - Electricity rates
 * @returns {Object} Revenue calculation
 */
export function calculateRevenue(generation, consumption, rates = { grid: 0.6, retail: 1.0 }) {
  const selfConsumed = Math.min(generation, consumption);
  const exported = Math.max(0, generation - consumption);
  const imported = Math.max(0, consumption - generation);

  const savingsFromSelfConsumption = selfConsumed * rates.retail;
  const revenueFromExport = exported * rates.grid;
  const costOfImport = imported * rates.retail;

  const netSavings = savingsFromSelfConsumption + revenueFromExport - costOfImport;

  return {
    selfConsumed: selfConsumed.toFixed(2),
    exported: exported.toFixed(2),
    imported: imported.toFixed(2),
    savingsFromSelfConsumption: savingsFromSelfConsumption.toFixed(2),
    revenueFromExport: revenueFromExport.toFixed(2),
    costOfImport: costOfImport.toFixed(2),
    netSavings: netSavings.toFixed(2)
  };
}

/**
 * Get comprehensive energy prediction
 * @param {number} latitude - Location latitude
 * @param {number} longitude - Location longitude
 * @param {number} installedCapacity - Installed capacity in kW
 * @param {Array} historicalData - Historical consumption data
 * @returns {Object} Complete prediction data
 */
export async function getEnergyPrediction(latitude, longitude, installedCapacity, historicalData) {
  const weatherData = await getWeatherData(latitude, longitude);

  if (!weatherData) {
    throw new Error('Failed to fetch weather data');
  }

  const forecast = calculateSolarForecast(weatherData, installedCapacity);
  const consumptionPattern = analyzeConsumptionPattern(historicalData);

  const currentGeneration = parseFloat(forecast.averageDaily);
  const currentConsumption = parseFloat(consumptionPattern.averageConsumption) || 20;

  const recommendations = generateOptimizationRecommendations(
    {
      generation: currentGeneration,
      consumption: currentConsumption,
      peakConsumption: currentConsumption * 1.5
    },
    forecast
  );

  const storage = calculateStorageRecommendations({
    generation: currentGeneration,
    consumption: currentConsumption
  });

  const revenue = calculateRevenue(currentGeneration, currentConsumption);

  return {
    forecast,
    consumptionPattern,
    recommendations,
    storage,
    revenue,
    weatherData
  };
}
