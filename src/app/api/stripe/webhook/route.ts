// @ts-nocheck
/**
 * POST /api/stripe/webhook
 * Reçoit et traite les webhooks Stripe
 * - checkout.session.completed → auto-inscription étudiant
 * - account.updated → synchronisation statut compte client
 * - checkout.session.expired → marquer paiement expiré
 * - charge.refunded → annuler inscription
 */
import { NextResponse } from 'next/server'
import { handleWebhook } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    const result = await handleWebhook(body, signature)

    return NextResponse.json({ received: result.received })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 },
    )
  }
}
