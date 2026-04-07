import { Router } from 'express';
import * as statsService from '../services/statsService';

const router = Router();
await router.get('/', (req, res) => {
  try {
    res.json({ data: statsService.getEcosystemStats() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
export default router;
