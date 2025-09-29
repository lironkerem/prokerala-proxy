export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path, payload } = req.body;
    
    if (!path || !payload) {
      return res.status(400).json({ error: 'Missing path or payload' });
    }

    const clientId = process.env.PROKERALA_CLIENT_ID;
    const clientSecret = process.env.PROKERALA_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'API credentials not configured' });
    }

    // Get OAuth2 token
    const tokenResponse = await fetch('https://api.prokerala.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'Failed to get token', details: tokenData });
    }

    // Build query parameters from payload
    const queryParams = new URLSearchParams();
    if (payload.datetime) queryParams.append('datetime', payload.datetime);
    if (payload.coordinates) queryParams.append('coordinates', payload.coordinates);
    if (payload.ayanamsa !== undefined) queryParams.append('ayanamsa', payload.ayanamsa);

    // Make GET request with query parameters
    const apiUrl = `https://api.prokerala.com/${path}?${queryParams.toString()}`;
    
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });

    const data = await apiResponse.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
