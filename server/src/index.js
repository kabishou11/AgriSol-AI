import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';
import config from './config.js';
import routes from './routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, '../uploads');

mkdirSync(uploadsDir, { recursive: true });

const fastify = Fastify({
  logger: true
});

await fastify.register(cors, {
  origin: true
});

await fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

await fastify.register(staticFiles, {
  root: uploadsDir,
  prefix: '/uploads/'
});

await fastify.register(routes);

const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`Server running at http://${config.host}:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
