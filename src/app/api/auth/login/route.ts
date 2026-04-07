import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { verifyPassword, createToken, createSessionCookie } from '@/lib/auth'


export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe sont requis' }, { status: 400 })
    }

    const db = await getDB()

    // Find user by email
    const user = await db
      .prepare('SELECT id, email, password_hash, full_name, role, affiliate_code FROM users WHERE email = ?')
      .bind(email.toLowerCase())
      .first()

    if (!user) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
    }

    // Verify password
    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
    }

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'super_admin' | 'admin' | 'affiliate',
    })

    // Return success with session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        affiliate_code: user.affiliate_code,
      },
    })

    response.headers.append('Set-Cookie', createSessionCookie(token))
    return response
  } catch (error: any) {
    console.error('Login error:', error?.message || error)
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (error?.message || 'Veuillez réessayer.') },
      { status: 500 }
    )
  }
}
