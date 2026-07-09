import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth } from '../auth/middleware';
import { computeDurationHours } from '../utils/duration';
import { notifyAdminsOfNewOtRequest } from '../services/notifications';

export const otRequestsRouter = Router();

const timeRe = /^\d{1,2}:\d{2}$/;
const dateRe = /^\d{4}-\d{2}-\d{2}$/;

const blockSchema = z
  .object({
    workDate: z.string().regex(dateRe, 'workDate must be YYYY-MM-DD'),
    startTime: z.string().regex(timeRe, 'startTime must be HH:MM'),
    endTime: z.string().regex(timeRe, 'endTime must be HH:MM'),
    projectId: z.string().min(1),
    taskLink: z.string().trim().min(1).max(2000),
    taskStatus: z.enum(['DONE', 'IN_PROGRESS']),
    hoursToComplete: z.number().int().positive().max(1000).optional(),
  })
  .refine(
    (b) => b.taskStatus !== 'IN_PROGRESS' || typeof b.hoursToComplete === 'number',
    { message: 'hoursToComplete is required when status is IN_PROGRESS', path: ['hoursToComplete'] },
  );

const createSchema = z.object({
  requests: z.array(blockSchema).min(1).max(50),
});

/**
 * POST /api/ot-requests
 * Body: { requests: Block[] } — submit one or many OT blocks in one call.
 * Duration is computed server-side and always PENDING on creation.
 */
otRequestsRouter.post('/', requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const userId = req.auth!.sub;

  // Validate the referenced projects exist and are active.
  const projectIds = [...new Set(parsed.data.requests.map((r) => r.projectId))];
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds }, active: true },
    select: { id: true },
  });
  const validIds = new Set(projects.map((p) => p.id));
  const badId = projectIds.find((id) => !validIds.has(id));
  if (badId) {
    return res.status(400).json({ error: 'One or more projects are invalid or inactive' });
  }

  const data = parsed.data.requests.map((b) => ({
    userId,
    projectId: b.projectId,
    workDate: b.workDate,
    startTime: b.startTime,
    endTime: b.endTime,
    durationHours: computeDurationHours(b.startTime, b.endTime),
    taskLink: b.taskLink,
    taskStatus: b.taskStatus,
    hoursToComplete: b.taskStatus === 'IN_PROGRESS' ? b.hoursToComplete ?? null : null,
  }));

  await prisma.otRequest.createMany({ data });
  res.status(201).json({ created: data.length });

  // Fire-and-forget: let admins know there's OT to review (never blocks the response).
  void notifyAdminsOfNewOtRequest({
    submitterId: userId,
    submitterName: req.auth!.name,
    submitterEmail: req.auth!.email,
    count: data.length,
  });
});

/**
 * PATCH /api/ot-requests/:id
 * Edit one of the caller's own OT requests. Only allowed while the request is
 * still PENDING. Duration is recomputed and the version is bumped.
 */
otRequestsRouter.patch('/:id', requireAuth, async (req, res) => {
  const parsed = blockSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const b = parsed.data;

  const existing = await prisma.otRequest.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.auth!.sub) {
    return res.status(404).json({ error: 'OT request not found' });
  }
  if (existing.approvalStatus !== 'PENDING') {
    return res
      .status(409)
      .json({ error: 'This request has already been reviewed and can no longer be edited' });
  }

  const project = await prisma.project.findFirst({
    where: { id: b.projectId, active: true },
    select: { id: true },
  });
  if (!project) {
    return res.status(400).json({ error: 'The selected project is invalid or inactive' });
  }

  const request = await prisma.otRequest.update({
    where: { id: existing.id },
    data: {
      projectId: b.projectId,
      workDate: b.workDate,
      startTime: b.startTime,
      endTime: b.endTime,
      durationHours: computeDurationHours(b.startTime, b.endTime),
      taskLink: b.taskLink,
      taskStatus: b.taskStatus,
      hoursToComplete: b.taskStatus === 'IN_PROGRESS' ? b.hoursToComplete ?? null : null,
      version: { increment: 1 },
    },
    include: { project: { select: { id: true, name: true } } },
  });
  res.json({ request });
});

/**
 * GET /api/ot-requests/mine?month=YYYY-MM
 * List the current user's OT requests, newest first, optionally filtered by month.
 */
otRequestsRouter.get('/mine', requireAuth, async (req, res) => {
  const month = typeof req.query.month === 'string' ? req.query.month : undefined;
  const where: Record<string, unknown> = { userId: req.auth!.sub };
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    where.workDate = { startsWith: month };
  }
  const requests = await prisma.otRequest.findMany({
    where,
    include: { project: { select: { id: true, name: true } } },
    orderBy: [{ workDate: 'desc' }, { createdAt: 'desc' }],
  });
  res.json({ requests });
});
