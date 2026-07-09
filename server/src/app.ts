import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { graphRouter } from './routes/graph.js';
import { nodesRouter } from './routes/nodes.js';
import { edgesRouter } from './routes/edges.js';
import { sanitizeBody } from './middleware/sanitize.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
const clientDistPath =
  process.env.CLIENT_DIST_PATH ??
  path.resolve(__dirname, '../../client/dist');

export const app = express();

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(sanitizeBody);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/graph', graphRouter);
app.use('/api/v1/nodes', nodesRouter);
app.use('/api/v1/edges', edgesRouter);

app.use('/api/v1/*', (_req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'API route not found' },
  });
});

if (isProduction) {
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next();
      return;
    }
    res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
}
