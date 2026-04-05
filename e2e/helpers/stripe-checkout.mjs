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
  state: 'CA',
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

  // Billing address — required by checkout session config
  // Click "Enter address manually" if it exists (avoids autocomplete dropdown)
  const manualAddressBtn = page.getByRole('button', { name: 'Enter address manually' });
  if (await manualAddressBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await manualAddressBtn.click();
    await page.waitForTimeout(500);
  }

  // Address line 1
  const addressLine1 = page.getByLabel('Address line 1');
  if (await addressLine1.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await addressLine1.fill(BILLING_ADDRESS.line1);
  } else {
    // Try the combobox/autocomplete version
    const addressCombo = page.getByLabel('Address');
    if (await addressCombo.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await addressCombo.fill(BILLING_ADDRESS.line1);
      await page.waitForTimeout(1_000);
      // Press Escape to dismiss autocomplete dropdown, then tab out
      await addressCombo.press('Escape');
      await page.waitForTimeout(500);
    }
  }

  // City
  const cityInput = page.getByPlaceholder('City');
  if (await cityInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await cityInput.fill(BILLING_ADDRESS.city);
  }

  // ZIP
  const zipInput = page.getByPlaceholder('ZIP');
  if (await zipInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await zipInput.fill(BILLING_ADDRESS.zip);
  }

  // State dropdown
  const stateSelect = page.locator('select').last();
  if (await stateSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await stateSelect.selectOption({ label: 'California' }).catch(() =>
      stateSelect.selectOption('CA').catch(() => {})
    );
  }

  // Small wait for form validation to settle
  await page.waitForTimeout(1_000);

  // Submit payment
  await payButton.click();

  // Wait for payment processing (Stripe shows a spinner)
  // The button changes to "Processing" state
  await page.waitForTimeout(3_000);
}
