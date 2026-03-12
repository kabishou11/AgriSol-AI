import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';
import config from './config.js';
import routes from './routes.js';
import statisticsRoutes from './routes/statistics.js';
import userRoutes from './routes/user.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, '../uploads');

mkdirSync(uploadsDir, { recursive: true });
mkdirSync(join(uploadsDir, 'crops'), { recursive: true });
mkdirSync(join(uploadsDir, 'audio'), { recursive: true });
mkdirSync(join(__dirname, '../data'), { recursive: true });

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info'
  }
});

// CORS
await fastify.register(cors, { origin: true });

// Multipart (file uploads)
await fastify.register(multipart, {
  limits: { fileSize: 20 * 1024 * 1024 }
});

// Static files
await fastify.register(staticFiles, {
  root: uploadsDir,
  prefix: '/uploads/'
});

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.status(error.statusCode || 500).send({
    success: false,
    message: error.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// Health check
fastify.get('/health', async () => ({
  success: true,
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '1.0.0'
}));

// Register all routes
await fastify.register(routes);
await fastify.register(statisticsRoutes);
await fastify.register(userRoutes);

const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`\n🚀 AgriSol-AI Server running at http://localhost:${config.port}`);
    console.log(`📊 API ready at http://localhost:${config.port}/api`);
    console.log(`❤️  Health check: http://localhost:${config.port}/health\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
