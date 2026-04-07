import type { Request, Response } from 'express';
import * as agentService from '../services/agentService';

export async function upsertAgent(req: Request, res: Response) {
  try {
    const data = req.body;
    if (!data.repository_url) {
      return res.status(400).json({ error: 'repository_url is required' });
    }
    const result = await agentService.upsertAgent(data);
    res.json({ data: { id: result?.id }, message: 'Agent upserted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
