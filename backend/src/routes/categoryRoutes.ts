import { Router } from 'express';
import * as catService from '../services/categoryService';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const data = await catService.getAllCategories();
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const cat = await catService.getCategoryBySlug(req.params.slug);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    const agents = await catService.getAgentsByCategory(req.params.slug);
    res.json({ data: { ...cat, agents: agents.agents }, total: agents.total });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
