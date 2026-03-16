import type { FastifyInstance } from 'fastify';
import { plansRoutes } from './plans-routes.js';
import { userRoutes } from './user-routes.js';
import { checkoutRoutes } from './checkout-routes.js';
import { stripeRoutes } from './stripe-routes.js';
export async function mainRoutes(app: FastifyInstance) {
  app.get('/', async () => ({ message: 'Hello World' }));

  app.register(plansRoutes, { prefix: '/plans' });
  app.register(userRoutes, { prefix: '/users' });
  app.register(checkoutRoutes, { prefix: '/checkout' });
  app.register(stripeRoutes, { prefix: '/stripe' });
}
