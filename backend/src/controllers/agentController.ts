import type { Request, Response } from 'express';
import * as agentService from '../services/agentService';

export async function listAgents(req: Request, res: Response) {
  try {
    const { page, limit, sort, type, verification_status, tools_used, tags, license, search } = req.query;
    const result = await agentService.listAgents({
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      sort: sort as string,
      type: type as string,
      verification_status: verification_status as string,
      tools_used: tools_used as string,
      tags: tags as string,
      license: license as string,
      search: search as string,
    });
    res.json({ data: result.agents, total: result.total, page: result.page, limit: result.limit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAgentById(req: Request, res: Response) {
  try {
    const agent = await agentService.getAgentById(parseInt(req.params.id, 10));
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json({ data: agent });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAgentBySlug(req: Request, res: Response) {
  try {
    const agent = await agentService.getAgentBySlug(req.params.slug);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json({ data: agent });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function searchAgents(req: Request, res: Response) {
  try {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ error: 'Missing search query' });
    const { page, limit } = req.query;
    const result = await agentService.listAgents({
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      search: q,
    });
    res.json({ data: result.agents, total: result.total, page: result.page, limit: result.limit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getFeatured(req: Request, res: Response) {
  try {
    const agents = await agentService.getFeaturedAgents(4);
    res.json({ data: agents });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getRecent(req: Request, res: Response) {
  try {
    const agents = await agentService.getRecentAgents(8);
    res.json({ data: agents });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
