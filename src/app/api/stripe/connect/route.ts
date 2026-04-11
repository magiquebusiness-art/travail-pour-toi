// @ts-nocheck
/**
 * POST /api/stripe/connect
 * Crée un compte Stripe Express et génère le lien d'onboarding
 * Réservé aux admins (créateurs de formations)
 */
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createConnectAccount } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    // Vérifier l'authentification admin
    const session = await getSession(request)
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const origin = request.headers.get('origin') || 'https://travail-pour-toi.com'

    // URLs de redirection
    const returnUrl = `${origin}/admin?tab=settings&stripe=success`
    const refreshUrl = `${origin}/admin?tab=settings&stripe=refresh`

    const result = await createConnectAccount(session.userId, returnUrl, refreshUrl)

    return NextResponse.json({
      url: result.url,
      accountId: result.accountId,
      isNew: result.isNew,
    })
  } catch (error) {
    console.error('Stripe Connect error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la connexion Stripe' },
      { status: 500 },
    )
  }
}
