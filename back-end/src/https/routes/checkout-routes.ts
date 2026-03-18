import type { FastifyInstance } from 'fastify';
import {
  createCheckoutSession,
  confirmCheckoutSession,
} from '../controllers/checkout-controller.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';

export async function checkoutRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/create-checkout-session',
    {
      preHandler: [authMiddleware],
    },
    createCheckoutSession,
  );

  fastify.get(
    '/confirm-session',
    {
      preHandler: [authMiddleware],
    },
    confirmCheckoutSession,
  );
}
