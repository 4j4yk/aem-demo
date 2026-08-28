export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [value, label] = row.children;
    row.className = 'stats-item';
    if (value) value.className = 'stats-value';
    if (label) label.className = 'stats-label';
  });
}
