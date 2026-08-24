const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
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
    if (!email || !password || password.length < 6) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'email et mot de passe (6+ caractères) requis' }) };
    }
    const secrets = getStore('outreach-crm-secrets');
    const raw = await secrets.get('oo-users');
    const users = raw ? JSON.parse(raw) : [];

    if (users.some(u => u.role === 'admin')) {
      return { statusCode: 409, headers, body: JSON.stringify({ error: 'un compte admin existe déjà' }) };
    }
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { statusCode: 409, headers, body: JSON.stringify({ error: 'cet email est déjà utilisé' }) };
    }

    const user = { id: crypto.randomBytes(6).toString('hex'), email, passwordHash: hashPassword(password), role: 'admin', createdAt: Date.now() };
    users.push(user);
    await secrets.set('oo-users', JSON.stringify(users));

    const secret = await getSecret(secrets);
    const token = signToken({ uid: user.id, role: 'admin' }, secret);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, token, role: 'admin' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'server error' }) };
  }
};
