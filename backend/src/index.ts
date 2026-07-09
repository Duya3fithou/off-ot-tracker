import cors from 'cors';
import express from 'express';
import { config } from './config';
import { adminRouter } from './routes/admin';
import { authRouter } from './routes/auth';
import { otRequestsRouter } from './routes/otRequests';
import { projectsRouter } from './routes/projects';
import { teamworkRouter } from './routes/teamwork';

const app = express();

app.use(
  cors({
    origin: config.corsOrigins,
  }),
);
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/ot-requests', otRequestsRouter);
app.use('/api/teamwork', teamworkRouter);
app.use('/api/admin', adminRouter);

// Fallback error handler
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  },
);

app.listen(config.port, () => {
  console.log(`OT Logger API listening on http://localhost:${config.port}`);
});
