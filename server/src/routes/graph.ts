import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getGraphForUser } from '../services/graphService.js';

export const graphRouter = Router();

graphRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const graph = await getGraphForUser(userId);
    res.json(graph);
  } catch (err) {
    console.error('Graph fetch error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch graph' },
    });
  }
});
