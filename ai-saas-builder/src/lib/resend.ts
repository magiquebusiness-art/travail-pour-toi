const RESEND_API_URL = 'https://api.resend.com/emails'

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

interface SendEmailResponse {
  id: string
  from: string
  to: string[]
  created_at: string
}

export async function sendEmail({
  to,
  subject,
  html,
  from = 'AffiliationPro <noreply@cashflowecosysteme.com>',
}: SendEmailParams): Promise<SendEmailResponse> {
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Resend API error: ${error}`)
  }

  return response.json()
}

// Email templates
export function getWelcomeEmailTemplate(name: string, referralLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #0f0f1a; color: #fff; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .logo { font-size: 28px; font-weight: bold; color: #a855f7; margin-bottom: 30px; }
        .card { background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(59, 130, 246, 0.1)); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 16px; padding: 30px; }
        .title { font-size: 24px; margin-bottom: 20px; }
        .link { display: inline-block; background: linear-gradient(135deg, #7c3aed, #3b82f6); color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none; margin: 20px 0; }
        .footer { margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">✨ Affiliation Pro</div>
        <div class="card">
          <h1 class="title">Bienvenue ${name} ! 🎉</h1>
          <p>Votre compte Affiliation Pro est prêt. Vous pouvez maintenant commencer à gagner des commissions.</p>
          <p><strong>Votre lien d'affiliation :</strong></p>
          <p style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; font-family: monospace;">${referralLink}</p>
          <a href="${referralLink}" class="link">Accéder à mon dashboard</a>
        </div>
        <div class="footer">
          <p>© 2024 Affiliation Pro. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getCommissionEmailTemplate(
  name: string,
  amount: number,
  source: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #0f0f1a; color: #fff; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .logo { font-size: 28px; font-weight: bold; color: #a855f7; margin-bottom: 30px; }
        .card { background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(59, 130, 246, 0.1)); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 16px; padding: 30px; }
        .amount { font-size: 48px; font-weight: bold; color: #22c55e; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">✨ Affiliation Pro</div>
        <div class="card">
          <h1>Nouvelle commission ! 💰</h1>
          <p>Bonjour ${name},</p>
          <p>Vous avez reçu une nouvelle commission de :</p>
          <div class="amount">+${amount.toFixed(2)} $</div>
          <p>Source : ${source}</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #3b82f6); color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none;">Voir mon dashboard</a>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getPayoutEmailTemplate(
  name: string,
  amount: number
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #0f0f1a; color: #fff; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .logo { font-size: 28px; font-weight: bold; color: #a855f7; margin-bottom: 30px; }
        .card { background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(59, 130, 246, 0.1)); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 16px; padding: 30px; }
        .amount { font-size: 48px; font-weight: bold; color: #22c55e; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">✨ Affiliation Pro</div>
        <div class="card">
          <h1>Paiement envoyé ! ✅</h1>
          <p>Bonjour ${name},</p>
          <p>Votre paiement a été traité avec succès :</p>
          <div class="amount">${amount.toFixed(2)} $</div>
          <p>Vous recevrez les fonds sous 3-5 jours ouvrables.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
