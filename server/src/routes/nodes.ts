import { Router } from 'express';
import {
  NodeCreateSchema,
  NodePositionSchema,
  NodeUpdateSchema,
} from '@netweave/shared';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  createNode,
  deleteNode,
  getNodeById,
  getNodesForUser,
  NodeServiceError,
  updateNode,
  updateNodePosition,
} from '../services/nodeService.js';
import { routeParam } from '../utils/params.js';

export const nodesRouter = Router();

nodesRouter.use(authMiddleware);

nodesRouter.get('/', async (req, res) => {
  try {
    const nodes = await getNodesForUser(req.user!.userId);
    res.json(nodes);
  } catch (err) {
    console.error('Get nodes error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch nodes' },
    });
  }
});

nodesRouter.post('/', validateBody(NodeCreateSchema), async (req, res) => {
  try {
    const node = await createNode(req.user!.userId, req.body);
    res.status(201).json(node);
  } catch (err) {
    if (err instanceof NodeServiceError) {
      const status = err.code === 'NOT_FOUND' ? 404 : 400;
      res.status(status).json({ error: { code: err.code, message: err.message } });
      return;
    }
    console.error('Create node error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to create node' },
    });
  }
});

nodesRouter.get('/:id', async (req, res) => {
  try {
    const node = await getNodeById(req.user!.userId, routeParam(req.params.id));
    if (!node) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Node not found' } });
      return;
    }
    res.json(node);
  } catch (err) {
    console.error('Get node error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch node' },
    });
  }
});

nodesRouter.patch('/:id', validateBody(NodeUpdateSchema), async (req, res) => {
  try {
    const node = await updateNode(req.user!.userId, routeParam(req.params.id), req.body);
    if (!node) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Node not found' } });
      return;
    }
    res.json(node);
  } catch (err) {
    if (err instanceof NodeServiceError) {
      const status = err.code === 'FORBIDDEN' ? 403 : 400;
      res.status(status).json({ error: { code: err.code, message: err.message } });
      return;
    }
    console.error('Update node error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to update node' },
    });
  }
});

nodesRouter.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteNode(req.user!.userId, routeParam(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Node not found' } });
      return;
    }
    res.status(204).send();
  } catch (err) {
    if (err instanceof NodeServiceError) {
      res.status(403).json({ error: { code: err.code, message: err.message } });
      return;
    }
    console.error('Delete node error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to delete node' },
    });
  }
});

nodesRouter.patch('/:id/position', validateBody(NodePositionSchema), async (req, res) => {
  try {
    const { x, y } = req.body;
    const updated = await updateNodePosition(req.user!.userId, routeParam(req.params.id), x, y);
    if (!updated) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Node not found' } });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error('Update position error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to update position' },
    });
  }
});
