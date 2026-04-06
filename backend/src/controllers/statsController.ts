import type { Request, Response } from 'express';
import * as statsService from '../services/statsService';

export async function getStats(req: Request, res: Response) {
  try {
    const stats = await statsService.getEcosystemStats();
    res.json({ data: stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
