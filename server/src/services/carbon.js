const EMISSION_FACTORS = {
  electricity: 0.5,
  diesel: 2.68,
  gasoline: 2.31,
  fertilizer_n: 5.87,
  fertilizer_p: 0.67,
  fertilizer_k: 0.45,
  transport: 0.12
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

export function calculateCarbonSequestration(cropType, area, yield_amount) {
  const sequestrationRates = {
    rice: 0.8,
    wheat: 0.6,
    corn: 0.7,
    soybean: 0.5,
    default: 0.6
  };

  const rate = sequestrationRates[cropType] || sequestrationRates.default;
  const sequestered = area * rate;

  return {
    sequesteredKg: sequestered.toFixed(2),
    sequesteredTons: (sequestered / 1000).toFixed(4),
    cropType,
    area,
    rate
  };
}
