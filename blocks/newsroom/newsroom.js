import { createOptimizedPicture } from '../../scripts/aem.js';

function normalize(value = '') {
  return value.trim().toLocaleLowerCase();
}

function getCategory(card) {
  const label = card.querySelector('.newsroom-card-content strong');
  return label?.textContent.trim() || 'Stories';
}

function createControl(label, value, active = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'newsroom-filter';
  button.textContent = label;
  button.dataset.value = value;
  button.setAttribute('aria-pressed', String(active));
  return button;
}

export default function decorate(block) {
  const cards = document.createElement('ul');
  cards.className = 'newsroom-grid';

  [...block.children].forEach((row) => {
    const card = document.createElement('li');
    card.className = 'newsroom-card';
    while (row.firstElementChild) card.append(row.firstElementChild);

    const cells = [...card.children];
    const imageCell = cells.find((cell) => cell.querySelector('picture'));
    const contentCell = cells.find((cell) => cell !== imageCell) || cells[0];
    if (imageCell) imageCell.className = 'newsroom-card-image';
    if (contentCell) contentCell.className = 'newsroom-card-content';

    const image = imageCell?.querySelector('img');
    if (image && !image.src.startsWith('about:')) {
      image.closest('picture').replaceWith(createOptimizedPicture(
        image.src,
        image.alt,
        false,
        [{ media: '(min-width: 900px)', width: '750' }, { width: '500' }],
      ));
    } else if (imageCell) {
      imageCell.remove();
      card.classList.add('newsroom-card-no-image');
    }

    const heading = contentCell?.querySelector('h2, h3, h4');
    const link = heading?.querySelector('a') || contentCell?.querySelector('a');
    if (link && heading && !heading.querySelector('a')) {
      const titleLink = link.cloneNode();
      titleLink.textContent = heading.textContent;
      heading.replaceChildren(titleLink);
    }

    card.dataset.category = getCategory(card);
    card.dataset.search = normalize(card.textContent);
    cards.append(card);
  });

  const categories = [...new Set([...cards.children].map((card) => card.dataset.category))]
    .sort((a, b) => a.localeCompare(b));
  const toolbar = document.createElement('div');
  toolbar.className = 'newsroom-toolbar';

  const searchLabel = document.createElement('label');
  searchLabel.className = 'newsroom-search';
  const searchText = document.createElement('span');
  searchText.textContent = 'Search stories';
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search by topic, title, or author';
  search.autocomplete = 'off';
  searchLabel.append(searchText, search);

  const filters = document.createElement('div');
  filters.className = 'newsroom-filters';
  filters.setAttribute('aria-label', 'Filter stories by category');
  filters.append(createControl('All stories', 'all', true));
  categories.forEach((category) => filters.append(createControl(category, category)));

  const status = document.createElement('p');
  status.className = 'newsroom-results';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  const empty = document.createElement('div');
  empty.className = 'newsroom-empty';
  empty.hidden = true;
  empty.innerHTML = '<strong>No matching stories</strong><p>Try another term or select a different category.</p>';

  let activeCategory = 'all';
  const update = () => {
    const query = normalize(search.value);
    let visible = 0;
    [...cards.children].forEach((card) => {
      const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
      const matchesSearch = !query || card.dataset.search.includes(query);
      card.hidden = !(matchesCategory && matchesSearch);
      if (!card.hidden) visible += 1;
    });
    status.textContent = `${visible} ${visible === 1 ? 'story' : 'stories'} shown`;
    empty.hidden = visible !== 0;
  };

  search.addEventListener('input', update);
  filters.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    activeCategory = button.dataset.value;
    filters.querySelectorAll('button').forEach((control) => {
      control.setAttribute('aria-pressed', String(control === button));
    });
    update();
  });

  toolbar.append(searchLabel, filters, status);
  block.replaceChildren(toolbar, cards, empty);
  update();
}
