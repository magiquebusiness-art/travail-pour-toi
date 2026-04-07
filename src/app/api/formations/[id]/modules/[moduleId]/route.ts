export const runtime = 'edge'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

async function verifyAdminAccess(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return { authorized: false, error: 'Non autorisé', status: 401 }
  if (session.role !== 'admin' && session.role !== 'super_admin') {
    return { authorized: false, error: 'Accès refusé', status: 403 }
  }
  const db = await getDB()
  return { authorized: true, db, session }
}

// GET /api/formations/[id]/modules/[moduleId] — Get module with lessons
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id, moduleId } = await params
    const db = await getDB()

    const module = await db.prepare(
      'SELECT * FROM formation_modules WHERE id = ? AND formation_id = ?'
    ).bind(moduleId, id).first()

    if (!module) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 })
    }

    const lessons = await db.prepare(
      'SELECT * FROM formation_lessons WHERE module_id = ? ORDER BY sort_order ASC'
    ).bind(moduleId).all()

    return NextResponse.json({ module, lessons: lessons.results || [] })
  } catch (error) {
    console.error('Module detail error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/formations/[id]/modules/[moduleId] — Update module (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const verification = await verifyAdminAccess(request)
    if (!verification.authorized) {
      return NextResponse.json({ error: verification.error }, { status: verification.status })
    }
    const { db } = verification

    const { id, moduleId } = await params

    const module = await db.prepare(
      'SELECT id FROM formation_modules WHERE id = ? AND formation_id = ?'
    ).bind(moduleId, id).first()

    if (!module) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 })
    }

    const body = await request.json()
    const updates: string[] = []
    const values: unknown[] = []

    const fields = ['title', 'description', 'is_free']
    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`)
        values.push(field === 'is_free' ? (body[field] ? 1 : 0) : body[field])
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 })
    }

    updates.push("updated_at = datetime('now')")
    values.push(moduleId)

    await db.prepare(`UPDATE formation_modules SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Module update error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/formations/[id]/modules/[moduleId] — Delete module (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const verification = await verifyAdminAccess(request)
    if (!verification.authorized) {
      return NextResponse.json({ error: verification.error }, { status: verification.status })
    }
    const { db } = verification

    const { id, moduleId } = await params

    const module = await db.prepare(
      'SELECT id FROM formation_modules WHERE id = ? AND formation_id = ?'
    ).bind(moduleId, id).first()

    if (!module) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 })
    }

    await db.prepare('DELETE FROM formation_lessons WHERE module_id = ?').bind(moduleId).run()
    await db.prepare('DELETE FROM formation_modules WHERE id = ?').bind(moduleId).run()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Module delete error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
