import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'

// GET /api/public/marketplace — Public marketplace products (no auth required)
export async function GET() {
  try {
    const db = await getDB()

    const result = await db
      .prepare(`
        SELECT p.id, p.title, p.description_short, p.price, p.commission_n1, p.commission_n2, p.commission_n3, p.affiliate_link, p.image_url, c.name as category_name
        FROM marketplace_products p
        LEFT JOIN marketplace_categories c ON p.category_id = c.id
        WHERE p.status = ?
        ORDER BY p.created_at DESC
        LIMIT 50
      `)
      .bind('active')
      .all()

    return NextResponse.json({ products: result.results || [] })
  } catch (error) {
    console.error('Public marketplace error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
