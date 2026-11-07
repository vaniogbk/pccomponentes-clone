import { z } from 'zod';
import { EmailSendError } from './providers.js';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);

function layout(lang: string, title: string, shopName: string, bodyHtml: string) {
  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:24px;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#232b38">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px" cellspacing="0" cellpadding="0">
<tr><td>
<p style="margin:0 0 24px;font-size:13px;font-weight:bold;color:#64748b">${escapeHtml(shopName)}</p>
${bodyHtml}
</td></tr></table>
</td></tr></table>
</body>
</html>`;
}

const passwordResetPayload = z.object({
  locale: z.string().default('fr'),
  firstName: z.string().min(1).max(100),
  resetUrl: z.string().url(),
  expiresInMinutes: z.number().int().positive(),
});

type Renderer = (payload: unknown, shopName: string) => RenderedEmail;

const renderers: Record<string, Renderer> = {
  'password-reset'(raw, shopName) {
    const payload = passwordResetPayload.parse(raw);
    const subject = 'Réinitialisation de votre mot de passe';
    const name = escapeHtml(payload.firstName);
    const url = escapeHtml(payload.resetUrl);
    const html = layout(payload.locale, subject, shopName, `
<h1 style="margin:0 0 16px;font-size:22px">${subject}</h1>
<p style="margin:0 0 16px;line-height:1.5">Bonjour ${name},</p>
<p style="margin:0 0 24px;line-height:1.5">Vous avez demandé à changer le mot de passe de votre compte. Ce lien est valable ${payload.expiresInMinutes} minutes et ne peut servir qu’une fois.</p>
<p style="margin:0 0 24px"><a href="${url}" style="display:inline-block;background:#ff6000;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px">Choisir un nouveau mot de passe</a></p>
<p style="margin:0 0 8px;font-size:13px;color:#64748b;line-height:1.5">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
<p style="margin:0 0 24px;font-size:13px;word-break:break-all"><a href="${url}" style="color:#ff6000">${url}</a></p>
<p style="margin:0;font-size:13px;color:#64748b;line-height:1.5">Vous n’êtes pas à l’origine de cette demande ? Ignorez cet e-mail : votre mot de passe reste inchangé.</p>`);
    const text = [
      `Bonjour ${payload.firstName},`,
      '',
      `Vous avez demandé à changer le mot de passe de votre compte. Ce lien est valable ${payload.expiresInMinutes} minutes et ne peut servir qu’une fois :`,
      payload.resetUrl,
      '',
      'Vous n’êtes pas à l’origine de cette demande ? Ignorez cet e-mail : votre mot de passe reste inchangé.',
      '',
      shopName,
    ].join('\n');
    return { subject, html, text };
  },
};

export const EMAIL_TEMPLATES = Object.keys(renderers);

/** Un modèle inconnu ou une donnée invalide est une erreur définitive : le message passe en échec sans réessai. */
export function renderEmail(template: string, payload: unknown, shopName: string): RenderedEmail {
  const renderer = renderers[template];
  if (!renderer) throw new EmailSendError(`Modèle inconnu : ${template}`, true);
  try {
    return renderer(payload, shopName);
  } catch (error) {
    if (error instanceof z.ZodError) throw new EmailSendError(`Données invalides pour le modèle ${template}`, true);
    throw error;
  }
}
