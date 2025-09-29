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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

// Step 1: Get OAuth2 token
const tokenResponse = await fetch('https://api.prokerala.com/token', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
});

if (!tokenResponse.ok) {
  const errorText = await tokenResponse.text();
  return res.status(500).json({ 
    error: 'Failed to get OAuth token', 
    details: errorText,
    status: tokenResponse.status 
  });
}

const tokenData = await tokenResponse.json();
const token = tokenData.access_token;

if (!token) {
  return res.status(500).json({ 
    error: 'No access token received', 
    details: tokenData 
  });
}

    // Step 2: Call Prokerala API
  try {
  const { path, method, payload } = req.body;
  
  if (!path || !method || !payload) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const clientId = process.env.PROKERALA_CLIENT_ID;
  const clientSecret = process.env.PROKERALA_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'API credentials not configured' });
  }

  // Step 1: Get OAuth2 token
  const tokenResponse = await fetch('https://api.prokerala.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
  });

  const tokenData = await tokenResponse.json();
  const token = tokenData.access_token;

  if (!token) {
    return res.status(500).json({ error: 'Failed to get token', details: tokenData });
  }

  // Step 2: Build query parameters from payload
  const queryParams = new URLSearchParams();
  
  // Add profile data
  if (payload.datetime) queryParams.append('datetime', payload.datetime);
  if (payload.latitude) queryParams.append('latitude', payload.latitude);
  if (payload.longitude) queryParams.append('longitude', payload.longitude);
  
  // Add required parameters with defaults
  queryParams.append('house_system', 'placidus');
  queryParams.append('orb', 'default');
  queryParams.append('la', 'en');
  queryParams.append('ayanamsa', '0');

  // Step 3: Make GET request with query parameters
  const apiUrl = `https://api.prokerala.com${path}?${queryParams.toString()}`;
  
  const apiResponse = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  const data = await apiResponse.json();
  res.status(200).json(data);

} catch (err) {
  console.error(err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
}
