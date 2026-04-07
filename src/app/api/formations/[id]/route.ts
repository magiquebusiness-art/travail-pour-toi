/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Helper: verify admin or super_admin access
async function verifyAdminAccess(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return { authorized: false, error: 'Non autorisé', status: 401 }

  if (session.role !== 'admin' && session.role !== 'super_admin') {
    return { authorized: false, error: 'Accès refusé', status: 403 }
  }

  const db = await getDB()
  return { authorized: true, db, session }
}

// GET /api/formations/[id] — Get formation details (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await getDB()

    const formation = await db.prepare('SELECT * FROM formations WHERE id = ?').bind(id).first()

    if (!formation) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 })
    }

    // Get modules with lessons
    const modules = await db.prepare(
      'SELECT * FROM formation_modules WHERE formation_id = ? ORDER BY sort_order ASC'
    ).bind(id).all()

    const modulesWithLessons = []
    for (const mod of (modules.results || []) as any[]) {
      const lessons = await db.prepare(
        'SELECT * FROM formation_lessons WHERE module_id = ? ORDER BY sort_order ASC'
      ).bind(mod.id).all()
      modulesWithLessons.push({
        ...mod,
        lessons: lessons.results || [],
      })
    }

    // Get stats
    const enrollments = await db.prepare(
      'SELECT COUNT(*) as count FROM formation_enrollments WHERE formation_id = ?'
    ).bind(id).first()

    return NextResponse.json({
      formation,
      modules: modulesWithLessons,
      stats: {
        student_count: (enrollments as any)?.count || 0,
        module_count: (modules.results || []).length,
      },
    })
  } catch (error) {
    console.error('Formation detail error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/formations/[id] — Update formation (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const verification = await verifyAdminAccess(request)
    if (!verification.authorized) {
      return NextResponse.json({ error: verification.error }, { status: verification.status })
    }
    const { db, session } = verification

    const { id } = await params

    const formation = await db.prepare('SELECT id, tenant_id FROM formations WHERE id = ?').bind(id).first()
    if (!formation) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 })
    }

    if (session.role === 'admin' && (formation as any).tenant_id !== session.userId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const updates: string[] = []
    const values: unknown[] = []

    const fields = ['title', 'description', 'long_description', 'price', 'category', 'thumbnail_url', 'status']
    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`)
        values.push(field === 'price' ? Number(body[field]) : body[field])
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 })
    }

    updates.push("updated_at = datetime('now')")
    values.push(id)

    await db.prepare(`UPDATE formations SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Formation update error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/formations/[id] — Delete formation (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const verification = await verifyAdminAccess(request)
    if (!verification.authorized) {
      return NextResponse.json({ error: verification.error }, { status: verification.status })
    }
    const { db, session } = verification

    const { id } = await params

    const formation = await db.prepare('SELECT id, tenant_id FROM formations WHERE id = ?').bind(id).first()
    if (!formation) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 })
    }

    if (session.role === 'admin' && (formation as any).tenant_id !== session.userId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Delete lessons, modules, pages, enrollments first (cascade should handle)
    await db.prepare('DELETE FROM formation_lessons WHERE formation_id = ?').bind(id).run()
    await db.prepare('DELETE FROM formation_modules WHERE formation_id = ?').bind(id).run()
    await db.prepare('DELETE FROM formation_pages WHERE formation_id = ?').bind(id).run()
    await db.prepare('DELETE FROM formation_enrollments WHERE formation_id = ?').bind(id).run()
    await db.prepare('DELETE FROM formations WHERE id = ?').bind(id).run()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Formation delete error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
