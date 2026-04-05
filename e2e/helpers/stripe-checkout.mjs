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
 * The checkout has billing_address_collection: 'required', so all
 * address fields must be filled for payment to process.
 */
export async function fillStripeCheckout(page, { email }) {
  // Wait for the submit button
  const payButton = page.getByTestId('hosted-payment-submit-button');
  await payButton.waitFor({ state: 'visible', timeout: 30_000 });

  // Card number
  await page.getByLabel('Card number').fill(STRIPE_CARD.number);

  // Expiration
  await page.getByLabel('Expiration').fill(STRIPE_CARD.expiry);

  // CVC (use ID to avoid matching the CVC icon SVG)
  await page.locator('#cardCvc').fill(STRIPE_CARD.cvc);

  // Cardholder name
  const cardholderName = page.getByLabel('Cardholder name');
  if (await cardholderName.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await cardholderName.fill(STRIPE_CARD.name);
  }

  // Billing address — required by checkout session config.
  // Type the address into the autocomplete combobox, wait for Google
  // Places suggestions to appear, then select the first one.
  // Selecting an autocomplete suggestion auto-fills City, State, and ZIP.
  const addressInput = page.getByRole('combobox', { name: 'Address' });
  if (await addressInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await addressInput.click();
    await addressInput.pressSequentially('2121 Ygnacio Valley Rd', { delay: 30 });

    // Wait for Google Places autocomplete suggestion to appear and click it.
    // The suggestion is inside a listbox within the address combobox.
    const suggestion = page.getByRole('option', { name: /Ygnacio Valley Rd,/ }).first();
    await suggestion.waitFor({ state: 'visible', timeout: 10_000 });
    await suggestion.click();

    // Wait for Stripe to populate the other fields from the suggestion
    await page.waitForTimeout(1_000);
  }

  // Wait for form validation to settle
  await page.waitForTimeout(1_000);

  // Submit payment
  await payButton.click();
}
