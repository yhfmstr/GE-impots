// GET /api/health - Health check endpoint
// Note: Does not expose service configuration details for security

export default function handler(req, res) {
  // CORS handled by vercel.json
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

