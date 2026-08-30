export default function decorate(block) {
  const list = document.createElement('dl');
  list.className = 'article-meta-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const term = document.createElement('dt');
    term.textContent = cells[0].textContent.trim();
    const description = document.createElement('dd');
    while (cells[1].firstChild) description.append(cells[1].firstChild);
    list.append(term, description);
  });

  const article = block.closest('main');
  const words = article?.textContent.trim().split(/\s+/).length || 0;
  if (words > 0 && ![...list.children].some((item) => item.textContent.includes('min read'))) {
    const term = document.createElement('dt');
    term.textContent = 'Reading time';
    const description = document.createElement('dd');
    description.textContent = `${Math.max(1, Math.ceil(words / 225))} min read`;
    list.append(term, description);
  }

  block.replaceChildren(list);
}
