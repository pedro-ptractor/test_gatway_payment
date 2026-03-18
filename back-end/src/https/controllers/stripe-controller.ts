import type { FastifyReply, FastifyRequest } from 'fastify';
import { stripe } from '../../lib/stripe.js';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../env/index.js';
import { HttpError } from '../erros/index.js';

import type { WebhookInvoice } from '../../helpers/stripe/stripe-webhook-helpers.js';
import {
  handleCheckoutCompleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
} from '../../services/stripe/stripe-webhook-service.js';
import type Stripe from 'stripe';

type WebhookRequest = FastifyRequest & { rawBody?: string | Buffer };

export async function handleStripeWebhook(
  req: WebhookRequest,
  reply: FastifyReply,
) {
  const signature = req.headers['stripe-signature'];

  if (!signature || typeof signature !== 'string') {
    throw new HttpError('Missing stripe signature', 400);
  }

  const rawBody = req.rawBody;

  if (!rawBody) {
    throw new HttpError('Missing raw body for webhook validation', 400);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
    console.log('event', event);
  } catch (error) {
    console.error('Invalid Stripe signature:', error);
    throw new HttpError('Invalid webhook signature', 400);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as WebhookInvoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as WebhookInvoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      default:
        break;
    }

    return reply.status(200).send({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    throw new HttpError('Webhook processing failed', 500);
  }
}

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
      return_url: `${env.FRONTEND_URL}/account`,
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
