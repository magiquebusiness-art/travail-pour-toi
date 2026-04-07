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

// GET /api/formations/[id]/page — Get formation landing page content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await getDB()

    const page = await db.prepare(
      'SELECT * FROM formation_pages WHERE formation_id = ?'
    ).bind(id).first()

    if (!page) {
      return NextResponse.json({ page: null, html_content: '', css_content: '', components_json: '[]', style_json: '{}' })
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Formation page get error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/formations/[id]/page — Save formation landing page content (admin only)
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

    const formation = await db.prepare('SELECT id FROM formations WHERE id = ?').bind(id).first()
    if (!formation) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 })
    }

    const body = await request.json()
    const { html_content, css_content, components_json, style_json, title, slug, is_published } = body

    const now = new Date().toISOString()

    // Check if page exists
    const existingPage = await db.prepare(
      'SELECT id FROM formation_pages WHERE formation_id = ?'
    ).bind(id).first()

    if (existingPage) {
      const updates: string[] = []
      const values: unknown[] = []

      if (html_content !== undefined) { updates.push('html_content = ?'); values.push(html_content) }
      if (css_content !== undefined) { updates.push('css_content = ?'); values.push(css_content) }
      if (components_json !== undefined) { updates.push('components_json = ?'); values.push(components_json) }
      if (style_json !== undefined) { updates.push('style_json = ?'); values.push(style_json) }
      if (title !== undefined) { updates.push('title = ?'); values.push(title) }
      if (slug !== undefined) { updates.push('slug = ?'); values.push(slug) }
      if (is_published !== undefined) { updates.push('is_published = ?'); values.push(is_published ? 1 : 0) }
      updates.push("updated_at = ?")
      values.push(now)
      values.push((existingPage as any).id)

      await db.prepare(
        `UPDATE formation_pages SET ${updates.join(', ')} WHERE id = ?`
      ).bind(...values).run()
    } else {
      // Create new page
      const pageId = `fpg_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
      const pageSlug = slug || `formation-${id.slice(4, 10)}`

      await db.prepare(`
        INSERT INTO formation_pages (id, formation_id, slug, title, html_content, css_content, components_json, style_json, is_published, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        pageId,
        id,
        pageSlug,
        title || 'Page de vente',
        html_content || '',
        css_content || '',
        components_json || '[]',
        style_json || '{}',
        is_published ? 1 : 0,
        now,
        now
      ).run()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Formation page save error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
