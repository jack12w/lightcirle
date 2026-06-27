// Visitor analytics tracking
(function() {
  var VISITOR_API = '/api/visitors';
  var sessionId = localStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('visitor_session_id', sessionId);
  }

  var pageUrl = window.location.pathname + window.location.search;
  var pageTitle = document.title;
  var referrer = document.referrer || '';
  var entryTime = Date.now();

  // Timezone hint
  var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  var countryHint = tz.split('/').length > 1 ? tz.split('/')[1] : '';

  function beaconPost(url, data) {
    var blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, blob);
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(data));
    }
  }

  // Track page view
  beaconPost(VISITOR_API + '/track', {
    sessionId: sessionId,
    pageUrl: pageUrl,
    pageTitle: pageTitle,
    referrer: referrer,
    userAgent: navigator.userAgent,
    ipAddress: '',
    country: countryHint
  });

  // Scroll tracking
  var maxScroll = 0;
  var scrollTimer = null;
  window.addEventListener('scroll', function() {
    var scrollPct = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
    if (scrollPct > maxScroll) {
      maxScroll = scrollPct;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function() {
        beaconPost(VISITOR_API + '/heartbeat', { sessionId: sessionId, pageUrl: pageUrl, scrollDepth: maxScroll });
      }, 2000);
    }
  });

  // Track WhatsApp & Email clicks
  document.addEventListener('click', function(e) {
    if (e.target.closest('[href*="wa.me"]') || e.target.closest('[href*="whatsapp"]')) {
      beaconPost(VISITOR_API + '/click', { sessionId: sessionId, pageUrl: pageUrl, type: 'whatsapp' });
    }
    if (e.target.closest('[href^="mailto:"]')) {
      beaconPost(VISITOR_API + '/click', { sessionId: sessionId, pageUrl: pageUrl, type: 'email' });
    }
  });

  // Page exit
  function sendExit() {
    var duration = Math.round((Date.now() - entryTime) / 1000);
    beaconPost(VISITOR_API + '/exit', { sessionId: sessionId, pageUrl: pageUrl, duration: duration });
  }

  window.addEventListener('beforeunload', sendExit);
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') sendExit();
  });
})();
