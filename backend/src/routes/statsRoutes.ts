import { Router } from 'express';
import * as statsService from '../services/statsService';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const stats = await statsService.getEcosystemStats();
    res.json({ data: stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
export default router;
