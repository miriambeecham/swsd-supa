// e2e/helpers/stripe-checkout.mjs
// Shared helper for interacting with Stripe's hosted checkout page.

export const STRIPE_CARD = {
  number: '4242424242424242',
  expiry: '1230',
  cvc: '123',
  name: 'Test User',
  zip: '94598',
};

/**
 * Fill and submit Stripe's hosted checkout page.
 * Assumes the page has already navigated to checkout.stripe.com.
 */
export async function fillStripeCheckout(page, { email }) {
  // Wait for the Stripe checkout form to render by looking for the submit button
  // Stripe Checkout uses a "Pay" or "Subscribe" button
  const payButton = page.locator('button.SubmitButton, button[data-testid="hosted-payment-submit-button"]');
  await payButton.first().waitFor({ state: 'visible', timeout: 30_000 });

  // Email field (sometimes pre-filled, sometimes needs input)
  const emailInput = page.locator('#email');
  if (await emailInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await emailInput.fill(email);
    // Tab out to trigger validation
    await emailInput.press('Tab');
  }

  // Card number — Stripe Checkout uses an iframe for the card form
  const cardFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first();

  // Try to find and fill card number
  const cardInput = cardFrame.locator('input[name="cardnumber"]');
  await cardInput.waitFor({ state: 'visible', timeout: 10_000 });
  await cardInput.fill(STRIPE_CARD.number);

  // Expiry — in the same frame, next field
  const expiryInput = cardFrame.locator('input[name="exp-date"]');
  await expiryInput.fill(STRIPE_CARD.expiry);

  // CVC
  const cvcInput = cardFrame.locator('input[name="cvc"]');
  await cvcInput.fill(STRIPE_CARD.cvc);

  // Cardholder name (if visible — not always present)
  const nameInput = page.locator('#billingName');
  if (await nameInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await nameInput.fill(STRIPE_CARD.name);
  }

  // ZIP/Postal code (if visible)
  const zipInput = page.locator('#billingPostalCode');
  if (await zipInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await zipInput.fill(STRIPE_CARD.zip);
  }

  // Submit payment
  await payButton.first().click();
}
