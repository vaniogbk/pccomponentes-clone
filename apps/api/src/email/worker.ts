import type { PrismaClient } from '@prisma/client';
import { type EmailProvider, EmailSendError } from './providers.js';
import { renderEmail } from './templates.js';

/** Délais avant chaque nouvelle tentative : 1, 5, 15, 60 puis 360 minutes. */
export const RETRY_DELAYS_MINUTES = [1, 5, 15, 60, 360] as const;
export const STALE_SENDING_MS = 10 * 60 * 1000;
export const DELIVERY_WINDOW_MS = 72 * 60 * 60 * 1000;
export const DELIVERY_CHECK_INTERVAL_MS = 10 * 60 * 1000;
const BATCH_SIZE = 20;

export interface WorkerLogger {
  info(object: Record<string, unknown>, message: string): void;
  warn(object: Record<string, unknown>, message: string): void;
  error(object: Record<string, unknown>, message: string): void;
}

export interface EmailWorkerOptions {
  prisma: PrismaClient;
  provider: EmailProvider;
  logger: WorkerLogger;
  shopName: string;
  intervalMs?: number;
  now?: () => Date;
}

export function retryDelayMs(attempts: number): number {
  const index = Math.min(Math.max(attempts, 1), RETRY_DELAYS_MINUTES.length) - 1;
  return RETRY_DELAYS_MINUTES[index] * 60 * 1000;
}

/** Les erreurs gardées en base ne doivent contenir ni adresse e-mail ni jeton. */
export function sanitizeError(error: unknown): string {
  const message = error instanceof EmailSendError ? error.message : error instanceof Error ? error.name : 'Erreur inconnue';
  return message.replace(/[^\s@]+@[^\s@]+/g, '[adresse]').slice(0, 300);
}

export function createEmailWorker(options: EmailWorkerOptions) {
  const { prisma, provider, logger, shopName } = options;
  const now = options.now ?? (() => new Date());
  let running: Promise<number> | null = null;
  let rerun = false;
  let timers: NodeJS.Timeout[] = [];

  async function sendOne(id: string): Promise<boolean> {
    // Verrou optimiste : seule l'instance qui fait passer la ligne de QUEUED à SENDING l'envoie.
    const claimed = await prisma.emailMessage.updateMany({
      where: { id, status: 'QUEUED', nextAttemptAt: { lte: now() } },
      data: { status: 'SENDING', attempts: { increment: 1 }, provider: provider.name },
    });
    if (claimed.count !== 1) return false;

    const message = await prisma.emailMessage.findUniqueOrThrow({ where: { id } });
    try {
      const rendered = renderEmail(message.template, message.payload, shopName);
      const result = await provider.send({ id: message.id, to: message.toAddress, ...rendered });

      if (provider.isLocal) {
        await prisma.emailMessage.update({ where: { id }, data: { status: 'LOGGED', subject: rendered.subject, lastError: null } });
        logger.info({ emailId: id, template: message.template }, 'E-mail conservé localement (mode développement)');
        return true;
      }
      if (!result.messageId) throw new EmailSendError('Accusé du fournisseur absent');

      await prisma.emailMessage.update({
        where: { id },
        data: { status: 'SENT', sentAt: now(), providerMessageId: result.messageId, subject: rendered.subject, lastError: null },
      });
      logger.info({ emailId: id, template: message.template }, 'E-mail accepté par le fournisseur');
      return true;
    } catch (error) {
      const permanent = error instanceof EmailSendError && error.permanent;
      const exhausted = permanent || message.attempts >= message.maxAttempts;
      await prisma.emailMessage.update({
        where: { id },
        data: exhausted
          ? { status: 'FAILED', lastError: sanitizeError(error) }
          : { status: 'QUEUED', lastError: sanitizeError(error), nextAttemptAt: new Date(now().getTime() + retryDelayMs(message.attempts)) },
      });
      logger.warn({ emailId: id, template: message.template, attempts: message.attempts, failed: exhausted }, 'Échec d’envoi d’e-mail');
      return false;
    }
  }

  async function processBatch(): Promise<number> {
    // Un envoi resté « SENDING » (processus arrêté en plein envoi) est remis en file.
    await prisma.emailMessage.updateMany({
      where: { status: 'SENDING', updatedAt: { lt: new Date(now().getTime() - STALE_SENDING_MS) } },
      data: { status: 'QUEUED' },
    });

    const due = await prisma.emailMessage.findMany({
      where: { status: 'QUEUED', nextAttemptAt: { lte: now() } },
      orderBy: { nextAttemptAt: 'asc' },
      take: BATCH_SIZE,
      select: { id: true },
    });

    let sent = 0;
    for (const { id } of due) {
      if (await sendOne(id)) sent += 1;
    }
    return sent;
  }

  /** Un seul traitement à la fois par processus ; une demande pendant un traitement en relance un autre ensuite. */
  function run(): Promise<number> {
    if (running) {
      rerun = true;
      return running;
    }
    running = processBatch()
      .catch((error: unknown) => {
        logger.error({ errorName: error instanceof Error ? error.name : typeof error }, 'Traitement de la file d’e-mails impossible');
        return 0;
      })
      .finally(() => {
        running = null;
        if (rerun) {
          rerun = false;
          void run();
        }
      });
    return running;
  }

  async function checkDeliveries(): Promise<number> {
    if (!provider.checkDelivery) return 0;
    const since = new Date(now().getTime() - DELIVERY_WINDOW_MS);
    const recheckBefore = new Date(now().getTime() - DELIVERY_CHECK_INTERVAL_MS);
    const pending = await prisma.emailMessage.findMany({
      where: {
        status: 'SENT',
        provider: provider.name,
        deliveredAt: null,
        providerMessageId: { not: null },
        sentAt: { gte: since },
        OR: [{ deliveryCheckedAt: null }, { deliveryCheckedAt: { lt: recheckBefore } }],
      },
      take: 50,
      select: { id: true, providerMessageId: true },
    });

    let updated = 0;
    for (const message of pending) {
      try {
        const outcome = await provider.checkDelivery(message.providerMessageId!);
        const checkedAt = now();
        if (outcome.status === 'delivered') {
          await prisma.emailMessage.update({ where: { id: message.id }, data: { deliveredAt: outcome.at, deliveryCheckedAt: checkedAt } });
          updated += 1;
        } else if (outcome.status === 'failed') {
          await prisma.emailMessage.update({
            where: { id: message.id },
            data: { status: 'FAILED', lastError: sanitizeError(new EmailSendError(`Refusé par le destinataire : ${outcome.reason}`)), deliveryCheckedAt: checkedAt },
          });
          updated += 1;
        } else {
          await prisma.emailMessage.update({ where: { id: message.id }, data: { deliveryCheckedAt: checkedAt } });
        }
      } catch (error) {
        logger.warn({ emailId: message.id, error: sanitizeError(error) }, 'Suivi de livraison indisponible');
      }
    }
    return updated;
  }

  return {
    processBatch: run,
    checkDeliveries,
    /** À appeler après la validation d'une transaction qui a mis un e-mail en file ; ne bloque pas la réponse. */
    kick() {
      setImmediate(() => void run());
    },
    start() {
      void run();
      timers = [
        setInterval(() => void run(), options.intervalMs ?? 30_000),
        setInterval(() => void checkDeliveries().catch(() => 0), DELIVERY_CHECK_INTERVAL_MS),
      ];
      for (const timer of timers) timer.unref();
    },
    async stop() {
      for (const timer of timers) clearInterval(timer);
      timers = [];
      if (running) await running;
    },
  };
}

export type EmailWorker = ReturnType<typeof createEmailWorker>;
