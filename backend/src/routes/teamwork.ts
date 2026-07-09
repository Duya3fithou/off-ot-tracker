import { Router } from 'express';
import { requireAuth } from '../auth/middleware';
import { prisma } from '../prisma';
import {
  fetchTeamworkTask,
  isTeamworkConfigured,
  parseTaskId,
} from '../services/teamwork';

export const teamworkRouter = Router();

/**
 * GET /api/teamwork/task?url=<teamwork task url>
 * Look up a Teamwork task and return the fields we can pre-fill an OT request
 * with. `matchedProjectId` is our Project whose name equals the Teamwork
 * project name (case-insensitive), or null if there's no match.
 */
teamworkRouter.get('/task', requireAuth, async (req, res) => {
  const url = typeof req.query.url === 'string' ? req.query.url.trim() : '';
  if (!url) return res.status(400).json({ error: 'Missing task url' });

  const taskId = parseTaskId(url);
  if (!taskId) return res.status(400).json({ error: 'Not a valid Teamwork task link' });

  if (!isTeamworkConfigured()) {
    return res.status(503).json({ error: 'Teamwork integration is not configured' });
  }

  try {
    const task = await fetchTeamworkTask(taskId, url);

    let matchedProjectId: string | null = null;
    if (task.projectName) {
      const project = await prisma.project.findFirst({
        where: { name: { equals: task.projectName, mode: 'insensitive' }, active: true },
        select: { id: true },
      });
      matchedProjectId = project?.id ?? null;
    }

    res.json({ task, matchedProjectId });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 502;
    res.status(status).json({ error: (err as Error).message ?? 'Teamwork lookup failed' });
  }
});
