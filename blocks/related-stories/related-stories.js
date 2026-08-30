import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  try {
    const response = await fetch('/stories-index.json');
    if (!response.ok) throw new Error(`Story index returned ${response.status}`);
    const { data } = await response.json();
    const categoryTerm = [...document.querySelectorAll('.article-meta dt')]
      .find((term) => term.textContent.trim() === 'Category');
    const category = categoryTerm?.nextElementSibling?.textContent.trim();
    const stories = data.filter((story) => (
      story.path !== window.location.pathname && (!category || story.category === category)
    )).slice(0, 3);
    const list = document.createElement('ul');
    stories.forEach((story) => {
      const item = document.createElement('li');
      if (story.image) item.append(createOptimizedPicture(story.image, story.imageAlt || '', false, [{ width: '500' }]));
      const heading = document.createElement('h3');
      const link = document.createElement('a');
      link.href = story.path;
      link.textContent = story.title;
      heading.append(link);
      const summary = document.createElement('p');
      summary.textContent = story.description;
      item.append(heading, summary);
      list.append(item);
    });
    block.replaceChildren(list);
  } catch (error) {
    block.dataset.error = error.message;
    block.hidden = true;
  }
}
