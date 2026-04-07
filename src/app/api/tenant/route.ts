
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/tenant?slug=diane — Lookup tenant + products from D1
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'Slug requis' }, { status: 400 })
    }

    // Get D1 from Cloudflare env (OpenNext Workers)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require('@opennextjs/cloudflare')
    const { env } = getRequestContext()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (env as any).DB

    // Lookup tenant by slug
    const tenant = await db
      .prepare('SELECT * FROM tenants WHERE slug = ? AND status = ?')
      .bind(slug, 'active')
      .first()

    if (!tenant) {
      return NextResponse.json({ error: 'Collaborateur introuvable' }, { status: 404 })
    }

    // Parse JSON fields
    const t = tenant as Record<string, unknown>
    const config = t.config ? JSON.parse(t.config as string) : {}
    const socialLinks = t.social_links ? JSON.parse(t.social_links as string) : {}

    // Get tenant's products
    const productsResult = await db
      .prepare(
        'SELECT * FROM products WHERE tenant_id = ? AND status = ? ORDER BY created_at DESC'
      )
      .bind(t.id, 'active')
      .all()

    // Get tenant's formations
    const formationsResult = await db
      .prepare(
        'SELECT * FROM formations WHERE tenant_id = ? AND status = ? ORDER BY created_at DESC'
      )
      .bind(t.id, 'published')
      .all()

    return NextResponse.json({
      tenant: {
        id: t.id,
        slug: t.slug,
        display_name: t.display_name,
        bio: t.bio,
        avatar_url: t.avatar_url,
        type: t.type,
        plan: t.plan,
        config,
        social_links: socialLinks,
        created_at: t.created_at,
      },
      products: productsResult.results || [],
      formations: formationsResult.results || [],
      stats: {
        products_count: (productsResult.results || []).length,
        formations_count: (formationsResult.results || []).length,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
