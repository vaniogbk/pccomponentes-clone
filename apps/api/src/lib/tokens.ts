import { createHmac, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';

const ISSUER = 'pcc-api';
const AUDIENCE = 'pcc-web';

/** Jeton opaque transmis au navigateur ; seule son empreinte est conservée en base. */
export function randomToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(secret: string, token: string): string {
  return createHmac('sha256', secret).update(token).digest('hex');
}

export interface AccessClaims {
  userId: string;
  role: 'CLIENT' | 'ADMIN';
}

export function signAccessToken(secret: string, claims: AccessClaims, ttlSeconds: number): string {
  return jwt.sign({ role: claims.role }, secret, {
    algorithm: 'HS256',
    subject: claims.userId,
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: ttlSeconds,
  });
}

export function verifyAccessToken(secret: string, token: string): AccessClaims | null {
  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE });
    if (typeof payload === 'string' || typeof payload.sub !== 'string') return null;
    if (payload.role !== 'CLIENT' && payload.role !== 'ADMIN') return null;
    return { userId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}
