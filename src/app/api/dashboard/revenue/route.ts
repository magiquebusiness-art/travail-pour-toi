import { NextResponse, type NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

async function safeFirst(db: any, sql: string, params: any[]): Promise<any> {
  try { return await db.prepare(sql).bind(...params).first() }
  catch (e: any) { console.warn('Revenue query skipped:', e?.message); return null }
}

async function safeAll(db: any, sql: string, params: any[]): Promise<any[]> {
  try { const r = await db.prepare(sql).bind(...params).all(); return r.results || [] }
  catch (e: any) { console.warn('Revenue query skipped:', e?.message); return [] }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    if (session.role !== 'admin' && session.role !== 'super_admin' && session.role !== 'client') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Base de donnees indisponible' }, { status: 500 })

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || ''
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '10')))
    const offset = (page - 1) * limit

    const conditions: string[] = ['f.tenant_id = ?']
    const values: unknown[] = [session.userId]
    if (statusFilter) { conditions.push('p.status = ?'); values.push(statusFilter) }
    const whereClause = conditions.join(' AND ')

    const summary = await safeFirst(db, `
      SELECT
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) as total_revenue_cents,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.net_amount ELSE 0 END), 0) as total_net_cents,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.platform_fee_amount ELSE 0 END), 0) as total_fees_cents,
        COUNT(*) as total_payments,
        COUNT(CASE WHEN p.status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN p.status = 'refunded' THEN 1 END) as refunded_count
      FROM payments p INNER JOIN formations f ON f.id = p.formation_id WHERE ${whereClause}
    `, values)

    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
    const monthSummary = await safeFirst(db, `
      SELECT COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) as month_revenue_cents
      FROM payments p INNER JOIN formations f ON f.id = p.formation_id WHERE f.tenant_id = ? AND p.paid_at >= ?
    `, [session.userId, startOfMonth.toISOString()])

    const startOfWeek = new Date()
    const dow = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - (dow === 0 ? 6 : dow - 1))
    startOfWeek.setHours(0, 0, 0, 0)
    const weekSummary = await safeFirst(db, `
      SELECT COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) as week_revenue_cents
      FROM payments p INNER JOIN formations f ON f.id = p.formation_id WHERE f.tenant_id = ? AND p.paid_at >= ?
    `, [session.userId, startOfWeek.toISOString()])

    const countResult = await safeFirst(db, `
      SELECT COUNT(*) as total FROM payments p INNER JOIN formations f ON f.id = p.formation_id WHERE ${whereClause}
    `, values)
    const total = countResult?.total || 0

    const payments = await safeAll(db, `
      SELECT p.id, p.student_email, p.student_name, p.amount, p.currency, p.net_amount,
             p.platform_fee_amount, p.status, p.created_at, p.paid_at,
             f.title as formation_title, f.id as formation_id
      FROM payments p INNER JOIN formations f ON f.id = p.formation_id WHERE ${whereClause}
      ORDER BY p.created_at DESC LIMIT ? OFFSET ?
    `, [...values, limit, offset])

    return NextResponse.json({
      summary: {
        totalRevenueCents: summary?.total_revenue_cents || 0,
        totalNetCents: summary?.total_net_cents || 0,
        totalFeesCents: summary?.total_fees_cents || 0,
        totalPayments: summary?.total_payments || 0,
        paidCount: summary?.paid_count || 0,
        pendingCount: summary?.pending_count || 0,
        refundedCount: summary?.refunded_count || 0,
        monthRevenueCents: monthSummary?.month_revenue_cents || 0,
        weekRevenueCents: weekSummary?.week_revenue_cents || 0,
      },
      payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    console.error('Dashboard revenue error:', error?.message || error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
