import { Router } from 'express';
import * as agentService from '../services/agentService';

const router = Router();

await router.get('/', (req, res) => {
  try {
    const result = agentService.listAgents({
      page: parseInt(req.query.page as string || '1'),
      limit: parseInt(req.query.limit as string || '20'),
      sort: req.query.sort as string,
      resource_type: req.query.resource_type as string,
      type: req.query.type as string,
      verification_status: req.query.verification_status as string,
      tier2_categories: req.query.tier2_categories as string,
      category_slug: req.query.category_slug as string,
      complexity_level: req.query.complexity_level as string,
      deployment_type: req.query.deployment_type as string,
      maintenance_status: req.query.maintenance_status as string,
      required_skills: req.query.required_skills as string,
      tools_used: req.query.tools_used as string,
      tags: req.query.tags as string,
      search: req.query.search as string,
    });
    res.json({ data: result.agents, total: result.total, page: result.page, limit: result.limit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

await router.get('/resource-type/:type', (req, res) => {
  try {
    const agents = agentService.getAgentsByResourceType(req.params.type);
    res.json({ data: agents });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

await router.get('/featured', (req, res) => {
  try {
    const agents = agentService.getFeaturedAgents(4);
    res.json({ data: agents });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

await router.get('/recent', (req, res) => {
  try {
    const agents = agentService.getRecentAgents(10);
    res.json({ data: agents });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

await router.get('/id/:id', (req, res) => {
  try {
    const agent = agentService.getAgentById(parseInt(req.params.id));
    if (!agent) return res.status(404).json({ error: 'Resource not found' });
    res.json({ data: agent });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

await router.get('/slug/:slug', (req, res) => {
  try {
    const agent = agentService.getAgentBySlug(req.params.slug);
    if (!agent) return res.status(404).json({ error: 'Resource not found' });
    res.json({ data: agent });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
