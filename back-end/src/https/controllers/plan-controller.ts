import type { FastifyReply, FastifyRequest } from 'fastify';
import z from 'zod';
import { $Enums } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../erros/index.js';

export async function listPlans(req: FastifyRequest, reply: FastifyReply) {
  const plans = await prisma.plan.findMany();
  return reply.status(200).send(plans);
}

export async function createPlan(req: FastifyRequest, reply: FastifyReply) {
  const bodySchema = z.object({
    name: z.string(),
    description: z.string(),
    priceCents: z.number(),
    code: z.string(),
    interval: z.enum($Enums.PlanInterval),
    stripePriceId: z.string(),
  });

  const { name, description, priceCents, code, interval, stripePriceId } =
    bodySchema.parse(req.body);

  const plan = await prisma.plan.findUnique({
    where: {
      code,
    },
  });

  if (plan) throw new HttpError('Plan already exists', 400);

  const createPlan = await prisma.plan.create({
    data: {
      name,
      description,
      priceCents,
      code,
      interval,
      stripePriceId,
    },
  });

  return reply.status(201).send(createPlan);
}
