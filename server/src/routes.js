import carbonRoutes from './routes/carbon.js';
import environmentRoutes from './routes/environment.js';
import energyRoutes from './routes/energy.js';
import wisdomRoutes from './routes/wisdom.js';
import familyRoutes from './routes/family.js';
import cropRoutes from './routes/crop.js';
import { mkdir } from 'fs/promises';
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
}
