import { test, expect } from '@playwright/test';

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

const STRIPE_CARD = {
  number: '4242424242424242',
  expiry: '12/30',
  cvc: '123',
  name: 'Test Mother',
  zip: '94598',
};

test.describe('Mother-Daughter Class Booking', () => {
  test('full booking flow: browse → select M&D class → fill form → Stripe checkout', async ({ page }) => {
    // Step 1: Navigate to public classes page
    await page.goto('/public-classes');
    await expect(page.locator('h1')).toContainText('Public Classes', { timeout: 30_000 });

    // Step 2: Find a Mother & Daughter class with "Sign Up" button
    const classCards = page.locator('[class*="rounded-lg"]');
    const mdCards = classCards.filter({ hasText: /[Mm]other|[Dd]aughter/ });
    const mdSignUp = mdCards.first().locator('button:has-text("Sign Up")');

    if (await mdSignUp.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await mdSignUp.click();
    } else {
      // If no M&D class visible, skip test
      test.skip(true, 'No Mother-Daughter class available on public classes page');
      return;
    }

    // Step 3: Verify we're on the M&D booking page
    await expect(page).toHaveURL(/book-mother-daughter-class/, { timeout: 10_000 });

    // Step 4: Fill mother/guardian contact information
    const textInputs = page.locator('input[type="text"]');
    await textInputs.nth(0).fill(TEST_DATA.mother.firstName);
    await textInputs.nth(1).fill(TEST_DATA.mother.lastName);
    await page.locator('input[type="email"]').fill(TEST_DATA.mother.email);
    await page.locator('input[type="tel"]').fill(TEST_DATA.mother.phone);

    // Step 5: Fill daughter information
    // The first daughter section should already be visible
    // Find daughter name fields (they come after the mother contact fields)
    // Daughter first name and last name are in the daughter section
    const daughterSection = page.locator('text=Daughter').first().locator('..').locator('..');
    const allTextInputs = page.locator('input[type="text"]');

    // Mother fields are indices 0,1. Daughter fields follow.
    // Fill daughter first name (index 2) and last name (index 3)
    await allTextInputs.nth(2).fill(TEST_DATA.daughter.firstName);
    await allTextInputs.nth(3).fill(TEST_DATA.daughter.lastName);

    // Step 6: Select daughter age group (must be 12-15)
    const ageSelect = page.locator('select').first();
    await ageSelect.selectOption(TEST_DATA.daughter.ageGroup);

    // Step 7: Check SMS consent
    const smsCheckbox = page.locator('input[type="checkbox"]').first();
    await smsCheckbox.check();

    // Step 8: Handle reCAPTCHA
    const recaptchaFrame = page.frameLocator('iframe[src*="recaptcha"]').first();
    try {
      const recaptchaCheckbox = recaptchaFrame.locator('#recaptcha-anchor');
      await recaptchaCheckbox.waitFor({ timeout: 10_000 });
      await recaptchaCheckbox.click();
      await recaptchaFrame.locator('.recaptcha-checkbox-checked').waitFor({ timeout: 10_000 });
    } catch (e) {
      console.log('reCAPTCHA interaction failed, continuing anyway:', e.message);
    }

    // Step 9: Submit booking
    const submitButton = page.locator('button:has-text("Proceed to Payment")');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Step 10: Wait for Stripe redirect
    const errorBox = page.locator('.bg-red-50');
    const stripeRedirect = page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 }).catch(() => null);
    const errorAppeared = errorBox.waitFor({ timeout: 5_000 }).catch(() => null);
    await Promise.race([stripeRedirect, errorAppeared]);

    if (await errorBox.isVisible().catch(() => false)) {
      const errorText = await errorBox.textContent();
      throw new Error(`Booking submission failed with error: ${errorText}`);
    }

    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30_000 });

    // Step 11: Fill Stripe checkout
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

    // Step 12: Submit payment
    const payButton = page.locator('button[type="submit"]:has-text("Pay"), button:has-text("Pay"), .SubmitButton');
    await expect(payButton.first()).toBeVisible({ timeout: 10_000 });
    await payButton.first().click();

    // Step 13: Wait for success page
    await page.waitForURL(/stripe-success/, { timeout: 60_000 });
    await expect(page).toHaveURL(/stripe-success/);
  });
});
