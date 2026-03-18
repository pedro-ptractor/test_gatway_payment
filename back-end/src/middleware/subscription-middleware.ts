import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../https/erros/index.js';

const ACTIVE_STATUS = 'active';

export async function subscriptionMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user.id;
  console.log('middleware', userId);
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: ACTIVE_STATUS,
      currentPeriodEnd: { gt: new Date() },
    },
    orderBy: { currentPeriodEnd: 'desc' },
  });

  if (!subscription) {
    throw new HttpError(
      'Active subscription required to access this resource',
      403,
    );
  }
}
