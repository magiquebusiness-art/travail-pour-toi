'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { StarryBackground } from '@/components/StarryBackground'
import {
  Diamond,
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Loader2,
  Search,
  CheckCircle2,
  Play,
  ChevronRight,
  XCircle,
  Mail,
} from 'lucide-react'

interface Enrollment {
  enrollment_id: string
  formation_id: string
  student_email: string
  student_name: string
  status: string
  progress_percent: number
  completed_lessons: string | null
  enrolled_at: string
  last_accessed_at: string | null
  completed_at: string | null
  formation_title: string
  thumbnail_url: string | null
  formation_description: string | null
  formation_price: number
  category: string | null
  total_lessons: number
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function MesFormationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <MesFormationsContent />
    </Suspense>
  )
}

function MesFormationsContent() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email')

  const [email, setEmail] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [emailError, setEmailError] = useState('')

  // Load saved email from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('nyxia_student_email')
    if (savedEmail) {
      setEmail(savedEmail)
    }
    if (emailParam) {
      setEmail(emailParam)
      handleLookup(emailParam)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLookup = useCallback(async (lookupEmail?: string) => {
    const emailToUse = (lookupEmail || email).trim()
    if (!emailToUse) {
      setEmailError('Veuillez entrer votre adresse email')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailToUse)) {
      setEmailError('Adresse email invalide')
      return
    }

    setEmailError('')
    setIsSearching(true)
    setSubmittedEmail(emailToUse)

    // Save to localStorage
    localStorage.setItem('nyxia_student_email', emailToUse)

    try {
      const res = await fetch(`/api/student/enrollments?email=${encodeURIComponent(emailToUse)}`)
      const data = await res.json()
      setEnrollments(data.enrollments || [])
    } catch (error) {
      console.error('Error fetching enrollments:', error)
      setEnrollments([])
    } finally {
      setIsSearching(false)
      setIsLoading(false)
    }
  }, [email])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup()
    }
  }

  return (
    <div className="min-h-screen relative">
      <StarryBackground />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center">
              <Diamond className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold gradient-text-violet">NyXia</span>
          </Link>
          <Link href="/formations" className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              Formations
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
              <GraduationCap className="h-4 w-4 text-[#F4C842]" />
              <span className="text-sm font-medium text-[#a5b4fc]">Mon Espace</span>
            </div>
            <h1 className="font-[var(--font-heading)] text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Mes <span className="gradient-text-violet">Formations</span>
            </h1>
            <p className="text-[#a5b4fc] text-lg max-w-xl mx-auto">
              Retrouvez toutes vos formations et suivez votre progression.
            </p>
          </div>

          {/* Email Lookup */}
          {!submittedEmail ? (
            <div className="max-w-md mx-auto">
              <div className="glass-card-gold p-8 text-center relative overflow-hidden">
                <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-[#F4C842]/5 blur-[80px] pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#7B5CFF]/20 to-purple-500/10 flex items-center justify-center">
                    <Mail className="w-7 h-7 text-[#7B5CFF]" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-3">Accédez à vos formations</h2>
                  <p className="text-zinc-400 text-sm mb-6">
                    Entrez l&apos;adresse email utilisée lors de votre inscription pour retrouver vos formations.
                  </p>
                  <div className="space-y-3">
                    <Input
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
                      onKeyDown={handleKeyDown}
                      className="bg-white/[0.05] border-purple-500/20 text-white placeholder:text-zinc-600 focus:border-purple-500/50 h-12"
                    />
                    {emailError && (
                      <div className="flex items-center gap-2 justify-center">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <p className="text-red-400 text-sm">{emailError}</p>
                      </div>
                    )}
                    <Button
                      onClick={() => handleLookup()}
                      className="btn-primary w-full py-3 text-base border-0"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Recherche en cours...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5 mr-2" />
                          Rechercher mes formations
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Loading State */}
              {isSearching ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-zinc-400">Chargement de vos formations...</p>
                  </div>
                </div>
              ) : enrollments.length === 0 ? (
                /* Empty State */
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-purple-500/30" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-3">Aucune formation trouvée</h3>
                  <p className="text-zinc-400 text-sm mb-8 max-w-md mx-auto">
                    Vous n&apos;êtes inscrit à aucune formation avec cette adresse email.
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <Link href="/formations">
                      <Button className="btn-primary border-0">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Parcourir les formations
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="text-zinc-400 hover:text-white"
                      onClick={() => { setSubmittedEmail(''); setEnrollments([]) }}
                    >
                      Changer d&apos;email
                    </Button>
                  </div>
                </div>
              ) : (
                /* Enrollment Cards Grid */
                <>
                  {/* Info bar */}
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-zinc-400 text-sm">
                      <span className="text-white font-medium">{enrollments.length}</span> formation{enrollments.length > 1 ? 's' : ''} trouvée{enrollments.length > 1 ? 's' : ''}
                      <span className="text-zinc-600 ml-2">({submittedEmail})</span>
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-500 hover:text-zinc-300 text-xs"
                      onClick={() => { setSubmittedEmail(''); setEnrollments([]) }}
                    >
                      Changer d&apos;email
                    </Button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    {enrollments.map((enrollment) => {
                      const isComplete = enrollment.progress_percent >= 100
                      const completedLessonCount = (() => {
                        try {
                          return JSON.parse(enrollment.completed_lessons || '[]').length
                        } catch {
                          return 0
                        }
                      })()

                      return (
                        <div
                          key={enrollment.enrollment_id}
                          className="glass-card border-0 overflow-hidden group hover:border-purple-500/20 transition-all duration-300"
                        >
                          {/* Thumbnail */}
                          <div className="relative h-36 bg-black/20 overflow-hidden">
                            {enrollment.thumbnail_url ? (
                              <img
                                src={enrollment.thumbnail_url}
                                alt={enrollment.formation_title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#7B5CFF]/20 to-purple-500/10 flex items-center justify-center">
                                <GraduationCap className="w-12 h-12 text-purple-400/40" />
                              </div>
                            )}
                            {/* Completion Badge */}
                            {isComplete && (
                              <div className="absolute top-3 right-3">
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Terminée
                                </Badge>
                              </div>
                            )}
                            {/* Category */}
                            {enrollment.category && !isComplete && (
                              <div className="absolute top-3 right-3">
                                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">
                                  {enrollment.category}
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-5">
                            <h3 className="text-white font-semibold text-base mb-2 line-clamp-2 group-hover:text-[#F4C842] transition-colors">
                              {enrollment.formation_title}
                            </h3>

                            {enrollment.formation_description && (
                              <p className="text-zinc-500 text-xs leading-relaxed mb-4 line-clamp-2">
                                {enrollment.formation_description}
                              </p>
                            )}

                            {/* Progress */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-zinc-400 text-xs">
                                  {completedLessonCount} / {enrollment.total_lessons || 0} leçons
                                </span>
                                <span className={`text-xs font-medium ${isComplete ? 'text-green-400' : 'text-[#a5b4fc]'}`}>
                                  {enrollment.progress_percent || 0}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isComplete
                                      ? 'bg-gradient-to-r from-green-500 to-green-400'
                                      : 'bg-gradient-to-r from-[#7B5CFF] to-[#F4C842]'
                                  }`}
                                  style={{ width: `${enrollment.progress_percent || 0}%` }}
                                />
                              </div>
                            </div>

                            {/* Enrolled date */}
                            <p className="text-zinc-600 text-[10px] mb-4">
                              Inscrit le {formatDate(enrollment.enrolled_at)}
                            </p>

                            {/* Continue Button */}
                            <Link href={`/formations/${enrollment.formation_id}/learn?email=${encodeURIComponent(submittedEmail)}`}>
                              <Button
                                className={`w-full py-2.5 text-sm border-0 ${
                                  isComplete
                                    ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                                    : 'btn-primary'
                                }`}
                              >
                                {isComplete ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Revoir la formation
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Continuer
                                    <ChevronRight className="w-4 h-4 ml-auto" />
                                  </>
                                )}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full relative">
        <div className="h-px bg-gradient-to-r from-transparent via-[#7B5CFF]/30 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center">
                <Diamond className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold gradient-text-violet text-sm">NyXia MarketPlace</span>
            </Link>
            <p className="text-zinc-600 text-xs">&copy; 2026 NyXia MarketPlace. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
