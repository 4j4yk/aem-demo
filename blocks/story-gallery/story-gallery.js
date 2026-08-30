import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const list = document.createElement('ul');
  [...block.children].forEach((row) => {
    const item = document.createElement('li');
    const image = row.querySelector('img');
    if (!image || image.src.startsWith('about:')) return;

    const figure = document.createElement('figure');
    figure.append(createOptimizedPicture(
      image.src,
      image.alt,
      false,
      [{ media: '(min-width: 900px)', width: '1200' }, { width: '750' }],
    ));
    const captionText = [...row.children]
      .filter((cell) => !cell.contains(image))
      .map((cell) => cell.textContent.trim())
      .filter(Boolean)
      .join(' ');
    if (captionText) {
      const caption = document.createElement('figcaption');
      caption.textContent = captionText;
      figure.append(caption);
    }
    item.append(figure);
    list.append(item);
  });
  block.replaceChildren(list);
}
