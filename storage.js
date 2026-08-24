// Compatibility shim so the app's existing window.storage.get/set calls
// (originally designed for the Claude.ai artifact storage API) work
// unmodified against a real backend on Netlify.
//
// shared = false -> stored locally in this browser only (used for "who am I logged in as")
// shared = true  -> stored in Netlify Blobs via a serverless function (shared by everyone)
(function () {
  const API = '/.netlify/functions/data';

  async function get(key, shared) {
    if (!shared) {
      try {
        const v = localStorage.getItem(key);
        return v !== null ? { key, value: v, shared } : null;
      } catch (e) {
        return null;
      }
    }
    try {
      const res = await fetch(`${API}?key=${encodeURIComponent(key)}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || data.value === undefined || data.value === null) return null;
      return { key, value: data.value, shared };
    } catch (e) {
      throw e;
    }
  }

  async function set(key, value, shared) {
    if (!shared) {
      try {
        localStorage.setItem(key, value);
        return { key, value, shared };
      } catch (e) {
        return null;
      }
    }
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) return null;
      return { key, value, shared };
    } catch (e) {
      throw e;
    }
  }

  window.storage = { get, set };
})();
