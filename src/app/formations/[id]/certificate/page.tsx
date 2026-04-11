'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StarryBackground } from '@/components/StarryBackground'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Loader2,
  Diamond,
  Lock,
  Award,
  GraduationCap,
  Download,
  Shield,
  Calendar,
  CheckCircle2,
  BookOpen,
  Trophy,
} from 'lucide-react'

interface Formation {
  id: string
  title: string
  description: string
  price: number
}

interface Enrollment {
  id: string
  student_email: string
  student_name: string | null
  progress_percent: number
  completed_lessons: string
  completed_at: string | null
  enrolled_at: string
}

export default function CertificatePage() {
  const params = useParams()
  const formationId = params.id as string
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [formation, setFormation] = useState<Formation | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [studentEmail, setStudentEmail] = useState('')

  // Get total lessons count
  const [totalLessons, setTotalLessons] = useState(0)

  useEffect(() => {
    async function fetchData() {
      try {
        const emailParam = searchParams.get('email')
        const savedEmail = localStorage.getItem(`nyxia_enrollment_${formationId}`)
        const email = emailParam || savedEmail || ''

        if (!email) {
          setIsLoading(false)
          return
        }

        setStudentEmail(email)
        if (emailParam) {
          localStorage.setItem(`nyxia_enrollment_${formationId}`, emailParam)
        }

        // Fetch enrollment
        const enrollmentRes = await fetch(
          `/api/stripe/enrollment?formationId=${formationId}&email=${encodeURIComponent(email)}`
        )
        const enrollmentData = await enrollmentRes.json()
        setEnrollment(enrollmentData.enrollment || null)
        setHasAccess(enrollmentData.hasAccess || false)

        // Fetch formation
        const formationRes = await fetch(`/api/formations/${formationId}`)
        const formationData = await formationRes.json()
        setFormation(formationData.formation)

        // Count total lessons
        const modules = formationData.modules || []
        let count = 0
        modules.forEach((mod: any) => { count += mod.lessons?.length || 0 })
        setTotalLessons(count)
      } catch (error) {
        console.error('Certificate page error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [formationId, searchParams])

  const isCompleted = enrollment && enrollment.progress_percent >= 100

  const handleDownload = () => {
    toast({
      title: 'Bientôt disponible',
      description: 'Le téléchargement du certificat sera disponible prochainement.',
    })
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <StarryBackground />
        <div className="relative z-10 text-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Chargement du certificat...</p>
        </div>
      </div>
    )
  }

  // ── No access / no email ───────────────────────────────────────────────────
  if (!hasAccess || !enrollment) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <StarryBackground />
        <div className="relative z-10 max-w-md w-full mx-4">
          <div className="glass-card p-10 text-center relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
                <Lock className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Accès restreint</h2>
              <p className="text-zinc-400 mb-8">
                Vous devez être inscrit à cette formation pour accéder au certificat.
              </p>
              <Link href={`/formations/${formationId}`}>
                <Button className="btn-primary w-full py-4 text-base border-0 mb-3">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Voir la formation
                </Button>
              </Link>
              <Link href="/formations">
                <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-300">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour aux formations
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Not completed yet ──────────────────────────────────────────────────────
  if (!isCompleted) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <StarryBackground />
        <div className="relative z-10 max-w-md w-full mx-4">
          <div className="glass-card-gold p-10 text-center relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-[#F4C842]/5 blur-[80px] pointer-events-none" />
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Formation en cours</h2>
              <p className="text-zinc-400 mb-6">
                Terminez toutes les leçons pour débloquer votre certificat.
              </p>

              {/* Progress indicator */}
              <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400 text-sm">Progression</span>
                  <span className="text-white font-bold">{enrollment.progress_percent}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-[#7B5CFF] to-[#F4C842] rounded-full transition-all duration-500"
                    style={{ width: `${enrollment.progress_percent}%` }}
                  />
                </div>
                <p className="text-zinc-500 text-xs">
                  {enrollment.completed_lessons ? JSON.parse(enrollment.completed_lessons).length : 0} / {totalLessons} leçons complétées
                </p>
              </div>

              <Link href={`/formations/${formationId}/learn?email=${encodeURIComponent(studentEmail)}`}>
                <Button className="btn-primary w-full py-4 text-base border-0 mb-3">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Continuer la formation
                </Button>
              </Link>
              <Link href={`/mes-formations?email=${encodeURIComponent(studentEmail)}`}>
                <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-300 w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à mes formations
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Certificate (Completed) ───────────────────────────────────────────────
  const completedDate = enrollment.completed_at
    ? new Date(enrollment.completed_at).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const enrolledDate = enrollment.enrolled_at
    ? new Date(enrollment.enrolled_at).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const completedLessonCount = enrollment.completed_lessons
    ? JSON.parse(enrollment.completed_lessons).length
    : 0

  return (
    <div className="min-h-screen relative flex flex-col">
      <StarryBackground />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3 border-b border-purple-500/10 bg-[#06101f]/80 backdrop-blur-lg shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center">
              <Diamond className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold gradient-text-violet text-sm hidden sm:block">NyXia</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/mes-formations?email=${encodeURIComponent(studentEmail)}`}>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white text-xs">
              <GraduationCap className="w-3 h-3 mr-1.5" />
              <span className="hidden sm:inline">Mes Formations</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="max-w-2xl w-full animate-slide-up">
          {/* Heading */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#F4C842]/20 to-[#F4C842]/5 flex items-center justify-center pulse-gold">
              <Trophy className="w-8 h-8 text-[#F4C842]" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold gradient-text-gold mb-2">
              Félicitations
            </h1>
            <p className="text-zinc-400 text-base">
              Vous avez avec succès terminé cette formation.
            </p>
          </div>

          {/* Completion Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="glass-card p-4 text-center">
              <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <p className="text-white font-bold text-xl">{completedLessonCount}</p>
              <p className="text-zinc-500 text-xs">Leçons</p>
            </div>
            <div className="glass-card p-4 text-center">
              <Award className="w-5 h-5 text-[#F4C842] mx-auto mb-2" />
              <p className="text-white font-bold text-xl">100%</p>
              <p className="text-zinc-500 text-xs">Progression</p>
            </div>
            <div className="glass-card p-4 text-center">
              <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <p className="text-white font-bold text-sm leading-7">
                {completedDate || '—'}
              </p>
              <p className="text-zinc-500 text-xs">Complétion</p>
            </div>
          </div>

          {/* Certificate Card */}
          <div className="relative mb-8">
            <div className="absolute -inset-[1px] bg-gradient-to-br from-[#F4C842] via-[#7B5CFF] to-[#F4C842] rounded-2xl opacity-60 blur-[1px]" />
            <div className="relative bg-[#0c1a2e] rounded-2xl p-8 sm:p-10 overflow-hidden">
              {/* Decorative corners */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#F4C842]/30 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#F4C842]/30 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#F4C842]/30 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#F4C842]/30 rounded-br-lg" />

              {/* Glow effects */}
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[#F4C842]/5 blur-[60px] pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-[#7B5CFF]/5 blur-[60px] pointer-events-none" />

              <div className="relative z-10 text-center">
                {/* Logo & Brand */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center">
                    <Diamond className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold gradient-text-violet text-lg">NyXia MarketPlace</span>
                </div>

                {/* Certificate title */}
                <p className="text-[#F4C842] text-xs uppercase tracking-[0.3em] mb-2 font-semibold">
                  Certificat de complétion
                </p>
                <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[#F4C842]/40 to-transparent mx-auto mb-6" />

                {/* Recipient */}
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Délivré à</p>
                <p className="text-white text-xl sm:text-2xl font-bold mb-6">
                  {enrollment.student_name || enrollment.student_email}
                </p>

                {/* Formation */}
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Pour avoir complété</p>
                <p className="text-white text-lg font-semibold mb-6">
                  {formation?.title || 'Formation'}
                </p>

                {/* Stats row */}
                <div className="flex items-center justify-center gap-6 mb-6 text-sm text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{completedLessonCount} leçons</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{completedDate || enrolledDate || '—'}</span>
                  </div>
                </div>

                {/* Signature area */}
                <div className="pt-6 border-t border-white/5">
                  <p className="text-zinc-600 text-[10px] uppercase tracking-[0.2em] mb-1">
                    Certifié par NyXia MarketPlace
                  </p>
                  <div className="flex items-center justify-center gap-1.5 text-zinc-500 text-xs">
                    <Shield className="w-3 h-3" />
                    <span>Identifiant : {enrollment.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownload}
              className="btn-gold flex-1 py-4 text-base border-0"
            >
              <Download className="w-5 h-5 mr-2" />
              Télécharger le certificat
            </Button>
            <Link href={`/mes-formations?email=${encodeURIComponent(studentEmail)}`} className="flex-1">
              <Button
                variant="outline"
                className="w-full py-4 text-base border-purple-500/20 text-zinc-400 hover:text-white hover:border-purple-500/40"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour à mes formations
              </Button>
            </Link>
          </div>

          {/* Continue learning link */}
          <p className="text-center text-zinc-600 text-xs mt-6">
            <Link
              href={`/formations/${formationId}/learn?email=${encodeURIComponent(studentEmail)}`}
              className="hover:text-purple-400 transition-colors underline underline-offset-2"
            >
              Revoir le contenu de la formation
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
