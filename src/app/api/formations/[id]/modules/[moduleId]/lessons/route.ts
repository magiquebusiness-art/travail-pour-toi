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

// GET /api/formations/[id]/modules/[moduleId]/lessons — List lessons
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id, moduleId } = await params
    const db = await getDB()

    const module = await db.prepare(
      'SELECT id FROM formation_modules WHERE id = ? AND formation_id = ?'
    ).bind(moduleId, id).first()

    if (!module) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 })
    }

    const result = await db.prepare(
      'SELECT * FROM formation_lessons WHERE module_id = ? ORDER BY sort_order ASC'
    ).bind(moduleId).all()

    return NextResponse.json({ lessons: result.results || [] })
  } catch (error) {
    console.error('Lessons list error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/formations/[id]/modules/[moduleId]/lessons — Create lesson (admin only)
export async function POST(
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
    const { title, description, content_type, video_url, content_html, duration_minutes, is_free } = body

    if (!title) {
      return NextResponse.json({ error: 'Le titre de la leçon est requis' }, { status: 400 })
    }

    // Get next sort_order
    const lastLesson = await db.prepare(
      'SELECT MAX(sort_order) as max_order FROM formation_lessons WHERE module_id = ?'
    ).bind(moduleId).first()
    const sortOrder = ((lastLesson as any)?.max_order || 0) + 1

    const lessonId = `lsn_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
    const now = new Date().toISOString()

    const validContentTypes = ['text', 'video', 'audio', 'pdf', 'quiz']
    const contentType = validContentTypes.includes(content_type) ? content_type : 'text'

    await db.prepare(`
      INSERT INTO formation_lessons (id, module_id, formation_id, title, description, content_type, video_url, content_html, duration_minutes, sort_order, is_free, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      lessonId,
      moduleId,
      id,
      title,
      description || '',
      contentType,
      video_url || '',
      content_html || '',
      duration_minutes ? Number(duration_minutes) : 0,
      sortOrder,
      is_free ? 1 : 0,
      now,
      now
    ).run()

    return NextResponse.json({ success: true, lessonId })
  } catch (error) {
    console.error('Lesson create error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
