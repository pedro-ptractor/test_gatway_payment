import type { FastifyReply, FastifyRequest } from 'fastify';
import type Stripe from 'stripe';

import { $Enums } from '../../generated/prisma/client.js';
import { stripe } from '../../lib/stripe.js';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../env/index.js';
import { HttpError } from '../../https/erros/index.js';

type WebhookRequest = FastifyRequest & { rawBody?: string | Buffer };

type WebhookInvoice = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
  payment_intent?: string | Stripe.PaymentIntent | null;
  parent?: {
    type?: string | null;
    subscription_details?: {
      subscription?: string | Stripe.Subscription | null;
      metadata?: Record<string, string> | null;
    } | null;
  } | null;
  payments?: {
    data?: Array<{
      payment?: {
        type?: string | null;
        payment_intent?: string | Stripe.PaymentIntent | null;
      } | null;
    }>;
  } | null;
};

function toDateFromUnix(timestamp: number | null | undefined): Date | null {
  if (timestamp == null) return null;
  return new Date(timestamp * 1000);
}

function toSubscriptionStatus(
  status: Stripe.Subscription['status'],
): $Enums.SubscriptionStatus {
  const map: Record<string, $Enums.SubscriptionStatus> = {
    active: $Enums.SubscriptionStatus.active,
    past_due: $Enums.SubscriptionStatus.past_due,
    canceled: $Enums.SubscriptionStatus.canceled,
    incomplete: $Enums.SubscriptionStatus.incomplete,
    incomplete_expired: $Enums.SubscriptionStatus.incomplete_expired,
    trialing: $Enums.SubscriptionStatus.trialing,
    unpaid: $Enums.SubscriptionStatus.past_due,
    paused: $Enums.SubscriptionStatus.canceled,
  };

  return map[status] ?? $Enums.SubscriptionStatus.incomplete;
}

function getSubscriptionPeriod(sub: Stripe.Subscription) {
  const firstItem = sub.items?.data?.[0];

  const start = toDateFromUnix(
    (firstItem as { current_period_start?: number } | undefined)
      ?.current_period_start,
  );
  const end = toDateFromUnix(
    (firstItem as { current_period_end?: number } | undefined)
      ?.current_period_end,
  );

  if (!start || !end) {
    return null;
  }

  return { start, end };
}

function getStripeSubscriptionIdFromInvoice(
  invoice: WebhookInvoice,
): string | null {
  if (
    invoice.parent?.type === 'subscription_details' &&
    typeof invoice.parent.subscription_details?.subscription === 'string'
  ) {
    return invoice.parent.subscription_details.subscription;
  }

  if (
    invoice.parent?.type === 'subscription_details' &&
    invoice.parent.subscription_details?.subscription &&
    typeof invoice.parent.subscription_details.subscription === 'object'
  ) {
    return invoice.parent.subscription_details.subscription.id;
  }

  if (typeof invoice.subscription === 'string') {
    return invoice.subscription;
  }

  if (invoice.subscription && typeof invoice.subscription === 'object') {
    return invoice.subscription.id;
  }

  return null;
}

function getStripePaymentIntentIdFromInvoice(
  invoice: WebhookInvoice,
): string | null {
  if (typeof invoice.payment_intent === 'string') {
    return invoice.payment_intent;
  }

  if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
    return invoice.payment_intent.id;
  }

  const firstPayment = invoice.payments?.data?.[0]?.payment;

  if (!firstPayment) {
    return null;
  }

  if (typeof firstPayment.payment_intent === 'string') {
    return firstPayment.payment_intent;
  }

  if (
    firstPayment.payment_intent &&
    typeof firstPayment.payment_intent === 'object'
  ) {
    return firstPayment.payment_intent.id;
  }

  return null;
}

