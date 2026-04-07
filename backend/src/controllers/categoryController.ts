import type { Request, Response } from 'express';
import * as categoryService from '../services/categoryService';
import * as agentService from '../services/agentService';

export async function listCategories(req: Request, res: Response) {
  try {
    const categories = await categoryService.getAllCategories();
    res.json({ data: categories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getCategoryBySlug(req: Request, res: Response) {
  try {
    const category = await categoryService.getCategoryBySlug(req.params.slug);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    const agents = await agentService.listAgents({ category_slug: req.params.slug as string });
    res.json({ data: { ...category, agents: agents.agents }, total: agents.total });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
