import type Stripe from 'stripe';
import { $Enums } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import {
  createPaymentIfNotExists,
  ensureLocalSubscription,
  getStripeSubscriptionIdFromInvoice,
  getSubscriptionPeriod,
  toDateFromUnix,
  toSubscriptionStatus,
  type WebhookInvoice,
  updateSubscriptionStatus,
} from '../../helpers/stripe/stripe-webhook-helpers.js';
import { stripe } from '../../lib/stripe.js';

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
) {
  const userId = session.metadata?.userId ?? session.client_reference_id;
  const planId = session.metadata?.planId;
  const stripeSubscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

  if (!userId || !planId || !stripeSubscriptionId) return;

  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (existingSubscription) return;

  const stripeSubscription =
    await stripe.subscriptions.retrieve(stripeSubscriptionId);

  const period = getSubscriptionPeriod(stripeSubscription);

  try {
    await prisma.subscription.create({
      data: {
        userId,
        planId,
        stripeSubscriptionId,
        status: toSubscriptionStatus(stripeSubscription.status),
        currentPeriodStart: period?.start ?? new Date(),
        currentPeriodEnd: period?.end ?? new Date(),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        cancelAt: toDateFromUnix(stripeSubscription.cancel_at),
      },
    });
  } catch {
    // ignora corrida entre eventos
  }
}

export async function handleInvoicePaid(invoice: WebhookInvoice) {
  const stripeSubscriptionId = getStripeSubscriptionIdFromInvoice(invoice);
  if (!stripeSubscriptionId || !invoice.id) return;

  const localSubscription = await ensureLocalSubscription(stripeSubscriptionId);
  if (!localSubscription) return;

  await createPaymentIfNotExists({
    invoiceId: invoice.id,
    userId: localSubscription.userId,
    subscriptionId: localSubscription.id,
    amountCents: invoice.amount_paid,
    currency: invoice.currency ?? 'brl',
    status: $Enums.PaymentStatus.paid,
    paidAt: new Date(),
  });

  await updateSubscriptionStatus(stripeSubscriptionId, {
    status: $Enums.SubscriptionStatus.active,
  });
}

export async function handleInvoicePaymentFailed(invoice: WebhookInvoice) {
  const stripeSubscriptionId = getStripeSubscriptionIdFromInvoice(invoice);
  if (!stripeSubscriptionId || !invoice.id) return;

  const localSubscription = await ensureLocalSubscription(stripeSubscriptionId);
  if (!localSubscription) return;

  await createPaymentIfNotExists({
    invoiceId: invoice.id,
    userId: localSubscription.userId,
    subscriptionId: localSubscription.id,
    amountCents: invoice.amount_due,
    currency: invoice.currency ?? 'brl',
    status: $Enums.PaymentStatus.failed,
  });

  await updateSubscriptionStatus(stripeSubscriptionId, {
    status: $Enums.SubscriptionStatus.past_due,
  });
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
) {
  const period = getSubscriptionPeriod(subscription);

  await updateSubscriptionStatus(subscription.id, {
    status: toSubscriptionStatus(subscription.status),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    cancelAt: toDateFromUnix(subscription.cancel_at),
    ...(period && {
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
    }),
  });
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
) {
  await updateSubscriptionStatus(subscription.id, {
    status: $Enums.SubscriptionStatus.canceled,
    cancelAtPeriodEnd: false,
    cancelAt: null,
  });
}
