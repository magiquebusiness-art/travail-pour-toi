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
    const rawSearch = searchParams.get('search') || ''
    // Sanitize search input to prevent SQL injection
    const search = rawSearch.replace(/[%'\\]/g, '')

    // Check if super admin
    const profile = await db
      .prepare('SELECT role FROM users WHERE id = ?')
      .bind(session.userId)
      .first()

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Get global stats
    const totalUsersResult = await db.prepare('SELECT COUNT(*) as count FROM users').first()
    const totalAdminsResult = await db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").first()
    const totalAffiliatesResult = await db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'affiliate'").first()
    const totalSalesResult = await db.prepare('SELECT COUNT(*) as count FROM sales').first()

    const revenueResult = await db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM sales').first()
    const totalRevenue = revenueResult?.total || 0

    const pendingResult = await db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM commissions WHERE status = 'pending'").first()
    const pendingPayouts = pendingResult?.total || 0

    const paidResult = await db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payouts WHERE status = 'paid'").first()
    const totalPayouts = paidResult?.total || 0

    // Get all admins
    let adminsResult
    if (search) {
      adminsResult = await db
        .prepare("SELECT id, email, full_name, affiliate_code, role, paypal_email, subdomain, parent_id, created_at FROM users WHERE role = 'admin' AND (email LIKE ? OR full_name LIKE ?) ORDER BY created_at DESC")
        .bind(`%${search}%`, `%${search}%`)
        .all()
    } else {
      adminsResult = await db
        .prepare("SELECT id, email, full_name, affiliate_code, role, paypal_email, subdomain, parent_id, created_at FROM users WHERE role = 'admin' ORDER BY created_at DESC")
        .all()
    }
    const admins = adminsResult.results || []

    // Build teams structure: Admin -> Level 2 (their affiliates) -> Level 3
    const teams: any[] = []

    for (const adminUser of admins) {
      // Get level 2 affiliates (admin_id = admin.id)
      let level2Result
      if (search) {
        level2Result = await db
          .prepare("SELECT id, email, full_name, affiliate_code, role, paypal_email, parent_id, created_at FROM users WHERE admin_id = ? AND (email LIKE ? OR full_name LIKE ?)")
          .bind(adminUser.id, `%${search}%`, `%${search}%`)
          .all()
      } else {
        level2Result = await db
          .prepare('SELECT id, email, full_name, affiliate_code, role, paypal_email, parent_id, created_at FROM users WHERE admin_id = ?')
          .bind(adminUser.id)
          .all()
      }
      const level2 = level2Result.results || []

      // For each L2, get their L3 members
      const level2WithL3: any[] = []
      for (const l2 of level2) {
        const l3Result = await db
          .prepare('SELECT id, email, full_name, affiliate_code, role, paypal_email, parent_id, created_at FROM users WHERE parent_id = ?')
          .bind(l2.id)
          .all()
        const level3 = l3Result.results || []

        level2WithL3.push({
          ...l2,
          level3,
        })
      }

      teams.push({
        admin: adminUser,
        level2: level2WithL3,
        level3Count: level2WithL3.reduce((sum: number, l2: any) => sum + (l2.level3?.length || 0), 0),
      })
    }

    // Get recent sales with affiliate info
    const recentSalesResult = await db
      .prepare(`SELECT s.id, s.amount, s.status, s.created_at, s.commission_l1, s.customer_email,
        a.id as affiliate_id, a.user_id as affiliate_user_id,
        u.full_name as affiliate_name, u.email as affiliate_email, u.role as affiliate_role
        FROM sales s
        JOIN affiliates a ON s.affiliate_id = a.id
        JOIN users u ON a.user_id = u.id
        ORDER BY s.created_at DESC LIMIT 20`)
      .all()
    const recentSales = (recentSalesResult.results || []).map((s: any) => ({
      id: s.id,
      amount: s.amount,
      status: s.status,
      created_at: s.created_at,
      commission_l1: s.commission_l1,
      customer_email: s.customer_email,
      affiliates: {
        id: s.affiliate_id,
        user_id: s.affiliate_user_id,
        profile: {
          full_name: s.affiliate_name,
          email: s.affiliate_email,
          role: s.affiliate_role,
        },
      },
    }))

    // Get messages with sender/recipient info
    let messagesResult
    if (search) {
      messagesResult = await db
        .prepare(`SELECT m.id, m.subject, m.content, m.sender_id, m.recipient_id, m.is_broadcast, m.created_at, m.read_at,
          su.full_name as sender_name, su.email as sender_email,
          ru.full_name as recipient_name, ru.email as recipient_email
          FROM messages m
          JOIN users su ON m.sender_id = su.id
          JOIN users ru ON m.recipient_id = ru.id
          WHERE (m.subject LIKE ? OR m.content LIKE ?)
          ORDER BY m.created_at DESC LIMIT 50`)
        .bind(`%${search}%`, `%${search}%`)
        .all()
    } else {
      messagesResult = await db
        .prepare(`SELECT m.id, m.subject, m.content, m.sender_id, m.recipient_id, m.is_broadcast, m.created_at, m.read_at,
          su.full_name as sender_name, su.email as sender_email,
          ru.full_name as recipient_name, ru.email as recipient_email
          FROM messages m
          JOIN users su ON m.sender_id = su.id
          JOIN users ru ON m.recipient_id = ru.id
          ORDER BY m.created_at DESC LIMIT 50`)
        .all()
    }
    const messages = (messagesResult.results || []).map((m: any) => ({
      id: m.id,
      subject: m.subject,
      content: m.content,
      sender_id: m.sender_id,
      recipient_id: m.recipient_id,
      is_broadcast: m.is_broadcast,
      created_at: m.created_at,
      read_at: m.read_at,
      sender: { full_name: m.sender_name, email: m.sender_email },
      recipient: { full_name: m.recipient_name, email: m.recipient_email },
    }))

    // Get commission programs
    const programsResult = await db
      .prepare('SELECT id, name, description, commission_l1, commission_l2, commission_l3, is_active, created_at FROM programs ORDER BY created_at ASC')
      .all()
    const programs = programsResult.results || []

    return NextResponse.json({
      stats: {
        totalUsers: totalUsersResult?.count || 0,
        totalAdmins: totalAdminsResult?.count || 0,
        totalAffiliates: totalAffiliatesResult?.count || 0,
        totalSales: totalSalesResult?.count || 0,
        totalRevenue,
        pendingPayouts,
        totalPayouts,
      },
      admins,
      teams,
      recentSales,
      messages,
      programs,
    })
  } catch (error) {
    console.error('Super admin error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Update commission rates for a program
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const db = await getDB()

    const profile = await db
      .prepare('SELECT role FROM users WHERE id = ?')
      .bind(session.userId)
      .first()

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { programId, commission_l1, commission_l2, commission_l3, name } = body

    if (!programId) {
      return NextResponse.json({ error: 'Programme non trouvé' }, { status: 400 })
    }

    // Validate commissions (0-100)
    const l1 = Math.min(100, Math.max(0, Number(commission_l1)))
    const l2 = Math.min(100, Math.max(0, Number(commission_l2)))
    const l3 = Math.min(100, Math.max(0, Number(commission_l3)))

    if (l1 + l2 + l3 > 100) {
      return NextResponse.json({ error: 'Le total des commissions ne peut pas dépasser 100%' }, { status: 400 })
    }

    // Update the program
    const updates: string[] = []
    const values: unknown[] = []

    updates.push('commission_l1 = ?')
    values.push(l1)
    updates.push('commission_l2 = ?')
    values.push(l2)
    updates.push('commission_l3 = ?')
    values.push(l3)

    if (name && typeof name === 'string') {
      updates.push('name = ?')
      values.push(name)
    }

    values.push(programId)
    await db
      .prepare(`UPDATE programs SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run()

    return NextResponse.json({ success: true, commission_l1: l1, commission_l2: l2, commission_l3: l3 })
  } catch (error) {
    console.error('Update commissions error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
