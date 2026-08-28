export default function decorate(block) {
  [...block.children].forEach((row, index) => {
    const [label, content] = row.children;
    const details = document.createElement('details');
    if (index === 0) details.open = true;
    const summary = document.createElement('summary');
    while (label?.firstChild) summary.append(label.firstChild);
    const body = document.createElement('div');
    body.className = 'accordion-body';
    while (content?.firstChild) body.append(content.firstChild);
    details.append(summary, body);
    row.replaceWith(details);
  });
}
