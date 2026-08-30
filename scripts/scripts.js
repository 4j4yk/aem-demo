import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
} from './aem.js';

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Promotes the opening image, heading, and introduction into a hero block.
 * This keeps the document simple for authors while giving the lead story a
 * dedicated, reusable presentation layer.
 * @param {Element} main The main content container
 */
function buildHeroAutoBlock(main) {
  const firstSection = main.querySelector(':scope > div');
  const heading = firstSection?.querySelector(':scope > h1');
  if (!heading || firstSection.querySelector(':scope > .hero')) return;

  const heroContent = [];
  const previous = heading.previousElementSibling;
  if (previous?.querySelector('picture')) heroContent.push(previous);
  heroContent.push(heading);

  let sibling = heading.nextElementSibling;
  while (sibling && !sibling.matches('h2, h3, div[class]')) {
    const next = sibling.nextElementSibling;
    heroContent.push(sibling);
    sibling = next;
  }

  firstSection.prepend(buildBlock('hero', { elems: heroContent }));
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroAutoBlock(main);
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

function ensureMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.append(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
}

function decorateDiscoverability(main) {
  const canonicalUrl = new URL(window.location.pathname, 'https://aem-demo.ajayk.xyz').href;
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.append(canonical);
  }
  canonical.href = canonicalUrl;
  const description = document.head.querySelector('meta[name="description"]')?.content
    || main.querySelector('h1 + p')?.textContent.trim() || '';
  const image = main.querySelector('picture img')?.src;
  ensureMeta('meta[property="og:title"]', { property: 'og:title', content: document.title });
  ensureMeta('meta[property="og:description"]', { property: 'og:description', content: description });
  ensureMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
  ensureMeta('meta[property="og:type"]', { property: 'og:type', content: document.body.classList.contains('article') ? 'article' : 'website' });
  ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
  if (image) ensureMeta('meta[property="og:image"]', { property: 'og:image', content: new URL(image, window.location).href });

  const h1 = main.querySelector('h1');
  if (!h1 || document.head.querySelector('script[data-aem-structured-data]')) return;
  const data = document.createElement('script');
  data.type = 'application/ld+json';
  data.dataset.aemStructuredData = 'true';
  data.textContent = JSON.stringify(document.body.classList.contains('article') ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: h1.textContent.trim(),
    description,
    image: image ? [new URL(image, window.location).href] : undefined,
    mainEntityOfPage: canonicalUrl,
    publisher: { '@type': 'Organization', name: 'AEM Automotive Experience Lab' },
  } : {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AEM Automotive Experience Lab',
    url: canonicalUrl,
    description,
  });
  document.head.append(data);
}

function buildArticleBreadcrumbs(main) {
  if (!document.body.classList.contains('article') || main.querySelector('.breadcrumbs')) return;
  const h1 = main.querySelector('h1');
  if (!h1) return;
  const nav = document.createElement('nav');
  nav.className = 'breadcrumbs';
  nav.setAttribute('aria-label', 'Breadcrumb');
  const list = document.createElement('ol');
  list.innerHTML = '<li><a href="/">Newsroom</a></li>';
  const current = document.createElement('li');
  current.textContent = h1.textContent.trim();
  current.setAttribute('aria-current', 'page');
  list.append(current);
  nav.append(list);
  h1.closest('.hero')?.prepend(nav);
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  const capabilities = main.querySelector('.section.highlight');
  if (capabilities) capabilities.id = 'capabilities';
  decorateBlocks(main);
  decorateButtons(main);
  decorateDiscoverability(main);
  buildArticleBreadcrumbs(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./analytics.js');
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();

/** Enable the DA.live in-context preview only when its explicit query flag is present. */
(async function loadDaPreview() {
  if (!new URL(window.location.href).searchParams.has('dapreview')) return;
  // eslint-disable-next-line import/no-unresolved
  const { default: daPreview } = await import('https://da.live/scripts/dapreview.js');
  daPreview(loadPage);
}());
