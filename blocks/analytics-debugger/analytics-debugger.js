export default function decorate(block) {
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = 'Analytics event debugger';
  const consent = document.createElement('p');
  consent.className = 'analytics-debugger-consent';
  consent.textContent = 'Consent: declined — events remain local to this page.';
  const list = document.createElement('ol');
  list.className = 'analytics-debugger-events';
  const empty = document.createElement('li');
  empty.textContent = 'Waiting for an interaction…';
  list.append(empty);
  details.append(summary, consent, list);
  block.replaceChildren(details);

  const addEvent = ({ detail }) => {
    if (list.firstElementChild === empty) empty.remove();
    const item = document.createElement('li');
    const name = document.createElement('strong');
    name.textContent = detail.event;
    const data = document.createElement('code');
    data.textContent = JSON.stringify(detail.data);
    item.append(name, data);
    list.prepend(item);
    while (list.children.length > 12) list.lastElementChild.remove();
  };
  document.addEventListener('aem:analytics-event', addEvent);
  document.addEventListener('aem:analytics-consent', ({ detail }) => {
    consent.textContent = detail.consented
      ? 'Consent: accepted — events are mirrored to adobeDataLayer.'
      : 'Consent: declined — events remain local to this page.';
  });
}
