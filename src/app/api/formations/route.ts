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

// GET /api/formations — List published formations (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const search = (searchParams.get('search') || '').replace(/[%'\\]/g, '')

    const conditions: string[] = ["f.status = 'published'"]
    const values: unknown[] = []

    if (category) {
      conditions.push('f.category = ?')
      values.push(category)
    }

    if (search) {
      conditions.push('(f.title LIKE ? OR f.description LIKE ?)')
      values.push(`%${search}%`, `%${search}%`)
    }

    const whereClause = conditions.join(' AND ')

    const query = `
      SELECT f.*,
        (SELECT COUNT(*) FROM formation_modules WHERE formation_id = f.id) as module_count,
        (SELECT COUNT(*) FROM formation_lessons WHERE formation_id = f.id) as lesson_count,
        (SELECT COUNT(*) FROM formation_enrollments WHERE formation_id = f.id) as student_count
      FROM formations f
      WHERE ${whereClause}
      ORDER BY f.created_at DESC
    `

    const db = await getDB()
    const result = await db.prepare(query).bind(...values).all()
    const formations = result.results || []

    return NextResponse.json({ formations })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Formations list error:', error)
    return NextResponse.json({ error: 'Erreur serveur', debug: msg }, { status: 500 })
  }
}

// POST /api/formations — Create formation (admin only)
export async function POST(request: NextRequest) {
  try {
    const verification = await verifyAdminAccess(request)
    if (!verification.authorized) {
      return NextResponse.json({ error: verification.error }, { status: verification.status })
    }
    const { db, session } = verification

    const body = await request.json()
    const { title, description, long_description, price, category, thumbnail_url, status } = body

    if (!title) {
      return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 })
    }

    const formationId = `frm_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
    const now = new Date().toISOString()

    await db.prepare(`
      INSERT INTO formations (id, tenant_id, title, description, long_description, price, currency, thumbnail_url, status, modules_count, total_duration, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    `).bind(
      formationId,
      session.userId,
      title,
      description || '',
      long_description || '',
      price !== undefined ? Number(price) : 0,
      'CAD',
      thumbnail_url || null,
      status || 'draft',
      now,
      now
    ).run()

    return NextResponse.json({ success: true, formationId })
  } catch (error) {
    console.error('Formation create error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
