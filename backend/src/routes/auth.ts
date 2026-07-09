import { Router } from 'express';
import { z } from 'zod';
import { isAdminEmail, isAllowedEmail } from '../config';
import { prisma } from '../prisma';
import { requireAuth } from '../auth/middleware';
import { signSessionToken, verifyGoogleIdToken } from '../auth/tokens';

export const authRouter = Router();

const loginSchema = z.object({
  idToken: z.string().min(10),
});

/**
 * POST /api/auth/google
 * Body: { idToken } — a Google ID token obtained by the web app.
 * Verifies the token, enforces the allowed email domains, upserts the user,
 * and returns an app session token + profile.
 */
authRouter.post('/google', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'idToken is required' });
  }

  let profile;
  try {
    profile = await verifyGoogleIdToken(parsed.data.idToken);
  } catch {
    return res.status(401).json({ error: 'Invalid Google token' });
  }

  if (!isAllowedEmail(profile.email)) {
    return res.status(403).json({
      error:
        'Your account is not allowed. Please sign in with a company account.',
    });
  }

  const user = await prisma.user.upsert({
    where: { email: profile.email },
    update: { name: profile.name, picture: profile.picture },
    create: {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    },
  });

  const isAdmin = isAdminEmail(user.email);
  const token = signSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    isAdmin,
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      isAdmin,
    },
  });
});

/** GET /api/auth/me — return the current session's user. */
authRouter.get('/me', requireAuth, (req, res) => {
  const auth = req.auth!;
  res.json({
    user: {
      id: auth.sub,
      email: auth.email,
      name: auth.name,
      isAdmin: auth.isAdmin,
    },
  });
});
