export default function decorate(block) {
  const tabList = document.createElement('div');
  tabList.className = 'tabs-list';
  tabList.setAttribute('role', 'tablist');
  const panels = document.createElement('div');
  panels.className = 'tabs-panels';

  [...block.children].forEach((row, index) => {
    const [label, content] = row.children;
    const id = `tab-${index + 1}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = `${id}-button`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', id);
    button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    button.textContent = label?.textContent.trim() || `Tab ${index + 1}`;

    const panel = document.createElement('div');
    panel.id = id;
    panel.className = 'tabs-panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', button.id);
    panel.hidden = index !== 0;
    while (content?.firstChild) panel.append(content.firstChild);

    button.addEventListener('click', () => {
      tabList.querySelectorAll('[role="tab"]').forEach((tab) => tab.setAttribute('aria-selected', 'false'));
      panels.querySelectorAll('[role="tabpanel"]').forEach((item) => { item.hidden = true; });
      button.setAttribute('aria-selected', 'true');
      panel.hidden = false;
    });
    tabList.append(button);
    panels.append(panel);
  });
  block.replaceChildren(tabList, panels);
}
