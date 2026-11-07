import pino from 'pino';
import { createApp } from './app.js';
import { readConfig } from './config/env.js';
import { consoleProvider, createBrevoProvider } from './email/providers.js';
import { createEmailWorker } from './email/worker.js';
import { disconnectPrisma, getPrisma } from './lib/prisma.js';

const config = readConfig();
const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });

const provider = config.email.provider === 'brevo'
  ? createBrevoProvider({ apiKey: config.email.brevoApiKey!, fromEmail: config.email.fromEmail!, fromName: config.email.fromName })
  : consoleProvider;

if (config.nodeEnv === 'production' && provider.isLocal) {
  logger.warn({}, 'EMAIL_PROVIDER=console en production : aucun e-mail ne sera réellement envoyé.');
}

const emailWorker = createEmailWorker({
  prisma: getPrisma(),
  provider,
  logger,
  shopName: config.email.fromName,
  intervalMs: config.email.workerIntervalMs,
});

const app = createApp(config, { emailQueue: emailWorker });

const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info({ port: config.port, emailProvider: provider.name }, 'API démarrée');
  emailWorker.start();
});

let stopping = false;

function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  logger.info({ signal }, 'Arrêt de l’API');

  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();

  server.close(() => {
    emailWorker.stop()
      .then(() => disconnectPrisma())
      .catch(() => undefined)
      .finally(() => process.exit(0));
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
