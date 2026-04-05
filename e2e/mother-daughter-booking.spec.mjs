import { test, expect } from '@playwright/test';
import { fillStripeCheckout } from './helpers/stripe-checkout.mjs';
import { navigateToBooking } from './helpers/test-data.mjs';

const TEST_DATA = {
  mother: {
    firstName: 'Test',
    lastName: 'Mother',
    email: 'info@streetwiseselfdefense.com',
    phone: '9255329953',
  },
  daughter: {
    firstName: 'Test',
    lastName: 'Daughter',
    ageGroup: '12-15',
  },
};

test.describe('Mother-Daughter Class Booking', () => {
  test('full booking flow: navigate → fill form → Stripe checkout → success', async ({ page }) => {
    // Step 1: Navigate to M&D booking page using test data schedule
    await navigateToBooking(page, 'motherDaughter');

    // Step 2: Verify the booking page loaded
    await expect(page.locator('h1')).toContainText('Book:', { timeout: 10_000 });

    // Step 3: Fill mother contact info
    const textInputs = page.locator('input[type="text"]');
    await textInputs.nth(0).fill(TEST_DATA.mother.firstName);
    await textInputs.nth(1).fill(TEST_DATA.mother.lastName);
    await page.locator('input[type="email"]').fill(TEST_DATA.mother.email);
    await page.locator('input[type="tel"]').fill(TEST_DATA.mother.phone);

    // Step 4: Fill daughter info
    await textInputs.nth(2).fill(TEST_DATA.daughter.firstName);
    await textInputs.nth(3).fill(TEST_DATA.daughter.lastName);
    await page.locator('select').first().selectOption(TEST_DATA.daughter.ageGroup);

    // Step 5: Check SMS consent
    await page.locator('input[type="checkbox"]').first().check();

    // Step 6: reCAPTCHA bypassed via VITE_TEST_MODE=true

    // Step 7: Submit booking
    await page.locator('button:has-text("Proceed to Payment")').click();

    // Step 8: Wait for Stripe redirect
    const errorBox = page.locator('.bg-red-50');
    await Promise.race([
      page.waitForURL(/checkout\.stripe\.com/, { timeout: 45_000 }),
      errorBox.waitFor({ timeout: 40_000 }).then(async () => {
        const text = await errorBox.textContent();
        throw new Error(`Booking failed: ${text}`);
      }),
    ]);

    // Step 9: Fill Stripe checkout and pay
    await fillStripeCheckout(page, { email: TEST_DATA.mother.email });

    // Step 10: Wait for success page
    await page.waitForURL(/stripe-success/, { timeout: 60_000 });
    await expect(page).toHaveURL(/stripe-success/);
  });
});
