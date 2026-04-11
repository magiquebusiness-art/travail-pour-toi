// @ts-nocheck
/**
 * POST /api/stripe/checkout
 * Crée une session de paiement Stripe pour l'achat d'une formation
 * Public — accessible aux étudiants (pas besoin d'être connecté)
 */
import { NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { formationId, studentEmail, studentName } = body

    // Validations
    if (!formationId || !studentEmail) {
      return NextResponse.json(
        { error: 'Formation ID et email sont requis' },
        { status: 400 },
      )
    }

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(studentEmail)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 },
      )
    }

    const origin = request.headers.get('origin') || 'https://travail-pour-toi.com'
    const successUrl = `${origin}/formations/${formationId}/learn?payment=success&email=${encodeURIComponent(body.studentEmail)}`
    const cancelUrl = `${origin}/formations/${formationId}?payment=cancelled`

    const result = await createCheckoutSession(
      formationId,
      studentEmail,
      studentName || null,
      successUrl,
      cancelUrl,
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la création du paiement' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 },
    )
  }
}
