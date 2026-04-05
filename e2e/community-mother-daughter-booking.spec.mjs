import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { fillStripeCheckout } from './helpers/stripe-checkout.mjs';

// Read schedule ID from e2e-test-data.json (written by data setup script) or fall back to hardcoded.
function getCommunityScheduleId() {
  if (existsSync('e2e-test-data.json')) {
    const data = JSON.parse(readFileSync('e2e-test-data.json', 'utf-8'));
    if (data.communityScheduleId) return data.communityScheduleId;
  }
  return 'rechvXSnrxhzaCK1q'; // fallback
}
const COMMUNITY_SCHEDULE_ID = getCommunityScheduleId();

const TEST_DATA = {
  mother: {
    firstName: 'Test',
    lastName: 'CommunityMom',
    email: 'info@streetwiseselfdefense.com',
    phone: '9255329953',
  },
  daughter: {
    firstName: 'Test',
    lastName: 'CommunityDaughter',
    ageGroup: '12-15',
  },
};

test.describe('Community Mother-Daughter Class Booking', () => {
  test('full booking flow: direct URL → fill form → Stripe checkout', async ({ page }) => {
    // Step 1: Navigate directly to community booking page
    await page.goto(`/book-community-md/${COMMUNITY_SCHEDULE_ID}`);

    // Step 2: Wait for form to load
    await expect(page.getByText('Mother/Guardian Information')).toBeVisible({ timeout: 30_000 });

    // Step 3: Verify community notice
    await expect(page.getByText('Private Community Class')).toBeVisible({ timeout: 5_000 });

    // Step 4: Fill mother/guardian info
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
