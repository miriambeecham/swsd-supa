import { test, expect } from '@playwright/test';
import { fillStripeCheckout } from './helpers/stripe-checkout.mjs';

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
  test('full booking flow: browse → select M&D class → fill form → Stripe checkout', async ({ page }) => {
    // Step 1: Navigate to public classes page
    await page.goto('/public-classes');
    await expect(page.locator('h1')).toContainText('Public Classes', { timeout: 30_000 });

    // Step 2: Find a Mother & Daughter class with "Sign Up"
    const mdCards = page.locator('[class*="rounded-lg"]').filter({ hasText: /[Mm]other|[Dd]aughter/ });
    const mdSignUp = mdCards.first().locator('button:has-text("Sign Up")');

    if (await mdSignUp.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await mdSignUp.click();
    } else {
      test.skip(true, 'No Mother-Daughter class available on public classes page');
      return;
    }

    // Step 3: Verify booking page
    await expect(page).toHaveURL(/book-mother-daughter-class/, { timeout: 10_000 });

    // Step 4: Fill mother contact info
    const textInputs = page.locator('input[type="text"]');
    await textInputs.nth(0).fill(TEST_DATA.mother.firstName);
    await textInputs.nth(1).fill(TEST_DATA.mother.lastName);
    await page.locator('input[type="email"]').fill(TEST_DATA.mother.email);
    await page.locator('input[type="tel"]').fill(TEST_DATA.mother.phone);

    // Step 5: Fill daughter info
    await textInputs.nth(2).fill(TEST_DATA.daughter.firstName);
    await textInputs.nth(3).fill(TEST_DATA.daughter.lastName);
    await page.locator('select').first().selectOption(TEST_DATA.daughter.ageGroup);

    // Step 6: Check SMS consent
    await page.locator('input[type="checkbox"]').first().check();

    // Step 7: reCAPTCHA bypassed via VITE_TEST_MODE=true

    // Step 8: Submit booking
    await page.locator('button:has-text("Proceed to Payment")').click();

    // Step 9: Wait for Stripe redirect
    const errorBox = page.locator('.bg-red-50');
    await Promise.race([
      page.waitForURL(/checkout\.stripe\.com/, { timeout: 45_000 }),
      errorBox.waitFor({ timeout: 40_000 }).then(async () => {
        const text = await errorBox.textContent();
        throw new Error(`Booking failed: ${text}`);
      }),
    ]);

    // Step 10: Fill Stripe checkout and pay
    await fillStripeCheckout(page, { email: TEST_DATA.mother.email });

    // Step 11: Wait for success page
    await page.waitForURL(/stripe-success/, { timeout: 60_000 });
    await expect(page).toHaveURL(/stripe-success/);
  });
});
