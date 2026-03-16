import type { FastifyInstance } from 'fastify';
import { createCheckoutSession } from '../controllers/checkout-controller.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';

export async function checkoutRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/create-checkout-session',
    {
      preHandler: [authMiddleware],
    },
    createCheckoutSession,
  );
}
