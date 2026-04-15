import { NextResponse, type NextRequest } from 'next/server'
import { getDB, generateId } from '@/lib/db'
import { getSession } from '@/lib/auth'

type VerificationSuccess = { authorized: true; db: any; session: { userId: string; email: string; role: string } }
type VerificationFailure = { authorized: false; error: string; status: number }
type Verification = VerificationSuccess | VerificationFailure

async function verifyAdminAccess(request: NextRequest): Promise<Verification> {
  const session = await getSession(request)
  if (!session) return { authorized: false, error: 'Non autorise', status: 401 }
  if (session.role !== 'admin' && session.role !== 'super_admin' && session.role !== 'client') {
    return { authorized: false, error: 'Acces refuse', status: 403 }
  }
  const db = await getDB()
  if (!db) return { authorized: false, error: 'Base de donnees indisponible', status: 500 }
  return { authorized: true, db, session }
}

// GET /api/dashboard/formations — List formations for this admin
export async function GET(request: NextRequest) {
  try {
    const verification = await verifyAdminAccess(request)
    if (!verification.authorized) {
      return NextResponse.json({ error: verification.error }, { status: verification.status })
    }
    const { db, session } = verification

    const formations = await db.prepare(`
      SELECT f.*,
        (SELECT COUNT(*) FROM formation_modules WHERE formation_id = f.id) as module_count,
        (SELECT COUNT(*) FROM formation_lessons WHERE formation_id = f.id) as lesson_count,
        (SELECT COUNT(*) FROM formation_enrollments WHERE formation_id = f.id AND status = 'active') as student_count
      FROM formations f
      WHERE f.tenant_id = ?
      ORDER BY f.created_at DESC
    `).bind(session.userId).all()

    return NextResponse.json({ formations: formations.results || [] })
  } catch (error: any) {
    console.error('Dashboard formations list error:', error?.message || error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/dashboard/formations — Create formation
export async function POST(request: NextRequest) {
  try {
    const verification = await verifyAdminAccess(request)
    if (!verification.authorized) {
      return NextResponse.json({ error: verification.error }, { status: verification.status })
    }
    const { db, session } = verification

    const body = await request.json()
    const { title, description, price, category } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 })
    }

    const formationId = `frm_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
    const now = new Date().toISOString()

    await db.prepare(`
      INSERT INTO formations (id, tenant_id, title, description, long_description, price, currency, thumbnail_url, status, modules_count, total_duration, created_at, updated_at)
      VALUES (?, ?, ?, ?, '', ?, 'CAD', NULL, 'draft', 0, 0, ?, ?)
    `).bind(
      formationId,
      session.userId,
      title.trim(),
      description || '',
      price !== undefined ? Number(price) : 0,
      now,
      now
    ).run()

    if (category) {
      await db.prepare(`UPDATE formations SET category = ? WHERE id = ?`).bind(category, formationId).run()
    }

    return NextResponse.json({ success: true, formationId })
  } catch (error: any) {
    console.error('Dashboard formations create error:', error?.message || error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
