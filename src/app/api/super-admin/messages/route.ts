export const runtime = 'edge'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from 'next/server'
import { getDB, generateId } from '@/lib/db'
import { getSession } from '@/lib/auth'


export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const db = await getDB()

    // Check if super admin
    const profile = await db
      .prepare('SELECT role FROM users WHERE id = ?')
      .bind(session.userId)
      .first()

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { subject, content, recipientId, isBroadcast } = await request.json()

    if (!subject || !content) {
      return NextResponse.json({ error: 'Sujet et contenu requis' }, { status: 400 })
    }

    const now = new Date().toISOString()

    if (isBroadcast) {
      // Get all users except current
      const usersResult = await db
        .prepare('SELECT id FROM users WHERE id != ?')
        .bind(session.userId)
        .all()
      const users = usersResult.results || []

      if (users.length > 0) {
        // Create individual messages for each user
        const stmts = users.map((u) =>
          db
            .prepare('INSERT INTO messages (id, sender_id, recipient_id, subject, content, is_broadcast, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .bind(generateId(), session.userId, u.id, subject, content, 1, now)
        )
        // Execute sequentially
        for (const stmt of stmts) {
          await stmt.run()
        }
      }
    } else {
      if (!recipientId) {
        return NextResponse.json({ error: 'Destinataire requis' }, { status: 400 })
      }

      await db
        .prepare('INSERT INTO messages (id, sender_id, recipient_id, subject, content, is_broadcast, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(generateId(), session.userId, recipientId, subject, content, 0, now)
        .run()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
