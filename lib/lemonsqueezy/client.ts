import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';

let initialized = false;

export function getLS() {
  if (!initialized) {
    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    if (!apiKey) throw new Error('LEMONSQUEEZY_API_KEY is not set');
    lemonSqueezySetup({ apiKey });
    initialized = true;
  }
  return { createCheckout };
}
