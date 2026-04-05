import { test, expect } from '@playwright/test';

const TEST_DATA = {
  email: 'info@streetwiseselfdefense.com',
  phone: '9255329953',
  firstName: 'Test',
  lastName: 'User',
  additionalFirstName: 'Test',
  additionalLastName: 'Guest',
};

const STRIPE_CARD = {
  number: '4242424242424242',
  expiry: '12/30',
  cvc: '123',
  name: 'Test User',
  zip: '94598',
};

test.describe('Adult Class Booking', () => {
  test('full booking flow: browse → select → fill form → Stripe checkout', async ({ page }) => {
    // Step 1: Navigate to public classes page
    await page.goto('/public-classes');
    await expect(page.locator('h1')).toContainText('Public Classes', { timeout: 30_000 });

    // Step 2: Find an available adult class with "Sign Up" button and click it
    const signUpButtons = page.locator('button:has-text("Sign Up")');
    await expect(signUpButtons.first()).toBeVisible({ timeout: 15_000 });

    // Find the first adult class (not mother & daughter) with a Sign Up button
    // Adult classes have "Adult & Teen" in their type
    const classCards = page.locator('[class*="rounded-lg"]').filter({ hasText: 'Adult' });
    const adultSignUp = classCards.first().locator('button:has-text("Sign Up")');

    if (await adultSignUp.isVisible()) {
      await adultSignUp.click();
    } else {
      // Fallback: click the first available Sign Up button
      await signUpButtons.first().click();
    }

    // Step 3: Verify we're on the booking page
    await expect(page).toHaveURL(/book-adult-class/, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText('Book:', { timeout: 10_000 });

    // Step 4: Fill in contact information
    const formGrid = page.locator('form, [class*="space-y"]').first();

    // First name and last name are in a 2-column grid
    const textInputs = page.locator('input[type="text"]');
    await textInputs.nth(0).fill(TEST_DATA.firstName);
    await textInputs.nth(1).fill(TEST_DATA.lastName);

    await page.locator('input[type="email"]').fill(TEST_DATA.email);
    await page.locator('input[type="tel"]').fill(TEST_DATA.phone);

    // Step 5: Check SMS consent checkbox
    const smsCheckbox = page.locator('input[type="checkbox"]').first();
    await smsCheckbox.check();

    // Step 6: reCAPTCHA is bypassed client-side and server-side via VITE_TEST_MODE=true.
    // No interaction needed — the booking page auto-sets a fake token in test mode.

    // Step 7: Click "Proceed to Payment"
    const submitButton = page.locator('button:has-text("Proceed to Payment")');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Step 8: Wait for redirect to Stripe Checkout
    // If there are validation errors, they'll show in a red box — capture them for debugging
    const errorBox = page.locator('.bg-red-50');
    const stripeRedirect = page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 }).catch(() => null);
    const errorAppeared = errorBox.waitFor({ timeout: 5_000 }).catch(() => null);

    await Promise.race([stripeRedirect, errorAppeared]);

    // Check if we got an error instead of redirect
    if (await errorBox.isVisible().catch(() => false)) {
      const errorText = await errorBox.textContent();
      throw new Error(`Booking submission failed with error: ${errorText}`);
    }

    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30_000 });

    // Step 9: Fill Stripe checkout form
    // Wait for the Stripe page to load
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    // Email field on Stripe
    const stripeEmail = page.locator('input[name="email"], input[id="email"], #email');
    if (await stripeEmail.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await stripeEmail.fill(TEST_DATA.email);
    }

    // Card number - Stripe uses iframes for card fields
    const cardNumberFrame = page.frameLocator('iframe[name*="cardNumber"], iframe[title*="card number"]').first();
    const cardNumber = cardNumberFrame.locator('input[name="cardnumber"], input[placeholder*="card number"]');
    if (await cardNumber.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cardNumber.fill(STRIPE_CARD.number);
    } else {
      // Stripe Checkout hosted page uses regular inputs
      const hostedCardInput = page.locator('input[name="cardNumber"], input[id="cardNumber"]');
      if (await hostedCardInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await hostedCardInput.fill(STRIPE_CARD.number);
      }
    }

    // Expiry
    const expiryFrame = page.frameLocator('iframe[name*="cardExpiry"], iframe[title*="expir"]').first();
    const expiry = expiryFrame.locator('input[name="exp-date"], input[placeholder*="MM"]');
    if (await expiry.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expiry.fill(STRIPE_CARD.expiry);
    } else {
      const hostedExpiry = page.locator('input[name="cardExpiry"], input[id="cardExpiry"]');
      if (await hostedExpiry.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await hostedExpiry.fill(STRIPE_CARD.expiry);
      }
    }

    // CVC
    const cvcFrame = page.frameLocator('iframe[name*="cardCvc"], iframe[title*="CVC"]').first();
    const cvc = cvcFrame.locator('input[name="cvc"], input[placeholder*="CVC"]');
    if (await cvc.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await cvc.fill(STRIPE_CARD.cvc);
    } else {
      const hostedCvc = page.locator('input[name="cardCvc"], input[id="cardCvc"]');
      if (await hostedCvc.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await hostedCvc.fill(STRIPE_CARD.cvc);
      }
    }

    // Cardholder name (if present)
    const nameInput = page.locator('input[name="billingName"], input[id="billingName"]');
    if (await nameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nameInput.fill(STRIPE_CARD.name);
    }

    // ZIP/Postal code (if present)
    const zipInput = page.locator('input[name="billingPostalCode"], input[id="billingPostalCode"]');
    if (await zipInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await zipInput.fill(STRIPE_CARD.zip);
    }

    // Step 10: Submit payment
    const payButton = page.locator('button[type="submit"]:has-text("Pay"), button:has-text("Pay"), .SubmitButton');
    await expect(payButton.first()).toBeVisible({ timeout: 10_000 });
    await payButton.first().click();

    // Step 11: Wait for redirect back to success page
    await page.waitForURL(/stripe-success/, { timeout: 60_000 });
    await expect(page).toHaveURL(/stripe-success/);

    // Step 12: Verify confirmation page content
    await expect(page.locator('text=confirmed, text=success, text=thank').first()).toBeVisible({ timeout: 15_000 });
  });
});
