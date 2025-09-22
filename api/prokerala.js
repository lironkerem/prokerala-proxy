// api/prokerala.js
// Vercel serverless function - Node 18+
// Purpose: get token from Prokerala and proxy requests server-side.
// Set env vars in Vercel: PROKERALA_CLIENT_ID and PROKERALA_CLIENT_SECRET

export default async function handler(req, res) {
  // CORS - allow your site. For quick testing we allow all origins.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : JSON.parse(req.body || '{}');
    const { path, method = 'POST', payload } = body;

    if (!path) return res.status(400).json({ error: 'Missing "path" in request body. Example: { path: "/v2/astrology/natal", method:"POST", payload:{...} }' });

    const CLIENT_ID = process.env.PROKERALA_CLIENT_ID;
    const CLIENT_SECRET = process.env.PROKERALA_CLIENT_SECRET;
    if (!CLIENT_ID || !CLIENT_SECRET) return res.status(500).json({ error: 'Server not configured. Set PROKERALA_CLIENT_ID and PROKERALA_CLIENT_SECRET in Vercel env vars.' });

    // Simple in-memory token cache stored on global (works across cold starts sometimes)
    if (!global._prokerala_token || !global._prokerala_token_expires || Date.now() >= global._prokerala_token_expires) {
      // Request token
      const tokenResp = await fetch('https://api.prokerala.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
        },
        body: 'grant_type=client_credentials'
      });

      if (!tokenResp.ok) {
        const txt = await tokenResp.text();
        return res.status(502).json({ error: 'Failed to fetch token from Prokerala', status: tokenResp.status, body: txt });
      }
      const tjson = await tokenResp.json();
      const token = tjson.access_token || tjson.token || tjson.accessToken;
      if (!token) return res.status(502).json({ error: 'Token response did not include access_token', body: tjson });

      const expires_in = Number(tjson.expires_in || 3600);
      global._prokerala_token = token;
      // expire 60 seconds before real expiry
      global._prokerala_token_expires = Date.now() + (expires_in - 60) * 1000;
    }

    // Forward request to Prokerala
    const url = 'https://api.prokerala.com' + path;
    const headers = {
      'Authorization': 'Bearer ' + global._prokerala_token,
      'Accept': 'application/json'
    };
    if (method.toUpperCase() !== 'GET') headers['Content-Type'] = 'application/json';

    const prokResp = await fetch(url, {
      method,
      headers,
      body: method.toUpperCase() === 'GET' ? undefined : JSON.stringify(payload || {})
    });

    const text = await prokResp.text();
    // Try to parse JSON, otherwise return raw text
    try {
      const json = JSON.parse(text);
      return res.status(prokResp.status).json(json);
    } catch (e) {
      return res.status(prokResp.status).send(text);
    }

  } catch (err) {
    console.error('Proxy error', err);
    return res.status(500).json({ error: 'Proxy server error', detail: err.message });
  }
}
