import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { config } from './config/index.js';
import { registerRoutes } from './routes/index.js';

const fastify = Fastify({
  logger: config.NODE_ENV !== 'test',
});

await fastify.register(cors, {
  origin: config.NODE_ENV === 'development' ? true : false,
  credentials: true,
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

await fastify.register(multipart, {
  limits: { fileSize: 15 * 1024 * 1024 },
});

await registerRoutes(fastify);

try {
  await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
