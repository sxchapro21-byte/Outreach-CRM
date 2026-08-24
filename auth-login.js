const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
  } catch (e) {
    return false;
  }
}

async function getSecret(secrets) {
  let secret = await secrets.get('oo-token-secret');
  if (!secret) {
    secret = crypto.randomBytes(32).toString('hex');
    await secrets.set('oo-token-secret', secret);
  }
  return secret;
}

function signToken(payload, secret) {
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payloadStr).digest('base64url');
  return `${payloadStr}.${sig}`;
}

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'method not allowed' }) };
  }
  try {
    const { email, password } = JSON.parse(event.body || '{}');
    if (!email || !password) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'email et mot de passe requis' }) };
    }
    const secrets = getStore('outreach-crm-secrets');
    const usersRaw = await secrets.get('oo-users');
    const users = usersRaw ? JSON.parse(usersRaw) : [];
    const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return { statusCode: 200, headers, body: JSON.stringify({ valid: false }) };
    }

    const secret = await getSecret(secrets);
    const token = signToken({ uid: user.id, role: user.role, vaId: user.vaId || null }, secret);
    return { statusCode: 200, headers, body: JSON.stringify({ valid: true, token, role: user.role, vaId: user.vaId || null }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'server error' }) };
  }
};
