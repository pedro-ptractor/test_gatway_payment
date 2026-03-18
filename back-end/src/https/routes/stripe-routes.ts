import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import {
  createBillingPortalSession,
  handleStripeWebhook,
} from '../controllers/stripe-controller.js';

export async function stripeRoutes(fastify: FastifyInstance) {
  fastify.post('/webhook', handleStripeWebhook);
  fastify.post(
    '/billing-portal',
    { preHandler: [authMiddleware] },
    createBillingPortalSession,
  );
}
