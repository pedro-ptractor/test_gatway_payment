import type { FastifyInstance } from 'fastify';
import { login, register } from '../controllers/user-controller.js';

export async function userRoutes(app: FastifyInstance) {
  app.post('/register', register);
  app.post('/login', login);
}
