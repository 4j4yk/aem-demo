import { createOptimizedPicture } from '../../scripts/aem.js';

const PAGE_SIZE = 6;
const REQUIRED = ['path', 'title', 'description', 'category', 'author', 'published'];
const normalize = (value = '') => value.trim().toLocaleLowerCase();

function emit(action, detail = {}) {
  document.dispatchEvent(new CustomEvent('aem:newsroom', { detail: { action, ...detail } }));
}

function validStory(story) {
  return story && REQUIRED.every((field) => typeof story[field] === 'string' && story[field].trim());
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(
    document.documentElement.lang || 'en',
    { month: 'long', day: 'numeric', year: 'numeric' },
  ).format(date);
}

function storyCard(story) {
  const card = document.createElement('li');
  card.className = 'newsroom-card';
  card.dataset.category = story.category;
  card.dataset.published = story.published;
  card.dataset.search = normalize([
    story.title, story.description, story.category, story.author, story.region,
    ...(Array.isArray(story.tags) ? story.tags : []),
  ].join(' '));
  if (story.image) {
    const media = document.createElement('div');
    media.className = 'newsroom-card-image';
    media.append(createOptimizedPicture(story.image, story.imageAlt || '', false, [
      { media: '(min-width: 900px)', width: '750' }, { width: '500' },
    ]));
    card.append(media);
  }
  const content = document.createElement('div');
  content.className = 'newsroom-card-content';
  const category = document.createElement('p');
  const categoryLabel = document.createElement('strong');
  categoryLabel.textContent = story.category;
  category.append(categoryLabel);
  const heading = document.createElement('h3');
  const title = document.createElement('a');
  title.href = story.path;
  title.textContent = story.title;
  title.addEventListener('click', () => emit('story-open', { path: story.path }));
  heading.append(title);
  const description = document.createElement('p');
  description.textContent = story.description;
  const byline = document.createElement('p');
  byline.className = 'newsroom-card-byline';
  byline.textContent = [story.author, formatDate(story.published), story.region].filter(Boolean).join(' · ');
  const action = document.createElement('p');
  const link = title.cloneNode();
  link.textContent = 'Read the story';
  link.addEventListener('click', () => emit('story-open', { path: story.path }));
  action.append(link);
  content.append(category, heading, description, byline, action);
  card.append(content);
  return card;
}

function authoredCard(row) {
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
    image.closest('picture').replaceWith(createOptimizedPicture(image.src, image.alt, false, [
      { media: '(min-width: 900px)', width: '750' }, { width: '500' },
    ]));
  }
  card.dataset.category = contentCell?.querySelector('strong')?.textContent.trim() || 'Stories';
  card.dataset.published = '';
  card.dataset.search = normalize(card.textContent);
  return card;
}

function filterButton(label, value, active) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'newsroom-filter';
  button.textContent = label;
  button.dataset.value = value;
  button.setAttribute('aria-pressed', String(active));
  return button;
}

async function fetchStories() {
  const response = await fetch('/stories-index.json', { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Story index returned ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.data)) throw new Error('Story index has no data array');
  return payload.data.filter(validStory);
}

