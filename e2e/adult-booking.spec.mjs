import { test, expect } from '@playwright/test';
import { navigateToBooking } from './helpers/test-data.mjs';

const TEST_DATA = {
  email: 'info@streetwiseselfdefense.com',
  phone: '9255329953',
  firstName: 'Test',
  lastName: 'User',
};

test.describe('Adult Class Booking', () => {
  test('full booking flow: fill form → redirect to Stripe checkout', async ({ page }) => {
    // Step 1: Navigate to adult booking page using test data schedule
    await navigateToBooking(page, 'adult');

    // Step 2: Verify the booking page loaded with class data
    await expect(page.locator('h1')).toContainText('Book:', { timeout: 10_000 });

    // Step 3: Fill contact info
    const textInputs = page.locator('input[type="text"]');
    await textInputs.nth(0).fill(TEST_DATA.firstName);
    await textInputs.nth(1).fill(TEST_DATA.lastName);
    await page.locator('input[type="email"]').fill(TEST_DATA.email);
    await page.locator('input[type="tel"]').fill(TEST_DATA.phone);

    // Step 4: Check SMS consent
    await page.locator('input[type="checkbox"]').first().check();

    // Step 5: reCAPTCHA bypassed via VITE_TEST_MODE=true

    // Step 6: Submit booking
    await page.locator('button:has-text("Proceed to Payment")').click();

    // Step 7: Verify redirect to Stripe Checkout
    // This confirms: form validation passed, API created the booking,
    // Stripe session was generated, and the redirect happened.
    const errorBox = page.locator('.bg-red-50');
    await Promise.race([
      page.waitForURL(/checkout\.stripe\.com/, { timeout: 45_000 }),
      errorBox.waitFor({ timeout: 40_000 }).then(async () => {
        const text = await errorBox.textContent();
        throw new Error(`Booking failed: ${text}`);
      }),
    ]);

    await expect(page).toHaveURL(/checkout\.stripe\.com/);
  });
});
