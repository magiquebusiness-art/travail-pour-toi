/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getDB, generateId } from '@/lib/db'
import { sendSaleNotification, sendAdminSaleNotification } from '@/lib/email'


/**
 * Systeme.io Webhook Handler
 * POST /api/webhooks/systemeio
 */

interface SystemeIoWebhookPayload {
  event: string
  data: {
    id: string
    contact?: {
      id?: string
      email?: string
      first_name?: string
      last_name?: string
    }
    product?: {
      id: string
      name?: string
      price?: number
    }
    metadata?: {
      affiliate_code?: string
      [key: string]: unknown
    }
    amount?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload: SystemeIoWebhookPayload = await request.json()

    console.log('[Systeme.io Webhook] Received:', JSON.stringify(payload, null, 2))

    // Optional webhook secret verification for backward compatibility
    const providedSecret = request.headers.get('x-webhook-secret')
    if (providedSecret) {
      const db = await getDB()
      // Look up any admin with a webhook_secret to verify
      const adminWithSecret = await db
        .prepare('SELECT webhook_secret FROM users WHERE webhook_secret IS NOT NULL AND webhook_secret != ? LIMIT 1')
        .bind('')
        .first()

      if (adminWithSecret && adminWithSecret.webhook_secret !== providedSecret) {
        console.log('[Systeme.io Webhook] Invalid webhook secret provided')
        return NextResponse.json({ success: false, error: 'Invalid webhook secret' }, { status: 401 })
      }
    }

    // Handle both contact.created and order.created events
    const handledEvents = ['contact.created', 'order.created']
    if (!handledEvents.includes(payload.event)) {
      console.log('[Systeme.io Webhook] Ignoring event:', payload.event)
      return NextResponse.json({ success: true, message: 'Event ignored' })
    }
    
    const { data } = payload
    
    // Use contact.id for contact.created, fallback to data.id
    const eventId = data.contact?.id || data.id
    if (!eventId) {
      return NextResponse.json({ success: false, error: 'Missing event ID' }, { status: 400 })
    }
    
    const affiliateCode = data.metadata?.affiliate_code
    
    if (!affiliateCode) {
      console.log('[Systeme.io Webhook] No affiliate code in metadata')
      return NextResponse.json({ success: true, message: 'No affiliate code - sale recorded without commission' })
    }

    const db = await getDB()
    
    // Find the affiliate by code (try uppercase first, then exact match)
    let user = await db
      .prepare('SELECT * FROM users WHERE affiliate_code = ?')
      .bind(affiliateCode.toUpperCase())
      .first()
    
    if (!user) {
      user = await db
        .prepare('SELECT * FROM users WHERE affiliate_code = ?')
        .bind(affiliateCode)
        .first()
    }
    
    if (!user) {
      console.log('[Systeme.io Webhook] Affiliate not found for code:', affiliateCode)
      return NextResponse.json({ success: false, error: 'Affiliate not found' }, { status: 404 })
    }
    
    // Get the affiliate record
    const affiliate = await db
      .prepare('SELECT id, program_id FROM affiliates WHERE user_id = ? AND status = ?')
      .bind(user.id, 'active')
      .first()
    
    if (!affiliate) {
      console.log('[Systeme.io Webhook] No active affiliate record for user:', user.id)
      return NextResponse.json({ success: false, error: 'No active affiliate record' }, { status: 404 })
    }
    
    // Determine the sale amount (0 for contact.created — commission tracked without amount)
    const saleAmount = data.amount || data.product?.price || 0
    
    // Customer info
    const customerEmail = data.contact?.email || null
    const customerName = data.contact?.first_name && data.contact?.last_name
      ? `${data.contact.first_name} ${data.contact.last_name}`
      : data.contact?.first_name || null
    
    // Get program commission rates
    const program = await db
      .prepare('SELECT commission_l1, commission_l2, commission_l3 FROM programs WHERE id = ?')
      .bind(affiliate.program_id)
      .first()

    if (!program) {
      return NextResponse.json({ success: false, error: 'Program not found' }, { status: 404 })
    }

    // Get affiliate with parent info
    const affiliateWithParent = await db
      .prepare('SELECT id, parent_affiliate_id, grandparent_affiliate_id FROM affiliates WHERE id = ?')
      .bind(affiliate.id)
      .first()

    // Calculate commissions
    const commissionL1 = (saleAmount * program.commission_l1) / 100
    const commissionL2 = (saleAmount * program.commission_l2) / 100
    const commissionL3 = (saleAmount * program.commission_l3) / 100

    // Create the sale
    const saleId = generateId()
    const now = new Date().toISOString()
    const metadata = JSON.stringify({
      systemeio_event: payload.event,
      product_id: data.product?.id,
      product_name: data.product?.name,
    })

    await db
      .prepare('INSERT INTO sales (id, affiliate_id, program_id, external_order_id, amount, commission_l1, commission_l2, commission_l3, customer_email, customer_name, metadata, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(
        saleId,
        affiliate.id,
        affiliate.program_id,
        eventId,
        saleAmount,
        commissionL1,
        commissionL2,
        commissionL3,
        customerEmail,
        customerName,
        metadata,
        'pending',
        now
      )
      .run()

    // Create commission records
    const commissions: Array<{ sale_id: string; affiliate_id: string; level: number; amount: number; status: string }> = []

    commissions.push({
      sale_id: saleId,
      affiliate_id: affiliate.id,
      level: 1,
      amount: commissionL1,
      status: 'pending',
    })

    if (affiliateWithParent?.parent_affiliate_id) {
      commissions.push({
        sale_id: saleId,
        affiliate_id: affiliateWithParent.parent_affiliate_id,
        level: 2,
        amount: commissionL2,
        status: 'pending',
      })
    }

    if (affiliateWithParent?.grandparent_affiliate_id) {
      commissions.push({
        sale_id: saleId,
        affiliate_id: affiliateWithParent.grandparent_affiliate_id,
        level: 3,
        amount: commissionL3,
        status: 'pending',
      })
    }

    // Insert commission records
    for (const commission of commissions) {
      await db
        .prepare('INSERT INTO commissions (id, sale_id, affiliate_id, level, amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(generateId(), commission.sale_id, commission.affiliate_id, commission.level, commission.amount, commission.status, now)
        .run()
    }
    
    console.log('[Systeme.io Webhook] Sale created:', saleId)
    console.log('[Systeme.io Webhook] Commissions created:', commissions.length)

    // ── Send email notifications (fire-and-forget, never block the response) ──
    if (user.email) {
      // 1. Notify the affiliate about their commission
      sendSaleNotification(
        user.email,
        user.full_name || user.email,
        saleAmount,
        customerEmail,
      ).catch(() => {})
    }

    // 2. Notify the admin (super_admin or admin linked to this affiliate)
    try {
      const adminEmail = await findAdminEmail(db, user)
      if (adminEmail) {
        sendAdminSaleNotification(
          adminEmail,
          saleAmount,
          user.full_name || user.email || 'Affilié',
          customerName,
        ).catch(() => {})
      }
    } catch {
      // ignore — email is best-effort
    }

    return NextResponse.json({
      success: true,
      sale_id: saleId,
      commissions_count: commissions.length,
    })
    
  } catch (error) {
    console.error('[Systeme.io Webhook] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Systeme.io webhook endpoint is active',
  })
}

/**
 * Walks up the chain to find the admin/super_admin email to notify about a sale.
 */
async function findAdminEmail(db: any, user: any): Promise<string | null> {
  // 1. Check if user has an explicit admin_id
  if (user.admin_id) {
    const admin = await db.prepare('SELECT email FROM users WHERE id = ?').bind(user.admin_id).first()
    if (admin?.email) return admin.email
  }

  // 2. Walk up parent chain (up to 5 levels)
  let currentId: string | null = user.parent_id
  for (let i = 0; i < 5; i++) {
    if (!currentId) break
    const profile = await db
      .prepare('SELECT id, email, role, parent_id, admin_id FROM users WHERE id = ?')
      .bind(currentId)
      .first()
    if (!profile) break
    if (profile.role === 'admin' || profile.role === 'super_admin') return profile.email
    if (profile.admin_id) {
      const admin = await db.prepare('SELECT email FROM users WHERE id = ?').bind(profile.admin_id).first()
      if (admin?.email) return admin.email
    }
    currentId = profile.parent_id
  }

  // 3. Fallback: look for any super_admin
  const superAdmin = await db
    .prepare("SELECT email FROM users WHERE role = 'super_admin' LIMIT 1")
    .first()
  return superAdmin?.email || null
}