export default async function decorate(block) {
  const fallback = [...block.children].map(authoredCard);
  let stories = [];
  let indexed = false;
  if (!block.classList.contains('authored-only')) {
    try {
      stories = await fetchStories();
      indexed = stories.length > 0;
    } catch (error) {
      block.dataset.indexError = error.message;
      emit('index-error', { message: error.message });
    }
  }
  const allCards = indexed ? stories.map(storyCard) : fallback;
  const cards = document.createElement('ul');
  cards.className = 'newsroom-grid';
  allCards.forEach((card) => cards.append(card));
  const categories = [...new Set(allCards.map((card) => card.dataset.category))].sort();
  const params = new URLSearchParams(window.location.search);
  let activeCategory = categories.includes(params.get('category')) ? params.get('category') : 'all';
  let visibleLimit = PAGE_SIZE;
  let sortOrder = params.get('sort') === 'oldest' ? 'oldest' : 'newest';

  const toolbar = document.createElement('div');
  toolbar.className = 'newsroom-toolbar';
  const primary = document.createElement('div');
  primary.className = 'newsroom-primary-controls';
  const searchLabel = document.createElement('label');
  searchLabel.className = 'newsroom-search';
  searchLabel.innerHTML = '<span>Search stories</span>';
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search by topic, title, or author';
  search.autocomplete = 'off';
  search.value = params.get('q') || '';
  searchLabel.append(search);
  const sortLabel = document.createElement('label');
  sortLabel.className = 'newsroom-sort';
  sortLabel.innerHTML = '<span>Sort stories</span>';
  const sort = document.createElement('select');
  sort.innerHTML = '<option value="newest">Newest first</option><option value="oldest">Oldest first</option>';
  sort.value = sortOrder;
  sortLabel.append(sort);
  primary.append(searchLabel, sortLabel);

  const filters = document.createElement('div');
  filters.className = 'newsroom-filters';
  filters.setAttribute('aria-label', 'Filter stories by category');
  filters.append(filterButton('All stories', 'all', activeCategory === 'all'));
  categories.forEach((category) => {
    filters.append(filterButton(category, category, activeCategory === category));
  });
  const status = document.createElement('p');
  status.className = 'newsroom-results';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const fallbackNote = document.createElement('p');
  fallbackNote.className = 'newsroom-fallback';
  fallbackNote.textContent = 'Showing authored fallback content while the story index is unavailable.';
  fallbackNote.hidden = indexed || block.classList.contains('authored-only');
  toolbar.append(primary, filters, status, fallbackNote);

  const loadMore = document.createElement('button');
  loadMore.type = 'button';
  loadMore.className = 'button secondary newsroom-more';
  loadMore.textContent = 'Load more stories';
  const empty = document.createElement('div');
  empty.className = 'newsroom-empty';
  empty.hidden = true;
  empty.innerHTML = '<strong>No matching stories</strong><p>Try another term or select a different category.</p>';

  const syncUrl = () => {
    const next = new URL(window.location.href);
    const query = normalize(search.value);
    if (query) next.searchParams.set('q', query); else next.searchParams.delete('q');
    if (activeCategory !== 'all') next.searchParams.set('category', activeCategory); else next.searchParams.delete('category');
    if (sortOrder !== 'newest') next.searchParams.set('sort', sortOrder); else next.searchParams.delete('sort');
    window.history.replaceState({}, '', next);
  };
  const update = () => {
    const query = normalize(search.value);
    const matches = allCards.filter((card) => (
      (activeCategory === 'all' || card.dataset.category === activeCategory)
      && (!query || card.dataset.search.includes(query))
    )).sort((a, b) => {
      const result = (a.dataset.published || '').localeCompare(b.dataset.published || '');
      return sortOrder === 'oldest' ? result : -result;
    });
    matches.forEach((card) => cards.append(card));
    allCards.forEach((card) => { card.hidden = true; });
    matches.slice(0, visibleLimit).forEach((card) => { card.hidden = false; });
    status.textContent = `${matches.length} ${matches.length === 1 ? 'story' : 'stories'} found`;
    empty.hidden = matches.length !== 0;
    loadMore.hidden = matches.length <= visibleLimit;
    syncUrl();
    return matches.length;
  };

  let searchTimer;
  search.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      visibleLimit = PAGE_SIZE;
      emit('search', { query: normalize(search.value), results: update() });
    }, 180);
  });
  sort.addEventListener('change', () => {
    sortOrder = sort.value;
    update();
    emit('sort', { order: sortOrder });
  });
  filters.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    activeCategory = button.dataset.value;
    visibleLimit = PAGE_SIZE;
    filters.querySelectorAll('button').forEach((control) => control.setAttribute('aria-pressed', String(control === button)));
    update();
    emit('filter', { category: activeCategory });
  });
  loadMore.addEventListener('click', () => {
    visibleLimit += PAGE_SIZE;
    update();
    emit('load-more', { visible: visibleLimit });
  });
  block.replaceChildren(toolbar, cards, loadMore, empty);
  update();
  emit('index-ready', { source: indexed ? 'index' : 'authored', stories: allCards.length });
}
