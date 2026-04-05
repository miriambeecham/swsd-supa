import { test, expect } from '@playwright/test';
import { fillStripeCheckout } from './helpers/stripe-checkout.mjs';

const TEST_DATA = {
  email: 'info@streetwiseselfdefense.com',
  phone: '9255329953',
  firstName: 'Test',
  lastName: 'User',
};

test.describe('Adult Class Booking', () => {
  test('full booking flow: browse → select → fill form → Stripe checkout', async ({ page }) => {
    // Step 1: Navigate to public classes page
    await page.goto('/public-classes');
    await expect(page.locator('h1')).toContainText('Public Classes', { timeout: 30_000 });

    // Step 2: Find an adult class with "Sign Up" button
    const signUpButtons = page.locator('button:has-text("Sign Up")');
    await expect(signUpButtons.first()).toBeVisible({ timeout: 15_000 });

    // Click the first available Sign Up button (adult classes appear first)
    const classCards = page.locator('[class*="rounded-lg"]').filter({ hasText: 'Adult' });
    const adultSignUp = classCards.first().locator('button:has-text("Sign Up")');

    if (await adultSignUp.isVisible().catch(() => false)) {
      await adultSignUp.click();
    } else {
      await signUpButtons.first().click();
    }

    // Step 3: Verify we're on the booking page
    await expect(page).toHaveURL(/book-adult-class/, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText('Book:', { timeout: 10_000 });

    // Step 4: Fill contact info
    const textInputs = page.locator('input[type="text"]');
    await textInputs.nth(0).fill(TEST_DATA.firstName);
    await textInputs.nth(1).fill(TEST_DATA.lastName);
    await page.locator('input[type="email"]').fill(TEST_DATA.email);
    await page.locator('input[type="tel"]').fill(TEST_DATA.phone);

    // Step 5: Check SMS consent
    await page.locator('input[type="checkbox"]').first().check();

    // Step 6: reCAPTCHA bypassed via VITE_TEST_MODE=true

    // Step 7: Submit booking
    await page.locator('button:has-text("Proceed to Payment")').click();

    // Step 8: Wait for Stripe redirect (with error capture)
    const errorBox = page.locator('.bg-red-50');
    await Promise.race([
      page.waitForURL(/checkout\.stripe\.com/, { timeout: 45_000 }),
      errorBox.waitFor({ timeout: 40_000 }).then(async () => {
        const text = await errorBox.textContent();
        throw new Error(`Booking failed: ${text}`);
      }),
    ]);

    // Step 9: Fill Stripe checkout and pay
    await fillStripeCheckout(page, { email: TEST_DATA.email });

    // Step 10: Wait for success page
    await page.waitForURL(/stripe-success/, { timeout: 60_000 });
    await expect(page).toHaveURL(/stripe-success/);
  });
});
