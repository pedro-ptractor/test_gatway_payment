import Fastify from 'fastify';
import type { FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import { env } from './env/index.js';
import jwt from '@fastify/jwt';
import { HttpError } from './https/erros/index.js';
import { mainRoutes } from './https/routes/main.js';

export const app = Fastify({});

// Preserva raw body para validação do webhook Stripe (content-type application/json)
app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body as unknown as ArrayBuffer);
  (req as FastifyRequest & { rawBody?: Buffer }).rawBody = buffer;
  const raw = buffer.toString('utf8').trim();
  if (!raw) {
    done(null, {});
    return;
  }
  try {
    done(null, JSON.parse(raw));
  } catch (e) {
    done(e as Error, undefined);
  }
});

app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

//preciso posteriormente dividir em outro arquivo essas configurações
app.register(jwt, {
  secret: env.JWT_SECRET,
});

app.register(mainRoutes, { prefix: '/api' });

app.setErrorHandler((error, _, reply) => {
  if (error instanceof HttpError) {
    return reply.status(error.statusCode).send({
      error: error.message,
    });
  }

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    const message = firstIssue?.message ?? 'Validation error';
    return reply.status(400).send({
      error: message,
    });
  }

  console.error('Unhandled error:', error);
  return reply.status(500).send({
    error: 'Internal server error',
  });
});
