export const runtime = 'edge'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getDB, generateId } from '@/lib/db'
import { getSession } from '@/lib/auth'


/**
 * GET /api/referrals
 * Get user's referrals (L1, L2, L3)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const db = await getDB()

    // Get user's affiliate record
    const affiliate = await db
      .prepare('SELECT * FROM affiliates WHERE user_id = ?')
      .bind(session.userId)
      .first()

    if (!affiliate) {
      return NextResponse.json({ error: 'Affilié non trouvé' }, { status: 404 })
    }

    // Get Level 1 referrals (direct) - affiliates where parent_affiliate_id = current affiliate.id
    const l1Result = await db
      .prepare(`SELECT a.id, a.total_earnings, a.total_referrals, a.created_at,
        u.email, u.full_name
        FROM affiliates a
        JOIN users u ON a.user_id = u.id
        WHERE a.parent_affiliate_id = ?`)
      .bind(affiliate.id)
      .all()
    const l1Referrals = (l1Result.results || []).map((r: any) => ({
      id: r.id,
      total_earnings: r.total_earnings,
      total_referrals: r.total_referrals,
      created_at: r.created_at,
      profile: { email: r.email, full_name: r.full_name },
    }))

    // Get Level 2 referrals - affiliates where grandparent_affiliate_id = current affiliate.id
    const l2Result = await db
      .prepare(`SELECT a.id, a.total_earnings, a.created_at,
        u.email, u.full_name
        FROM affiliates a
        JOIN users u ON a.user_id = u.id
        WHERE a.grandparent_affiliate_id = ?`)
      .bind(affiliate.id)
      .all()
    const l2Referrals = (l2Result.results || []).map((r: any) => ({
      id: r.id,
      total_earnings: r.total_earnings,
      created_at: r.created_at,
      profile: { email: r.email, full_name: r.full_name },
    }))

    // Get Level 3 referrals - children of L2 affiliates
    const l2Ids = l2Result.results?.map((r: any) => r.id) || []
    let l3Referrals: any[] = []
    if (l2Ids.length > 0) {
      const l3Placeholders = l2Ids.map(() => '?').join(',')
      const l3Result = await db
        .prepare(`SELECT a.id, a.total_earnings, a.created_at,
          u.email, u.full_name
          FROM affiliates a
          JOIN users u ON a.user_id = u.id
          WHERE a.parent_affiliate_id IN (${l3Placeholders})`)
        .bind(...l2Ids)
        .all()
      l3Referrals = (l3Result.results || []).map((r: any) => ({
        id: r.id,
        total_earnings: r.total_earnings,
        created_at: r.created_at,
        profile: { email: r.email, full_name: r.full_name },
      }))
    }

    return NextResponse.json({
      affiliate,
      referrals: {
        level1: l1Referrals,
        level2: l2Referrals,
        level3: l3Referrals,
      },
    })
  } catch (error) {
    console.error('Error fetching referrals:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * POST /api/referrals
 * Track a referral link click
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: 'Code de parrainage requis' }, { status: 400 })
    }

    const db = await getDB()

    // Find the user by affiliate code
    const user = await db
      .prepare('SELECT * FROM users WHERE affiliate_code = ?')
      .bind(code.toUpperCase())
      .first()

    if (!user) {
      return NextResponse.json({ error: 'Code de parrainage invalide' }, { status: 404 })
    }

    // Get the affiliate record for this user
    const affiliate = await db
      .prepare('SELECT id FROM affiliates WHERE user_id = ? AND status = ?')
      .bind(user.id, 'active')
      .first()

    if (!affiliate) {
      return NextResponse.json({ error: 'Affilié non actif' }, { status: 404 })
    }

    // Track the click
    const headers = request.headers
    const clickId = generateId()
    await db
      .prepare('INSERT INTO clicks (id, affiliate_id, ip_address, user_agent, referrer_url, landing_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(
        clickId,
        affiliate.id,
        headers.get('x-forwarded-for') || headers.get('x-real-ip') || null,
        headers.get('user-agent') || null,
        headers.get('referer') || null,
        headers.get('x-url') || null,
        new Date().toISOString()
      )
      .run()

    return NextResponse.json({
      success: true,
      message: 'Click tracked successfully',
      referrer: {
        name: user.full_name,
        code: user.affiliate_code,
      },
    })
  } catch (error) {
    console.error('Error tracking referral:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
