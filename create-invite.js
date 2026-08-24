const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[crypto.randomInt(chars.length)];
  return out;
}

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'method not allowed' }) };
  }
  try {
    const { vaId } = JSON.parse(event.body || '{}');
    if (!vaId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'vaId requis' }) };
    }
    const secrets = getStore('outreach-crm-secrets');
    const raw = await secrets.get('oo-invites');
    const invites = raw ? JSON.parse(raw) : [];

    // Invalidate any previous unused invite for this VA before issuing a new one.
    invites.forEach(i => { if (i.vaId === vaId && !i.used) i.used = true; });

    const code = genCode();
    invites.push({ code, vaId, used: false, createdAt: Date.now() });
    await secrets.set('oo-invites', JSON.stringify(invites));

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, code }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'server error' }) };
  }
};
