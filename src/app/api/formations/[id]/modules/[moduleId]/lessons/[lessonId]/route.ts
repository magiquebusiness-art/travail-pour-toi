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

// GET /api/formations/[id]/modules/[moduleId]/lessons/[lessonId] — Get lesson
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
  try {
    const { moduleId, lessonId } = await params
    const db = await getDB()

    const lesson = await db.prepare(
      'SELECT * FROM formation_lessons WHERE id = ? AND module_id = ?'
    ).bind(lessonId, moduleId).first()

    if (!lesson) {
      return NextResponse.json({ error: 'Leçon non trouvée' }, { status: 404 })
    }

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error('Lesson detail error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/formations/[id]/modules/[moduleId]/lessons/[lessonId] — Update lesson (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
  try {
    const verification = await verifyAdminAccess(request)
    if (!verification.authorized) {
      return NextResponse.json({ error: verification.error }, { status: verification.status })
    }
    const { db } = verification

    const { moduleId, lessonId } = await params

    const lesson = await db.prepare(
      'SELECT id FROM formation_lessons WHERE id = ? AND module_id = ?'
    ).bind(lessonId, moduleId).first()

    if (!lesson) {
      return NextResponse.json({ error: 'Leçon non trouvée' }, { status: 404 })
    }

    const body = await request.json()
    const updates: string[] = []
    const values: unknown[] = []

    const numberFields = ['duration_minutes', 'sort_order']
    const textFields = ['title', 'description', 'content_type', 'video_url', 'content_html', 'content_json']
    const boolFields = ['is_free']

    for (const field of textFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`)
        values.push(body[field])
      }
    }

    for (const field of numberFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`)
        values.push(Number(body[field]) || 0)
      }
    }

    for (const field of boolFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`)
        values.push(body[field] ? 1 : 0)
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 })
    }

    updates.push("updated_at = datetime('now')")
    values.push(lessonId)

    await db.prepare(`UPDATE formation_lessons SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lesson update error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/formations/[id]/modules/[moduleId]/lessons/[lessonId] — Delete lesson (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
  try {
    const verification = await verifyAdminAccess(request)
    if (!verification.authorized) {
      return NextResponse.json({ error: verification.error }, { status: verification.status })
    }
    const { db } = verification

    const { moduleId, lessonId } = await params

    const lesson = await db.prepare(
      'SELECT id FROM formation_lessons WHERE id = ? AND module_id = ?'
    ).bind(lessonId, moduleId).first()

    if (!lesson) {
      return NextResponse.json({ error: 'Leçon non trouvée' }, { status: 404 })
    }

    await db.prepare('DELETE FROM formation_lessons WHERE id = ?').bind(lessonId).run()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lesson delete error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
