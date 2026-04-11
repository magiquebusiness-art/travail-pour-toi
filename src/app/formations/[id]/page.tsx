'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { StarryBackground } from '@/components/StarryBackground'
import {
  GraduationCap,
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  Check,
  ChevronRight,
  Loader2,
  Diamond,
  Star,
  Shield,
  Play,
  FileText,
  Video,
  Headphones,
  HelpCircle,
  Lock,
  CreditCard,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

interface Formation {
  id: string
  title: string
  description: string
  long_description: string
  price: number
  category: string | null
  thumbnail_url: string | null
  status: string
  created_at: string
}

interface Module {
  id: string
  title: string
  description: string
  is_free: number
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  content_type: string
  duration_minutes: number
  is_free: number
}

interface FormationStats {
  student_count: number
  module_count: number
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount)
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

export default function FormationLandingPage() {
  const params = useParams()
  const formationId = params.id as string

  const [formation, setFormation] = useState<Formation | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [stats, setStats] = useState<FormationStats>({ student_count: 0, module_count: 0 })
  const [pageContent, setPageContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set())

  // Checkout state
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [studentEmail, setStudentEmail] = useState('')
  const [studentName, setStudentName] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | null>(null)

  const searchParams = useSearchParams()

  useEffect(() => {
    // Check payment status from URL params
    const payment = searchParams.get('payment')
    if (payment === 'success') setPaymentStatus('success')
    else if (payment === 'cancelled') setPaymentStatus('cancelled')
  }, [searchParams])

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/formations/${formationId}`)
        const result = await response.json()

        if (!response.ok) throw new Error('Formation non trouvée')

        setFormation(result.formation)
        setModules(result.modules || [])
        setStats(result.stats || {})

        // Fetch page content
        const pageRes = await fetch(`/api/formations/${formationId}/page`)
        const pageData = await pageRes.json()
        if (pageData.page?.html_content) {
          setPageContent(pageData.page.html_content)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [formationId])

  const handleCheckout = useCallback(async () => {
    if (!studentEmail.trim()) {
      setCheckoutError('Veuillez entrer votre email')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(studentEmail)) {
      setCheckoutError('Adresse email invalide')
      return
    }

    setCheckoutError('')
    setIsCheckingOut(true)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formationId,
          studentEmail: studentEmail.trim(),
          studentName: studentName.trim() || null,
        }),
      })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError(data.error || 'Erreur lors de la création du paiement')
      }
    } catch {
      setCheckoutError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setIsCheckingOut(false)
    }
  }, [formationId, studentEmail, studentName])

  const handleBuyClick = useCallback(() => {
    if (formation && formation.price <= 0) {
      // Free formation — go directly to learn
      window.location.href = `/formations/${formationId}/learn`
    } else {
      setCheckoutOpen(true)
    }
  }, [formation, formationId])

  const toggleModule = (index: number) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const totalDuration = modules.reduce(
    (sum, m) => sum + m.lessons.reduce((ls, l) => ls + (l.duration_minutes || 0), 0),
    0
  )

  if (isLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <StarryBackground />
        <div className="relative z-10 text-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Chargement de la formation...</p>
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
          <h2 className="text-white text-xl font-medium mb-2">Formation non trouvée</h2>
          <Link href="/formations">
            <Button className="btn-primary border-0 mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voir toutes les formations
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // If there is GrapesJS page content, render it
  if (pageContent) {
    return (
      <div className="min-h-screen relative">
        <StarryBackground />
        {/* Navigation bar */}
        <nav className="fixed top-0 left-0 w-full z-50 glass-nav">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center">
                <Diamond className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold gradient-text-violet">NyXia</span>
            </Link>
            <Link href="/formations">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Formations
              </Button>
            </Link>
          </div>
        </nav>
        {/* Render GrapesJS HTML content */}
        <div className="relative z-10 pt-20" dangerouslySetInnerHTML={{ __html: pageContent }} />
      </div>
    )
  }

  // Default landing page template
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
          <Link href="/formations">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Formations
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Info */}
            <div className="animate-slide-up">
              {formation.category && (
                <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">
                  {formation.category}
                </Badge>
              )}
              <h1 className="font-[var(--font-heading)] text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                {formation.title}
              </h1>
              <p className="text-[#a5b4fc] text-lg leading-relaxed mb-6">
                {formation.long_description || formation.description || 'Transformez vos compétences avec cette formation complète.'}
              </p>

              {/* Quick Stats */}
              <div className="flex items-center gap-6 mb-8 text-sm">
                <span className="flex items-center gap-2 text-zinc-400">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  {stats.module_count || modules.length} modules
                </span>
                <span className="flex items-center gap-2 text-zinc-400">
                  <FileText className="w-4 h-4 text-purple-400" />
                  {totalLessons} leçons
                </span>
                <span className="flex items-center gap-2 text-zinc-400">
                  <Clock className="w-4 h-4 text-purple-400" />
                  {totalDuration > 60 ? `${Math.floor(totalDuration / 60)}h${totalDuration % 60}m` : `${totalDuration}min`}
                </span>
                <span className="flex items-center gap-2 text-zinc-400">
                  <Users className="w-4 h-4 text-purple-400" />
                  {stats.student_count || 0} élèves
                </span>
              </div>

              {/* Price & CTA */}
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-3xl font-bold text-white">
                    {formation.price > 0 ? formatCurrency(formation.price) : 'Gratuit'}
                  </span>
                </div>
                <Button onClick={handleBuyClick} className="btn-primary text-base px-8 py-4 border-0">
                  <Play className="w-5 h-5 mr-2" />
                  S&apos;inscrire maintenant
                </Button>
              </div>
              {/* Payment status feedback */}
              {paymentStatus === 'success' && (
                <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                  <p className="text-green-400 text-sm">Paiement réussi ! Vous pouvez maintenant accéder à la formation.</p>
                </div>
              )}
              {paymentStatus === 'cancelled' && (
                <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <XCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <p className="text-amber-400 text-sm">Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.</p>
                </div>
              )}
            </div>

            {/* Visual Card */}
            <div className="hidden lg:block animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="glass-card-gold p-8 text-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#F4C842]/5 blur-[60px] pointer-events-none" />
                {formation.thumbnail_url ? (
                  <img src={formation.thumbnail_url} alt={formation.title} className="w-full h-48 object-cover rounded-xl mb-4" />
                ) : (
                  <div className="w-full h-48 rounded-xl bg-gradient-to-br from-[#7B5CFF]/20 to-purple-500/10 flex items-center justify-center mb-4">
                    <GraduationCap className="w-16 h-16 text-purple-400/50" />
                  </div>
                )}
                <h3 className="text-white text-lg font-semibold mb-1">{formation.title}</h3>
                <p className="text-zinc-400 text-sm">Par NyXia MarketPlace</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: Shield, title: 'Contenu Premium', desc: 'Créé par des experts reconnus dans leur domaine' },
              { icon: Star, title: 'Communauté', desc: 'Rejoignez une communauté active et bienveillante' },
              { icon: Check, title: 'Certificat', desc: 'Obtenez votre certificat à la fin de la formation' },
            ].map(item => (
              <div key={item.title} className="glass-card p-6 text-center border-0">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-[#7B5CFF]/20 to-purple-500/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-[#7B5CFF]" />
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program / Modules */}
      <section className="relative px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-[#7B5CFF]/10 text-[#a5b4fc] border-[#7B5CFF]/20">
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              Programme
            </Badge>
            <h2 className="font-[var(--font-heading)] text-3xl sm:text-4xl font-bold text-white">
              Ce que vous allez <span className="gradient-text-violet">apprendre</span>
            </h2>
          </div>

          <div className="space-y-3">
            {modules.map((module, index) => (
              <div key={module.id} className="glass-card border-0 overflow-hidden">
                <button
                  onClick={() => toggleModule(index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B5CFF]/20 to-purple-500/10 flex items-center justify-center shrink-0">
                      <span className="text-purple-400 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{module.title}</h3>
                      <p className="text-zinc-500 text-xs mt-0.5">{module.lessons.length} leçon(s)</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-zinc-500 transition-transform ${expandedModules.has(index) ? 'rotate-90' : ''}`} />
                </button>

                {expandedModules.has(index) && module.lessons.length > 0 && (
                  <div className="px-5 pb-4 space-y-2 border-t border-purple-500/10 pt-3">
                    {module.lessons.map(lesson => (
                      <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
                        <div className="flex items-center gap-3">
                          {contentTypeIcon(lesson.content_type)}
                          <span className="text-zinc-300 text-sm">{lesson.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {lesson.is_free ? (
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] px-1.5 py-0">Gratuit</Badge>
                          ) : (
                            <Lock className="w-3 h-3 text-zinc-600" />
                          )}
                          {lesson.duration_minutes > 0 && (
                            <span className="text-zinc-500 text-xs">{lesson.duration_minutes}min</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card-gold p-10 sm:p-14 text-center relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-[#F4C842]/5 blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-[#7B5CFF]/5 blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <GraduationCap className="w-14 h-14 text-[#F4C842] mx-auto mb-6" />
              <h2 className="font-[var(--font-heading)] text-3xl sm:text-4xl font-bold text-white mb-4">
                Prêt à commencer ?
              </h2>
              <p className="text-[#a5b4fc] text-lg mb-8 max-w-lg mx-auto">
                Rejoignez {stats.student_count || 0} étudiants qui ont déjà commencé leur parcours de transformation.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button onClick={handleBuyClick} className="btn-gold text-lg px-10 py-5 border-0">
                  S&apos;inscrire maintenant — {formation.price > 0 ? formatCurrency(formation.price) : 'Gratuit'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* Checkout Modal */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md bg-[#0c1a2e] border-purple-500/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B5CFF]/20 to-purple-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#7B5CFF]" />
              </div>
              Paiement sécurisé
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Accédez à la formation <span className="text-purple-400 font-medium">{formation.title}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Price summary */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-purple-500/10">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">Total</span>
                <span className="text-2xl font-bold text-white">
                  {formation.price > 0 ? formatCurrency(formation.price) : 'Gratuit'}
                </span>
              </div>
              <p className="text-zinc-500 text-xs mt-1">Paiement unique, accès illimité à vie</p>
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300 text-sm">Adresse email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={studentEmail}
                onChange={(e) => { setStudentEmail(e.target.value); setCheckoutError('') }}
                className="bg-white/[0.05] border-purple-500/20 text-white placeholder:text-zinc-600 focus:border-purple-500/50"
                onKeyDown={(e) => e.key === 'Enter' && handleCheckout()}
              />
            </div>

            {/* Name field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300 text-sm">Nom complet (optionnel)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Votre nom"
                value={studentName}
                onChange={(e) => { setStudentName(e.target.value); setCheckoutError('') }}
                className="bg-white/[0.05] border-purple-500/20 text-white placeholder:text-zinc-600 focus:border-purple-500/50"
                onKeyDown={(e) => e.key === 'Enter' && handleCheckout()}
              />
            </div>

            {/* Error message */}
            {checkoutError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-red-400 text-sm">{checkoutError}</p>
              </div>
            )}

            {/* Pay button */}
            <Button
              onClick={handleCheckout}
              disabled={isCheckingOut || !studentEmail.trim()}
              className="btn-primary w-full py-4 text-base border-0 disabled:opacity-50"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Redirection vers le paiement...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payer {formation.price > 0 ? formatCurrency(formation.price) : ''}
                </>
              )}
            </Button>

            {/* Security notice */}
            <div className="flex items-center justify-center gap-4 text-zinc-500 text-xs">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Paiement sécurisé</span>
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Données cryptées</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
