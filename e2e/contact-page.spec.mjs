import { test, expect } from '@playwright/test';

test.describe('Contact Page', () => {
  test('renders all contact methods and links', async ({ page }) => {
    await page.goto('/contact');

    // Page loads with correct title
    await expect(page.locator('h1').first()).toContainText(/[Cc]ontact|[Gg]et [Ii]n [Tt]ouch/, { timeout: 15_000 });

    // Calendly scheduling link
    const calendlyLink = page.locator('a[href*="calendly.com"]');
    await expect(calendlyLink.first()).toBeVisible();

    // Phone number link
    const phoneLink = page.locator('a[href*="tel:"]');
    await expect(phoneLink.first()).toBeVisible();

    // Email link
    const emailLink = page.locator('a[href*="mailto:info@streetwiseselfdefense.com"]');
    await expect(emailLink.first()).toBeVisible();

    // Address / Google Maps link
    const mapLink = page.locator('a[href*="maps.google.com"], a[href*="maps.app.goo"]');
    await expect(mapLink.first()).toBeVisible();
  });

  test('social media links are present', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Facebook link
    const facebookLink = page.locator('a[href*="facebook.com"]');
    await expect(facebookLink.first()).toBeVisible();

    // Google Reviews link
    const googleLink = page.locator('a[href*="maps.app.goo"]');
    await expect(googleLink.first()).toBeVisible();

    // Yelp link
    const yelpLink = page.locator('a[href*="yelp.com"]');
    await expect(yelpLink.first()).toBeVisible();
  });
});
