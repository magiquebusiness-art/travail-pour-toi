// @ts-nocheck
/**
 * GET /api/stripe/connect/callback
 * Stripe redirige ici après l'onboarding du client
 * Synchronise le statut du compte et redirige vers le dashboard admin
 */
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { syncConnectAccount } from '@/lib/stripe'

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('account')

    if (accountId) {
      // Synchroniser le statut du compte Stripe
      await syncConnectAccount(accountId)
    }

    // Rediriger vers le dashboard admin avec indicateur de succès
    const origin = request.headers.get('origin') || 'https://travail-pour-toi.com'
    return NextResponse.redirect(`${origin}/admin?tab=settings&stripe=success`)
  } catch (error) {
    console.error('Stripe Connect callback error:', error)
    const origin = request.headers.get('origin') || 'https://travail-pour-toi.com'
    return NextResponse.redirect(`${origin}/admin?tab=settings&stripe=error`)
  }
}
