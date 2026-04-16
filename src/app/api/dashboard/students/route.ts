import { NextResponse, type NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

async function safeFirst(db: any, sql: string, params: any[]): Promise<any> {
  try { return await db.prepare(sql).bind(...params).first() }
  catch (e: any) { console.warn('Students query skipped:', e?.message); return null }
}

async function safeAll(db: any, sql: string, params: any[]): Promise<any[]> {
  try { const r = await db.prepare(sql).bind(...params).all(); return r.results || [] }
  catch (e: any) { console.warn('Students query skipped:', e?.message); return [] }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    if (session.role !== 'admin' && session.role !== 'super_admin' && session.role !== 'client') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Base de donnees indisponible' }, { status: 500 })

    const { searchParams } = new URL(request.url)
    const formationId = searchParams.get('formationId') || ''
    const search = (searchParams.get('search') || '').replace(/[%'\\]/g, '').trim()
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '10')))
    const offset = (page - 1) * limit

    const conditions: string[] = ['f.tenant_id = ?']
    const values: unknown[] = [session.userId]

    if (formationId) { conditions.push('e.formation_id = ?'); values.push(formationId) }
    if (search) {
      conditions.push('(e.student_email LIKE ? OR e.student_name LIKE ? OR f.title LIKE ?)')
      values.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const whereClause = conditions.join(' AND ')

    const countResult = await safeFirst(db, `
      SELECT COUNT(*) as total
      FROM formation_enrollments e INNER JOIN formations f ON f.id = e.formation_id
      WHERE ${whereClause}
    `, values)
    const total = countResult?.total || 0

    const enrollments = await safeAll(db, `
      SELECT e.id, e.student_email, e.student_name, e.progress_percent, e.status,
             e.enrolled_at, e.completed_at, e.last_accessed_at,
             f.title as formation_title, f.id as formation_id, f.thumbnail_url
      FROM formation_enrollments e INNER JOIN formations f ON f.id = e.formation_id
      WHERE ${whereClause}
      ORDER BY e.enrolled_at DESC LIMIT ? OFFSET ?
    `, [...values, limit, offset])

    const formations = await safeAll(db, `
      SELECT f.id, f.title, COUNT(e.id) as student_count
      FROM formations f LEFT JOIN formation_enrollments e ON e.formation_id = f.id AND e.status = 'active'
      WHERE f.tenant_id = ? GROUP BY f.id ORDER BY f.title ASC
    `, [session.userId])

    return NextResponse.json({
      enrollments,
      formations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    console.error('Dashboard students error:', error?.message || error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
