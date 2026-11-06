import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import type { PrismaClient, User } from '@prisma/client';
import { localizedPath, type SiteLocale } from '@pcc/shared/locales';
import type { AppConfig } from '../config/env.js';
import { AppError, unprocessable } from '../lib/errors.js';
import { hashToken, randomToken, signAccessToken } from '../lib/tokens.js';

export const MAX_FAILED_LOGINS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
export const MAX_RESET_LINKS_PER_HOUR = 3;

const ARGON2_OPTIONS = { type: argon2.argon2id } as const;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Erreur unique pour e-mail inconnu, mot de passe faux, compte verrouillé ou désactivé. */
const invalidCredentials = () => new AppError(401, 'INVALID_CREDENTIALS', 'E-mail ou mot de passe incorrect.');
const sessionExpired = () => new AppError(401, 'SESSION_EXPIRED', 'Session expirée, reconnectez-vous.');

export type PublicUser = Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'phone' | 'role' | 'locale'>;

const PUBLIC_USER = {
  id: true, email: true, firstName: true, lastName: true, phone: true, role: true, locale: true,
} as const;

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

export function createAuthService(prisma: PrismaClient, config: AppConfig) {
  let dummyHash: Promise<string> | undefined;
  /** Vérification factice : un e-mail inconnu prend le même temps qu'un mot de passe faux. */
  const burnPasswordCheck = async (password: string) => {
    dummyHash ??= argon2.hash(randomToken(), ARGON2_OPTIONS);
    await argon2.verify(await dummyHash, password).catch(() => false);
  };

  const hash = (token: string) => hashToken(config.jwtRefreshSecret, token);

  async function issueSession(user: PublicUser, familyId: string = randomUUID()): Promise<IssuedSession & { tokenId: string }> {
    const refreshToken = randomToken();
    const row = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hash(refreshToken),
        familyId,
        expiresAt: new Date(Date.now() + config.refreshTokenTtlDays * DAY_MS),
      },
      select: { id: true },
    });
    const accessToken = signAccessToken(config.jwtAccessSecret, { userId: user.id, role: user.role }, config.accessTokenTtlSeconds);
    return { accessToken, refreshToken, user, tokenId: row.id };
  }

  async function revokeFamily(familyId: string) {
    await prisma.refreshToken.updateMany({ where: { familyId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  return {
    async register(input: { email: string; password: string; firstName: string; lastName: string; locale: SiteLocale }) {
      const passwordHash = await argon2.hash(input.password, ARGON2_OPTIONS);
      // createMany + skipDuplicates : même réponse et même coût, que l'adresse soit libre ou déjà prise.
      await prisma.user.createMany({
        data: [{
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          locale: input.locale,
          role: 'CLIENT',
        }],
        skipDuplicates: true,
      });
    },

    async login(email: string, password: string): Promise<IssuedSession> {
      const user = await prisma.user.findUnique({ where: { email } });
      const now = Date.now();

      if (!user || !user.isActive || (user.lockedUntil && user.lockedUntil.getTime() > now)) {
        await burnPasswordCheck(password);
        throw invalidCredentials();
      }

      const valid = await argon2.verify(user.passwordHash, password).catch(() => false);
      if (!valid) {
        const failures = user.failedLoginCount + 1;
        await prisma.user.update({
          where: { id: user.id },
          data: failures >= MAX_FAILED_LOGINS
            ? { failedLoginCount: 0, lockedUntil: new Date(now + LOCK_DURATION_MS) }
            : { failedLoginCount: failures },
        });
        throw invalidCredentials();
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date(now) },
        select: PUBLIC_USER,
      });
      return issueSession(updated);
    },

    /**
     * Rotation : chaque refresh token ne sert qu'une fois. Présenter un jeton déjà remplacé révèle un vol
     * probable : toute la famille de sessions est alors révoquée.
     */
    async refresh(refreshToken: string): Promise<IssuedSession> {
      const current = await prisma.refreshToken.findUnique({
        where: { tokenHash: hash(refreshToken) },
        include: { user: { select: { ...PUBLIC_USER, isActive: true } } },
      });
      if (!current) throw sessionExpired();

      if (current.revokedAt) {
        await revokeFamily(current.familyId);
        throw sessionExpired();
      }
      if (current.expiresAt.getTime() <= Date.now() || !current.user.isActive) {
        await revokeFamily(current.familyId);
        throw sessionExpired();
      }

      // Révocation conditionnelle : si deux requêtes utilisent le même jeton en même temps, une seule gagne.
      const claimed = await prisma.refreshToken.updateMany({
        where: { id: current.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (claimed.count !== 1) {
        await revokeFamily(current.familyId);
        throw sessionExpired();
      }

      const { isActive: _isActive, ...user } = current.user;
      const session = await issueSession(user, current.familyId);
      await prisma.refreshToken.update({ where: { id: current.id }, data: { replacedBy: session.tokenId } });
      return session;
    },

    async logout(refreshToken: string | undefined) {
      if (!refreshToken) return;
      const current = await prisma.refreshToken.findUnique({ where: { tokenHash: hash(refreshToken) }, select: { familyId: true } });
      if (current) await revokeFamily(current.familyId);
    },

    async me(userId: string): Promise<PublicUser | null> {
      return prisma.user.findFirst({ where: { id: userId, isActive: true }, select: PUBLIC_USER });
    },

    /** Toujours silencieux vers l'appelant ; au plus 3 liens par compte et par heure. */
    async forgotPassword(email: string, locale: SiteLocale) {
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, firstName: true, isActive: true, locale: true } });
      if (!user || !user.isActive) return;

      const recent = await prisma.passwordResetToken.count({
        where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
      });
      if (recent >= MAX_RESET_LINKS_PER_HOUR) return;

      const token = randomToken();
      const siteUrl = config.publicSiteUrl ?? 'http://localhost:3000';
      const resetUrl = new URL(localizedPath('/compte/reinitialiser', locale), siteUrl);
      resetUrl.searchParams.set('token', token);

      await prisma.$transaction([
        prisma.passwordResetToken.create({
          data: { userId: user.id, tokenHash: hash(token), expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
        }),
        // Mis en file d'envoi : le worker d'e-mails (phase suivante) l'enverra.
        prisma.emailMessage.create({
          data: {
            toAddress: user.email,
            subject: 'Réinitialisation de votre mot de passe',
            template: 'password-reset',
            payload: { locale, firstName: user.firstName, resetUrl: resetUrl.toString(), expiresInMinutes: RESET_TOKEN_TTL_MS / 60_000 },
          },
        }),
      ]);
    },

    async resetPassword(token: string, password: string) {
      const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hash(token) } });
      if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
        throw unprocessable('RESET_TOKEN_INVALID', 'Ce lien de réinitialisation est invalide ou expiré.');
      }

      const claimed = await prisma.passwordResetToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
      if (claimed.count !== 1) throw unprocessable('RESET_TOKEN_INVALID', 'Ce lien de réinitialisation est invalide ou expiré.');

      const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);
      await prisma.$transaction([
        prisma.user.update({ where: { id: row.userId }, data: { passwordHash, failedLoginCount: 0, lockedUntil: null } }),
        prisma.refreshToken.updateMany({ where: { userId: row.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
      ]);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
