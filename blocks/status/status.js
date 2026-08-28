export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [feature, state, evidence] = row.children;
    row.className = 'status-row';
    if (feature) feature.className = 'status-feature';
    if (state) {
      state.className = 'status-state';
      const value = state.textContent.trim().toLowerCase();
      state.dataset.state = value;
    }
    if (evidence) evidence.className = 'status-evidence';
  });
}
