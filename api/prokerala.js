export default async function handler(req, res) {
  // Set CORS headers first - before any other logic
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST for main logic
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const { path, method, payload } = req.body;

    if (!path || !method) {
      return res.status(400).json({
        error:
          'Missing "path" or "method" in request body. Example: { path: "/v2/astrology/natal", method:"POST", payload:{...} }',
      });
    }

    const clientId = process.env.PROKERALA_CLIENT_ID;
    const clientSecret = process.env.PROKERALA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Prokerala API credentials not set' });
    }

  // Skip token step - use direct API key authentication
const apiResponse = await fetch(`https://api.prokerala.com${path}`, {
  method,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${clientId}`, // Try using client_id directly
  },
  body: JSON.stringify(payload),
});

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

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
