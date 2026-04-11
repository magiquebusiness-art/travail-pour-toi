'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  Loader2,
  Diamond,
  GraduationCap,
  Lock,
  Menu,
  X,
  CreditCard,
  Shield,
  AlertTriangle,
} from 'lucide-react'

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

export default function FormationLearnPage() {
  const params = useParams()
  const formationId = params.id as string

  const [formation, setFormation] = useState<Formation | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())

  // Enrollment & access control state
  const [hasAccess, setHasAccess] = useState<boolean | null>(null) // null = checking
  const [studentEmail, setStudentEmail] = useState<string>('')
  const [isEnrollmentLoading, setIsEnrollmentLoading] = useState(true)
  const [isPolling, setIsPolling] = useState(false)

  const searchParams = useSearchParams()

  // Check enrollment status on mount
  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | null = null

    async function checkAccess() {
      try {
        // Get email from URL params (passed after Stripe payment) or localStorage
        const emailParam = searchParams.get('email')
        const savedEmail = localStorage.getItem(`nyxia_enrollment_${formationId}`)
        const email = emailParam || savedEmail || ''
        const isPaymentSuccess = searchParams.get('payment') === 'success'

        if (email) {
          setStudentEmail(email)
          // Save to localStorage for future visits
          if (emailParam) {
            localStorage.setItem(`nyxia_enrollment_${formationId}`, emailParam)
          }

          const res = await fetch(`/api/stripe/enrollment?formationId=${formationId}&email=${encodeURIComponent(email)}`)
          const data = await res.json()
          setHasAccess(data.hasAccess)

          // Restore progress from enrollment
          if (data.enrollment?.completed_lessons) {
            try {
              const lessons: string[] = JSON.parse(data.enrollment.completed_lessons)
              setCompletedLessons(new Set(lessons))
            } catch { /* ignore parse errors */ }
          }

          // If payment=success but no access yet, start polling
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
          // No email provided — check if formation is free
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
        // On error, allow access to free lesson previews
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

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/formations/${formationId}`)
        const result = await response.json()

        if (!response.ok) throw new Error('Formation non trouvée')

        setFormation(result.formation)
        setModules(result.modules || [])

        // Auto-select first lesson
        const allLessons: Lesson[] = []
        result.modules?.forEach((mod: Module) => {
          allLessons.push(...mod.lessons)
        })
        if (allLessons.length > 0) {
          setCurrentLesson(allLessons[0])
          // Expand first module
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

  const selectLesson = useCallback((lesson: Lesson) => {
    setCurrentLesson(lesson)
    // Ensure the module containing this lesson is expanded
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
    setCompletedLessons(prev => {
      const next = new Set(prev)
      if (next.has(lessonId)) next.delete(lessonId)
      else next.add(lessonId)
      return next
    })

    // Save progress to database
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
  }, [formationId, studentEmail])

  // Compute progress
  const allLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const progressPercent = allLessons > 0 ? Math.round((completedLessons.size / allLessons) * 100) : 0

  // Determine if lesson is locked based on enrollment
  const isLessonLocked = useCallback((lesson: Lesson) => {
    // Free lessons are always accessible
    if (lesson.is_free) return false
    // If user has full access, nothing is locked
    if (hasAccess) return false
    // Otherwise, paid lessons are locked
    return true
  }, [hasAccess])

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

  // Paywall — user has no access and formation is paid
  if (hasAccess === false && formation.price > 0) {
    // Polling state: show payment processing animation
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

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3 border-b border-purple-500/10 bg-[#06101f]/80 backdrop-blur-lg shrink-0">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-2 text-zinc-400 hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
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
        <div className="flex items-center gap-3">
          {/* Progress */}
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
          {hasAccess && studentEmail && (
            <Link href={`/mes-formations?email=${encodeURIComponent(studentEmail)}`} className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-[#a5b4fc] hover:text-white text-xs">
                <BookOpen className="w-3 h-3 mr-1.5" />
                Mes Formations
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

      {/* Main Content */}
      <div className="flex-1 flex relative z-10">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } fixed lg:sticky top-0 lg:top-[56px] left-0 z-30 w-80 h-[calc(100vh-56px)] bg-[#0c1a2e]/95 backdrop-blur-xl border-r border-purple-500/10 overflow-y-auto custom-scrollbar transition-transform duration-300 shrink-0`}
        >
          <div className="p-4">
            <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Contenu du cours
            </h2>

            <div className="space-y-1">
              {modules.map((module) => (
                <div key={module.id}>
                  {/* Module Header */}
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

                  {/* Lessons */}
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

        {/* Main Lesson Area */}
        <main className="flex-1 p-4 sm:p-8 lg:p-12 max-w-4xl">
          {currentLesson ? (
            <div className="space-y-6">
              {/* Lesson Header */}
              <div>
                <div className="flex items-center gap-2 mb-3">
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
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{currentLesson.title}</h1>
              </div>

              {/* Video Player */}
              {currentLesson.content_type === 'video' && currentLesson.video_url && (
                <div className="aspect-video rounded-2xl overflow-hidden bg-black/30 border border-purple-500/10">
                  <div className="w-full h-full flex items-center justify-center relative">
                    {/* Simple video embed (YouTube/Vimeo detection) */}
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

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between pt-8 border-t border-purple-500/10">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-500/20 text-zinc-400 hover:text-white"
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
    </div>
  )
}
