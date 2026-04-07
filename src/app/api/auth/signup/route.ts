export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { getDB, generateId, generateUniqueAffiliateCode } from '@/lib/db'
import { hashPassword, createToken, createSessionCookie, verifyPassword } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'


export async function POST(request: Request) {
  try {
    const { email, password, fullName, referralCode } = await request.json()

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Email, mot de passe et nom sont requis' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, { status: 400 })
    }

    const db = await getDB()

    // Check if email already exists
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first()
    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé. Connecte-toi plutôt.' }, { status: 409 })
    }

    // Generate unique affiliate code
    const affiliateCode = await generateUniqueAffiliateCode(db)

    // Find parent by referral code
    let parentId: string | null = null
    let parentAffiliateId: string | null = null
    let grandparentAffiliateId: string | null = null
    let adminId: string | null = null

    if (referralCode) {
      const parent = await db
        .prepare('SELECT id, admin_id FROM users WHERE affiliate_code = ?')
        .bind(referralCode.toUpperCase())
        .first()

      if (parent) {
        parentId = parent.id
        adminId = parent.admin_id

        // Find parent's affiliate record
        const parentAff = await db
          .prepare('SELECT id, parent_affiliate_id FROM affiliates WHERE user_id = ?')
          .bind(parent.id)
          .first()

        if (parentAff) {
          parentAffiliateId = parentAff.id
          grandparentAffiliateId = parentAff.parent_affiliate_id
        }

        // Walk up parent chain to find admin
        if (!adminId) {
          adminId = await findAdminId(db, parent.id)
        }
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const userId = generateId()
    await db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, affiliate_code, parent_id, admin_id)
      VALUES (?, ?, ?, ?, 'affiliate', ?, ?, ?)
    `).bind(userId, email.toLowerCase(), passwordHash, fullName, affiliateCode, parentId, adminId).run()

    // Create affiliate record if program exists
    const program = await db
      .prepare('SELECT id FROM programs WHERE is_active = 1 LIMIT 1')
      .first()

    if (program) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://affiliationpro.cashflowecosysteme.com'
      const affiliateId = generateId()
      await db.prepare(`
        INSERT INTO affiliates (id, program_id, user_id, affiliate_link, parent_affiliate_id, grandparent_affiliate_id, status)
        VALUES (?, ?, ?, ?, ?, ?, 'active')
      `).bind(affiliateId, program.id, userId, `${siteUrl}/r/${affiliateCode}`, parentAffiliateId, grandparentAffiliateId).run()
    }

    // Create JWT token
    const token = await createToken({ userId, email: email.toLowerCase(), role: 'affiliate' })

    // Send welcome email (fire-and-forget, never blocks the response)
    sendWelcomeEmail(email.toLowerCase(), fullName, affiliateCode).catch(() => {})

    // Return success with session cookie
    const response = NextResponse.json({
      success: true,
      user: { id: userId, email: email.toLowerCase(), full_name: fullName, affiliate_code: affiliateCode, role: 'affiliate' },
    })

    response.headers.append('Set-Cookie', createSessionCookie(token))
    return response
  } catch (error: any) {
    console.error('Signup error:', error?.message || error)
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (error?.message || 'Veuillez réessayer.') },
      { status: 500 }
    )
  }
}

async function findAdminId(db: any, profileId: string): Promise<string | null> {
  let currentId = profileId
  for (let i = 0; i < 5; i++) {
    const profile = await db
      .prepare('SELECT id, role, parent_id, admin_id FROM users WHERE id = ?')
      .bind(currentId)
      .first()
    if (!profile) return null
    if (profile.role === 'admin') return profile.id
    if (profile.admin_id) return profile.admin_id
    if (!profile.parent_id) return null
    currentId = profile.parent_id
  }
  return null
}
