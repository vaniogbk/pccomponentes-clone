export interface OutgoingEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendResult {
  /** Identifiant renvoyé par le fournisseur : sans lui, l'envoi n'est pas considéré comme accepté. */
  messageId?: string;
}

export type DeliveryOutcome =
  | { status: 'delivered'; at: Date }
  | { status: 'failed'; reason: string }
  | { status: 'pending' };

export interface EmailProvider {
  readonly name: string;
  /** `true` : les messages ne quittent pas le serveur (mode développement → statut LOGGED). */
  readonly isLocal: boolean;
  send(email: OutgoingEmail): Promise<SendResult>;
  checkDelivery?(messageId: string): Promise<DeliveryOutcome>;
}

/** Erreur d'envoi dont le message ne contient ni adresse, ni contenu, ni clé. */
export class EmailSendError extends Error {
  constructor(message: string, readonly permanent = false) {
    super(message);
    this.name = 'EmailSendError';
  }
}

/** Mode développement : rien n'est envoyé ; le message reste consultable en base. */
export const consoleProvider: EmailProvider = {
  name: 'console',
  isLocal: true,
  async send() {
    return {};
  },
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface BrevoOptions {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
  fetch?: FetchLike;
  timeoutMs?: number;
}

const BREVO_API = 'https://api.brevo.com/v3';
const FAILED_EVENTS = new Set(['hardBounces', 'blocked', 'invalid', 'spam', 'error']);

export function createBrevoProvider(options: BrevoOptions): EmailProvider {
  const doFetch = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? 10_000;

  async function call(path: string, init: RequestInit) {
    let response: Response;
    try {
      response = await doFetch(`${BREVO_API}${path}`, {
        ...init,
        headers: { 'api-key': options.apiKey, accept: 'application/json', 'content-type': 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      const name = error instanceof Error ? error.name : 'Error';
      throw new EmailSendError(name === 'TimeoutError' ? 'Brevo : délai dépassé' : 'Brevo : erreur réseau');
    }
    if (!response.ok) {
      // 4xx (hors 429) : requête refusée, inutile de réessayer à l'identique.
      const permanent = response.status >= 400 && response.status < 500 && response.status !== 429;
      throw new EmailSendError(`Brevo : HTTP ${response.status}`, permanent);
    }
    return response.json() as Promise<unknown>;
  }

  return {
    name: 'brevo',
    isLocal: false,
    async send(email) {
      const body = await call('/smtp/email', {
        method: 'POST',
        body: JSON.stringify({
          sender: { email: options.fromEmail, ...(options.fromName && { name: options.fromName }) },
          to: [{ email: email.to }],
          subject: email.subject,
          htmlContent: email.html,
          textContent: email.text,
          headers: { 'X-Mailin-custom': `outbox:${email.id}` },
        }),
      });
      const messageId = (body as { messageId?: unknown } | null)?.messageId;
      return typeof messageId === 'string' && messageId.length > 0 ? { messageId } : {};
    },
    async checkDelivery(messageId) {
      const query = new URLSearchParams({ messageId, days: '3', limit: '50', sort: 'desc' });
      const body = await call(`/smtp/statistics/events?${query}`, { method: 'GET' });
      const events = Array.isArray((body as { events?: unknown } | null)?.events)
        ? (body as { events: Array<{ event?: string; date?: string; reason?: string }> }).events
        : [];

      const failure = events.find((event) => event.event && FAILED_EVENTS.has(event.event));
      if (failure) return { status: 'failed', reason: `${failure.event}${failure.reason ? ` : ${failure.reason}` : ''}`.slice(0, 300) };

      const delivered = events.find((event) => event.event === 'delivered');
      if (delivered) return { status: 'delivered', at: delivered.date ? new Date(delivered.date) : new Date() };

      return { status: 'pending' };
    },
  };
}
