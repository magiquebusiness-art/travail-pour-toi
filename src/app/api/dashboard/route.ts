import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'


export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const db = await getDB()

    // Get user
    const user = await db
      .prepare('SELECT id, email, full_name, role, affiliate_code, avatar_url, paypal_email FROM users WHERE id = ?')
      .bind(session.userId)
      .first()

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Check if super_admin or admin - redirect info
    if (user.role === 'super_admin') {
      return NextResponse.json({ isSuperAdmin: true, profile: user })
    }
    if (user.role === 'admin') {
      return NextResponse.json({ isAdmin: true, profile: user })
    }

    // Get affiliate record with program
    const affiliate = await db
      .prepare(`
        SELECT a.*, p.name as program_name, p.commission_l1, p.commission_l2, p.commission_l3
        FROM affiliates a
        LEFT JOIN programs p ON a.program_id = p.id
        WHERE a.user_id = ?
      `)
      .bind(session.userId)
      .first()

    if (!affiliate) {
      return NextResponse.json({
        profile: user,
        affiliate: null,
        team: [],
        messages: [],
        stats: {
          totalEarnings: 0,
          pendingCommissions: 0,
          totalClicks: 0,
          l1Referrals: 0,
          l2Referrals: 0,
          l3Referrals: 0,
          recentSales: [],
          weeklySales: [],
        },
      })
    }

    // --- TEAM MEMBERS ---
    const team: any[] = []

    // Level 1 (direct referrals)
    const l1Members = await db
      .prepare(`
        SELECT a.id, a.created_at, u.full_name, u.email
        FROM affiliates a
        JOIN users u ON a.user_id = u.id
        WHERE a.parent_affiliate_id = ?
      `)
      .bind(affiliate.id)
      .all()

    const l1Ids: string[] = []
    for (const m of l1Members.results || []) {
      l1Ids.push(m.id)
      team.push({ id: m.id, full_name: m.full_name || 'Nouveau', email: m.email || '', level: 1, created_at: m.created_at })
    }

    // Level 2 (grandchildren)
    const l2Members = await db
      .prepare(`
        SELECT a.id, a.created_at, u.full_name, u.email
        FROM affiliates a
        JOIN users u ON a.user_id = u.id
        WHERE a.grandparent_affiliate_id = ?
      `)
      .bind(affiliate.id)
      .all()

    const l2Ids: string[] = []
    for (const m of l2Members.results || []) {
      l2Ids.push(m.id)
      team.push({ id: m.id, full_name: m.full_name || 'Nouveau', email: m.email || '', level: 2, created_at: m.created_at })
    }

    // Level 3 (children of L2)
    if (l2Ids.length > 0) {
      const placeholders = l2Ids.map(() => '?').join(',')
      const l3Members = await db
        .prepare(`
          SELECT a.id, a.created_at, u.full_name, u.email
          FROM affiliates a
          JOIN users u ON a.user_id = u.id
          WHERE a.parent_affiliate_id IN (${placeholders})
        `)
        .bind(...l2Ids)
        .all()

      for (const m of l3Members.results || []) {
        team.push({ id: m.id, full_name: m.full_name || 'Nouveau', email: m.email || '', level: 3, created_at: m.created_at })
      }
    }

    // --- MESSAGES ---
    const messages = await db
      .prepare(`
        SELECT id, subject, content, created_at, read_at
        FROM messages
        WHERE (recipient_id = ? OR is_broadcast = 1)
        ORDER BY created_at DESC
        LIMIT 5
      `)
      .bind(session.userId)
      .all()

    // --- STATS ---
    const paidCommissions = await db
      .prepare('SELECT COALESCE(SUM(amount), 0) as total FROM commissions WHERE affiliate_id = ? AND status = ?')
      .bind(affiliate.id, 'paid')
      .first()
    const totalEarnings = paidCommissions?.total || 0

    const pendingCommissions = await db
      .prepare('SELECT COALESCE(SUM(amount), 0) as total FROM commissions WHERE affiliate_id = ? AND status = ?')
      .bind(affiliate.id, 'pending')
      .first()
    const pendingCommissionsTotal = pendingCommissions?.total || 0

    const clickCount = await db
      .prepare('SELECT COUNT(*) as total FROM clicks WHERE affiliate_id = ?')
      .bind(affiliate.id)
      .first()
    const totalClicks = clickCount?.total || 0

    const l1Count = (l1Members.results || []).length
    const l2Count = (l2Members.results || []).length
    let l3Count = 0
    if (l2Ids.length > 0) {
      const placeholders = l2Ids.map(() => '?').join(',')
      const l3Result = await db
        .prepare(`SELECT COUNT(*) as total FROM affiliates WHERE parent_affiliate_id IN (${placeholders})`)
        .bind(...l2Ids)
        .first()
      l3Count = l3Result?.total || 0
    }

    // Recent sales
    const recentSales = await db
      .prepare('SELECT id, amount, status, created_at, commission_l1, customer_email FROM sales WHERE affiliate_id = ? ORDER BY created_at DESC LIMIT 10')
      .bind(affiliate.id)
      .all()

    // Weekly sales
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const weeklySalesData = await db
      .prepare('SELECT amount, created_at FROM sales WHERE affiliate_id = ? AND created_at >= ?')
      .bind(affiliate.id, sevenDaysAgo.toISOString())
      .all()

    const weeklySales: { date: string; total: number; count: number }[] = []
    const salesByDay: Record<string, { total: number; count: number }> = {}
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      salesByDay[dateStr] = { total: 0, count: 0 }
    }
    for (const sale of weeklySalesData.results || []) {
      const dateStr = (sale.created_at as string).split('T')[0]
      if (salesByDay[dateStr]) {
        salesByDay[dateStr].total += Number(sale.amount)
        salesByDay[dateStr].count += 1
      }
    }
    Object.entries(salesByDay).forEach(([date, data]) => {
      weeklySales.push({ date, total: data.total, count: data.count })
    })

    // Get marketplace products (active only)
    const marketplaceProducts = await db
      .prepare(`SELECT p.id, p.title, p.description_short, p.price, p.commission_n1, p.affiliate_link, p.image_url, c.name as category_name
        FROM marketplace_products p
        LEFT JOIN marketplace_categories c ON p.category_id = c.id
        WHERE p.status = ?
        ORDER BY p.created_at DESC
        LIMIT 20`)
      .bind('active')
      .all()

    return NextResponse.json({
      profile: user,
      affiliate,
      team,
      messages: messages.results || [],
      stats: {
        totalEarnings,
        pendingCommissions: pendingCommissionsTotal,
        totalClicks,
        l1Referrals: l1Count,
        l2Referrals: l2Count,
        l3Referrals: l3Count,
        recentSales: recentSales.results || [],
        weeklySales,
      },
      marketplaceProducts: marketplaceProducts.results || [],
    })
  } catch (error: any) {
    console.error('Dashboard error:', error?.message || error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
