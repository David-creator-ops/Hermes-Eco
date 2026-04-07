import express from 'express';
import cors from 'cors';

import db from './db/pool';
import './db/migrate';
import agentRoutes from './routes/agentRoutes';
import categoryRoutes from './routes/categoryRoutes';
import statsRoutes from './routes/statsRoutes';
import crawlerRoutes from './routes/crawlerRoutes';
import submissionRoutes from './routes/submissionRoutes';
import adminRoutes from './routes/adminRoutes';
import { seedDefaultUsers } from './services/adminService';

// Auto-seed on startup (one-time)
import('./db/seed').catch(() => {});

const app = express();

const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(cors());
app.use(express.json());

app.use('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: NODE_ENV });
});

app.use('/api/agents', agentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/crawler', crawlerRoutes);

seedDefaultUsers(). catch(() => {});

app.use('/api/submit', submissionRoutes);
app.use('/api/console', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Hermes Registry API running on http://localhost:${PORT} (${NODE_ENV})`);
});

export default app;
