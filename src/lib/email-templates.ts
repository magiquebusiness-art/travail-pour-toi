// @ts-nocheck
/**
 * NyXia MarketPlace — Email Templates for Student Enrollment
 * Uses the existing Resend infrastructure from src/lib/resend.ts
 */

/**
 * Generate HTML for enrollment confirmation email
 */
export function getEnrollmentConfirmationHTML(
  formationTitle: string,
  studentName: string,
  accessUrl: string,
): string {
  const displayName = studentName || 'Étudiant'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Inscription confirmée — ${escapeHtml(formationTitle)}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0B1F3A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 580px; margin: 40px auto; background: rgba(255,255,255,0.03); border: 1px solid rgba(123, 92, 255, 0.15); border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #7B5CFF 0%, #5a3fd4 100%); padding: 36px 28px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; }
    .header p { margin: 6px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 36px 28px; color: #d4d4d8; font-size: 15px; line-height: 1.75; }
    .body p { margin: 0 0 16px 0; }
    .body a { color: #F4C842; text-decoration: none; font-weight: 600; }
    .body a:hover { text-decoration: underline; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #7B5CFF 0%, #F4C842 100%); color: #ffffff !important; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; text-decoration: none !important; margin: 20px 0; }
    .cta-button:hover { opacity: 0.92; }
    .info-box { background: rgba(123, 92, 255, 0.08); border: 1px solid rgba(123, 92, 255, 0.15); border-radius: 12px; padding: 20px; margin: 20px 0; }
    .info-box .label { font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .info-box .value { font-size: 16px; font-weight: 700; color: #ffffff; }
    .footer { padding: 24px 28px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid rgba(123, 92, 255, 0.1); }
    .footer a { color: #7B5CFF; text-decoration: none; }
    .footer-brand { font-weight: 600; color: #a1a1aa; font-size: 13px; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bienvenue dans votre formation !</h1>
      <p>NyXia MarketPlace</p>
    </div>
    <div class="body">
      <p>Bonjour <strong style="color:#fff">${escapeHtml(displayName)}</strong>,</p>

      <p>Votre inscription a été confirmée avec succès. Vous avez maintenant accès à votre formation.</p>

      <div class="info-box">
        <div class="label">Votre formation</div>
        <div class="value">${escapeHtml(formationTitle)}</div>
      </div>

      <p style="text-align:center">
        <a href="${accessUrl}" class="cta-button">Accéder à ma formation</a>
      </p>

      <p>Commencez votre apprentissage dès maintenant et suivez votre progression à votre rythme. Votre accès est illimité.</p>
    </div>
    <div class="footer">
      <p class="footer-brand">NyXia MarketPlace</p>
      <p>Ce message vous a été envoyé automatiquement suite à votre inscription. Merci de ne pas y répondre.</p>
      <p><a href="https://travail-pour-toi.com">travail-pour-toi.com</a></p>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
