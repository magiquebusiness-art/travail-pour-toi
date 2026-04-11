// @ts-nocheck
/**
 * GET /api/student/enrollments?email=xxx
 * Récupère toutes les inscriptions actives d'un étudiant avec les détails des formations
 * Public — accessible aux étudiants
 */
import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    const db = await getDB()
    if (!db) {
      return NextResponse.json({ error: 'Base de données indisponible' }, { status: 500 })
    }

    const enrollments = await db.prepare(`
      SELECT
        e.id as enrollment_id,
        e.formation_id,
        e.student_email,
        e.student_name,
        e.status,
        e.progress_percent,
        e.completed_lessons,
        e.enrolled_at,
        e.last_accessed_at,
        e.completed_at,
        f.title as formation_title,
        f.thumbnail_url,
        f.description as formation_description,
        f.price as formation_price,
        f.category,
        (SELECT COUNT(*) FROM formation_lessons fl WHERE fl.formation_id = f.id) as total_lessons
      FROM formation_enrollments e
      INNER JOIN formations f ON f.id = e.formation_id
      WHERE e.student_email = ? AND e.status = 'active'
      ORDER BY e.enrolled_at DESC
    `).bind(email.trim().toLowerCase()).all()

    return NextResponse.json({
      enrollments: enrollments.results || [],
      total: (enrollments.results || []).length,
    })
  } catch (error) {
    console.error('Student enrollments error:', error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des inscriptions" },
      { status: 500 }
    )
  }
}
