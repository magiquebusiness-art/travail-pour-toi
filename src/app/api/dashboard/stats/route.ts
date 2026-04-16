import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Helper: execute a query safely — return null if table doesn't exist
async function safeQuery(db: any, sql: string, params: any[]): Promise<any> {
  try {
    const result = await db.prepare(sql).bind(...params).first()
    return result
  } catch (e: any) {
    console.warn('Stats query skipped (table may not exist):', e?.message || e)
    return null
  }
}

async function safeAll(db: any, sql: string, params: any[]): Promise<any[]> {
  try {
    const result = await db.prepare(sql).bind(...params).all()
    return result.results || []
  } catch (e: any) {
    console.warn('Stats query skipped (table may not exist):', e?.message || e)
    return []
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }
    if (session.role !== 'admin' && session.role !== 'super_admin' && session.role !== 'client') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    const db = await getDB()
    if (!db) {
      return NextResponse.json({ error: 'Base de donnees indisponible' }, { status: 500 })
    }

    const userId = session.userId

    // Total revenue
    const revenueResult = await safeQuery(db, `
      SELECT COALESCE(SUM(p.amount), 0) as total_revenue_cents,
             COALESCE(SUM(p.net_amount), 0) as total_net_cents,
             COALESCE(SUM(p.platform_fee_amount), 0) as total_fees_cents
      FROM payments p
      INNER JOIN formations f ON f.id = p.formation_id
      WHERE f.tenant_id = ? AND p.status = 'paid'
    `, [userId])

    // Revenue this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const monthRevenueResult = await safeQuery(db, `
      SELECT COALESCE(SUM(p.amount), 0) as month_revenue_cents
      FROM payments p
      INNER JOIN formations f ON f.id = p.formation_id
      WHERE f.tenant_id = ? AND p.status = 'paid' AND p.paid_at >= ?
    `, [userId, startOfMonth.toISOString()])

    // Revenue this week
    const startOfWeek = new Date()
    const dayOfWeek = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    startOfWeek.setHours(0, 0, 0, 0)

    const weekRevenueResult = await safeQuery(db, `
      SELECT COALESCE(SUM(p.amount), 0) as week_revenue_cents
      FROM payments p
      INNER JOIN formations f ON f.id = p.formation_id
      WHERE f.tenant_id = ? AND p.status = 'paid' AND p.paid_at >= ?
    `, [userId, startOfWeek.toISOString()])

    // Active students
    const studentsResult = await safeQuery(db, `
      SELECT COUNT(*) as total_students
      FROM formation_enrollments e
      INNER JOIN formations f ON f.id = e.formation_id
      WHERE f.tenant_id = ? AND e.status = 'active'
    `, [userId])

    // Published formations
    const formationsResult = await safeQuery(db, `
      SELECT COUNT(*) as total_formations,
             SUM(CASE WHEN f.status = 'published' THEN 1 ELSE 0 END) as published_formations
      FROM formations f
      WHERE f.tenant_id = ?
    `, [userId])

    // Average completion
    const completionResult = await safeQuery(db, `
      SELECT COALESCE(AVG(e.progress_percent), 0) as avg_completion
      FROM formation_enrollments e
      INNER JOIN formations f ON f.id = e.formation_id
      WHERE f.tenant_id = ? AND e.status = 'active'
    `, [userId])

    // Chart data - last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const chartData = await safeAll(db, `
      SELECT DATE(p.paid_at) as date, SUM(p.amount) as total_cents, COUNT(*) as count
      FROM payments p
      INNER JOIN formations f ON f.id = p.formation_id
      WHERE f.tenant_id = ? AND p.status = 'paid' AND p.paid_at >= ?
      GROUP BY DATE(p.paid_at)
      ORDER BY DATE(p.paid_at) ASC
    `, [userId, thirtyDaysAgo.toISOString()])

    // Recent enrollments
    const recentEnrollments = await safeAll(db, `
      SELECT e.id, e.student_email, e.student_name, e.progress_percent, e.status, e.enrolled_at,
             f.title as formation_title, f.id as formation_id
      FROM formation_enrollments e
      INNER JOIN formations f ON f.id = e.formation_id
      WHERE f.tenant_id = ?
      ORDER BY e.enrolled_at DESC
      LIMIT 10
    `, [userId])

    // Completion distribution
    const completionDistribution = await safeQuery(db, `
      SELECT
        SUM(CASE WHEN e.progress_percent < 25 THEN 1 ELSE 0 END) as range_0_25,
        SUM(CASE WHEN e.progress_percent >= 25 AND e.progress_percent < 50 THEN 1 ELSE 0 END) as range_25_50,
        SUM(CASE WHEN e.progress_percent >= 50 AND e.progress_percent < 75 THEN 1 ELSE 0 END) as range_50_75,
        SUM(CASE WHEN e.progress_percent >= 75 AND e.progress_percent < 100 THEN 1 ELSE 0 END) as range_75_100
      FROM formation_enrollments e
      INNER JOIN formations f ON f.id = e.formation_id
      WHERE f.tenant_id = ? AND e.status = 'active'
    `, [userId])

    const completionRateDistribution = [
      { range: '0-25%', count: completionDistribution?.range_0_25 || 0 },
      { range: '25-50%', count: completionDistribution?.range_25_50 || 0 },
      { range: '50-75%', count: completionDistribution?.range_50_75 || 0 },
      { range: '75-100%', count: completionDistribution?.range_75_100 || 0 },
    ]

    return NextResponse.json({
      stats: {
        totalRevenueCents: revenueResult?.total_revenue_cents || 0,
        totalNetCents: revenueResult?.total_net_cents || 0,
        totalFeesCents: revenueResult?.total_fees_cents || 0,
        monthRevenueCents: monthRevenueResult?.month_revenue_cents || 0,
        weekRevenueCents: weekRevenueResult?.week_revenue_cents || 0,
        totalStudents: studentsResult?.total_students || 0,
        totalFormations: formationsResult?.total_formations || 0,
        publishedFormations: formationsResult?.published_formations || 0,
        avgCompletion: Math.round(completionResult?.avg_completion || 0),
      },
      completionRateDistribution,
      chartData,
      recentEnrollments,
    })
  } catch (error: any) {
    console.error('Dashboard stats error:', error?.message || error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
