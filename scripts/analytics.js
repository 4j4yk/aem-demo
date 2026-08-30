const eventBuffer = [];
let consented = false;
const seenDepths = new Set();

function record(name, data = {}) {
  const event = {
    event: name,
    data,
    timestamp: new Date().toISOString(),
    path: window.location.pathname,
  };
  eventBuffer.push(event);
  document.dispatchEvent(new CustomEvent('aem:analytics-event', { detail: event }));
  if (consented) {
    window.adobeDataLayer = window.adobeDataLayer || [];
    window.adobeDataLayer.push(event);
  }
}

function trackDepth() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return;
  const depth = Math.round((window.scrollY / max) * 100);
  [25, 50, 75, 100].forEach((milestone) => {
    if (depth >= milestone && !seenDepths.has(milestone)) {
      seenDepths.add(milestone);
      record('content-depth', { milestone });
    }
  });
}

window.addEventListener('consent.update', ({ detail }) => {
  consented = detail.consented === true;
  document.dispatchEvent(new CustomEvent('aem:analytics-consent', { detail: { consented } }));
});
document.addEventListener('aem:newsroom', ({ detail }) => record(`newsroom-${detail.action}`, detail));
document.addEventListener('aem:experiment', ({ detail }) => record(`experiment-${detail.action}`, detail));
document.addEventListener('click', (event) => {
  const related = event.target.closest('.related-stories a');
  if (related) record('related-story-click', { href: related.pathname });
});
window.addEventListener('scroll', trackDepth, { passive: true });
record('page-view', { title: document.title, referrer: document.referrer || null });

window.aemAnalytics = {
  getEvents: () => [...eventBuffer],
  record,
};
