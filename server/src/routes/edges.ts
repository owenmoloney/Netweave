import { Router } from 'express';
import { EdgeCreateSchema, EdgeUpdateSchema } from '@netweave/shared';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  createEdge,
  deleteEdge,
  EdgeServiceError,
  getEdgeById,
  getEdgesForUser,
  updateEdge,
} from '../services/edgeService.js';
import { routeParam } from '../utils/params.js';

export const edgesRouter = Router();

edgesRouter.use(authMiddleware);

edgesRouter.get('/', async (req, res) => {
  try {
    const edges = await getEdgesForUser(req.user!.userId);
    res.json(edges);
  } catch (err) {
    console.error('Get edges error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch edges' },
    });
  }
});

edgesRouter.post('/', validateBody(EdgeCreateSchema), async (req, res) => {
  try {
    const edge = await createEdge(req.user!.userId, req.body);
    res.status(201).json(edge);
  } catch (err) {
    if (err instanceof EdgeServiceError) {
      const status =
        err.code === 'NOT_FOUND' ? 404 : err.code === 'CONFLICT' ? 409 : 400;
      res.status(status).json({ error: { code: err.code, message: err.message } });
      return;
    }
    console.error('Create edge error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to create edge' },
    });
  }
});

edgesRouter.get('/:id', async (req, res) => {
  try {
    const edge = await getEdgeById(req.user!.userId, routeParam(req.params.id));
    if (!edge) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Edge not found' } });
      return;
    }
    res.json(edge);
  } catch (err) {
    console.error('Get edge error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch edge' },
    });
  }
});

edgesRouter.patch('/:id', validateBody(EdgeUpdateSchema), async (req, res) => {
  try {
    const edge = await updateEdge(req.user!.userId, routeParam(req.params.id), req.body);
    if (!edge) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Edge not found' } });
      return;
    }
    res.json(edge);
  } catch (err) {
    console.error('Update edge error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to update edge' },
    });
  }
});

edgesRouter.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteEdge(req.user!.userId, routeParam(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Edge not found' } });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error('Delete edge error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to delete edge' },
    });
  }
});
