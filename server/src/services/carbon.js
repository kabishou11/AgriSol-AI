// IPCC-based Carbon Sequestration Calculation Service

// Emission factors (kg CO2e per unit)
const EMISSION_FACTORS = {
  electricity: 0.5,
  diesel: 2.68,
  gasoline: 2.31,
  fertilizer_n: 5.87,
  fertilizer_p: 0.67,
  fertilizer_k: 0.45,
  transport: 0.12
};

// Carbon sequestration rates based on IPCC guidelines
// Values in tons CO2e per hectare per year
export const CROP_SEQUESTRATION_RATES = {
  rice: {
    rate: 2.8,
    icon: '🌾',
    name: '水稻',
    biomassCarbon: 0.45,
    soilCarbon: 0.35
  },
  wheat: {
    rate: 2.2,
    icon: '🌾',
    name: '小麦',
    biomassCarbon: 0.42,
    soilCarbon: 0.28
  },
  corn: {
    rate: 3.2,
    icon: '🌽',
    name: '玉米',
    biomassCarbon: 0.48,
    soilCarbon: 0.32
  },
  soybean: {
    rate: 2.5,
    icon: '🫘',
    name: '大豆',
    biomassCarbon: 0.40,
    soilCarbon: 0.35
  },
  potato: {
    rate: 1.8,
    icon: '🥔',
    name: '马铃薯',
    biomassCarbon: 0.38,
    soilCarbon: 0.22
  },
  vegetables: {
    rate: 2.0,
    icon: '🥬',
    name: '蔬菜',
    biomassCarbon: 0.35,
    soilCarbon: 0.25
  },
  cotton: {
    rate: 2.6,
    icon: '🌱',
    name: '棉花',
    biomassCarbon: 0.43,
    soilCarbon: 0.27
  },
  sugarcane: {
    rate: 4.5,
    icon: '🎋',
    name: '甘蔗',
    biomassCarbon: 0.52,
    soilCarbon: 0.38
  },
  default: {
    rate: 2.0,
    icon: '🌱',
    name: '其他作物',
    biomassCarbon: 0.40,
    soilCarbon: 0.30
  }
};

// Average tree carbon sequestration: 21.77 kg CO2 per year
const TREE_SEQUESTRATION_RATE = 21.77;

// Area unit conversion to hectares
const AREA_CONVERSIONS = {
  hectare: 1,
  acre: 0.404686,
  mu: 0.0666667,
  sqm: 0.0001
};

export function calculateCarbonFootprint(activityType, amount, unit = 'kg') {
  const factor = EMISSION_FACTORS[activityType] || 1;
  const carbonKg = amount * factor;

  return {
    carbonKg: carbonKg.toFixed(2),
    carbonTons: (carbonKg / 1000).toFixed(4),
    activityType,
    amount,
    unit,
    factor
  };
}

export function calculateCarbonSequestration(cropType, area, areaUnit = 'hectare', duration = 12) {
  const cropData = CROP_SEQUESTRATION_RATES[cropType] || CROP_SEQUESTRATION_RATES.default;
  const areaInHectares = area * (AREA_CONVERSIONS[areaUnit] || 1);
  const durationInYears = duration / 12;

  const totalSequestered = areaInHectares * cropData.rate * durationInYears;
  const biomassCarbon = totalSequestered * cropData.biomassCarbon;
  const soilCarbon = totalSequestered * cropData.soilCarbon;
  const equivalentTrees = Math.round((totalSequestered * 1000) / TREE_SEQUESTRATION_RATE);

  const emissionReduction = {
    carKm: Math.round(totalSequestered * 1000 / 0.12),
    electricityKwh: Math.round(totalSequestered * 1000 / 0.5),
    flights: (totalSequestered / 0.9).toFixed(1)
  };

  return {
    totalSequestered: totalSequestered.toFixed(3),
    totalSequesteredKg: (totalSequestered * 1000).toFixed(2),
    biomassCarbon: biomassCarbon.toFixed(3),
    soilCarbon: soilCarbon.toFixed(3),
    equivalentTrees,
    emissionReduction,
    cropType,
    cropName: cropData.name,
    cropIcon: cropData.icon,
    area,
    areaUnit,
    areaInHectares: areaInHectares.toFixed(4),
    duration,
    durationInYears: durationInYears.toFixed(2),
    rate: cropData.rate,
    calculationMethod: 'IPCC 2006 Guidelines',
    calculatedAt: new Date().toISOString()
  };
}

export function generateCertificateId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CARBON-${timestamp}-${random}`;
}

export function calculateEnvironmentalScore(indicators) {
  const {
    soilPh = 7,
    soilOrganicMatter = 2,
    soilNitrogen = 0.1,
    soilPhosphorus = 0.02,
    soilPotassium = 0.15,
    waterEfficiency = 0.6,
    biodiversityScore = 50
  } = indicators;

  let soilScore = 0;
  if (soilPh >= 6.0 && soilPh <= 7.5) {
    soilScore += 20;
  } else if (soilPh >= 5.5 && soilPh <= 8.0) {
    soilScore += 15;
  } else {
    soilScore += 10;
  }

  if (soilOrganicMatter >= 3) {
    soilScore += 20;
  } else if (soilOrganicMatter >= 2) {
    soilScore += 15;
  } else {
    soilScore += 10;
  }

  const npkScore = Math.min(20, (soilNitrogen * 100 + soilPhosphorus * 500 + soilPotassium * 67) / 3);
  soilScore += npkScore;

  const waterScore = waterEfficiency * 30;
  const bioScore = (biodiversityScore / 100) * 30;
  const totalScore = soilScore + waterScore + bioScore;

  return {
    totalScore: Math.round(totalScore),
    soilHealthScore: Math.round(soilScore),
    waterEfficiencyScore: Math.round(waterScore),
    biodiversityScore: Math.round(bioScore),
    rating: totalScore >= 80 ? 'Excellent' : totalScore >= 60 ? 'Good' : totalScore >= 40 ? 'Fair' : 'Poor',
    recommendations: generateRecommendations(indicators)
  };
}

function generateRecommendations(indicators) {
  const recommendations = [];

  if (indicators.soilPh < 6.0) {
    recommendations.push('土壤偏酸，建议施用石灰调节pH值');
  } else if (indicators.soilPh > 7.5) {
    recommendations.push('土壤偏碱，建议施用硫磺或有机肥调节');
  }

  if (indicators.soilOrganicMatter < 2) {
    recommendations.push('有机质含量偏低，建议增加有机肥施用');
  }

  if (indicators.waterEfficiency < 0.5) {
    recommendations.push('水分利用效率较低，建议采用滴灌或喷灌技术');
  }

  if (indicators.biodiversityScore < 40) {
    recommendations.push('生物多样性较低，建议实施轮作和间作');
  }

  if (recommendations.length === 0) {
    recommendations.push('环境指标良好，继续保持当前管理措施');
  }

  return recommendations;
}

export function getCropTypes() {
  return Object.entries(CROP_SEQUESTRATION_RATES).map(([key, value]) => ({
    value: key,
    label: value.name,
    icon: value.icon,
    rate: value.rate
  }));
}

