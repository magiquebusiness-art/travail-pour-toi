import { NextResponse } from 'next/server'
import { getDB, generateId } from '@/lib/db'
import { hashPassword, createToken, createSessionCookie } from '@/lib/auth'


export async function POST(request: Request) {
  try {
    const { email, password, fullName, businessName } = await request.json()

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Email, mot de passe et nom sont requis' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caracteres' }, { status: 400 })
    }

    const db = await getDB()
    if (!db) {
      return NextResponse.json({ error: 'Base de donnees indisponible' }, { status: 500 })
    }

    // Check if email already exists
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first()
    if (existing) {
      return NextResponse.json({ error: 'Cet email est deja utilise. Connecte-toi plutot.' }, { status: 409 })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Generate unique affiliate code (required by schema)
    const affiliateCode = await generateUniqueAffiliateCode(db)

    // Create user as 'client' role
    const userId = generateId()
    await db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, affiliate_code, business_name)
      VALUES (?, ?, ?, ?, 'client', ?, ?)
    `).bind(userId, email.toLowerCase(), passwordHash, fullName, affiliateCode, businessName || null).run()

    // Create JWT token
    const token = await createToken({
      userId,
      email: email.toLowerCase(),
      role: 'client',
    })

    // Return success with session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: email.toLowerCase(),
        full_name: fullName,
        role: 'client',
        affiliate_code: affiliateCode,
      },
    })

    response.headers.append('Set-Cookie', createSessionCookie(token))
    return response
  } catch (error: any) {
    console.error('Client registration error:', error?.message || error)
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (error?.message || 'Veuillez reessayer.') },
      { status: 500 }
    )
  }
}

async function generateUniqueAffiliateCode(db: any): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    const exists = await db.prepare('SELECT id FROM users WHERE affiliate_code = ?').bind(code).first()
    if (!exists) return code
  }
  // Fallback: use UUID prefix
  return 'CLT' + generateId().replace(/-/g, '').slice(0, 5).toUpperCase()
}
