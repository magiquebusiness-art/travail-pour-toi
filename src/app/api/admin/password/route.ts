
import { NextResponse, type NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession, verifyPassword, hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Accessible pour admin ET super_admin
    if (session.role !== 'admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Veuillez remplir tous les champs' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' }, { status: 400 })
    }

    const db = await getDB()

    // Récupérer le hash du mot de passe actuel
    const profile = await db
      .prepare('SELECT password_hash FROM users WHERE id = ?')
      .bind(session.userId)
      .first()

    if (!profile || !profile.password_hash) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    }

    // Vérifier l'ancien mot de passe
    const isValid = await verifyPassword(currentPassword, profile.password_hash as string)
    if (!isValid) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 })
    }

    // Hasher et sauvegarder le nouveau mot de passe
    const newHash = await hashPassword(newPassword)
    await db
      .prepare('UPDATE users SET password_hash = ? WHERE id = ?')
      .bind(newHash, session.userId)
      .run()

    return NextResponse.json({ success: true, message: 'Mot de passe modifié avec succès' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
