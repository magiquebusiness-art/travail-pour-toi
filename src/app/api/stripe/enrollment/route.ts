// @ts-nocheck
/**
 * GET /api/stripe/enrollment?formationId=xxx&email=xxx
 * Vérifie si un étudiant a accès à une formation
 * Public — utilisé par la page d'apprentissage
 */
import { NextResponse } from 'next/server'
import { checkEnrollment } from '@/lib/stripe'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const formationId = searchParams.get('formationId')
    const email = searchParams.get('email')

    if (!formationId) {
      return NextResponse.json({ error: 'Formation ID requis' }, { status: 400 })
    }

    const result = await checkEnrollment(formationId, email)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Enrollment check error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification de l\'inscription' },
      { status: 500 },
    )
  }
}

/**
 * POST /api/stripe/enrollment
 * Met à jour la progression d'un étudiant
 */
import { updateProgress } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { formationId, email, lessonId } = body

    if (!formationId || !email || !lessonId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const result = await updateProgress(formationId, email, lessonId)

    if (!result) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Progress update error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la progression' },
      { status: 500 },
    )
  }
}
