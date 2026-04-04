/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from 'next/server'
import { getDB, generateId } from '@/lib/db'
import { getSession } from '@/lib/auth'


export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const db = await getDB()

    // Check if admin
    const profile = await db
      .prepare('SELECT role FROM users WHERE id = ?')
      .bind(session.userId)
      .first()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { affiliateId, amount } = await request.json()

    if (!affiliateId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }

    // Get affiliate's paypal email via join
    const affiliateResult = await db
      .prepare(`SELECT a.id, a.user_id, u.paypal_email, u.email FROM affiliates a JOIN users u ON a.user_id = u.id WHERE a.id = ?`)
      .bind(affiliateId)
      .first()

    if (!affiliateResult) {
      return NextResponse.json({ error: 'Affilié non trouvé' }, { status: 404 })
    }

    const paypalEmail = affiliateResult.paypal_email
    if (!paypalEmail) {
      return NextResponse.json({ error: "L'affilié n'a pas configuré son PayPal" }, { status: 400 })
    }

    // Create payout record
    const payoutId = generateId()
    const now = new Date().toISOString()
    await db
      .prepare('INSERT INTO payouts (id, admin_id, affiliate_id, amount, paypal_email, status, created_at, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(payoutId, session.userId, affiliateId, amount, paypalEmail, 'paid', now, now)
      .run()

    // Mark commissions as paid
    await db
      .prepare('UPDATE commissions SET status = ?, paid_at = ? WHERE affiliate_id = ? AND status = ?')
      .bind('paid', now, affiliateId, 'pending')
      .run()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payout error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
