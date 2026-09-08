const DEFAULT_COMMERCE_ORIGIN = 'https://store.ajayk.xyz';
const DEFAULT_VARIANT = 'SAR-90-200';

function text(cell) {
  return cell?.textContent.trim() || '';
}

function commerceOrigin(value) {
  try {
    const url = new URL(value || DEFAULT_COMMERCE_ORIGIN);
    if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error();
    return url.origin;
  } catch {
    return DEFAULT_COMMERCE_ORIGIN;
  }
}

function parse(block) {
  const config = {
    origin: DEFAULT_COMMERCE_ORIGIN,
    variant: DEFAULT_VARIANT,
    storefront: DEFAULT_COMMERCE_ORIGIN,
  };
  const fallback = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const key = text(cells[0]).toLowerCase();
    if (key === 'commerce origin') config.origin = commerceOrigin(text(cells[1]));
    else if (key === 'aircraft variant') config.variant = text(cells[1]) || DEFAULT_VARIANT;
    else if (key === 'storefront') config.storefront = commerceOrigin(text(cells[1]));
    else if (key === 'product' && cells.length >= 3) {
      fallback.push({
        name: text(cells[1]),
        sku: text(cells[2]),
        price: text(cells[3]),
        url: cells[4]?.querySelector('a')?.href || text(cells[4]),
      });
    }
  });
  return { config, fallback };
}

function normalizedProduct(item, storefront) {
  if (Number.isInteger(item) || (typeof item === 'string' && /^\d+$/.test(item))) {
    return {
      name: `Compatible aviation part #${item}`,
      sku: `Mage-OS product ${item}`,
      url: `${storefront}/strawberry-aviation-supply.html`,
    };
  }
  if (!item || typeof item !== 'object') return null;
  const sku = String(item.sku || '').trim();
  const name = String(item.name || sku || '').trim();
  if (!name) return null;
  let url = `${storefront}/catalogsearch/result/?q=${encodeURIComponent(sku || name)}`;
  try {
    const candidate = new URL(String(item.url || ''), storefront);
    if (candidate.origin === new URL(storefront).origin) url = candidate.href;
  } catch { /* use search fallback */ }
  return {
    name,
    sku,
    price: String(item.formatted_price || item.price || '').trim(),
    availability: String(item.availability || '').trim(),
    url,
  };
}

function productCard(product) {
  const item = document.createElement('li');
  item.className = 'aviation-catalog-card';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'aviation-catalog-sku';
  eyebrow.textContent = product.sku || 'Compatible aviation part';
  const heading = document.createElement('h3');
  const link = document.createElement('a');
  link.href = product.url;
  link.textContent = product.name;
  heading.append(link);
  const details = document.createElement('p');
  details.className = 'aviation-catalog-details';
  details.textContent = [product.price, product.availability].filter(Boolean).join(' · ')
    || 'View current details in the Mage-OS storefront';
  item.append(eyebrow, heading, details);
  return item;
}

function emit(action, detail = {}) {
  document.dispatchEvent(new CustomEvent('aem:aviation-commerce', {
    detail: { action, ...detail },
  }));
}

async function loadProducts(config) {
  const endpoint = `${config.origin}/rest/V1/strawberry/catalog/variant/${encodeURIComponent(config.variant)}`;
  let response = await fetch(endpoint, { credentials: 'omit', headers: { accept: 'application/json' } });
  if (response.status === 404) {
    response = await fetch(
      `${config.origin}/rest/V1/strawberry/compatibility/variant/${encodeURIComponent(config.variant)}`,
      { credentials: 'omit', headers: { accept: 'application/json' } },
    );
  }
  if (!response.ok) throw new Error(`Commerce API returned ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload)) throw new Error('Commerce API returned an invalid catalog');
  return payload.map((item) => normalizedProduct(item, config.storefront)).filter(Boolean);
}

export default async function decorate(block) {
  const { config, fallback } = parse(block);
  const fallbackProducts = fallback.map((item) => normalizedProduct(item, config.storefront))
    .filter(Boolean);
  const intro = document.createElement('div');
  intro.className = 'aviation-catalog-intro';
  const kicker = document.createElement('p');
  kicker.className = 'aviation-catalog-kicker';
  kicker.textContent = 'Live commerce integration';
  const heading = document.createElement('h2');
  heading.textContent = `Parts compatible with ${config.variant}`;
  intro.append(kicker, heading);
  const disclosure = document.createElement('p');
  disclosure.textContent = 'Fictional demonstration data. Mage-OS is the commerce system of record; compatibility and fulfillment locations are simulated.';
  const status = document.createElement('p');
  status.className = 'aviation-catalog-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const cards = document.createElement('ul');
  cards.className = 'aviation-catalog-grid';
  fallbackProducts.forEach((item) => cards.append(productCard(item)));
  status.textContent = fallbackProducts.length
    ? 'Showing authored product information while live compatibility loads.'
    : 'Loading compatible products…';
  block.replaceChildren(intro, disclosure, status, cards);

  try {
    const products = await loadProducts(config);
    if (!products.length) throw new Error('No compatible products returned');
    cards.replaceChildren(...products.map(productCard));
    status.textContent = `${products.length} compatible ${products.length === 1 ? 'part' : 'parts'} from Mage-OS.`;
    block.dataset.commerceState = 'live';
    emit('catalog-loaded', { variant: config.variant, products: products.length });
  } catch (error) {
    block.dataset.commerceState = 'fallback';
    block.dataset.commerceError = error.message;
    status.textContent = fallbackProducts.length
      ? 'Live compatibility is temporarily unavailable. Showing authored fallback information.'
      : 'Live compatibility is temporarily unavailable. Continue in the Mage-OS storefront.';
    if (!fallbackProducts.length) {
      const action = document.createElement('p');
      const link = document.createElement('a');
      link.className = 'button primary';
      link.href = `${config.storefront}/strawberry-aviation-supply.html`;
      link.textContent = 'Browse aviation parts';
      action.append(link);
      block.append(action);
    }
    emit('catalog-error', { variant: config.variant, category: 'availability' });
  }
}
