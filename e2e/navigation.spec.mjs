import { test, expect } from '@playwright/test';

test.describe('Site Navigation', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Streetwise/i, { timeout: 15_000 });
  });

  test('public classes page loads and shows classes', async ({ page }) => {
    await page.goto('/public-classes');
    await expect(page.locator('h1')).toContainText('Public Classes', { timeout: 30_000 });

    // Wait for classes to load (spinner disappears)
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 30_000 });
  });

  test('blog page loads', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h1')).toContainText('Blog', { timeout: 15_000 });
  });

  test('FAQ page loads', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.locator('h1')).toContainText(/FAQ|Frequently/i, { timeout: 15_000 });
  });

  test('about page loads', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
  });

  test('desktop nav contains all main links', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1280, height: 800 });

    const nav = page.locator('nav');
    await expect(nav.locator('a:has-text("Programs")')).toBeVisible();
    await expect(nav.locator('a:has-text("About")')).toBeVisible();
    await expect(nav.locator('a:has-text("Testimonials")')).toBeVisible();
    await expect(nav.locator('a:has-text("FAQ")')).toBeVisible();
    await expect(nav.locator('a:has-text("Blog")')).toBeVisible();
    await expect(nav.locator('a:has-text("Contact")')).toBeVisible();
  });
});
