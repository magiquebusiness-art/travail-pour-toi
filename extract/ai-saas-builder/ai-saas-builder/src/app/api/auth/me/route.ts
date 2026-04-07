import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'


export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const db = await getDB()
    const user = await db
      .prepare('SELECT id, email, full_name, role, affiliate_code, avatar_url, paypal_email, created_at FROM users WHERE id = ?')
      .bind(session.userId)
      .first()

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error('Me error:', error?.message || error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
