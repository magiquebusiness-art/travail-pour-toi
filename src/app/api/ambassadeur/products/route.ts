import { NextResponse, type NextRequest } from 'next/server'
import { getDB, generateId } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Ensure the ambassador_products table exists
async function ensureTable(db: any) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS ambassador_products (
      id TEXT PRIMARY KEY,
      ambassador_id TEXT NOT NULL REFERENCES users(id),
      product_id TEXT NOT NULL REFERENCES marketplace_products(id),
      promo_code TEXT,
      referral_link TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(ambassador_id, product_id)
    )
  `).run()
}

// GET /api/ambassadeur/products — List products selected by the ambassador
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const db = await getDB()
    await ensureTable(db)

    // Get ambassador's selected products with product details
    const result = await db
      .prepare(`
        SELECT ap.id as selection_id, ap.promo_code, ap.referral_link, ap.created_at as selected_at,
          p.id, p.title, p.description_short, p.price, p.commission_n1, p.commission_n2, p.commission_n3,
          p.affiliate_link, p.image_url, p.status as product_status,
          c.name as category_name
        FROM ambassador_products ap
        JOIN marketplace_products p ON ap.product_id = p.id
        LEFT JOIN marketplace_categories c ON p.category_id = c.id
        WHERE ap.ambassador_id = ?
        ORDER BY ap.created_at DESC
      `)
      .bind(session.userId)
      .all()

    return NextResponse.json({ products: result.results || [] })
  } catch (error) {
    console.error('Ambassador products list error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/ambassadeur/products — Ambassador selects a product to promote
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const db = await getDB()
    await ensureTable(db)

    const body = await request.json()
    const { product_id } = body

    if (!product_id) {
      return NextResponse.json({ error: 'ID produit requis' }, { status: 400 })
    }

    // Verify product exists and is active
    const product = await db
      .prepare('SELECT id, promo_code, affiliate_link FROM marketplace_products WHERE id = ? AND status = ?')
      .bind(product_id, 'active')
      .first()

    if (!product) {
      return NextResponse.json({ error: 'Produit introuvable ou inactif' }, { status: 404 })
    }

    // Check if already selected
    const existing = await db
      .prepare('SELECT id FROM ambassador_products WHERE ambassador_id = ? AND product_id = ?')
      .bind(session.userId, product_id)
      .first()

    if (existing) {
      return NextResponse.json({ error: 'Produit déjà sélectionné' }, { status: 409 })
    }

    // Get ambassador's code
    const user = await db
      .prepare('SELECT affiliate_code FROM users WHERE id = ?')
      .bind(session.userId)
      .first()

    const affiliateCode = user?.affiliate_code || 'AMBASSADEUR'

    // Generate promo code: PRODUCT_PROMO + affiliate code suffix
    const promoCode = (product.promo_code || product_id.toUpperCase().slice(-4)) + '_' + affiliateCode.slice(0, 4)

    // Build referral link
    const baseUrl = request.headers.get('x-forwarded-host')
      ? `https://${request.headers.get('x-forwarded-host')}`
      : 'https://travail-pour-toi.com'
    const referralLink = product.affiliate_link || `${baseUrl}/r/${affiliateCode}?product=${product_id}`

    // Insert selection
    const selectionId = generateId()
    await db.prepare(`
      INSERT INTO ambassador_products (id, ambassador_id, product_id, promo_code, referral_link, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(selectionId, session.userId, product_id, promoCode, referralLink).run()

    return NextResponse.json({
      success: true,
      selection: {
        id: selectionId,
        promo_code: promoCode,
        referral_link: referralLink,
      }
    })
  } catch (error) {
    console.error('Ambassador product select error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/ambassadeur/products — Ambassador removes a product from their promotions
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const db = await getDB()
    await ensureTable(db)

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')

    if (!productId) {
      return NextResponse.json({ error: 'ID produit requis' }, { status: 400 })
    }

    await db.prepare('DELETE FROM ambassador_products WHERE ambassador_id = ? AND product_id = ?')
      .bind(session.userId, productId)
      .run()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ambassador product remove error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
