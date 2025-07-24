import { loadStripe } from '@stripe/stripe-js';

// Debug: Log all environment variables that start with VITE_
console.log('Available VITE_ environment variables:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
console.log('VITE_STRIPE_PUBLISHABLE_KEY value:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error('Missing Stripe publishable key');
}

export const stripePromise = loadStripe(stripePublishableKey);

// Test card numbers for development
export const TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINED: '4000000000000002',
  REQUIRES_AUTH: '4000002500003155',
  INSUFFICIENT_FUNDS: '4000000000009995'
} as const;