import fetch from 'node-fetch';

export default async function handler(req, res) {
  // -----------------------------
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    // Extract body
    const { path, method, payload } = req.body;

    if (!path || !method) {
      return res.status(400).json({
        error:
          'Missing "path" or "method" in request body. Example: { path: "/v2/astrology/natal", method:"POST", payload:{...} }',
      });
    }

    // Get Prokerala credentials from environment variables
    const clientId = process.env.PROKERALA_CLIENT_ID;
    const clientSecret = process.env.PROKERALA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Prokerala API credentials not set' });
    }

    // Step 1: Get Bearer token
    const tokenResponse = await fetch('https://api.prokerala.com/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    });
    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;

    if (!token) {
      return res.status(500).json({ error: 'Failed to get Prokerala token', details: tokenData });
    }

    // Step 2: Call Prokerala API
    const apiResponse = await fetch(`https://api.prokerala.com${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await apiResponse.json();

    // Return the data
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
