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

// GET /api/formations/[id]/modules — List modules
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await getDB()

    const formation = await db.prepare('SELECT id FROM formations WHERE id = ?').bind(id).first()
    if (!formation) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 })
    }

    const result = await db.prepare(
      'SELECT * FROM formation_modules WHERE formation_id = ? ORDER BY sort_order ASC'
    ).bind(id).all()

    // Get lesson count per module
    const modulesWithCount = []
    for (const mod of (result.results || []) as any[]) {
      const lessonCount = await db.prepare(
        'SELECT COUNT(*) as count FROM formation_lessons WHERE module_id = ?'
      ).bind(mod.id).first()
      modulesWithCount.push({
        ...mod,
        lesson_count: (lessonCount as any)?.count || 0,
      })
    }

    return NextResponse.json({ modules: modulesWithCount })
  } catch (error) {
    console.error('Modules list error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/formations/[id]/modules — Create module (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const verification = await verifyAdminAccess(request)
    if (!verification.authorized) {
      return NextResponse.json({ error: verification.error }, { status: verification.status })
    }
    const { db } = verification

    const { id } = await params

    const formation = await db.prepare('SELECT id FROM formations WHERE id = ?').bind(id).first()
    if (!formation) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, is_free } = body

    if (!title) {
      return NextResponse.json({ error: 'Le titre du module est requis' }, { status: 400 })
    }

    // Get next sort_order
    const lastModule = await db.prepare(
      'SELECT MAX(sort_order) as max_order FROM formation_modules WHERE formation_id = ?'
    ).bind(id).first()
    const sortOrder = ((lastModule as any)?.max_order || 0) + 1

    const moduleId = `mod_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
    const now = new Date().toISOString()

    await db.prepare(`
      INSERT INTO formation_modules (id, formation_id, title, description, sort_order, is_free, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(moduleId, id, title, description || '', sortOrder, is_free ? 1 : 0, now, now).run()

    return NextResponse.json({ success: true, moduleId })
  } catch (error) {
    console.error('Module create error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/formations/[id]/modules — Reorder modules (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const verification = await verifyAdminAccess(request)
    if (!verification.authorized) {
      return NextResponse.json({ error: verification.error }, { status: verification.status })
    }
    const { db } = verification

    const { id } = await params
    const body = await request.json()
    const { moduleIds } = body // Array of module IDs in new order

    if (!Array.isArray(moduleIds)) {
      return NextResponse.json({ error: 'moduleIds doit être un tableau' }, { status: 400 })
    }

    for (let i = 0; i < moduleIds.length; i++) {
      await db.prepare(
        'UPDATE formation_modules SET sort_order = ? WHERE id = ? AND formation_id = ?'
      ).bind(i, moduleIds[i], id).run()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Module reorder error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
