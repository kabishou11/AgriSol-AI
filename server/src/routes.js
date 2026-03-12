import db from './database.js';
import { analyzeCropImage, getAgriWisdom } from './services/ai.js';
import { getWeatherData, calculateSolarPotential, calculateWindPotential } from './services/weather.js';
import { calculateCarbonFootprint, calculateCarbonSequestration } from './services/carbon.js';
import carbonRoutes from './routes/carbon.js';
import environmentRoutes from './routes/environment.js';
import energyRoutes from './routes/energy.js';
import wisdomRoutes from './routes/wisdom.js';
import familyRoutes from './routes/family.js';
import cropRoutes from './routes/crop.js';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export default async function routes(fastify) {
  await mkdir(join(process.cwd(), 'uploads/audio'), { recursive: true });
  await mkdir(join(process.cwd(), 'uploads/crops'), { recursive: true });

  await fastify.register(carbonRoutes);
  await fastify.register(environmentRoutes);
  await fastify.register(energyRoutes);
  await fastify.register(wisdomRoutes);
  await fastify.register(familyRoutes);
  await fastify.register(cropRoutes, { prefix: '/api/crops' });

  fastify.post('/api/crops/analyze', async (request, reply) => {
    const data = await request.file();
    const buffer = await data.toBuffer();

    const resizedBuffer = await sharp(buffer)
      .resize(800, 800, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer();

    const base64 = resizedBuffer.toString('base64');
    const cropType = request.body?.cropType || 'unknown';

    const analysis = await analyzeCropImage(base64, cropType);
    const healthScore = Math.random() * 40 + 60;

    const imagePath = `uploads/${Date.now()}.jpg`;
    await writeFile(join(process.cwd(), imagePath), resizedBuffer);

    const stmt = db.prepare('INSERT INTO crops (crop_type, image_path, analysis_result, health_score) VALUES (?, ?, ?, ?)');
    const result = stmt.run(cropType, imagePath, analysis, healthScore);

    return { id: result.lastInsertRowid, cropType, analysis, healthScore, imagePath };
  });

  fastify.post('/api/energy/predict', async (request, reply) => {
    const { latitude, longitude, location } = request.body;

    const weatherData = await getWeatherData(latitude, longitude);
    const solarPotential = calculateSolarPotential(weatherData);
    const windPotential = calculateWindPotential(weatherData);

    const stmt = db.prepare('INSERT INTO energy (location, solar_potential, wind_potential, prediction_data) VALUES (?, ?, ?, ?)');
    const result = stmt.run(location, solarPotential, windPotential, JSON.stringify(weatherData));

    return { id: result.lastInsertRowid, location, solarPotential, windPotential, weatherData };
  });

  fastify.post('/api/carbon/calculate', async (request, reply) => {
    const { activityType, amount, unit } = request.body;

    const calculation = calculateCarbonFootprint(activityType, amount, unit);

    const stmt = db.prepare('INSERT INTO carbon (activity_type, carbon_amount, calculation_details) VALUES (?, ?, ?)');
    const result = stmt.run(activityType, calculation.carbonKg, JSON.stringify(calculation));

    return { id: result.lastInsertRowid, ...calculation };
  });

  fastify.post('/api/carbon/sequestration', async (request, reply) => {
    const { cropType, area, yieldAmount } = request.body;

    const calculation = calculateCarbonSequestration(cropType, area, yieldAmount);

    return calculation;
  });

  fastify.post('/api/wisdom/ask', async (request, reply) => {
    const { question, category } = request.body;

    const answer = await getAgriWisdom(question);

    const stmt = db.prepare('INSERT INTO wisdom (question, answer, category) VALUES (?, ?, ?)');
    const result = stmt.run(question, answer, category || 'general');

    return { id: result.lastInsertRowid, question, answer, category };
  });

  fastify.get('/api/wisdom/history', async (request, reply) => {
    const stmt = db.prepare('SELECT * FROM wisdom ORDER BY created_at DESC LIMIT 50');
    const history = stmt.all();

    return history;
  });

  fastify.get('/api/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}
