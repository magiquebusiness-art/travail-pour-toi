// @ts-nocheck
/**
 * ════════════════════════════════════════════════════════════════════════════════
 * NYXIA MARKETPLACE — Stripe Connect Library
 * Gestion des paiements SaaS (modèle Systeme.io / Kajabi)
 *
 * Stripe Express Connect :
 *   - Les clients (admins) connectent leur compte Stripe Express
 *   - Les étudiants paient → argent va au client
 *   - Diane prend une commission automatique (platform_fee)
 *   - Webhook Stripe → auto-inscription étudiant
 * ════════════════════════════════════════════════════════════════════════════════
 */

import Stripe from 'stripe'

// ── Stripe instance (server-side only) ──────────────────────────────────────────
let _stripe: Stripe | null = null

export async function getStripe(): Promise<Stripe> {
  if (_stripe) return _stripe
  const { getCloudflareContext } = await import('@opennextjs/cloudflare')
  const { env } = await getCloudflareContext({ async: true })
  const secretKey = (env as any).STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY not configured')
  _stripe = new Stripe(secretKey, {
    apiVersion: '2025-04-30.basil',
    typescript: true,
  })
  return _stripe
}

// ── Get platform settings from DB ──────────────────────────────────────────────
export async function getPlatformSettings() {
  const { getDB } = await import('./db')
  const db = await getDB()
  if (!db) throw new Error('Database unavailable')
  return db.prepare('SELECT * FROM platform_settings WHERE id = 1').first()
}

// ════════════════════════════════════════════════════════════════════════════════
// CONNECT ONBOARDING — Créer & gérer les comptes Stripe Connect des clients
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Crée un compte Stripe Express pour un client et génère le lien d'onboarding
 * @param userId - ID de l'utilisateur (admin/client)
 * @param returnUrl - URL de redirection après onboarding réussi
 * @param refreshUrl - URL de redirection si onboarding échoue/doit être repris
 */
export async function createConnectAccount(userId: string, returnUrl: string, refreshUrl: string) {
  const stripe = await getStripe()
  const { getDB, generateId } = await import('./db')
  const db = await getDB()
  if (!db) throw new Error('Database unavailable')

  // Vérifier si le client a déjà un compte Stripe
  const existing = await db.prepare('SELECT * FROM stripe_accounts WHERE user_id = ?').bind(userId).first()

  let accountId: string

  if (existing) {
    // Compte existe déjà, vérifier son statut
    accountId = existing.stripe_account_id as string
  } else {
    // Créer un nouveau compte Express
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'CA',
      email: null, // sera rempli pendant l'onboarding
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      settings: {
        payouts: {
          schedule: {
            interval: 'weekly',
            weekly_anchor: 'friday',
          },
        },
      },
    })

    accountId = account.id

    // Sauvegarder en base
    await db.prepare(`
      INSERT INTO stripe_accounts (id, user_id, stripe_account_id)
      VALUES (?, ?, ?)
    `).bind(generateId(), userId, accountId).run()
  }

  // Générer le lien d'onboarding Stripe
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })

  return {
    url: accountLink.url,
    accountId,
    isNew: !existing,
  }
}

/**
 * Récupérer le statut du compte Stripe Connect d'un client
 */
export async function getConnectStatus(userId: string) {
  const { getDB } = await import('./db')
  const db = await getDB()
  if (!db) return null

  const account = await db.prepare('SELECT * FROM stripe_accounts WHERE user_id = ?').bind(userId).first()
  if (!account) return null

  return {
    connected: true,
    accountId: account.stripe_account_id,
    onboardingComplete: !!account.onboarding_complete,
    payoutsEnabled: !!account.payouts_enabled,
    chargesEnabled: !!account.charges_enabled,
    detailsSubmitted: !!account.details_submitted,
    businessName: account.business_name,
    email: account.email,
    country: account.country,
  }
}

/**
 * Synchroniser le statut du compte Stripe avec la DB (appelé par webhook)
 */
export async function syncConnectAccount(stripeAccountId: string) {
  const stripe = await getStripe()
  const { getDB } = await import('./db')
  const db = await getDB()
  if (!db) return

  const account = await stripe.accounts.retrieve(stripeAccountId)

  await db.prepare(`
    UPDATE stripe_accounts SET
      onboarding_complete = ?,
      payouts_enabled = ?,
      charges_enabled = ?,
      details_submitted = ?,
      email = COALESCE(?, email),
      country = COALESCE(?, country),
      business_name = ?,
      business_url = ?,
      updated_at = datetime('now')
    WHERE stripe_account_id = ?
  `).bind(
    account.charges_enabled && account.payouts_enabled ? 1 : 0,
    account.payouts_enabled ? 1 : 0,
    account.charges_enabled ? 1 : 0,
    account.details_submitted ? 1 : 0,
    account.email || null,
    account.country || null,
    account.business_profile?.name || null,
    account.business_profile?.url || null,
    stripeAccountId,
  ).run()
}

