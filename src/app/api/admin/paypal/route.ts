export const runtime = 'edge'
import { NextResponse, type NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'


export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const db = await getDB()

    const { paypalEmail } = await request.json()

    if (!paypalEmail || !paypalEmail.includes('@')) {
      return NextResponse.json({ error: 'Email PayPal invalide' }, { status: 400 })
    }

    // Update user paypal_email
    await db
      .prepare('UPDATE users SET paypal_email = ? WHERE id = ?')
      .bind(paypalEmail.toLowerCase(), session.userId)
      .run()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PayPal save error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
