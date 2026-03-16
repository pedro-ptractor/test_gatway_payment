import type { FastifyInstance } from 'fastify';
import { createPlan, listPlans } from '../controllers/plan-controller.js';

export async function plansRoutes(fastify: FastifyInstance) {
  fastify.get('/', listPlans);
  fastify.post('/', createPlan);
}
