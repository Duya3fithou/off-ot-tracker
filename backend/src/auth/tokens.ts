import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const googleClient = new OAuth2Client(config.googleClientId);

export interface GoogleProfile {
  email: string;
  name: string;
  picture?: string;
}

/** Verify a Google ID token and return the basic profile. Throws if invalid. */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('Google token has no email');
  }
  if (!payload.email_verified) {
    throw new Error('Google email is not verified');
  }
  return {
    email: payload.email.toLowerCase(),
    name: payload.name ?? payload.email,
    picture: payload.picture,
  };
}

export interface SessionClaims {
  sub: string; // user id
  email: string;
  name: string;
  isAdmin: boolean;
}

export function signSessionToken(claims: SessionClaims): string {
  return jwt.sign(claims, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function verifySessionToken(token: string): SessionClaims {
  return jwt.verify(token, config.jwtSecret) as SessionClaims;
}
