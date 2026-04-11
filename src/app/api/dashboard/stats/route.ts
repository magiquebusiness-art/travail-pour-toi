import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }
    if (session.role !== 'admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    const db = await getDB()
    if (!db) {
      return NextResponse.json({ error: 'Base de donnees indisponible' }, { status: 500 })
    }

    const userId = session.userId

    // Total revenue (in cents from payments)
    const revenueResult = await db.prepare(`
      SELECT COALESCE(SUM(p.amount), 0) as total_revenue_cents,
             COALESCE(SUM(p.net_amount), 0) as total_net_cents,
             COALESCE(SUM(p.platform_fee_amount), 0) as total_fees_cents
      FROM payments p
      INNER JOIN formations f ON f.id = p.formation_id
      WHERE f.tenant_id = ? AND p.status = 'paid'
    `).bind(userId).first()

    // Revenue this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const monthRevenueResult = await db.prepare(`
      SELECT COALESCE(SUM(p.amount), 0) as month_revenue_cents
      FROM payments p
      INNER JOIN formations f ON f.id = p.formation_id
      WHERE f.tenant_id = ? AND p.status = 'paid' AND p.paid_at >= ?
    `).bind(userId, startOfMonth.toISOString()).first()

    // Revenue this week
    const startOfWeek = new Date()
    const dayOfWeek = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    startOfWeek.setHours(0, 0, 0, 0)

    const weekRevenueResult = await db.prepare(`
      SELECT COALESCE(SUM(p.amount), 0) as week_revenue_cents
      FROM payments p
      INNER JOIN formations f ON f.id = p.formation_id
      WHERE f.tenant_id = ? AND p.status = 'paid' AND p.paid_at >= ?
    `).bind(userId, startOfWeek.toISOString()).first()

    // Active students count
    const studentsResult = await db.prepare(`
      SELECT COUNT(*) as total_students
      FROM formation_enrollments e
      INNER JOIN formations f ON f.id = e.formation_id
      WHERE f.tenant_id = ? AND e.status = 'active'
    `).bind(userId).first()

    // Published formations count
    const formationsResult = await db.prepare(`
      SELECT COUNT(*) as total_formations,
             SUM(CASE WHEN f.status = 'published' THEN 1 ELSE 0 END) as published_formations
      FROM formations f
      WHERE f.tenant_id = ?
    `).bind(userId).first()

    // Average completion rate
    const completionResult = await db.prepare(`
      SELECT COALESCE(AVG(e.progress_percent), 0) as avg_completion
      FROM formation_enrollments e
      INNER JOIN formations f ON f.id = e.formation_id
      WHERE f.tenant_id = ? AND e.status = 'active'
    `).bind(userId).first()

    // Revenue chart data - last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const chartData = await db.prepare(`
      SELECT DATE(p.paid_at) as date, SUM(p.amount) as total_cents, COUNT(*) as count
      FROM payments p
      INNER JOIN formations f ON f.id = p.formation_id
      WHERE f.tenant_id = ? AND p.status = 'paid' AND p.paid_at >= ?
      GROUP BY DATE(p.paid_at)
      ORDER BY DATE(p.paid_at) ASC
    `).bind(userId, thirtyDaysAgo.toISOString()).all()

    // Recent enrollments (last 10)
    const recentEnrollments = await db.prepare(`
      SELECT e.id, e.student_email, e.student_name, e.progress_percent, e.status, e.enrolled_at,
             f.title as formation_title, f.id as formation_id
      FROM formation_enrollments e
      INNER JOIN formations f ON f.id = e.formation_id
      WHERE f.tenant_id = ?
      ORDER BY e.enrolled_at DESC
      LIMIT 10
    `).bind(userId).all()

    // Completion rate distribution — how students are spread across progress ranges
    const completionDistribution = await db.prepare(`
      SELECT
        SUM(CASE WHEN e.progress_percent < 25 THEN 1 ELSE 0 END) as range_0_25,
        SUM(CASE WHEN e.progress_percent >= 25 AND e.progress_percent < 50 THEN 1 ELSE 0 END) as range_25_50,
        SUM(CASE WHEN e.progress_percent >= 50 AND e.progress_percent < 75 THEN 1 ELSE 0 END) as range_50_75,
        SUM(CASE WHEN e.progress_percent >= 75 AND e.progress_percent < 100 THEN 1 ELSE 0 END) as range_75_100
      FROM formation_enrollments e
      INNER JOIN formations f ON f.id = e.formation_id
      WHERE f.tenant_id = ? AND e.status = 'active'
    `).bind(userId).first()

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
      chartData: chartData.results || [],
      recentEnrollments: recentEnrollments.results || [],
    })
  } catch (error: any) {
    console.error('Dashboard stats error:', error?.message || error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
