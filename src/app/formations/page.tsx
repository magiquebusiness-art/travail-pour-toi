'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { StarryBackground } from '@/components/StarryBackground'
import {
  GraduationCap,
  Search,
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Users,
  Clock,
  Loader2,
  Sparkles,
  Filter,
  Diamond,
  Menu,
  X,
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
  student_count: number
  module_count: number
  lesson_count: number
  created_at: string
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 2000
          const start = performance.now()
          const animate = (now: number) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count.toLocaleString('fr-FR')}{suffix}</span>
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount)
}

export default function FormationsCatalogPage() {
  const [formations, setFormations] = useState<Formation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function fetchFormations() {
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.set('search', searchQuery)
        if (selectedCategory) params.set('category', selectedCategory)

        const response = await fetch(`/api/formations?${params.toString()}`)
        const result = await response.json()
        setFormations(result.formations || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFormations()
  }, [searchQuery, selectedCategory])

  const categories = useMemo(() => {
    const cats = new Set<string>()
    formations.forEach(f => { if (f.category) cats.add(f.category) })
    return Array.from(cats)
  }, [formations])

  return (
    <div className="min-h-screen relative">
      <StarryBackground />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center shadow-lg shadow-[#7B5CFF]/30">
                <Diamond className="h-5 w-5 text-white" />
              </div>
              <span className="font-[var(--font-heading)] text-2xl font-bold gradient-text-violet">NyXia</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm text-[#a5b4fc] hover:text-white transition-colors">Accueil</Link>
              <Link href="/formations" className="text-sm text-white font-medium">Formations</Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hidden sm:block">Connexion</Button>
              </Link>
              <Link href="/ambassadeur">
                <Button className="btn-gold text-sm h-10 px-5 border-0">Ambassadeur</Button>
              </Link>
              <button className="md:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden glass-nav border-t border-purple-500/10 px-4 py-4 space-y-3">
            <Link href="/" className="block text-sm text-[#a5b4fc] py-2" onClick={() => setMobileMenuOpen(false)}>Accueil</Link>
            <Link href="/formations" className="block text-sm text-white font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Formations</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative w-full pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6 animate-fade-in">
            <GraduationCap className="h-4 w-4 text-[#F4C842]" />
            <span className="text-sm font-medium text-[#a5b4fc]">Nos Formations</span>
          </div>

          <h1 className="font-[var(--font-heading)] text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6 animate-slide-up">
            Apprenez, Grandissez,{' '}
            <span className="gradient-text-violet">Réussissez</span>
          </h1>

          <p className="text-lg text-[#a5b4fc] max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Découvrez nos formations créées par des experts. Transformez vos compétences en résultats concrets.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-12 mb-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {[
              { value: formations.length || 12, suffix: '+', label: 'Formations' },
              { value: formations.reduce((sum, f) => sum + (f.student_count || 0), 0) || 500, suffix: '+', label: 'Étudiants' },
              { value: formations.reduce((sum, f) => sum + (f.lesson_count || 0), 0) || 200, suffix: '+', label: 'Leçons' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-[var(--font-heading)] text-2xl sm:text-3xl font-bold gradient-text-violet">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs sm:text-sm text-[#a5b4fc] mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="max-w-lg mx-auto relative animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Rechercher une formation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border-purple-500/20 text-white pl-12 pr-4 h-12 text-base rounded-xl focus:border-purple-500"
            />
          </div>
        </div>
      </section>

      {/* Category Filters */}
      {categories.length > 0 && (
        <section className="relative px-4 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  !selectedCategory
                    ? 'bg-[#7B5CFF] text-white'
                    : 'bg-white/5 text-[#a5b4fc] hover:bg-white/10 border border-purple-500/10'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Toutes
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#7B5CFF] text-white'
                      : 'bg-white/5 text-[#a5b4fc] hover:bg-white/10 border border-purple-500/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Formation Grid */}
      <section className="relative px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : formations.length === 0 ? (
            <div className="text-center py-20">
              <GraduationCap className="w-16 h-16 mx-auto mb-4 text-purple-500/20" />
              <h3 className="text-white text-xl font-medium mb-2">Aucune formation trouvée</h3>
              <p className="text-zinc-500 mb-6">De nouvelles formations arrivent bientôt !</p>
              <Link href="/">
                <Button className="btn-primary border-0">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à l&apos;accueil
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {formations.map((formation, index) => (
                <Link
                  key={formation.id}
                  href={`/formations/${formation.id}`}
                  className="gradient-border group animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative p-6 flex flex-col h-full">
                    {/* Thumbnail */}
                    {formation.thumbnail_url ? (
                      <div className="w-full h-40 rounded-xl overflow-hidden mb-4 bg-black/20">
                        <img
                          src={formation.thumbnail_url}
                          alt={formation.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-40 rounded-xl bg-gradient-to-br from-purple-500/20 to-[#7B5CFF]/10 flex items-center justify-center mb-4">
                        <GraduationCap className="w-12 h-12 text-purple-400/50 group-hover:text-purple-400 transition-colors group-hover:scale-110 transform duration-300" />
                      </div>
                    )}

                    {/* Category */}
                    {formation.category && (
                      <Badge className="self-start bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs px-2 py-0.5 mb-3">
                        {formation.category}
                      </Badge>
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#F4C842] transition-colors line-clamp-2">
                      {formation.title}
                    </h3>

                    {/* Description */}
                    <p className="text-[#a5b4fc] text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
                      {formation.description || 'Découvrez cette formation et développez vos compétences.'}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-zinc-500 text-xs mb-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {formation.module_count || 0} modules
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formation.lesson_count || 0} leçons
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {formation.student_count || 0} élèves
                      </span>
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-purple-500/10">
                      <span className="text-lg font-bold text-white">
                        {formation.price > 0 ? formatCurrency(formation.price) : 'Gratuit'}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-[#7B5CFF] group-hover:text-[#F4C842] transition-colors">
                        Voir détails
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full relative">
        <div className="h-px bg-gradient-to-r from-transparent via-[#7B5CFF]/30 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center">
                <Diamond className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold gradient-text-violet text-sm">NyXia MarketPlace</span>
            </div>
            <p className="text-zinc-600 text-xs">&copy; 2026 NyXia MarketPlace. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
