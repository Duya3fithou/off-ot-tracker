import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAdmin, requireAuth } from '../auth/middleware';

export const projectsRouter = Router();

/** GET /api/projects — list active projects (for the picker). Any signed-in user. */
projectsRouter.get('/', requireAuth, async (_req, res) => {
  const projects = await prisma.project.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });
  res.json({ projects });
});

// --- Admin management below ---

const upsertSchema = z.object({
  name: z.string().trim().min(1).max(120),
  active: z.boolean().optional(),
});

/** GET /api/projects/all — list every project incl. inactive (admin), with OT counts. */
projectsRouter.get('/all', requireAuth, requireAdmin, async (_req, res) => {
  const projects = await prisma.project.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { otRequests: true } } },
  });
  res.json({
    projects: projects.map(({ _count, ...p }) => ({
      ...p,
      otRequestCount: _count.otRequests,
    })),
  });
});

/** POST /api/projects — create a project (admin). */
projectsRouter.post('/', requireAuth, requireAdmin, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid project payload' });
  }
  const existing = await prisma.project.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) {
    return res.status(409).json({ error: 'A project with that name already exists' });
  }
  const project = await prisma.project.create({
    data: { name: parsed.data.name, active: parsed.data.active ?? true },
  });
  res.status(201).json({ project });
});

/** PATCH /api/projects/:id — rename or toggle active (admin). */
projectsRouter.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const parsed = upsertSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid project payload' });
  }
  // Guard against renaming onto an existing project name.
  if (parsed.data.name) {
    const clash = await prisma.project.findUnique({ where: { name: parsed.data.name } });
    if (clash && clash.id !== req.params.id) {
      return res.status(409).json({ error: 'A project with that name already exists' });
    }
  }
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json({ project });
  } catch {
    return res.status(404).json({ error: 'Project not found' });
  }
});

/**
 * DELETE /api/projects/:id — permanently delete a project (admin).
 * Also deletes every OT request that belongs to it (in a transaction).
 * Returns how many OT requests were removed.
 */
projectsRouter.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  const [deletedRequests] = await prisma.$transaction([
    prisma.otRequest.deleteMany({ where: { projectId: project.id } }),
    prisma.project.delete({ where: { id: project.id } }),
  ]);
  res.json({ deleted: true, deletedOtRequests: deletedRequests.count });
});
