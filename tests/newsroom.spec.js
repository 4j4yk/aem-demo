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

test('aviation catalog progressively enhances authored fallback with Mage-OS data', async ({ page }) => {
  await page.route('https://store.ajayk.xyz/rest/V1/strawberry/catalog/variant/SAR-90-200', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([{
      sku: 'SAS-HYD-1001',
      name: 'AeroFlow Hydraulic Pump',
      formatted_price: '$8,750.00',
      availability: 'Available from native single stock',
      url: 'https://untrusted.example/redirect',
    }]),
  }));
  await page.goto('/');
  await page.evaluate(async () => {
    const block = document.createElement('div');
    block.className = 'aviation-catalog';
    block.innerHTML = '<div><div>Commerce origin</div><div>https://store.ajayk.xyz</div></div>'
      + '<div><div>Aircraft variant</div><div>SAR-90-200</div></div>'
      + '<div><div>Product</div><div>Authored fallback</div><div>SAS-FALLBACK</div></div>';
    (document.querySelector('main') || document.body).append(block);
    // eslint-disable-next-line import/no-unresolved, import/no-absolute-path
    const { default: decorate } = await import('/blocks/aviation-catalog/aviation-catalog.js');
    await decorate(block);
  });
  await expect(page.locator('.aviation-catalog')).toHaveAttribute('data-commerce-state', 'live');
  await expect(page.locator('.aviation-catalog-status')).toHaveText('1 compatible part from Mage-OS.');
  await expect(page.locator('.aviation-catalog-card')).toContainText('AeroFlow Hydraulic Pump');
  await expect(page.locator('.aviation-catalog-card a')).toHaveAttribute(
    'href',
    'https://store.ajayk.xyz/catalogsearch/result/?q=SAS-HYD-1001',
  );
  await expect(page.locator('.aviation-catalog')).toContainText('fulfillment locations are simulated');
});

test('aviation catalog retains authored fallback when commerce is unavailable', async ({ page }) => {
  await page.route('https://store.ajayk.xyz/rest/V1/strawberry/catalog/variant/SAR-90-200', (route) => route.fulfill({ status: 503 }));
  await page.goto('/');
  await page.evaluate(async () => {
    const block = document.createElement('div');
    block.className = 'aviation-catalog';
    block.innerHTML = '<div><div>Product</div><div>Authored fallback pump</div><div>SAS-HYD-1001</div><div>$8,750</div></div>';
    (document.querySelector('main') || document.body).append(block);
    // eslint-disable-next-line import/no-unresolved, import/no-absolute-path
    const { default: decorate } = await import('/blocks/aviation-catalog/aviation-catalog.js');
    await decorate(block);
  });
  await expect(page.locator('.aviation-catalog')).toHaveAttribute('data-commerce-state', 'fallback');
  await expect(page.locator('.aviation-catalog-card')).toContainText('Authored fallback pump');
  await expect(page.locator('.aviation-catalog-status')).toContainText('temporarily unavailable');
});
