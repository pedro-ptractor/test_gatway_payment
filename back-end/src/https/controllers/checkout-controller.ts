import type { FastifyReply, FastifyRequest } from 'fastify';
import z from 'zod';

import { stripe } from '../../lib/stripe.js';
import { env } from '../../env/index.js';
import { HttpError } from '../erros/index.js';
import { prisma } from '../../lib/prisma.js';
import { ensureLocalSubscription } from '../../helpers/stripe/stripe-webhook-helpers.js';

export async function createCheckoutSession(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    planId: z.string(),
  });

  const { planId } = bodySchema.parse(req.body);
  const { id: userId } = req.user;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new HttpError('User not found', 404);
  }

  const plan = await prisma.plan.findUnique({
    where: {
      id: planId,
    },
  });

  if (!plan) {
    throw new HttpError('Plan not found', 404);
  }

  if (!plan.active) {
    throw new HttpError('Plan is inactive', 400);
  }

  let stripeCustomerId = user.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.id,
      },
    });

    stripeCustomerId = customer.id;

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        stripeCustomerId,
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_URL}/checkout/cancel`,
    metadata: {
      userId: user.id,
      planId: plan.id,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
    },
  });

  return reply.status(200).send({
    checkoutUrl: session.url,
  });
}

export async function confirmCheckoutSession(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  console.log('confirmCheckoutSession', req.query);
  const confirmSessionQuerySchema = z.object({
    session_id: z.string().min(1),
  });
  const { session_id: sessionId } = confirmSessionQuerySchema.parse(req.query);
  const userId = req.user.id;

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });

  const sessionUserId =
    session.metadata?.userId ?? session.client_reference_id ?? null;
  if (sessionUserId !== userId) {
    throw new HttpError('Session does not belong to this user', 403);
  }

  const stripeSubscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

  if (!stripeSubscriptionId) {
    return reply.status(200).send({
      status: 'pending',
      subscriptionId: null,
      planId: null,
    });
  }

  const subscription = await ensureLocalSubscription(stripeSubscriptionId);
  if (!subscription) {
    return reply.status(200).send({
      status: 'pending',
      subscriptionId: null,
      planId: null,
    });
  }

  return reply.status(200).send({
    status: subscription.status,
    subscriptionId: subscription.id,
    planId: subscription.planId,
  });
}
