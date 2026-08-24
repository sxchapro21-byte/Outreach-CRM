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
    const { code, email, password } = JSON.parse(event.body || '{}');
    if (!code || !email || !password || password.length < 6) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'code, email et mot de passe (6+ caractères) requis' }) };
    }
    const secrets = getStore('outreach-crm-secrets');

    const invitesRaw = await secrets.get('oo-invites');
    const invites = invitesRaw ? JSON.parse(invitesRaw) : [];
    const invite = invites.find(i => i.code.toUpperCase() === String(code).trim().toUpperCase() && !i.used);
    if (!invite) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'code d\'invitation invalide ou déjà utilisé' }) };
    }

    const usersRaw = await secrets.get('oo-users');
    const users = usersRaw ? JSON.parse(usersRaw) : [];
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { statusCode: 409, headers, body: JSON.stringify({ error: 'cet email est déjà utilisé' }) };
    }

    const user = { id: crypto.randomBytes(6).toString('hex'), email, passwordHash: hashPassword(password), role: 'va', vaId: invite.vaId, createdAt: Date.now() };
    users.push(user);
    invite.used = true;
    invite.usedAt = Date.now();

    await secrets.set('oo-users', JSON.stringify(users));
    await secrets.set('oo-invites', JSON.stringify(invites));

    const secret = await getSecret(secrets);
    const token = signToken({ uid: user.id, role: 'va', vaId: invite.vaId }, secret);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, token, role: 'va', vaId: invite.vaId }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'server error' }) };
  }
};
