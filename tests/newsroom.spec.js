import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('indexed newsroom supports discovery and URL state', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Automotive storytelling');
  await expect(page.locator('.newsroom-card')).toHaveCount(8);
  await expect(page.locator('.newsroom-results')).toHaveText('8 stories found');
  await page.getByLabel('Search stories').fill('battery');
  await expect(page.locator('.newsroom-results')).toHaveText('2 stories found');
  await expect(page.locator('.newsroom-grid')).toContainText('Designing batteries for a second life');
  await expect(page).toHaveURL(/q=battery/);
  await page.getByLabel('Search stories').fill(' ');
  await page.getByRole('button', { name: 'Community' }).click();
  await expect(page.locator('.newsroom-results')).toHaveText('2 stories found');
  await expect(page).toHaveURL(/category=Community/);
});

test('article has metadata, structured data, and related media', async ({ page }) => {
  await page.goto('/stories/electric-platform');
  await expect(page.locator('body')).toHaveClass(/article/);
  await expect(page.locator('.article-meta-list')).toBeVisible();
  await expect(page.locator('.story-gallery figure')).toHaveCount(2);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /electric-platform/);
  await expect(page.locator('script[data-aem-structured-data]')).toHaveCount(1);
});

test('homepage has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).exclude('.analytics-debugger').analyze();
  expect(results.violations.filter(({ impact }) => ['critical', 'serious'].includes(impact))).toEqual([]);
});
