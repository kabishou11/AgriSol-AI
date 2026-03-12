import { seedEnergyData, getEnergySampleStats } from './utils/seed-energy.js';

console.log('Starting energy data seeding...\n');

try {
  seedEnergyData();

  const stats = getEnergySampleStats();
  console.log('\nDatabase Statistics:');
  console.log('-------------------');
  console.log(`Total Records: ${stats.total_records}`);
  console.log(`Total Generation: ${stats.total_generation.toFixed(2)} kWh`);
  console.log(`Total Consumption: ${stats.total_consumption.toFixed(2)} kWh`);
  console.log(`Average Generation: ${stats.avg_generation.toFixed(2)} kWh`);
  console.log(`Average Consumption: ${stats.avg_consumption.toFixed(2)} kWh`);
  console.log('\nSeeding completed successfully!');
} catch (error) {
  console.error('Error seeding data:', error);
  process.exit(1);
}
