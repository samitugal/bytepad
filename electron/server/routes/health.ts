import { Router } from 'express';
import { getApiKey } from '../utils/apiKey';

const router = Router();

router.get('/', (_req, res) => {
  // Kept minimal and unauthenticated: no service name, version, or uptime,
  // since this endpoint is reachable without an API key.
  res.json({
    success: true,
    status: 'ok',
  });
});

router.get('/ready', (_req, res) => {
  // Check if API key is configured, without echoing that state back in the body.
  const hasApiKey = !!getApiKey();

  if (hasApiKey) {
    res.json({
      success: true,
      status: 'ready',
    });
  } else {
    res.status(503).json({
      success: false,
      status: 'not_ready',
    });
  }
});

export default router;
