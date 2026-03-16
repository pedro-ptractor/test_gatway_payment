import Stripe from 'stripe';
import { env } from '../env/index.js';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  typescript: true,
});
