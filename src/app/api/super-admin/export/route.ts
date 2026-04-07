export const runtime = 'edge'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'


export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const db = await getDB()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'users'

    // Verify super admin
    const profile = await db
      .prepare('SELECT role FROM users WHERE id = ?')
      .bind(session.userId)
      .first()

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    let csv = ''

    if (type === 'users') {
      const usersResult = await db
        .prepare('SELECT email, full_name, role, affiliate_code, paypal_email, subdomain, created_at FROM users ORDER BY created_at DESC')
        .all()
      const users = usersResult.results || []

      csv = 'Email,Nom,Rôle,Code Affiliation,PayPal,Sous-domaine,Date inscription\n'
      users.forEach((u: any) => {
        csv += `"${u.email}","${u.full_name || ''}","${u.role}","${u.affiliate_code}","${u.paypal_email || ''}","${u.subdomain || ''}","${u.created_at}"\n`
      })
    } else if (type === 'sales') {
      const salesResult = await db
        .prepare(`SELECT s.amount, s.status, s.commission_l1, s.commission_l2, s.commission_l3, s.customer_email, s.created_at,
          u.email as affiliate_email, u.full_name as affiliate_name
          FROM sales s
          JOIN affiliates a ON s.affiliate_id = a.id
          JOIN users u ON a.user_id = u.id
          ORDER BY s.created_at DESC`)
        .all()
      const sales = salesResult.results || []

      csv = 'Montant,Statut,Commission L1,Commission L2,Commission L3,Client Email,Affilié,Date\n'
      sales.forEach((s: any) => {
        csv += `"${s.amount}","${s.status}","${s.commission_l1}","${s.commission_l2}","${s.commission_l3}","${s.customer_email || ''}","${s.affiliate_name || ''} (${s.affiliate_email || ''})","${s.created_at}"\n`
      })
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${type}_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
