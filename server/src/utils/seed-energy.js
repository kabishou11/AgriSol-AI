import db from '../database.js';

/**
 * Seed sample energy data for testing
 */
export function seedEnergyData() {
  console.log('Seeding energy data...');

  // Clear existing data
  db.prepare('DELETE FROM energy_records').run();
  db.prepare('DELETE FROM energy_devices').run();

  // Add sample devices
  const devices = [
    { name: '太阳能板组A', type: 'solar', capacity: 5.0 },
    { name: '太阳能板组B', type: 'solar', capacity: 5.0 },
    { name: '储能系统', type: 'battery', capacity: 10.0 },
    { name: '逆变器', type: 'inverter', capacity: 10.0 }
  ];

  const deviceStmt = db.prepare(`
    INSERT INTO energy_devices (device_name, device_type, capacity, status)
    VALUES (?, ?, ?, 'active')
  `);

  devices.forEach(device => {
    deviceStmt.run(device.name, device.type, device.capacity);
  });

  // Generate sample energy records for the past 30 days
  const recordStmt = db.prepare(`
    INSERT INTO energy_records
    (timestamp, generation, consumption, grid_import, grid_export, battery_charge, battery_discharge)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();

  for (let day = 30; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    // Generate hourly data for each day
    for (let hour = 0; hour < 24; hour++) {
      date.setHours(hour, 0, 0, 0);

      // Solar generation (peak at noon)
      let generation = 0;
      if (hour >= 6 && hour <= 18) {
        const solarCurve = Math.sin(((hour - 6) / 12) * Math.PI);
        generation = solarCurve * 8 * (0.8 + Math.random() * 0.4);
      }

      // Consumption (higher during day, lower at night)
      let consumption = 2 + Math.random() * 2;
      if (hour >= 8 && hour <= 20) {
        consumption = 4 + Math.random() * 3;
      }

      // Calculate grid import/export
      const difference = generation - consumption;
      const gridImport = difference < 0 ? Math.abs(difference) : 0;
      const gridExport = difference > 0 ? difference * 0.8 : 0;

      // Battery operations
      const batteryCharge = difference > 0 ? difference * 0.2 : 0;
      const batteryDischarge = difference < -1 ? Math.min(1, Math.abs(difference) * 0.3) : 0;

      recordStmt.run(
        date.toISOString(),
        generation.toFixed(2),
        consumption.toFixed(2),
        gridImport.toFixed(2),
        gridExport.toFixed(2),
        batteryCharge.toFixed(2),
        batteryDischarge.toFixed(2)
      );
    }
  }

  console.log('Energy data seeded successfully!');
  console.log(`- Added ${devices.length} devices`);
  console.log(`- Added ${31 * 24} energy records`);
}

/**
 * Get sample statistics
 */
export function getEnergySampleStats() {
  const stmt = db.prepare(`
    SELECT
      COUNT(*) as total_records,
      SUM(generation) as total_generation,
      SUM(consumption) as total_consumption,
      AVG(generation) as avg_generation,
      AVG(consumption) as avg_consumption
    FROM energy_records
  `);

  return stmt.get();
}
