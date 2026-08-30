function assignment(id) {
  const key = `aem-experiment-${id}`;
  let variant = sessionStorage.getItem(key);
  if (!variant) {
    variant = Math.random() < 0.5 ? 'control' : 'challenger';
    sessionStorage.setItem(key, variant);
  }
  return variant;
}

export default function decorate(block) {
  const id = block.dataset.blockName || block.closest('.section')?.id || 'editorial-hero';
  const variant = assignment(id);
  const rows = [...block.children];
  const selected = rows.find(
    (row) => row.firstElementChild?.textContent.trim().toLowerCase() === variant,
  )
    || rows[0];
  const content = selected?.children[1] || selected?.firstElementChild;
  const badge = document.createElement('p');
  badge.className = 'experiment-badge';
  badge.textContent = `Experiment variant: ${variant}`;
  badge.title = 'Stable for this browser session';
  block.replaceChildren(badge, ...(content ? [...content.childNodes] : []));
  block.dataset.variant = variant;
  document.dispatchEvent(new CustomEvent('aem:experiment', {
    detail: { action: 'view', id, variant },
  }));
  block.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('aem:experiment', {
      detail: {
        action: 'conversion', id, variant, href: link.pathname,
      },
    }));
  }));
}
