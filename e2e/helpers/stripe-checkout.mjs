// e2e/helpers/stripe-checkout.mjs
// Shared helper for interacting with Stripe's hosted checkout page.

export const STRIPE_CARD = {
  number: '4242424242424242',
  expiry: '12/30',
  cvc: '123',
  name: 'Test User',
};

/**
 * Fill and submit Stripe's hosted checkout page.
 * Assumes the page has already navigated to checkout.stripe.com.
 *
 * Stripe Checkout renders card fields as regular textboxes on the page
 * (not in iframes), accessible by their labels.
 */
export async function fillStripeCheckout(page, { email }) {
  // Wait for the submit button (use test ID to avoid matching "Pay with card"/"Pay with Bank")
  const payButton = page.getByTestId('hosted-payment-submit-button');
  await payButton.waitFor({ state: 'visible', timeout: 30_000 });

  // Card number
  const cardNumber = page.getByLabel('Card number');
  await cardNumber.fill(STRIPE_CARD.number);

  // Expiration
  const expiry = page.getByLabel('Expiration');
  await expiry.fill(STRIPE_CARD.expiry);

  // CVC (use ID to avoid matching the CVC icon SVG)
  const cvc = page.locator('#cardCvc');
  await cvc.fill(STRIPE_CARD.cvc);

  // Cardholder name
  const cardholderName = page.getByLabel('Cardholder name');
  if (await cardholderName.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await cardholderName.fill(STRIPE_CARD.name);
  }

  // Country is pre-selected as US. Fill ZIP in billing address.
  const zipInput = page.getByPlaceholder('ZIP');
  if (await zipInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await zipInput.fill('94598');
  }

  // Submit payment
  await payButton.click();
}
