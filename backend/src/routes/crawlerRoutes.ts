import { Router } from 'express';
import * as agentService from '../services/agentService';

const router = Router();
router.post('/upsert', async (req, res) => {
  try {
    const data = req.body;
    if (!data.repository_url) return res.status(400).json({ error: 'repository_url required' });
    const result = await agentService.upsertAgent(data);
    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
export default router;
