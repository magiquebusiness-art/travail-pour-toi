// @ts-nocheck
/**
 * POST /api/formations/[id]/enroll-free
 * Inscrit un étudiant gratuitement à une formation sans paiement
 * Public — accessible aux étudiants
 */
import { NextResponse } from 'next/server'
import { getDB, generateId } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formationId } = await params
    const body = await request.json()
    const { email, name } = body

    // Validations
    if (!formationId) {
      return NextResponse.json({ error: 'Formation ID requis' }, { status: 400 })
    }
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    const studentEmail = email.trim().toLowerCase()
    const studentName = (name || '').trim() || null

    const db = await getDB()
    if (!db) {
      return NextResponse.json({ error: 'Base de données indisponible' }, { status: 500 })
    }

    // 1. Verify formation exists, is published, and is free
    const formation = await db.prepare(
      'SELECT * FROM formations WHERE id = ? AND status = ? AND price = 0'
    ).bind(formationId, 'published').first()

    if (!formation) {
      return NextResponse.json(
        { error: 'Formation introuvable, non publiée ou non gratuite' },
        { status: 404 }
      )
    }

    // 2. Check if already enrolled
    const existing = await db.prepare(
      'SELECT id FROM formation_enrollments WHERE formation_id = ? AND student_email = ? AND status = ?'
    ).bind(formationId, studentEmail, 'active').first()

    if (existing) {
      // Already enrolled — return the learn URL
      const accessUrl = `/formations/${formationId}/learn?email=${encodeURIComponent(studentEmail)}`
      return NextResponse.json({ success: true, accessUrl, alreadyEnrolled: true })
    }

    // 3. Create enrollment record
    await db.prepare(`
      INSERT INTO formation_enrollments (id, formation_id, student_email, student_name, status, enrolled_at)
      VALUES (?, ?, ?, ?, 'active', datetime('now'))
    `).bind(generateId(), formationId, studentEmail, studentName).run()

    // 4. Create or update user record
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').bind(studentEmail).first()

    if (!existingUser) {
      const userId = generateId()
      const affiliateCode = await generateUniqueAffiliateCode(db)
      await db.prepare(`
        INSERT INTO users (id, email, full_name, role, affiliate_code, created_at)
        VALUES (?, ?, ?, 'affiliate', ?, datetime('now'))
      `).bind(userId, studentEmail, studentName, affiliateCode).run()
    }

    const accessUrl = `/formations/${formationId}/learn?email=${encodeURIComponent(studentEmail)}`

    return NextResponse.json({ success: true, accessUrl })
  } catch (error) {
    console.error('Free enrollment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de l'inscription gratuite" },
      { status: 500 }
    )
  }
}

async function generateUniqueAffiliateCode(db: any): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    const existing = await db.prepare('SELECT id FROM users WHERE affiliate_code = ?').bind(code).first()
    if (!existing) return code
  }
  return Date.now().toString(36).toUpperCase().slice(-8)
}
