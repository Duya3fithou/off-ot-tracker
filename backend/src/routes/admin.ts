import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAdmin, requireAuth } from '../auth/middleware';
import { notifyOwnerOfReview } from '../services/notifications';
import { buildOtWorkbook, monthLabel } from '../services/otExport';
import { getAppSettings, updateAppSettings } from '../services/settings';

export const adminRouter = Router();

// All routes here require an admin session.
adminRouter.use(requireAuth, requireAdmin);

const monthRe = /^\d{4}-\d{2}$/;

/** GET /api/admin/users — list all users (for filter pickers). */
adminRouter.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });
  res.json({ users });
});

/**
 * GET /api/admin/ot-requests?month=YYYY-MM&status=PENDING&userId=...&projectId=...
 * List OT requests across all users with optional filters.
 */
adminRouter.get('/ot-requests', async (req, res) => {
  const { month, status, userId, projectId } = req.query as Record<string, string | undefined>;
  const where: Record<string, unknown> = {};
  if (month && monthRe.test(month)) where.workDate = { startsWith: month };
  if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
    where.approvalStatus = status;
  }
  if (userId) where.userId = userId;
  if (projectId) where.projectId = projectId;

  const requests = await prisma.otRequest.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ workDate: 'desc' }, { createdAt: 'desc' }],
  });
  res.json({ requests });
});

/**
 * GET /api/admin/summary?month=YYYY-MM&projectId=...&userId=...
 * Per-user OT totals for the month (approved + pending hours, counts).
 */
adminRouter.get('/summary', async (req, res) => {
  const { month, projectId, userId } = req.query as Record<string, string | undefined>;
  const where: Record<string, unknown> = {};
  if (month && monthRe.test(month)) where.workDate = { startsWith: month };
  if (projectId) where.projectId = projectId;
  if (userId) where.userId = userId;

  const requests = await prisma.otRequest.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const byUser = new Map<
    string,
    {
      userId: string;
      name: string;
      email: string;
      totalRequests: number;
      pendingHours: number;
      approvedHours: number;
      rejectedHours: number;
    }
  >();

  for (const r of requests) {
    const key = r.userId;
    const entry =
      byUser.get(key) ??
      {
        userId: r.userId,
        name: r.user.name,
        email: r.user.email,
        totalRequests: 0,
        pendingHours: 0,
        approvedHours: 0,
        rejectedHours: 0,
      };
    entry.totalRequests += 1;
    if (r.approvalStatus === 'APPROVED') entry.approvedHours += r.durationHours;
    else if (r.approvalStatus === 'PENDING') entry.pendingHours += r.durationHours;
    else entry.rejectedHours += r.durationHours;
    byUser.set(key, entry);
  }

  const round = (n: number) => Math.round(n * 100) / 100;
  const summary = [...byUser.values()]
    .map((e) => ({
      ...e,
      pendingHours: round(e.pendingHours),
      approvedHours: round(e.approvedHours),
      rejectedHours: round(e.rejectedHours),
    }))
    .sort((a, b) => b.approvedHours + b.pendingHours - (a.approvedHours + a.pendingHours));

  res.json({ month: month ?? null, summary });
});

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().trim().max(500).optional(),
  // The version the admin saw. If it no longer matches, the request changed
  // since it was loaded and the review is rejected (stale).
  expectedVersion: z.number().int().nonnegative(),
});

/**
 * PATCH /api/admin/ot-requests/:id/review — approve or reject a request.
 * Uses optimistic concurrency: if `expectedVersion` no longer matches the row,
 * responds 409 with the current request so the client can warn + reload.
 */
adminRouter.patch('/ot-requests/:id/review', async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'status must be APPROVED or REJECTED (with expectedVersion)' });
  }
  const auth = req.auth!;

  // Conditional update guarded by the version the admin last saw.
  const result = await prisma.otRequest.updateMany({
    where: { id: req.params.id, version: parsed.data.expectedVersion },
    data: {
      approvalStatus: parsed.data.status,
      reviewNote: parsed.data.note ?? null,
      reviewedById: auth.sub,
      reviewedByEmail: auth.email,
      reviewedAt: new Date(),
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    // Either the request no longer exists, or it changed since it was loaded.
    const current = await prisma.otRequest.findUnique({
      where: { id: req.params.id },
      include: {
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!current) {
      return res.status(404).json({ error: 'OT request not found' });
    }
    return res.status(409).json({
      error: 'This request changed since you loaded it. Reloading the latest version.',
      request: current,
    });
  }

  const request = await prisma.otRequest.findUnique({
    where: { id: req.params.id },
    include: {
      project: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
  res.json({ request });

  // Fire-and-forget: tell the owner their OT was approved/rejected.
  if (request) {
    void notifyOwnerOfReview({
      ownerId: request.userId,
      requestId: request.id,
      status: parsed.data.status,
      workDate: request.workDate,
      projectName: request.project?.name,
      note: parsed.data.note,
    });
  }
});

/**
 * GET /api/admin/ot-requests/export.xlsx?month=&status=&userId=&projectId=
 * Download the filtered month's OT entries as an .xlsx (Resource-management layout).
 */
adminRouter.get('/ot-requests/export.xlsx', async (req, res) => {
  const { month, status, userId, projectId } = req.query as Record<string, string | undefined>;
  const where: Record<string, unknown> = {};
  if (month && monthRe.test(month)) where.workDate = { startsWith: month };
  if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
    where.approvalStatus = status;
  }
  if (userId) where.userId = userId;
  if (projectId) where.projectId = projectId;

  const requests = await prisma.otRequest.findMany({
    where,
    include: {
      project: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: [{ workDate: 'asc' }, { createdAt: 'asc' }],
  });

  const buffer = await buildOtWorkbook(
    requests.map((r) => ({
      workDate: r.workDate,
      email: r.user.email,
      name: r.user.name,
      durationHours: r.durationHours,
      projectName: r.project?.name ?? '',
    })),
    month ?? '',
  );

  const filename = `OT ${monthLabel(month ?? '')}.xlsx`;
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

/** GET /api/admin/settings — current app settings (admin-configurable). */
adminRouter.get('/settings', async (_req, res) => {
  const settings = await getAppSettings();
  res.json({ settings: { emailOnOtSubmit: settings.emailOnOtSubmit } });
});

const settingsSchema = z.object({
  emailOnOtSubmit: z.boolean().optional(),
});

/** PATCH /api/admin/settings — update app settings. */
adminRouter.patch('/settings', async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid settings payload' });
  }
  const settings = await updateAppSettings(parsed.data);
  res.json({ settings: { emailOnOtSubmit: settings.emailOnOtSubmit } });
});
