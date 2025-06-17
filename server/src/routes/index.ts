import { Router } from 'express';

const router = Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     description: Health check
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/health', (_req, res) => {
  res.json({ status: 'OK' });
});

export default router;
