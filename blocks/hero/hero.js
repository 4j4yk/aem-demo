/**
 * Decorates the lead story while preserving author-provided markup.
 * @param {Element} block The hero block
 */
export default function decorate(block) {
  const heading = block.querySelector('h1');
  if (!heading) return;

  const eyebrow = document.createElement('p');
  eyebrow.className = 'hero-eyebrow';
  eyebrow.textContent = 'AEM DEVELOPER & SOLUTION ARCHITECT PORTFOLIO';
  heading.before(eyebrow);

  const content = [...block.children].filter((child) => !child.querySelector('picture'));
  const body = document.createElement('div');
  body.className = 'hero-body';
  body.append(...content);
  block.append(body);

  const picture = block.querySelector('picture');
  if (picture) picture.classList.add('hero-media');
}
