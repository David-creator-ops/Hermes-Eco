import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import db from './db/pool';
import './db/migrate';
import agentRoutes from './routes/agentRoutes';
import categoryRoutes from './routes/categoryRoutes';
import statsRoutes from './routes/statsRoutes';
import crawlerRoutes from './routes/crawlerRoutes';
import submissionRoutes from './routes/submissionRoutes';
import adminRoutes from './routes/adminRoutes';
import { seedDefaultUsers } from './services/adminService';

const app = express();

const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(cors());
app.use(express.json());

// Trust Railway proxy to fix rate limiter X-Forwarded-For errors
app.set('trust proxy', 1);

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions, please try again later.' },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many admin requests, please try again later.' },
});

app.use('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: NODE_ENV });
});

app.use('/api/agents', publicLimiter, agentRoutes);
app.use('/api/categories', publicLimiter, categoryRoutes);
app.use('/api/stats', publicLimiter, statsRoutes);
app.use('/api/crawler', crawlerRoutes);

seedDefaultUsers().catch(() => {});

app.use('/api/submit', submissionLimiter, submissionRoutes);
app.use('/api/console', adminLimiter, adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Hermes Registry API running on http://localhost:${PORT} (${NODE_ENV})`);
});

export default app;
