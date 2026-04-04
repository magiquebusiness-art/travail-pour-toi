// ─── Resend Email Integration for AffiliationPro ────────────────────────
// Uses the Resend REST API via fetch() — compatible with Cloudflare Workers.
// No npm `resend` package required.

const RESEND_API_KEY = 're_cKkFtPtR_1dXxefB6C9sM7sKzWBhKde9z'
const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_ADDRESS = 'AffiliationPro <noreply@cashflowecosysteme.com>'

// ─── Low-level helper ──────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`[Email] Resend API error ${response.status}:`, errorBody)
      return false
    }

    const result = await response.json()
    console.log('[Email] Sent successfully, id:', result.id)
    return true
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Email] Failed to send email:', message)
    return false
  }
}

// ─── Shared HTML wrapper ───────────────────────────────────────────────

function emailWrapper(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #a855f7 100%); padding: 36px 28px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { margin: 6px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 36px 28px; color: #27272a; font-size: 15px; line-height: 1.75; }
    .body p { margin: 0 0 16px 0; }
    .body a { color: #7c3aed; text-decoration: none; font-weight: 600; }
    .body a:hover { text-decoration: underline; }
    .highlight-box { background: #f8f5ff; border-left: 4px solid #7c3aed; padding: 18px 22px; border-radius: 0 10px 10px 0; margin: 24px 0; }
    .highlight-box strong { color: #5b21b6; }
    .code-display { display: inline-block; background: #7c3aed; color: #ffffff; padding: 6px 16px; border-radius: 6px; font-family: 'SF Mono', 'Fira Code', 'Fira Mono', monospace; font-size: 15px; font-weight: 700; letter-spacing: 1px; margin-top: 6px; }
    .link-box { background: #f4f4f5; border: 1px dashed #d4d4d8; padding: 14px 18px; border-radius: 8px; text-align: center; margin: 16px 0; word-break: break-all; }
    .link-box a { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 13px; color: #7c3aed; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #6d28d9 0%, #a855f7 100%); color: #ffffff !important; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; text-decoration: none !important; margin: 20px 0; }
    .cta-button:hover { opacity: 0.92; }
    .info-row { display: flex; gap: 12px; margin: 20px 0; }
    .info-card { flex: 1; background: #f9fafb; border-radius: 10px; padding: 14px 18px; text-align: center; }
    .info-card .label { font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .info-card .value { font-size: 16px; font-weight: 700; color: #18181b; }
    .amount { font-size: 32px; font-weight: 800; color: #16a34a; margin: 8px 0; }
    .success-icon { font-size: 40px; text-align: center; margin-bottom: 8px; }
    .divider { border: none; border-top: 1px solid #e4e4e7; margin: 24px 0; }
    .footer { padding: 24px 28px; text-align: center; font-size: 12px; color: #a1a1aa; border-top: 1px solid #e4e4e7; }
    .footer a { color: #7c3aed; text-decoration: none; }
    .footer-brand { font-weight: 600; color: #71717a; font-size: 13px; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(title)}</h1>
    </div>
    <div class="body">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p class="footer-brand">AffiliationPro — Publication CashFlow &bull; Visionnaire depuis 1997</p>
      <p>Ce message vous a été envoyé automatiquement. Merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>`
}

// ─── Utility helpers ────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ─── Exported email functions ──────────────────────────────────────────

/**
 * Sends a welcome email to a newly registered affiliate.
 */
export async function sendWelcomeEmail(
  email: string,
  fullName: string,
  affiliateCode: string,
): Promise<boolean> {
  const referralLink = `https://affiliationpro.cashflowecosysteme.com/r/${affiliateCode}`
  const loginUrl = 'https://affiliationpro.cashflowecosysteme.com/login'

  const subject = `🎉 Bienvenue sur AffiliationPro, ${fullName} !`

  const body = `
    <p>Bonjour <strong>${escapeHtml(fullName)}</strong>,</p>

    <p>Votre compte a été créé avec succès ! 🎉</p>
    <p>Bienvenue dans le programme d'affiliation <strong>AffiliationPro</strong>. Vous pouvez dès maintenant commencer à partager votre lien de parrainage et gagner des commissions sur <strong>3 niveaux</strong>.</p>

    <div class="highlight-box">
      <p style="margin:0"><strong>🔑 Votre code d'affiliation :</strong></p>
      <p style="margin:8px 0 0 0"><span class="code-display">${escapeHtml(affiliateCode)}</span></p>
    </div>

    <p><strong>🔗 Votre lien de parrainage :</strong></p>
    <div class="link-box">
      <a href="${escapeHtml(referralLink)}">${escapeHtml(referralLink)}</a>
    </div>

    <p>Partagez ce lien avec votre réseau pour commencer à gagner des commissions. Chaque vente générée par vos filleuls vous rapporte des gains — sur 3 niveaux de profondeur ! 💰</p>

    <div class="info-row">
      <div class="info-card">
        <div class="label">📊 Tableau de bord</div>
        <div class="value"><a href="${loginUrl}">Se connecter</a></div>
      </div>
      <div class="info-card">
        <div class="label">💰 Commissions</div>
        <div class="value">3 niveaux</div>
      </div>
    </div>

    <p style="text-align:center">
      <a href="${loginUrl}" class="cta-button">🔑 Connexion au Dashboard</a>
    </p>

    <p>Bonne chance et bons gains ! 🚀</p>
  `

  return sendEmail(email, subject, emailWrapper('Bienvenue sur AffiliationPro 🎉', body))
}

/**
 * Notifies an affiliate that a new sale has been registered via their referral link.
 */
export async function sendSaleNotification(
  email: string,
  fullName: string,
  amount: number,
  customerEmail: string | null,
): Promise<boolean> {
  const customerDisplay = customerEmail
    ? escapeHtml(customerEmail)
    : 'Client non identifié'

  const subject = `🎉 Nouvelle vente ! ${amount}$ - AffiliationPro`

  const body = `
    <p>Bonjour <strong>${escapeHtml(fullName)}</strong>,</p>

    <div class="success-icon">🎉</div>

    <p>Une nouvelle vente de <strong>${amount}$</strong> vient d'être enregistrée grâce à votre lien d'affiliation !</p>

    <div class="amount">+${amount}$</div>
    <p style="text-align:center; color:#71717a; font-size:14px; margin-top:-4px;">montant de la vente</p>

    <div class="info-row">
      <div class="info-card">
        <div class="label">👤 Client</div>
        <div class="value" style="font-size:14px;">${customerDisplay}</div>
      </div>
      <div class="info-card">
        <div class="label">🛍️ Montant</div>
        <div class="value">${amount}$</div>
      </div>
    </div>

    <hr class="divider" />

    <p>Votre commission sera calculée automatiquement selon votre niveau. Consultez votre <a href="https://affiliationpro.cashflowecosysteme.com/login">tableau de bord</a> pour suivre vos performances.</p>

    <p>Continuez à partager votre lien pour multiplier vos gains ! 💪🚀</p>
  `

  return sendEmail(email, subject, emailWrapper('Nouvelle vente enregistrée 🎉', body))
}

/**
 * Notifies an admin when a new affiliate joins their team.
 */
export async function sendAdminNewAffiliate(
  adminEmail: string,
  affiliateName: string,
  affiliateEmail: string,
): Promise<boolean> {
  const subject = '👨‍💼 Nouvel affilié dans votre équipe - AffiliationPro'

  const body = `
    <p>Bonjour,</p>

    <div class="success-icon">👨‍💼</div>

    <p>Un nouvel affilié vient de rejoindre votre programme d'affiliation !</p>

    <div class="highlight-box">
      <p style="margin:0 0 8px 0"><strong>Nouvel affilié :</strong></p>
      <p style="margin:0 0 4px 0">👤 <strong>${escapeHtml(affiliateName)}</strong></p>
      <p style="margin:0">📧 <a href="mailto:${escapeHtml(affiliateEmail)}">${escapeHtml(affiliateEmail)}</a></p>
    </div>

    <p><strong>${escapeHtml(affiliateName)}</strong> (${escapeHtml(affiliateEmail)}) vient de rejoindre votre programme d'affiliation.</p>

    <p style="text-align:center">
      <a href="https://affiliationpro.cashflowecosysteme.com/login" class="cta-button">📊 Voir le Dashboard</a>
    </p>

    <p>Consultez votre tableau de bord pour suivre la croissance de votre équipe.</p>
  `

  return sendEmail(adminEmail, subject, emailWrapper('Nouvel affilié 👨‍💼', body))
}

/**
 * Notifies an admin when a new sale is registered on their program.
 */
export async function sendAdminSaleNotification(
  email: string,
  amount: number,
  affiliateName: string,
  customerName: string | null,
): Promise<boolean> {
  const customerDisplay = customerName
    ? escapeHtml(customerName)
    : 'Client non identifié'

  const subject = `📊 Vente enregistrée — ${escapeHtml(affiliateName)} — ${amount}$`

  const body = `
    <p>Bonjour,</p>

    <p>Une nouvelle vente a été enregistrée sur la plateforme.</p>

    <div class="amount">${amount}$</div>
    <p style="text-align:center; color:#71717a; font-size:14px; margin-top:-4px;">montant total de la vente</p>

    <div class="info-row">
      <div class="info-card">
        <div class="label">🤝 Affilié</div>
        <div class="value" style="font-size:14px;">${escapeHtml(affiliateName)}</div>
      </div>
      <div class="info-card">
        <div class="label">👤 Client</div>
        <div class="value" style="font-size:14px;">${customerDisplay}</div>
      </div>
    </div>

    <hr class="divider" />

    <p>Consultez le <a href="https://affiliationpro.cashflowecosysteme.com/login">tableau de bord d'administration</a> pour plus de détails sur les commissions associées.</p>
  `

  return sendEmail(email, subject, emailWrapper('Vente enregistrée 📊', body))
}
