import { Router } from 'express';
import { getApiKey } from '../utils/apiKey';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'bytepad-mcp',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/ready', (req, res) => {
  // Check if API key is configured
  const hasApiKey = !!getApiKey();

  if (hasApiKey) {
    res.json({
      success: true,
      status: 'ready',
      apiKeyConfigured: true,
    });
  } else {
    res.status(503).json({
      success: false,
      status: 'not_ready',
      apiKeyConfigured: false,
      message: 'API key not configured',
    });
  }
});

export default router;
