// Generic key-value storage endpoint backed by Netlify Blobs.
// GET  /.netlify/functions/data?key=oo-entries      -> { value: "...json string..." }
// POST /.netlify/functions/data  { key, value }      -> stores value under key
//
// This mirrors the get/set(key, value) shape the front-end already expects
// (see storage.js), so the rest of the app's code didn't need to change.

const { getStore } = require('@netlify/blobs');

const MAX_KEY_LENGTH = 200;
const MAX_VALUE_BYTES = 5 * 1024 * 1024; // 5MB safety cap

function store() {
  // A single named store holds every key for this app.
  return getStore('outreach-crm');
}

function isValidKey(key) {
  return typeof key === 'string' && key.length > 0 && key.length <= MAX_KEY_LENGTH && !/[\s/\\'"]/.test(key);
}

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  try {
    if (event.httpMethod === 'GET') {
      const key = (event.queryStringParameters || {}).key;
      if (!isValidKey(key)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid key' }) };
      }
      const value = await store().get(key);
      return { statusCode: 200, headers, body: JSON.stringify({ key, value }) };
    }

    if (event.httpMethod === 'POST') {
      let payload;
      try {
        payload = JSON.parse(event.body || '{}');
      } catch (e) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid json body' }) };
      }
      const { key, value } = payload;
      if (!isValidKey(key)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid key' }) };
      }
      if (typeof value !== 'string' || Buffer.byteLength(value, 'utf8') > MAX_VALUE_BYTES) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid or oversized value' }) };
      }
      await store().set(key, value);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'server error' }) };
  }
};
