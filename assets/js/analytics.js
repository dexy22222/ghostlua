// Lightweight client analytics funnel.
(() => {
  const SESSION_KEY = 'gl_analytics_sid';
  const SID = (() => {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, sid);
    return sid;
  })();

  function _safePath() {
    try {
      return `${location.pathname}${location.search || ''}`;
    } catch {
      return '/';
    }
  }

  function _post(event, props = {}) {
    const payload = {
      event,
      props,
      sessionId: SID,
      path: _safePath(),
      ts: Date.now(),
      referrer: document.referrer || '',
      userAgent: navigator.userAgent || '',
    };

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/event', blob);
        return;
      }
    } catch {}

    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }

  window.trackEvent = (event, props = {}) => {
    if (!event || typeof event !== 'string') return;
    _post(event, props);
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.trackEvent('page_view', { page: _safePath() });
  });
})();
