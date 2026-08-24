// Tells the front-end whether an admin account already exists.
// Used to decide whether to show "create the first admin account"
// or the normal "sign in" screen.
const { getStore } = require('@netlify/blobs');

exports.handler = async () => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  try {
    const secrets = getStore('outreach-crm-secrets');
    const raw = await secrets.get('oo-users');
    const users = raw ? JSON.parse(raw) : [];
    const hasAdmin = users.some(u => u.role === 'admin');
    return { statusCode: 200, headers, body: JSON.stringify({ hasAdmin }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'server error' }) };
  }
};
