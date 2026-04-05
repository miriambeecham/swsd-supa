import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';

// Community M-D booking page loads via URL param, no navigation state needed.
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

const STRIPE_CARD = {
  number: '4242424242424242',
  expiry: '12/30',
  cvc: '123',
  name: 'Test CommunityMom',
  zip: '94598',
};

test.describe('Community Mother-Daughter Class Booking', () => {
  test('full booking flow: direct URL → fill form → Stripe checkout', async ({ page }) => {
    // Step 1: Navigate directly to community booking page via URL
    await page.goto(`/book-community-md/${COMMUNITY_SCHEDULE_ID}`);

    // Step 2: Wait for class data to load
    // The page fetches schedule + class data, then renders the form
    await expect(page.getByText('Mother/Guardian Information')).toBeVisible({ timeout: 30_000 });

    // Step 3: Verify community notice banner is visible
    await expect(page.getByText('Private Community Class')).toBeVisible({ timeout: 5_000 });

    // Step 4: Fill mother/guardian contact information
    const textInputs = page.locator('input[type="text"]');
    await textInputs.nth(0).fill(TEST_DATA.mother.firstName);
    await textInputs.nth(1).fill(TEST_DATA.mother.lastName);
    await page.locator('input[type="email"]').fill(TEST_DATA.mother.email);
    await page.locator('input[type="tel"]').fill(TEST_DATA.mother.phone);

    // Step 5: Fill daughter information
    // Daughter first and last name follow mother fields
    await textInputs.nth(2).fill(TEST_DATA.daughter.firstName);
    await textInputs.nth(3).fill(TEST_DATA.daughter.lastName);

    // Age group dropdown (community page only shows 12-15 option)
    const ageSelect = page.locator('select').first();
    await ageSelect.selectOption(TEST_DATA.daughter.ageGroup);

    // Step 6: Check SMS consent
    const smsCheckbox = page.locator('input[type="checkbox"]').first();
    await smsCheckbox.check();

    // Step 7: reCAPTCHA is bypassed client-side and server-side via VITE_TEST_MODE=true.

    // Step 8: Submit booking
    const submitButton = page.locator('button:has-text("Proceed to Payment")');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Step 9: Wait for Stripe redirect
    const errorBox = page.locator('.bg-red-50');
    const stripeRedirect = page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 }).catch(() => null);
    const errorAppeared = errorBox.waitFor({ timeout: 5_000 }).catch(() => null);
    await Promise.race([stripeRedirect, errorAppeared]);

    if (await errorBox.isVisible().catch(() => false)) {
      const errorText = await errorBox.textContent();
      throw new Error(`Booking submission failed with error: ${errorText}`);
    }

    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30_000 });

    // Step 10: Fill Stripe checkout
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    // Email
    const stripeEmail = page.locator('input[name="email"], input[id="email"], #email');
    if (await stripeEmail.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await stripeEmail.fill(TEST_DATA.mother.email);
    }

    // Card number
    const cardNumberFrame = page.frameLocator('iframe[name*="cardNumber"], iframe[title*="card number"]').first();
    const cardNumber = cardNumberFrame.locator('input[name="cardnumber"], input[placeholder*="card number"]');
    if (await cardNumber.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cardNumber.fill(STRIPE_CARD.number);
    } else {
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

    // Name
    const nameInput = page.locator('input[name="billingName"], input[id="billingName"]');
    if (await nameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nameInput.fill(STRIPE_CARD.name);
    }

    // ZIP
    const zipInput = page.locator('input[name="billingPostalCode"], input[id="billingPostalCode"]');
    if (await zipInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await zipInput.fill(STRIPE_CARD.zip);
    }

    // Step 11: Submit payment
    const payButton = page.locator('button[type="submit"]:has-text("Pay"), button:has-text("Pay"), .SubmitButton');
    await expect(payButton.first()).toBeVisible({ timeout: 10_000 });
    await payButton.first().click();

    // Step 12: Wait for success page
    await page.waitForURL(/stripe-success/, { timeout: 60_000 });
    await expect(page).toHaveURL(/stripe-success/);
  });
});
