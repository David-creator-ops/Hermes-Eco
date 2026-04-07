import { Router } from 'express';
import * as catService from '../services/categoryService';

const router = Router();

await router.get('/', (req, res) => {
  try {
    res.json({ data: catService.getAllCategories() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

await router.get('/:slug', (req, res) => {
  try {
    const cat = catService.getCategoryBySlug(req.params.slug);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    const agents = catService.getAgentsByCategory(req.params.slug);
    res.json({ data: { ...cat, agents: agents.agents }, total: agents.total });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
