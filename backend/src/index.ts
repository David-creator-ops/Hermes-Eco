     1|import express from 'express';
     2|import cors from 'cors';
     3|import rateLimit from 'express-rate-limit';
     4|
     5|import db from './db/pool';
     6|import './db/migrate';
     7|import agentRoutes from './routes/agentRoutes';
     8|import categoryRoutes from './routes/categoryRoutes';
     9|import statsRoutes from './routes/statsRoutes';
    10|import crawlerRoutes from './routes/crawlerRoutes';
    11|import submissionRoutes from './routes/submissionRoutes';
    12|import adminRoutes from './routes/adminRoutes';
    13|import { seedDefaultUsers } from './services/adminService';
    14|
    15|const app = express();
    16|
    17|const PORT = parseInt(process.env.PORT || '3001', 10);
    18|const NODE_ENV = process.env.NODE_ENV || 'development';
    19|
    20|app.use(cors());
    21|app.use(express.json());
    22|
    23|// Trust Railway proxy to fix rate limiter X-Forwarded-For errors
    24|app.set('trust proxy', 1);
    25|
    26|const publicLimiter = rateLimit({
    27|  windowMs: 15 * 60 * 1000,
    28|  max: 100,
    29|  standardHeaders: true,
    30|  legacyHeaders: false,
    31|  skipFailedRequests: true,
    32|  validator: false,
    33|  message: { error: 'Too many requests, please try again later.' },
    34|});
    35|
    36|const submissionLimiter = rateLimit({
    37|  windowMs: 15 * 60 * 1000,
    38|  max: 20,
    39|  standardHeaders: true,
    40|  legacyHeaders: false,
    41|  skipFailedRequests: true,
    42|  validator: false,
    43|  message: { error: 'Too many submissions, please try again later.' },
    44|});
    45|
    46|const adminLimiter = rateLimit({
    47|  windowMs: 15 * 60 * 1000,
    48|  max: 30,
    49|  standardHeaders: true,
    50|  legacyHeaders: false,
    51|  skipFailedRequests: true,
    52|  validator: false,
    53|  message: { error: 'Too many admin requests, please try again later.' },
    54|});
    55|
    56|app.use('/api/health', (_req, res) => {
    57|  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: NODE_ENV });
    58|});
    59|
    60|app.use('/api/agents', publicLimiter, agentRoutes);
    61|app.use('/api/categories', publicLimiter, categoryRoutes);
    62|app.use('/api/stats', publicLimiter, statsRoutes);
    63|app.use('/api/crawler', crawlerRoutes);
    64|
    65|seedDefaultUsers().catch(() => {});
    66|
    67|app.use('/api/submit', submissionLimiter, submissionRoutes);
    68|app.use('/api/console', adminLimiter, adminRoutes);
    69|
    70|app.use((req, res) => {
    71|  res.status(404).json({ error: 'Not found' });
    72|});
    73|
    74|app.listen(PORT, () => {
    75|  console.log(`Hermes Registry API running on http://localhost:${PORT} (${NODE_ENV})`);
    76|});
    77|
    78|export default app;
    79|