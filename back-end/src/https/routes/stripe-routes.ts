import type { FastifyInstance } from 'fastify';
import { handleStripeWebhook } from '../../utils/stripe/stripe-webhook-utils.js';

export async function stripeRoutes(fastify: FastifyInstance) {
  fastify.post('/webhook', handleStripeWebhook);
}
