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

    // Get profile
    const profile = await db
      .prepare('SELECT id, email, full_name, paypal_email, affiliate_code, role, subdomain, admin_id, webhook_secret, custom_slug FROM users WHERE id = ?')
      .bind(session.userId)
      .first()

    if (!profile) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 })
    }

    // Check role - must be admin or super_admin
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // If super_admin, redirect to super-admin page
    if (profile.role === 'super_admin') {
      return NextResponse.json({ redirect: '/super-admin' })
    }

    // Get Level 2 affiliates: users where admin_id = current user and role = 'affiliate'
    const teamMembersResult = await db
      .prepare('SELECT id, email, full_name, paypal_email, affiliate_code, role, created_at, admin_id FROM users WHERE admin_id = ? AND role = ? ORDER BY created_at DESC')
      .bind(session.userId, 'affiliate')
      .all()

    const teamMembers = teamMembersResult.results || []

    // Get affiliate record IDs and stats for these team members
    const memberIds = teamMembers.map((m: any) => m.id) || []
    let affiliateRecords: any[] = []
    if (memberIds.length > 0) {
      const placeholders = memberIds.map(() => '?').join(',')
      const affiliateResult = await db
        .prepare(`SELECT id, user_id, status, total_earnings, total_referrals FROM affiliates WHERE user_id IN (${placeholders})`)
        .bind(...memberIds)
        .all()
      affiliateRecords = affiliateResult.results || []
    }

    // Build a map of user_id -> affiliate record for quick lookup
    const affiliateByUserId = new Map<string, any>()
    affiliateRecords.forEach((a: any) => affiliateByUserId.set(a.user_id, a))

    // Merge profile data with affiliate stats
    const affiliates = (teamMembers || []).map((m: any) => {
      const aff = affiliateByUserId.get(m.id)
      return {
        id: m.id,
        email: m.email,
        full_name: m.full_name,
        paypal_email: m.paypal_email,
        affiliate_code: m.affiliate_code,
        role: m.role,
        created_at: m.created_at,
        admin_id: m.admin_id,
        status: aff?.status || 'active',
        total_earnings: aff?.total_earnings || 0,
        total_referrals: aff?.total_referrals || 0,
        affiliate_record_id: aff?.id || null,
      }
    })

    // Get Level 3 affiliates: children of Level 2 members
    let level3Members: any[] = []
    if (memberIds.length > 0) {
      const l3Placeholders = memberIds.map(() => '?').join(',')
      const l3Result = await db
        .prepare(`SELECT id, email, full_name, affiliate_code, role, created_at, parent_id, admin_id FROM users WHERE parent_id IN (${l3Placeholders})`)
        .bind(...memberIds)
        .all()
      level3Members = l3Result.results || []
    }

    // Get affiliate IDs from affiliate records (for sales/commissions queries)
    const affiliateIds = affiliateRecords.map((a: any) => a.id) || []

    // Get total sales for this admin's affiliates
    let totalSales = 0
    let totalRevenue = 0
    let pendingPayouts = 0

    if (affiliateIds.length > 0) {
      const salesPlaceholders = affiliateIds.map(() => '?').join(',')
      const salesResult = await db
        .prepare(`SELECT amount FROM sales WHERE affiliate_id IN (${salesPlaceholders})`)
        .bind(...affiliateIds)
        .all()
      const sales = salesResult.results || []
      totalSales = sales.length
      totalRevenue = sales.reduce((sum: number, s: any) => sum + Number(s.amount), 0)

      // Get pending commissions
      const pendingCommissionsResult = await db
        .prepare(`SELECT amount FROM commissions WHERE affiliate_id IN (${salesPlaceholders}) AND status = ?`)
        .bind(...affiliateIds, 'pending')
        .all()
      const pendingCommissions = pendingCommissionsResult.results || []
      pendingPayouts = pendingCommissions.reduce((sum: number, c: any) => sum + Number(c.amount), 0)
    }

    // Get paid payouts total
    const paidPayoutsResult = await db
      .prepare('SELECT amount FROM payouts WHERE admin_id = ? AND status = ?')
      .bind(session.userId, 'paid')
      .all()
    const paidPayoutsTotal = (paidPayoutsResult.results || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0)

    // Get pending commissions with affiliate details for payouts
    let pendingCommissions: any[] = []
    if (affiliateIds.length > 0) {
      const pcPlaceholders = affiliateIds.map(() => '?').join(',')
      const pcResult = await db
        .prepare(`SELECT c.affiliate_id, c.amount, u.id as user_id, u.full_name, u.email, u.paypal_email FROM commissions c JOIN affiliates a ON c.affiliate_id = a.id JOIN users u ON a.user_id = u.id WHERE c.affiliate_id IN (${pcPlaceholders}) AND c.status = ?`)
        .bind(...affiliateIds, 'pending')
        .all()
      pendingCommissions = pcResult.results || []
    }

    // Aggregate by affiliate
    const aggregatedPayouts: { [key: string]: { affiliate_id: string; amount: number; profile: any } } = {}
    pendingCommissions.forEach((c: any) => {
      const affId = c.affiliate_id
      if (!aggregatedPayouts[affId]) {
        aggregatedPayouts[affId] = {
          affiliate_id: affId,
          amount: 0,
          profile: {
            id: c.user_id,
            full_name: c.full_name,
            email: c.email,
            paypal_email: c.paypal_email,
          },
        }
      }
      aggregatedPayouts[affId].amount += Number(c.amount)
    })

    // Get recent sales
    let recentSales: any[] = []
    if (affiliateIds.length > 0) {
      const rsPlaceholders = affiliateIds.map(() => '?').join(',')
      const rsResult = await db
        .prepare(`SELECT id, amount, status, created_at, commission_l1, customer_email FROM sales WHERE affiliate_id IN (${rsPlaceholders}) ORDER BY created_at DESC LIMIT 20`)
        .bind(...affiliateIds)
        .all()
      recentSales = rsResult.results || []
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        paypal_email: profile.paypal_email,
        affiliate_code: profile.affiliate_code,
        subdomain: profile.subdomain,
        webhook_secret: profile.webhook_secret || null,
        custom_slug: profile.custom_slug || null,
      },
      stats: {
        totalAffiliates: affiliates.length,
        totalLevel3: level3Members.length,
        totalSales,
        totalRevenue,
        pendingPayouts,
        paidPayouts: paidPayoutsTotal,
      },
      affiliates,
      level3: level3Members,
      recentSales,
      pendingCommissions: Object.values(aggregatedPayouts),
    })
  } catch (error) {
    console.error('Admin error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const db = await getDB()

    // Verify user is admin
    const profile = await db
      .prepare('SELECT id, role FROM users WHERE id = ?')
      .bind(session.userId)
      .first()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { webhook_secret, custom_slug } = body

    // Build dynamic update query
    const updates: string[] = []
    const values: unknown[] = []

    if (typeof webhook_secret === 'string') {
      updates.push('webhook_secret = ?')
      values.push(webhook_secret)
    }

    if (typeof custom_slug === 'string') {
      updates.push('custom_slug = ?')
      values.push(custom_slug.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 })
    }

    values.push(session.userId)
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`

    await db.prepare(sql).bind(...values).run()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin PATCH error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