async function ensureLocalSubscription(stripeSubscriptionId: string) {
  let localSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (localSubscription) {
    return localSubscription;
  }

  const stripeSubscription =
    await stripe.subscriptions.retrieve(stripeSubscriptionId);

  const userId = stripeSubscription.metadata?.userId;
  const planId = stripeSubscription.metadata?.planId;

  if (!userId || !planId) {
    console.warn('Missing metadata in Stripe subscription', {
      stripeSubscriptionId,
      userId,
      planId,
    });
    return null;
  }

  const period = getSubscriptionPeriod(stripeSubscription);

  try {
    localSubscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        stripeSubscriptionId,
        status: toSubscriptionStatus(stripeSubscription.status),
        currentPeriodStart: period?.start ?? new Date(),
        currentPeriodEnd: period?.end ?? new Date(),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });

    console.log(
      'Local subscription created from fallback:',
      stripeSubscriptionId,
    );
    return localSubscription;
  } catch (error) {
    const createdSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });

    if (createdSubscription) {
      return createdSubscription;
    }

    throw error;
  }
}

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
  } catch (error) {
    console.error('Invalid Stripe signature:', error);
    throw new HttpError('Invalid webhook signature', 400);
  }

  try {
    console.log('Stripe webhook received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.userId ?? session.client_reference_id;
        const planId = session.metadata?.planId;
        const stripeSubscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

        if (!userId || !planId || !stripeSubscriptionId) {
          console.warn('Missing session metadata', {
            sessionId: session.id,
            userId,
            planId,
            stripeSubscriptionId,
          });
          break;
        }

        const existingSubscription = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId },
        });

        if (existingSubscription) {
          break;
        }

        const stripeSubscription =
          await stripe.subscriptions.retrieve(stripeSubscriptionId);

        const period = getSubscriptionPeriod(stripeSubscription);

        try {
          await prisma.subscription.create({
            data: {
              userId,
              planId,
              stripeSubscriptionId,
              stripeCheckoutSessionId: session.id,
              status: toSubscriptionStatus(stripeSubscription.status),
              currentPeriodStart: period?.start ?? new Date(),
              currentPeriodEnd: period?.end ?? new Date(),
              cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            },
          });
        } catch (error) {
          const createdSubscription = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId },
          });

          if (!createdSubscription) {
            throw error;
          }
        }

        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as WebhookInvoice;
        const stripeSubscriptionId =
          getStripeSubscriptionIdFromInvoice(invoice);

        console.log('invoice.paid debug:', {
          invoiceId: invoice.id,
          parentType: invoice.parent?.type,
          resolvedStripeSubscriptionId: stripeSubscriptionId,
        });

        if (!stripeSubscriptionId) {
          console.warn('invoice.paid without subscription');
          break;
        }

        const localSubscription =
          await ensureLocalSubscription(stripeSubscriptionId);

        if (!localSubscription) {
          console.warn(
            'Could not ensure local subscription for invoice.paid:',
            stripeSubscriptionId,
          );
          break;
        }

        const existingPayment = invoice.id
          ? await prisma.payment.findUnique({
              where: { stripeInvoiceId: invoice.id },
            })
          : null;

        if (!existingPayment) {
          const stripePaymentIntentId =
            getStripePaymentIntentIdFromInvoice(invoice);

          await prisma.payment.create({
            data: {
              userId: localSubscription.userId,
              subscriptionId: localSubscription.id,
              stripeInvoiceId: invoice.id,
              stripePaymentIntentId,
              amountCents: invoice.amount_paid ?? 0,
              currency: invoice.currency ?? 'brl',
              status: $Enums.PaymentStatus.paid,
              paidAt: new Date(),
            },
          });

          console.log('Payment created:', invoice.id);
        }

        await prisma.subscription.update({
          where: { stripeSubscriptionId },
          data: {
            status: $Enums.SubscriptionStatus.active,
          },
        });

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as WebhookInvoice;
        const stripeSubscriptionId =
          getStripeSubscriptionIdFromInvoice(invoice);

        if (!stripeSubscriptionId) {
          console.warn('invoice.payment_failed without subscription');
          break;
        }

        const localSubscription =
          await ensureLocalSubscription(stripeSubscriptionId);

        if (!localSubscription) {
          console.warn(
            'Could not ensure local subscription for invoice.payment_failed:',
            stripeSubscriptionId,
          );
          break;
        }

        const existingPayment = invoice.id
          ? await prisma.payment.findUnique({
              where: { stripeInvoiceId: invoice.id },
            })
          : null;

        if (!existingPayment) {
          const stripePaymentIntentId =
            getStripePaymentIntentIdFromInvoice(invoice);

          await prisma.payment.create({
            data: {
              userId: localSubscription.userId,
              subscriptionId: localSubscription.id,
              stripeInvoiceId: invoice.id,
              stripePaymentIntentId,
              amountCents: invoice.amount_due ?? 0,
              currency: invoice.currency ?? 'brl',
              status: $Enums.PaymentStatus.failed,
            },
          });
        }

        await prisma.subscription.update({
          where: { stripeSubscriptionId },
          data: {
            status: $Enums.SubscriptionStatus.past_due,
          },
        });

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: $Enums.SubscriptionStatus.canceled,
            cancelAtPeriodEnd: false,
          },
        });

        break;
      }

      default:
        break;
    }

    return reply.status(200).send({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    throw new HttpError('Webhook processing failed', 500);
  }
}
