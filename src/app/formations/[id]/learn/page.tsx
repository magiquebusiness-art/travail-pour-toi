'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarryBackground } from '@/components/StarryBackground'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Play,
  FileText,
  Video,
  Headphones,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Diamond,
  GraduationCap,
  Lock,
  Menu,
  X,
  CreditCard,
  Shield,
  AlertTriangle,
  Trophy,
  Award,
  PartyPopper,
  ArrowRight,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Formation {
  id: string
  title: string
  description: string
  price: number
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

interface Lesson {
  id: string
  module_id: string
  title: string
  content_type: string
  video_url: string
  content_html: string
  duration_minutes: number
  is_free: number
}

function formatDuration(minutes: number) {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }
  return `${minutes}min`
}

const contentTypeIcon = (type: string) => {
  switch (type) {
    case 'video': return <Video className="w-4 h-4" />
    case 'audio': return <Headphones className="w-4 h-4" />
    case 'pdf': return <FileText className="w-4 h-4" />
    case 'quiz': return <HelpCircle className="w-4 h-4" />
    default: return <FileText className="w-4 h-4" />
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// Completion Celebration Overlay Component
// ════════════════════════════════════════════════════════════════════════════════

function CelebrationOverlay({
  formationTitle,
  totalLessons,
  formationId,
  studentEmail,
  onDismiss,
}: {
  formationTitle: string
  totalLessons: number
  formationId: string
  studentEmail: string
  onDismiss: () => void
}) {
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          onDismiss()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [onDismiss])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
      onClick={onDismiss}
      role="dialog"
      aria-label="Félicitations - Formation terminée"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Confetti particles (CSS-only) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full celebration-particle"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `-20px`,
              width: `${Math.random() * 10 + 6}px`,
              height: `${Math.random() * 10 + 6}px`,
              backgroundColor: i % 3 === 0 ? '#F4C842' : i % 3 === 1 ? '#7B5CFF' : '#a78bfa',
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 3}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Content Card */}
      <div
        className="relative z-10 max-w-lg w-full mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass-card-gold p-8 sm:p-10 text-center relative overflow-hidden">
          {/* Glow effects */}
          <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-[#F4C842]/10 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-[#7B5CFF]/10 blur-[80px] pointer-events-none" />

          <div className="relative z-10">
            {/* Trophy icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#F4C842]/20 to-[#F4C842]/5 flex items-center justify-center pulse-gold">
              <Trophy className="w-10 h-10 text-[#F4C842]" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold gradient-text-gold mb-3">
              Félicitations !
            </h2>

            <p className="text-zinc-300 text-base mb-6">
              Vous avez terminé la formation avec succès.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-3 mb-8">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Formation</p>
                <p className="text-white font-semibold text-sm truncate">{formationTitle}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Leçons</p>
                  <p className="text-[#F4C842] font-bold text-xl">{totalLessons}</p>
                  <p className="text-zinc-500 text-[10px]">complétées</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Progression</p>
                  <p className="text-[#7B5CFF] font-bold text-xl">100%</p>
                  <p className="text-zinc-500 text-[10px]">terminé</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Link href={`/formations/${formationId}/certificate?email=${encodeURIComponent(studentEmail)}`}>
                <Button className="btn-gold w-full py-4 text-base border-0">
                  <Award className="w-5 h-5 mr-2" />
                  Obtenir mon certificat
                </Button>
              </Link>
              <Link href={`/mes-formations?email=${encodeURIComponent(studentEmail)}`}>
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white text-sm w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retourner à mes formations
                </Button>
              </Link>
            </div>

            {/* Auto-dismiss countdown */}
            <p className="text-zinc-600 text-xs mt-6">
              Fermeture automatique dans {countdown}s
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// Main Learn Page Component
// ════════════════════════════════════════════════════════════════════════════════

export default function FormationLearnPage() {
  const params = useParams()
  const formationId = params.id as string
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [formation, setFormation] = useState<Formation | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [showCelebration, setShowCelebration] = useState(false)

  // Enrollment & access control state
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [studentEmail, setStudentEmail] = useState<string>('')
  const [isEnrollmentLoading, setIsEnrollmentLoading] = useState(true)
  const [isPolling, setIsPolling] = useState(false)

  const celebrationDismissed = useRef(false)

  // ── Compute flat lesson list and navigation ────────────────────────────────
  const flatLessons = useMemo(() => {
    return modules.flatMap(m => m.lessons)
  }, [modules])

  const currentLessonIndex = useMemo(() => {
    if (!currentLesson) return -1
    return flatLessons.findIndex(l => l.id === currentLesson.id)
  }, [currentLesson, flatLessons])

  const prevLesson = useMemo(() => {
    return currentLessonIndex > 0 ? flatLessons[currentLessonIndex - 1] : null
  }, [currentLessonIndex, flatLessons])

  const nextLesson = useMemo(() => {
    return currentLessonIndex >= 0 && currentLessonIndex < flatLessons.length - 1
      ? flatLessons[currentLessonIndex + 1]
      : null
  }, [currentLessonIndex, flatLessons])

  const isLastLesson = currentLessonIndex === flatLessons.length - 1

  const allCompleted = useMemo(() => {
    return completedLessons.size === flatLessons.length && flatLessons.length > 0
  }, [completedLessons.size, flatLessons.length])

  // Compute progress
  const allLessonsCount = flatLessons.length
  const progressPercent = allLessonsCount > 0 ? Math.round((completedLessons.size / allLessonsCount) * 100) : 0

  // ── Check enrollment status on mount ───────────────────────────────────────
  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | null = null

    async function checkAccess() {
      try {
        const emailParam = searchParams.get('email')
        const savedEmail = localStorage.getItem(`nyxia_enrollment_${formationId}`)
        const email = emailParam || savedEmail || ''
        const isPaymentSuccess = searchParams.get('payment') === 'success'

        if (email) {
          setStudentEmail(email)
          if (emailParam) {
            localStorage.setItem(`nyxia_enrollment_${formationId}`, emailParam)
          }

          const res = await fetch(`/api/stripe/enrollment?formationId=${formationId}&email=${encodeURIComponent(email)}`)
          const data = await res.json()
          setHasAccess(data.hasAccess)

          if (data.enrollment?.completed_lessons) {
            try {
              const lessons: string[] = JSON.parse(data.enrollment.completed_lessons)
              setCompletedLessons(new Set(lessons))
            } catch { /* ignore parse errors */ }
          }

          if (isPaymentSuccess && !data.hasAccess) {
            setIsPolling(true)
            let attempts = 0
            const maxAttempts = 10
            pollInterval = setInterval(async () => {
              attempts++
              try {
                const pollRes = await fetch(`/api/stripe/enrollment?formationId=${formationId}&email=${encodeURIComponent(email)}`)
                const pollData = await pollRes.json()
                if (pollData.hasAccess) {
                  if (pollInterval) clearInterval(pollInterval)
                  pollInterval = null
                  setIsPolling(false)
                  setHasAccess(true)
                  if (pollData.enrollment?.completed_lessons) {
                    try {
                      setCompletedLessons(new Set(JSON.parse(pollData.enrollment.completed_lessons)))
                    } catch {}
                  }
                } else if (attempts >= maxAttempts) {
                  if (pollInterval) clearInterval(pollInterval)
                  pollInterval = null
                  setIsPolling(false)
                }
              } catch {
                if (attempts >= maxAttempts && pollInterval) {
                  clearInterval(pollInterval)
                  pollInterval = null
                  setIsPolling(false)
                }
              }
            }, 3000)
          }
        } else {
          const formationRes = await fetch(`/api/formations/${formationId}`)
          const formationData = await formationRes.json()
          if (formationData.formation?.price <= 0) {
            setHasAccess(true)
          } else {
            setHasAccess(false)
          }
        }
      } catch (error) {
        console.error('Enrollment check error:', error)
        setHasAccess(false)
      } finally {
        setIsEnrollmentLoading(false)
      }
    }

    checkAccess()

    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [formationId, searchParams])

  // ── Fetch formation data ───────────────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/formations/${formationId}`)
        const result = await response.json()

        if (!response.ok) throw new Error('Formation non trouvée')

        setFormation(result.formation)
        setModules(result.modules || [])

        const allFetched: Lesson[] = []
        result.modules?.forEach((mod: Module) => {
          allFetched.push(...mod.lessons)
        })
        if (allFetched.length > 0) {
          setCurrentLesson(allFetched[0])
          if (result.modules?.length > 0) {
            setExpandedModules(new Set([result.modules[0].id]))
          }
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [formationId])

  // ── Show celebration when all lessons completed ────────────────────────────
  useEffect(() => {
    if (allCompleted && !celebrationDismissed.current && flatLessons.length > 0) {
      const timer = setTimeout(() => {
        setShowCelebration(true)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [allCompleted, flatLessons.length])

  const dismissCelebration = useCallback(() => {
    celebrationDismissed.current = true
    setShowCelebration(false)
  }, [])

  const selectLesson = useCallback((lesson: Lesson) => {
    setCurrentLesson(lesson)
    setExpandedModules(prev => new Set([...prev, lesson.module_id]))
  }, [])

  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }, [])

  const markComplete = useCallback((lessonId: string) => {
    const wasAlreadyCompleted = completedLessons.has(lessonId)

    setCompletedLessons(prev => {
      const next = new Set(prev)
      if (next.has(lessonId)) next.delete(lessonId)
      else next.add(lessonId)
      return next
    })

    if (studentEmail) {
      fetch('/api/stripe/enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formationId,
          email: studentEmail,
          lessonId,
        }),
      }).catch((err) => console.error('Failed to save progress:', err))
    }

    // Auto-advance to next lesson after 1 second (only if marking as complete, not un-marking)
    if (!wasAlreadyCompleted && nextLesson) {
      setTimeout(() => {
        setCurrentLesson(nextLesson)
        setExpandedModules(prev => new Set([...prev, nextLesson.module_id]))
      }, 1000)
    }

    // Show toast feedback
    if (!wasAlreadyCompleted) {
      if (isLastLesson) {
        toast({
          title: 'Dernière leçon terminée !',
          description: 'Toutes nos félicitations pour avoir complété cette formation.',
        })
      } else {
        toast({
          title: 'Leçon terminée',
          description: 'Passage automatique à la leçon suivante...',
        })
      }
    }
  }, [formationId, studentEmail, completedLessons, nextLesson, isLastLesson, toast])

  // Determine if lesson is locked
  const isLessonLocked = useCallback((lesson: Lesson) => {
    if (lesson.is_free) return false
    if (hasAccess) return false
    return true
  }, [hasAccess])

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading || isEnrollmentLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <StarryBackground />
        <div className="relative z-10 text-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Chargement du cours...</p>
        </div>
      </div>
    )
  }

  if (!formation) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <StarryBackground />
        <div className="relative z-10 text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-purple-500/20" />
          <h2 className="text-white text-xl mb-4">Formation non trouvée</h2>
          <Link href="/formations">
            <Button className="btn-primary border-0"><ArrowLeft className="w-4 h-4 mr-2" />Formations</Button>
          </Link>
        </div>
      </div>
    )
  }

  // ── Paywall ────────────────────────────────────────────────────────────────
  if (hasAccess === false && formation.price > 0) {
    if (isPolling) {
      return (
        <div className="min-h-screen relative flex items-center justify-center">
          <StarryBackground />
          <div className="relative z-10 max-w-md w-full mx-4 text-center">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">Confirmation du paiement en cours...</h2>
            <p className="text-zinc-400">Votre paiement a été reçu. Veuillez patienter quelques instants pendant que nous activons votre accès.</p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <StarryBackground />
        <div className="relative z-10 max-w-md w-full mx-4">
          <div className="glass-card-gold p-10 text-center relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-[#F4C842]/5 blur-[80px] pointer-events-none" />
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#7B5CFF]/20 to-purple-500/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Accès restreint</h2>
              <p className="text-zinc-400 mb-2">Cette formation est payante.</p>
              <p className="text-zinc-500 text-sm mb-8">
                Procédez au paiement pour débloquer l&apos;intégralité du contenu et suivre votre progression.
              </p>
              {searchParams.get('payment') === 'success' && !isPolling && (
                <div className="mb-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-amber-400 text-sm">Si vous venez de payer, veuillez patienter un instant ou contacter le support.</p>
                </div>
              )}
              <Link href={`/formations/${formationId}`}>
                <Button className="btn-gold w-full py-4 text-base border-0 mb-4">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Accéder à la formation
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

  return (
    <div className="min-h-screen relative flex flex-col">
      <StarryBackground />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3 border-b border-purple-500/10 bg-[#06101f]/80 backdrop-blur-lg shrink-0">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-2 text-zinc-400 hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center">
              <Diamond className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold gradient-text-violet text-sm hidden sm:block">NyXia</span>
          </Link>
          <div className="hidden sm:block h-4 w-px bg-zinc-700" />
          <span className="text-zinc-400 text-sm truncate max-w-[200px]">{formation.title}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Progress bar */}
          {hasAccess && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7B5CFF] to-[#F4C842] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-zinc-400 text-xs">{progressPercent}%</span>
            </div>
          )}
          {!hasAccess && formation.price > 0 && (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Aperçu gratuit
            </Badge>
          )}
          {/* Mes Formations link - for enrolled students */}
          {hasAccess && studentEmail && (
            <Link href={`/mes-formations?email=${encodeURIComponent(studentEmail)}`}>
              <Button variant="ghost" size="sm" className="text-[#a5b4fc] hover:text-white text-xs">
                <GraduationCap className="w-3 h-3 mr-1.5" />
                <span className="hidden sm:inline">Mes Formations</span>
                <span className="sm:hidden">Mes cours</span>
              </Button>
            </Link>
          )}
          <Link href={`/formations/${formationId}`}>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white text-xs">
              Retour
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex relative z-10">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } fixed lg:sticky top-0 lg:top-[56px] left-0 z-30 w-80 h-[calc(100vh-56px)] bg-[#0c1a2e]/95 backdrop-blur-xl border-r border-purple-500/10 overflow-y-auto custom-scrollbar transition-transform duration-300 shrink-0`}
        >
          <div className="p-4">
            {/* Progress summary in sidebar */}
            {hasAccess && (
              <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400 text-xs">Progression globale</span>
                  <span className="text-white text-xs font-semibold">{completedLessons.size}/{allLessonsCount}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7B5CFF] to-[#F4C842] rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {allCompleted && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Trophy className="w-3 h-3 text-[#F4C842]" />
                    <span className="text-[#F4C842] text-[10px] font-semibold">Formation terminée !</span>
                  </div>
                )}
              </div>
            )}

            <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Contenu du cours
            </h2>

            <div className="space-y-1">
              {modules.map((module) => (
                <div key={module.id}>
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-white/5 transition-colors"
                  >
                    <ChevronRight className={`w-3 h-3 text-zinc-500 shrink-0 transition-transform ${expandedModules.has(module.id) ? 'rotate-90' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{module.title}</p>
                      <p className="text-zinc-600 text-[10px]">{module.lessons.length} leçon(s)</p>
                    </div>
                  </button>

                  {expandedModules.has(module.id) && (
                    <div className="ml-4 space-y-0.5 mt-0.5">
                      {module.lessons.map((lesson) => {
                        const isCurrent = currentLesson?.id === lesson.id
                        const isCompleted = completedLessons.has(lesson.id)
                        const isLocked = isLessonLocked(lesson)

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => selectLesson(lesson)}
                            disabled={isLocked}
                            className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-left transition-all ${
                              isCurrent
                                ? 'bg-purple-500/15 border border-purple-500/30'
                                : 'hover:bg-white/5 border border-transparent'
                            } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                            ) : isLocked ? (
                              <Lock className="w-4 h-4 text-zinc-600 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-zinc-600 shrink-0" />
                            )}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {contentTypeIcon(lesson.content_type)}
                              <span className={`text-sm truncate ${isCurrent ? 'text-white' : 'text-zinc-400'}`}>
                                {lesson.title}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main Lesson Area ──────────────────────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-8 lg:p-12 max-w-4xl">
          {currentLesson ? (
            <div className="space-y-6">
              {/* Lesson Header */}
              <div>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {contentTypeIcon(currentLesson.content_type)}
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">
                    {currentLesson.content_type === 'video' ? 'Vidéo' :
                     currentLesson.content_type === 'audio' ? 'Audio' :
                     currentLesson.content_type === 'quiz' ? 'Quiz' :
                     currentLesson.content_type === 'pdf' ? 'PDF' : 'Texte'}
                  </Badge>
                  {currentLesson.duration_minutes > 0 && (
                    <span className="text-zinc-500 text-xs">{formatDuration(currentLesson.duration_minutes)}</span>
                  )}
                  {/* Lesson position indicator */}
                  <span className="text-zinc-600 text-xs ml-auto">
                    Leçon {currentLessonIndex + 1} sur {allLessonsCount}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{currentLesson.title}</h1>
              </div>

              {/* Video Player */}
              {currentLesson.content_type === 'video' && currentLesson.video_url && (
                <div className="aspect-video rounded-2xl overflow-hidden bg-black/30 border border-purple-500/10">
                  <div className="w-full h-full flex items-center justify-center relative">
                    {currentLesson.video_url.includes('youtube.com') || currentLesson.video_url.includes('youtu.be') ? (
                      <iframe
                        src={currentLesson.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        title={currentLesson.title}
                      />
                    ) : (
                      <div className="text-center">
                        <Play className="w-16 h-16 text-purple-400 mx-auto mb-3" />
                        <a href={currentLesson.video_url} target="_blank" rel="noopener noreferrer">
                          <Button className="btn-primary border-0">
                            <Play className="w-4 h-4 mr-2" />
                            Ouvrir la vidéo
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lesson Content */}
              <div className="prose prose-invert max-w-none">
                {currentLesson.content_html ? (
                  <div
                    className="text-zinc-300 leading-relaxed text-base"
                    dangerouslySetInnerHTML={{ __html: currentLesson.content_html }}
                  />
                ) : (
                  <div className="text-center py-16">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                    <p className="text-zinc-500">Le contenu de cette leçon n&apos;est pas encore disponible.</p>
                  </div>
                )}
              </div>

              {/* ── Bottom Navigation Bar ────────────────────────────────────── */}
              <div className="pt-8 border-t border-purple-500/10">
                {/* Mark Complete Button - centered */}
                <div className="flex justify-center mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-purple-500/20 transition-all ${
                      completedLessons.has(currentLesson.id)
                        ? 'text-green-400 border-green-500/30 bg-green-500/5 hover:bg-green-500/10'
                        : 'text-zinc-400 hover:text-white hover:border-purple-500/40'
                    }`}
                    onClick={() => markComplete(currentLesson.id)}
                  >
                    {completedLessons.has(currentLesson.id) ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                        Complétée
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4 mr-2" />
                        Marquer comme terminée
                      </>
                    )}
                  </Button>
                </div>

                {/* Next / Previous Navigation */}
                <div className="flex items-center justify-between gap-4">
                  {/* Previous Lesson */}
                  <div className="flex-1 min-w-0">
                    {prevLesson ? (
                      <button
                        onClick={() => selectLesson(prevLesson)}
                        className="group flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-purple-500/20 hover:bg-white/5 transition-all w-full text-left"
                      >
                        <ChevronLeft className="w-5 h-5 text-zinc-500 group-hover:text-purple-400 shrink-0 transition-colors" />
                        <div className="min-w-0">
                          <span className="text-zinc-600 text-[10px] uppercase tracking-wider block">Leçon précédente</span>
                          <span className="text-zinc-400 text-sm group-hover:text-white transition-colors truncate block">
                            {prevLesson.title}
                          </span>
                        </div>
                      </button>
                    ) : (
                      <div className="p-3 opacity-30">
                        <span className="text-zinc-600 text-[10px] uppercase tracking-wider block">Leçon précédente</span>
                        <span className="text-zinc-700 text-sm block">Aucune</span>
                      </div>
                    )}
                  </div>

                  {/* Next Lesson or Certificate */}
                  <div className="flex-1 min-w-0">
                    {nextLesson ? (
                      <button
                        onClick={() => selectLesson(nextLesson)}
                        className="group flex items-center justify-end gap-3 p-3 rounded-xl border border-white/5 hover:border-purple-500/20 hover:bg-white/5 transition-all w-full text-right"
                      >
                        <div className="min-w-0 text-right">
                          <span className="text-zinc-600 text-[10px] uppercase tracking-wider block">Leçon suivante</span>
                          <span className="text-zinc-400 text-sm group-hover:text-white transition-colors truncate block">
                            {nextLesson.title}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-purple-400 shrink-0 transition-colors" />
                      </button>
                    ) : (
                      // Last lesson - show certificate link if completed
                      <div>
                        {allCompleted ? (
                          <Link
                            href={`/formations/${formationId}/certificate?email=${encodeURIComponent(studentEmail)}`}
                            className="group flex items-center justify-end gap-3 p-3 rounded-xl border border-[#F4C842]/20 bg-[#F4C842]/5 hover:bg-[#F4C842]/10 transition-all w-full text-right"
                          >
                            <div className="min-w-0 text-right">
                              <span className="text-[#F4C842]/60 text-[10px] uppercase tracking-wider block">Formation terminée</span>
                              <span className="text-[#F4C842] text-sm font-semibold group-hover:text-[#fde68a] transition-colors block">
                                Voir mon certificat
                              </span>
                            </div>
                            <Award className="w-5 h-5 text-[#F4C842] shrink-0" />
                          </Link>
                        ) : (
                          <div className="p-3 opacity-30 text-right">
                            <span className="text-zinc-600 text-[10px] uppercase tracking-wider block">Leçon suivante</span>
                            <span className="text-zinc-700 text-sm block">Dernière leçon</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">Sélectionnez une leçon pour commencer</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Completion Celebration Overlay ──────────────────────────────────── */}
      {showCelebration && (
        <CelebrationOverlay
          formationTitle={formation.title}
          totalLessons={allLessonsCount}
          formationId={formationId}
          studentEmail={studentEmail}
          onDismiss={dismissCelebration}
        />
      )}
    </div>
  )
}
