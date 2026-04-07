/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession, verifyPassword, hashPassword } from '@/lib/auth'


export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const db = await getDB()

    // Check if super admin
    const profile = await db
      .prepare('SELECT role, password_hash FROM users WHERE id = ?')
      .bind(session.userId)
      .first()

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, profile.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 })
    }

    // Update password
    const newHash = await hashPassword(newPassword)
    await db
      .prepare('UPDATE users SET password_hash = ? WHERE id = ?')
      .bind(newHash, session.userId)
      .run()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
