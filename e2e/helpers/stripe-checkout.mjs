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
 *
 * Stripe Checkout's hosted page structure varies by region and version.
 * This helper tries multiple selector strategies.
 */
export async function fillStripeCheckout(page, { email }) {
  // Give Stripe's page a moment to fully render
  await page.waitForTimeout(3_000);

  // Debug: log what's on the page
  const pageUrl = page.url();
  console.log(`Stripe checkout URL: ${pageUrl}`);

  // Log all iframes on the page for debugging
  const iframes = await page.locator('iframe').all();
  console.log(`Found ${iframes.length} iframes on Stripe page`);
  for (let i = 0; i < iframes.length; i++) {
    const name = await iframes[i].getAttribute('name').catch(() => 'unknown');
    const title = await iframes[i].getAttribute('title').catch(() => 'unknown');
    console.log(`  iframe[${i}]: name="${name}" title="${title}"`);
  }

  // Email field
  const emailInput = page.locator('#email');
  if (await emailInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await emailInput.fill(email);
    await emailInput.press('Tab');
    await page.waitForTimeout(500);
  }

  // Strategy 1: Card fields directly on the page (some Stripe Checkout versions)
  const directCardNumber = page.locator('#cardNumber, input[name="cardNumber"]');
  if (await directCardNumber.isVisible({ timeout: 3_000 }).catch(() => false)) {
    console.log('Using direct card input strategy');
    await directCardNumber.fill(STRIPE_CARD.number);

    const directExpiry = page.locator('#cardExpiry, input[name="cardExpiry"]');
    if (await directExpiry.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await directExpiry.fill(STRIPE_CARD.expiry);
    }

    const directCvc = page.locator('#cardCvc, input[name="cardCvc"]');
    if (await directCvc.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await directCvc.fill(STRIPE_CARD.cvc);
    }
  } else {
    // Strategy 2: Card fields inside iframes (Stripe Elements within Checkout)
    console.log('Trying iframe-based card input strategy');

    // Find all iframes and try each one for card inputs
    const allFrames = page.frames();
    console.log(`Total frames: ${allFrames.length}`);

    let cardFilled = false;
    for (const frame of allFrames) {
      const cardInput = frame.locator('input[name="cardnumber"], input[name="number"], input[autocomplete="cc-number"]');
      if (await cardInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
        console.log(`Found card input in frame: ${frame.url()}`);
        await cardInput.fill(STRIPE_CARD.number);
        cardFilled = true;

        // Expiry in same or sibling frame
        const expiryInput = frame.locator('input[name="exp-date"], input[name="expiry"], input[autocomplete="cc-exp"]');
        if (await expiryInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
          await expiryInput.fill(STRIPE_CARD.expiry);
        }

        // CVC
        const cvcInput = frame.locator('input[name="cvc"], input[autocomplete="cc-csc"]');
        if (await cvcInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
          await cvcInput.fill(STRIPE_CARD.cvc);
        }
        break;
      }
    }

    if (!cardFilled) {
      // Strategy 3: Try the newer Stripe Checkout with combined payment element
      console.log('Trying payment element strategy');
      const paymentFrame = page.frameLocator('iframe[title*="payment"], iframe[title*="card"], iframe[name*="stripe"]').first();
      const paymentInput = paymentFrame.locator('input[name="cardnumber"], input[name="number"], input[autocomplete="cc-number"]');
      await paymentInput.waitFor({ state: 'visible', timeout: 15_000 });
      await paymentInput.fill(STRIPE_CARD.number);

      const expiryInput = paymentFrame.locator('input[name="exp-date"], input[name="expiry"], input[autocomplete="cc-exp"]');
      if (await expiryInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await expiryInput.fill(STRIPE_CARD.expiry);
      }

      const cvcInput = paymentFrame.locator('input[name="cvc"], input[autocomplete="cc-csc"]');
      if (await cvcInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await cvcInput.fill(STRIPE_CARD.cvc);
      }
    }
  }

  // Cardholder name (if visible)
  const nameInput = page.locator('#billingName, input[name="billingName"]');
  if (await nameInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await nameInput.fill(STRIPE_CARD.name);
  }

  // ZIP/Postal code (if visible)
  const zipInput = page.locator('#billingPostalCode, input[name="billingPostalCode"]');
  if (await zipInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await zipInput.fill(STRIPE_CARD.zip);
  }

  // Submit payment — try multiple selectors for the pay button
  const payButton = page.locator(
    'button.SubmitButton, ' +
    'button[data-testid="hosted-payment-submit-button"], ' +
    '.SubmitButton-IconContainer, ' +
    'button[type="submit"]'
  ).first();
  await payButton.waitFor({ state: 'visible', timeout: 10_000 });
  await payButton.click();
}
