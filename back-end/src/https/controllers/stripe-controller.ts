import type { FastifyReply, FastifyRequest } from 'fastify';
import { stripe } from '../../lib/stripe.js';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../env/index.js';

export async function createBillingPortalSession(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user?.id;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return reply.status(404).send({ error: 'User not found' });
  }

  if (!user.stripeCustomerId) {
    return reply
      .status(400)
      .send({ error: 'User does not have a stripe customer id' });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${env.FRONTEND_URL}/account/billing`,
    });

    return reply.status(200).send({
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe billing portal error:', error);
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Failed to create billing portal session';
    return reply.status(502).send({ error: message });
  }
}
