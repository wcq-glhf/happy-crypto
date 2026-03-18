export default async function handler(req, res) {
  const UPSTREAM = process.env.UPSTREAM_URL || 'https://api.openai.com';
  const API_KEY = process.env.API_KEY || 'sk-proxy-demo-key-001';
  
  const response = await fetch(`${UPSTREAM}${req.url}`, {
    method: req.method,
    headers: {
      'Authorization': req.headers.authorization || `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
  });
  
  const data = await response.json();
  res.status(response.status).json(data);
}
