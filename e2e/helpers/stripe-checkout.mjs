// e2e/helpers/stripe-checkout.mjs
// Shared helper for interacting with Stripe's hosted checkout page.

export const STRIPE_CARD = {
  number: '4242424242424242',
  expiry: '12/30',
  cvc: '123',
  name: 'Test User',
};

const BILLING_ADDRESS = {
  line1: '2121 Ygnacio Valley Rd',
  city: 'Walnut Creek',
  zip: '94598',
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
  // The Address field is an autocomplete combobox. Type the address,
  // then click directly on the City field to dismiss the dropdown
  // and continue filling the rest of the form.
  const addressInput = page.getByRole('combobox', { name: 'Address' });
  if (await addressInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await addressInput.click();
    await addressInput.pressSequentially(BILLING_ADDRESS.line1, { delay: 30 });
    await page.waitForTimeout(500);
  }

  // Click directly on the City field to dismiss the address autocomplete dropdown
  const cityInput = page.getByRole('textbox', { name: 'City' });
  await cityInput.click();
  await page.waitForTimeout(300);
  await cityInput.fill(BILLING_ADDRESS.city);

  // ZIP
  const zipInput = page.getByRole('textbox', { name: 'ZIP' });
  await zipInput.fill(BILLING_ADDRESS.zip);

  // State — select California
  const stateCombo = page.getByRole('combobox', { name: 'State' });
  if (await stateCombo.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await stateCombo.selectOption({ label: 'California' });
  }

  // Wait for Stripe's form validation
  await page.waitForTimeout(1_000);

  // Submit payment
  await payButton.click();
}
