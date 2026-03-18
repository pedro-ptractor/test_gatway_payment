import type { FastifyInstance } from 'fastify';
import { plansRoutes } from './plans-routes.js';
import { userRoutes } from './user-routes.js';
import { checkoutRoutes } from './checkout-routes.js';
import { stripeRoutes } from './stripe-routes.js';
import { getMe } from '../controllers/user-controller.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';

export async function mainRoutes(app: FastifyInstance) {
  app.get('/', async () => ({ message: 'Hello World' }));

  app.get('/me', {
    preHandler: [authMiddleware],
  }, getMe);

  app.register(plansRoutes, { prefix: '/plans' });
  app.register(userRoutes, { prefix: '/users' });
  app.register(checkoutRoutes, { prefix: '/checkout' });
  app.register(stripeRoutes, { prefix: '/stripe' });
}
