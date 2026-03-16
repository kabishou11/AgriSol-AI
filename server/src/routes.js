import carbonRoutes from './routes/carbon.js';
import environmentRoutes from './routes/environment.js';
import energyRoutes from './routes/energy.js';
import wisdomRoutes from './routes/wisdom.js';
import familyRoutes from './routes/family.js';
import cropRoutes from './routes/crop.js';
import aiRoutes from './routes/ai.js';
import graphRoutes from './routes/graph.js';
import promptRoutes from './routes/prompts.js';

export default async function routes(fastify) {
  await fastify.register(carbonRoutes);
  await fastify.register(environmentRoutes);
  await fastify.register(energyRoutes);
  await fastify.register(wisdomRoutes);
  await fastify.register(familyRoutes);
  await fastify.register(cropRoutes, { prefix: '/api/crops' });
  await fastify.register(aiRoutes);
  await fastify.register(graphRoutes);
  await fastify.register(promptRoutes);
}