// ════════════════════════════════════════════════════════════════════════════════
// CHECKOUT — Créer des sessions de paiement pour les étudiants
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Créer une session Checkout Stripe pour l'achat d'une formation
 * L'argent va au compte Stripe Connect du client, Diane prend sa commission
 *
 * @param formationId - ID de la formation
 * @param studentEmail - Email de l'étudiant
 * @param studentName - Nom de l'étudiant (optionnel)
 * @param successUrl - URL après paiement réussi
 * @param cancelUrl - URL si paiement annulé
 */
export async function createCheckoutSession(
  formationId: string,
  studentEmail: string,
  studentName: string | null,
  successUrl: string,
  cancelUrl: string,
) {
  const stripe = await getStripe()
  const { getDB, generateId } = await import('./db')
  const db = await getDB()
  if (!db) throw new Error('Database unavailable')

  // 1. Récupérer la formation
  const formation = await db.prepare('SELECT * FROM formations WHERE id = ? AND status = ?')
    .bind(formationId, 'published').first()
  if (!formation) throw new Error('Formation not found or not published')

  // 2. Récupérer le compte Stripe Connect du créateur
  const stripeAccount = await db.prepare(`
    SELECT sa.* FROM stripe_accounts sa
    INNER JOIN formations f ON f.tenant_id = sa.user_id
    WHERE f.id = ?
  `).bind(formationId).first()

  if (!stripeAccount) throw new Error('Creator has not connected their Stripe account')
  if (!stripeAccount.charges_enabled) throw new Error('Creator payment processing is not enabled')

  // 3. Calculer les montants
  const amount = Math.round(parseFloat(formation.price) * 100) // en cents
  const settings = await getPlatformSettings()
  const feePercent = (settings?.platform_fee_percent || 5) / 100
  const feeFixed = settings?.platform_fee_fixed || 50 // 50 cents
  const platformFee = Math.round(amount * feePercent) + feeFixed
  const netAmount = amount - platformFee

  // 4. Vérifier si l'étudiant a déjà acheté
  const existingEnrollment = await db.prepare(
    'SELECT id FROM formation_enrollments WHERE formation_id = ? AND student_email = ? AND status = ?'
  ).bind(formationId, studentEmail, 'active').first()

  if (existingEnrollment) throw new Error('You are already enrolled in this formation')

  // 5. Vérifier si une session de paiement est déjà en cours pour cet email
  const existingPayment = await db.prepare(
    "SELECT id FROM payments WHERE formation_id = ? AND student_email = ? AND status = 'pending'"
  ).bind(formationId, studentEmail).first()

  if (existingPayment) {
    // Retourner la session existante
    const existingSession = await db.prepare('SELECT stripe_checkout_session_id FROM payments WHERE id = ?')
      .bind(existingPayment.id).first()
    if (existingSession?.stripe_checkout_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(
          existingSession.stripe_checkout_session_id,
          undefined,
          { stripeAccount: stripeAccount.stripe_account_id }
        )
        if (session.status === 'open') {
          return { url: session.url, sessionId: session.id }
        }
      } catch { /* session expirée, en créer une nouvelle */ }
    }
  }

  // 6. Créer la session Checkout sur le compte du créateur
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: formation.currency || 'cad',
        unit_amount: amount,
        product_data: {
          name: formation.title,
          description: (formation.description || '').slice(0, 500),
          images: formation.thumbnail_url ? [formation.thumbnail_url] : [],
        },
      },
      quantity: 1,
    }],
    payment_intent_data: {
      application_fee_amount: platformFee,
      metadata: {
        formation_id: formationId,
        student_email: studentEmail,
        student_name: studentName || '',
        platform_fee: platformFee.toString(),
        net_amount: netAmount.toString(),
      },
    },
    customer_email: studentEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      formation_id: formationId,
      student_email: studentEmail,
    },
    // Préférence locale
    locale: 'fr',
  }, {
    stripeAccount: stripeAccount.stripe_account_id,
  })

  // 7. Sauvegarder le paiement en base
  await db.prepare(`
    INSERT INTO payments (id, formation_id, student_email, student_name, stripe_checkout_session_id,
      stripe_account_id, amount, currency, platform_fee_amount, net_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).bind(
    generateId(), formationId, studentEmail, studentName, session.id,
    stripeAccount.stripe_account_id, amount, formation.currency || 'cad',
    platformFee, netAmount,
  ).run()

  return {
    url: session.url,
    sessionId: session.id,
    amount,
    currency: formation.currency || 'cad',
    platformFee,
    netAmount,
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// WEBHOOK — Traitement automatique des événements Stripe
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Traiter un webhook Stripe entrant
 * Gère : checkout.session.completed (inscription auto), account.updated (sync statut)
 */
export async function handleWebhook(payload: string | Buffer, signature: string): Promise<{ received: boolean }> {
  const stripe = await getStripe()
  const { getCloudflareContext } = await import('@opennextjs/cloudflare')
  const { env } = await getCloudflareContext({ async: true })
  const webhookSecret = (env as any).STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return { received: false }
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return { received: false }
  }

  const { getDB, generateId } = await import('./db')
  const db = await getDB()
  if (!db) return { received: true }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutComplete(session, db, generateId)
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        await syncConnectAccount(account.id)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        await db.prepare("UPDATE payments SET status = 'expired' WHERE stripe_checkout_session_id = ?")
          .bind(session.id).run()
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await handleRefund(charge, db)
        break
      }
    }
  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err)
  }

  return { received: true }
}

/**
 * Paiement réussi → créer l'inscription étudiant automatiquement
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session, db: any, generateId: () => string) {
  const { getStripe } = await import('./stripe')

  const formationId = session.metadata?.formation_id
  const studentEmail = session.customer_email || session.metadata?.student_email
  const studentName = session.metadata?.student_name || ''
  const stripeAccountId = session.metadata?.stripe_account_id

  if (!formationId || !studentEmail) {
    console.error('Missing formation_id or student_email in checkout session metadata')
    return
  }

  // 1. Mettre à jour le paiement
  await db.prepare(`
    UPDATE payments SET
      status = 'paid',
      paid_at = datetime('now'),
      stripe_payment_intent_id = COALESCE(?, stripe_payment_intent_id)
    WHERE stripe_checkout_session_id = ?
  `).bind(
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
    session.id,
  ).run()

  // 2. Vérifier si l'étudiant est déjà inscrit
  const existing = await db.prepare(
    'SELECT id FROM formation_enrollments WHERE formation_id = ? AND student_email = ? AND status = ?'
  ).bind(formationId, studentEmail, 'active').first()

  if (existing) {
    console.log(`Student ${studentEmail} already enrolled in ${formationId}`)
    return
  }

  // 3. Récupérer le payment_id
  const payment = await db.prepare('SELECT id FROM payments WHERE stripe_checkout_session_id = ?')
    .bind(session.id).first()

  // 4. Créer l'inscription
  await db.prepare(`
    INSERT INTO formation_enrollments (id, formation_id, student_email, student_name, payment_id, status, enrolled_at)
    VALUES (?, ?, ?, ?, ?, 'active', datetime('now'))
  `).bind(
    generateId(), formationId, studentEmail, studentName, payment?.id || null,
  ).run()

  // 5. Créer ou mettre à jour le compte étudiant (users table)
  const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').bind(studentEmail).first()

  if (!existingUser) {
    const userId = generateId()
    const affiliateCode = await (await import('./db')).generateUniqueAffiliateCode(db)
    await db.prepare(`
      INSERT INTO users (id, email, full_name, role, affiliate_code, created_at)
      VALUES (?, ?, ?, 'affiliate', ?, datetime('now'))
    `).bind(userId, studentEmail, studentName, affiliateCode).run()
  }

  // 6. Send enrollment confirmation email
  try {
    const formationTitle = (await db.prepare('SELECT title FROM formations WHERE id = ?').bind(formationId).first())?.title || 'Formation'
    const { getEnrollmentConfirmationHTML } = await import('./email-templates')
    const { sendWelcomeEmail } = await import('./resend')
    const origin = 'https://travail-pour-toi.com'
    const accessUrl = `${origin}/formations/${formationId}/learn?email=${encodeURIComponent(studentEmail)}`
    const htmlContent = getEnrollmentConfirmationHTML(formationTitle, studentName || '', accessUrl)

    // Use the Resend API directly via fetch (server-side compatible)
    const RESEND_API_KEY = 're_cKkFtPtR_1dXxefB6C9sM7sKzWBhKde9z'
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NyXia MarketPlace <noreply@cashflowecosysteme.com>',
        to: [studentEmail],
        subject: `Bienvenue dans votre formation : ${formationTitle}`,
        html: htmlContent,
      }),
    })
    if (emailRes.ok) {
      console.log(`Enrollment confirmation email sent to ${studentEmail}`)
    } else {
      const emailError = await emailRes.text()
      console.error(`Failed to send enrollment email: ${emailError}`)
    }
  } catch (emailErr) {
    console.error('Failed to send enrollment confirmation email:', emailErr)
    // Don't fail the enrollment if email fails
  }

  console.log(`Enrollment created: ${studentEmail} → formation ${formationId}`)
}

/**
 * Remboursement → désactiver l'inscription
 */
async function handleRefund(charge: Stripe.Charge, db: any) {
  const paymentIntentId = charge.payment_intent as string
  if (!paymentIntentId) return

  // Trouver le paiement et le marquer comme remboursé
  const payment = await db.prepare('SELECT id, formation_id, student_email FROM payments WHERE stripe_payment_intent_id = ?')
    .bind(paymentIntentId).first()

  if (!payment) return

  await db.prepare(`
    UPDATE payments SET status = 'refunded', refunded_at = datetime('now')
    WHERE stripe_payment_intent_id = ?
  `).bind(paymentIntentId).run()

  await db.prepare(`
    UPDATE formation_enrollments SET status = 'refunded', completed_at = datetime('now')
    WHERE formation_id = ? AND student_email = ? AND status = 'active'
  `).bind(payment.formation_id, payment.student_email).run()
}

// ════════════════════════════════════════════════════════════════════════════════
// UTILITAIRES — Statistiques, vérifications, etc.
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Vérifier si un étudiant a accès à une formation
 */
export async function checkEnrollment(formationId: string, email: string | null) {
  const { getDB } = await import('./db')
  const db = await getDB()
  if (!db) return { hasAccess: false, enrollment: null }

  if (!email) return { hasAccess: false, enrollment: null }

  const enrollment = await db.prepare(`
    SELECT * FROM formation_enrollments
    WHERE formation_id = ? AND student_email = ? AND status = 'active'
  `).bind(formationId, email).first()

  return {
    hasAccess: !!enrollment,
    enrollment: enrollment || null,
  }
}

/**
 * Récupérer les statistiques de paiement pour un créateur
 */
export async function getCreatorPaymentStats(userId: string) {
  const { getDB } = await import('./db')
  const db = await getDB()
  if (!db) return null

  const stats = await db.prepare(`
    SELECT
      COUNT(*) as total_payments,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) as successful_payments,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_revenue_cents,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN net_amount ELSE 0 END), 0) as total_net_cents,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN platform_fee_amount ELSE 0 END), 0) as total_fees_cents,
      COUNT(DISTINCT CASE WHEN status = 'paid' THEN student_email END) as unique_students
    FROM payments p
    INNER JOIN formations f ON f.id = p.formation_id
    WHERE f.tenant_id = ?
  `).bind(userId).first()

  return stats
}

/**
 * Mettre à jour la progression d'un étudiant
 */
export async function updateProgress(formationId: string, email: string, completedLessonId: string) {
  const { getDB } = await import('./db')
  const db = await getDB()
  if (!db) return null

  // Récupérer l'inscription actuelle
  const enrollment = await db.prepare(`
    SELECT * FROM formation_enrollments
    WHERE formation_id = ? AND student_email = ? AND status = 'active'
  `).bind(formationId, email).first()

  if (!enrollment) return null

  let completedLessons: string[] = []
  try {
    completedLessons = JSON.parse(enrollment.completed_lessons || '[]')
  } catch { /* empty array */ }

  if (!completedLessons.includes(completedLessonId)) {
    completedLessons.push(completedLessonId)
  }

  // Calculer le pourcentage de progression
  const totalLessons = await db.prepare(
    'SELECT COUNT(*) as count FROM formation_lessons WHERE formation_id = ?'
  ).bind(formationId).first()
  const total = totalLessons?.count || 1
  const percent = Math.round((completedLessons.length / total) * 100)

  // Mettre à jour
  const isComplete = completedLessons.length >= total && total > 0

  await db.prepare(`
    UPDATE formation_enrollments SET
      completed_lessons = ?,
      progress_percent = ?,
      completed_at = ?,
      last_accessed_at = datetime('now'),
      certificate_issued = ?
    WHERE id = ?
  `).bind(
    JSON.stringify(completedLessons),
    percent,
    isComplete ? "datetime('now')" : null,
    isComplete ? 1 : 0,
    enrollment.id,
  ).run()

  return { completedLessons, progressPercent: percent, isComplete }
}
