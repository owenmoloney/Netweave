import { Router } from 'express';
import bcrypt from 'bcrypt';
import { LoginSchema, RegisterSchema } from '@netweave/shared';
import { prisma } from '../prisma.js';
import { validateBody } from '../middleware/validate.js';
import { signToken } from '../middleware/auth.js';
import {
  createDemoNodesForUser,
  createSelfNodeForUser,
} from '../services/graphService.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(RegisterSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({
        error: { code: 'CONFLICT', message: 'Email already registered' },
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash },
    });

    const selfNode = await createSelfNodeForUser(user.id, email);
    await createDemoNodesForUser(user.id, selfNode.id);

    const token = signToken({ userId: user.id, email: user.email });

    res.status(201).json({ token, userId: user.id });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to register user' },
    });
  }
});

authRouter.post('/login', validateBody(LoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
      });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
      });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.json({ token, userId: user.id });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to login' },
    });
  }
});
