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

    // Step 2: Wait for classes to load
    await page.waitForTimeout(3_000);

    // Step 3: Find a Mother & Daughter class with "Sign Up"
    // The class name contains "Mothers & Daughters" or "Mother & Daughter"
    // Look for any Sign Up button near that text
    const allSignUpButtons = page.locator('button:has-text("Sign Up")');
    const signUpCount = await allSignUpButtons.count();
    console.log(`Found ${signUpCount} Sign Up buttons on page`);

    // Log all visible class names for debugging
    const classNames = page.locator('.text-navy.font-bold');
    const nameCount = await classNames.count();
    for (let i = 0; i < nameCount; i++) {
      const text = await classNames.nth(i).textContent();
      console.log(`  Class ${i}: ${text}`);
    }

    // Find a M&D class name, then click the Sign Up button in the same card.
    // Each card is a flex row: [icon] [class info] [Sign Up button]
    // The class name is in a span.text-navy.font-bold
    let mdSignUpFound = false;

    for (let i = 0; i < nameCount; i++) {
      const text = await classNames.nth(i).textContent();
      if (text && /[Dd]aughter/.test(text)) {
        // Found a M&D class — find the Sign Up button in the same card.
        // Navigate up to the card container (flex row), then find the button.
        const card = classNames.nth(i).locator('xpath=ancestor::div[contains(@class, "flex") and contains(@class, "items-start")]');
        const signUp = card.locator('button:has-text("Sign Up")');
        if (await signUp.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await signUp.click();
          mdSignUpFound = true;
          console.log(`Clicked Sign Up for M&D class: ${text}`);
          break;
        }
      }
    }

    if (!mdSignUpFound) {
      test.skip(true, 'No Mother-Daughter class with Sign Up button found on public classes page');
      return;
    }

    // Step 4: Verify booking page
    await expect(page).toHaveURL(/book-mother-daughter-class/, { timeout: 10_000 });

    // Step 5: Fill mother contact info
    const textInputs = page.locator('input[type="text"]');
    await textInputs.nth(0).fill(TEST_DATA.mother.firstName);
    await textInputs.nth(1).fill(TEST_DATA.mother.lastName);
    await page.locator('input[type="email"]').fill(TEST_DATA.mother.email);
    await page.locator('input[type="tel"]').fill(TEST_DATA.mother.phone);

    // Step 6: Fill daughter info
    await textInputs.nth(2).fill(TEST_DATA.daughter.firstName);
    await textInputs.nth(3).fill(TEST_DATA.daughter.lastName);
    await page.locator('select').first().selectOption(TEST_DATA.daughter.ageGroup);

    // Step 7: Check SMS consent
    await page.locator('input[type="checkbox"]').first().check();

    // Step 8: reCAPTCHA bypassed via VITE_TEST_MODE=true

    // Step 9: Submit booking
    await page.locator('button:has-text("Proceed to Payment")').click();

    // Step 10: Wait for Stripe redirect
    const errorBox = page.locator('.bg-red-50');
    await Promise.race([
      page.waitForURL(/checkout\.stripe\.com/, { timeout: 45_000 }),
      errorBox.waitFor({ timeout: 40_000 }).then(async () => {
        const text = await errorBox.textContent();
        throw new Error(`Booking failed: ${text}`);
      }),
    ]);

    // Step 11: Fill Stripe checkout and pay
    await fillStripeCheckout(page, { email: TEST_DATA.mother.email });

    // Step 12: Wait for success page
    await page.waitForURL(/stripe-success/, { timeout: 60_000 });
    await expect(page).toHaveURL(/stripe-success/);
  });
});
