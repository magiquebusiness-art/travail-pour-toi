// @ts-nocheck
/**
 * GET /api/stripe/connect/status
 * Récupère le statut de connexion Stripe du client connecté
 * Réservé aux admins
 */
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getConnectStatus } from '@/lib/stripe'

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const status = await getConnectStatus(session.userId)

    return NextResponse.json({
      connected: !!status,
      ...status,
    })
  } catch (error) {
    console.error('Stripe status error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut Stripe' },
      { status: 500 },
    )
  }
}
