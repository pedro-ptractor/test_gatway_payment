import type Stripe from 'stripe';
import { $Enums } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { stripe } from '../../lib/stripe.js';

export type WebhookInvoice = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
  parent?: {
    type?: string | null;
    subscription_details?: {
      subscription?: string | Stripe.Subscription | null;
    } | null;
  } | null;
};

export function toDateFromUnix(
  timestamp: number | null | undefined,
): Date | null {
  return timestamp == null ? null : new Date(timestamp * 1000);
}

export function toSubscriptionStatus(
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

export function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items?.data?.[0];

  const start = toDateFromUnix(
    (item as { current_period_start?: number } | undefined)
      ?.current_period_start,
  );
  const end = toDateFromUnix(
    (item as { current_period_end?: number } | undefined)?.current_period_end,
  );

  if (!start || !end) return null;

  return { start, end };
}

export function getStripeSubscriptionIdFromInvoice(
  invoice: WebhookInvoice,
): string | null {
  const parentSubscription = invoice.parent?.subscription_details?.subscription;

  if (typeof parentSubscription === 'string') return parentSubscription;
  if (parentSubscription && typeof parentSubscription === 'object') {
    return parentSubscription.id;
  }

  if (typeof invoice.subscription === 'string') return invoice.subscription;
  if (invoice.subscription && typeof invoice.subscription === 'object') {
    return invoice.subscription.id;
  }

  return null;
}

export async function ensureLocalSubscription(stripeSubscriptionId: string) {
  let subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (subscription) return subscription;

  const stripeSubscription =
    await stripe.subscriptions.retrieve(stripeSubscriptionId);

  const userId = stripeSubscription.metadata?.userId;
  const planId = stripeSubscription.metadata?.planId;
  const period = getSubscriptionPeriod(stripeSubscription);

  if (!userId || !planId) return null;

  try {
    subscription = await prisma.subscription.create({
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

    return subscription;
  } catch {
    return prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });
  }
}

export async function createPaymentIfNotExists(params: {
  invoiceId: string;
  userId: string;
  subscriptionId: string;
  amountCents: number;
  currency: string;
  status: $Enums.PaymentStatus;
  paidAt?: Date;
}) {
  const existingPayment = await prisma.payment.findUnique({
    where: { stripeInvoiceId: params.invoiceId },
  });

  if (existingPayment) return existingPayment;

  return prisma.payment.create({
    data: {
      userId: params.userId,
      subscriptionId: params.subscriptionId,
      stripeInvoiceId: params.invoiceId,
      amountCents: params.amountCents,
      currency: params.currency,
      status: params.status,
      paidAt: params.paidAt ?? null,
    },
  });
}

export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  data: Partial<{
    status: $Enums.SubscriptionStatus;
    cancelAtPeriodEnd: boolean;
    cancelAt: Date | null;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }>,
) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId },
    data,
  });
}
