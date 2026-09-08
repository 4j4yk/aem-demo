import { expect, test } from '@playwright/test';

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
