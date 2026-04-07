'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { StarryBackground } from '@/components/StarryBackground'
import {
  Diamond,
  Palette,
  Monitor,
  TrendingUp,
  Store,
  Briefcase,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  Check,
  ArrowRight,
  Users,
  Gift,
  GraduationCap,
  Lock,
  Star,
  Heart,
  Facebook,
  Instagram,
  Globe,
  Zap,
  Crown,
  Network,
  Shield,
  MessageCircle,
} from 'lucide-react'

/* ===== Intersection Observer Hook ===== */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    const elements = el.querySelectorAll('.reveal, .stagger-children')
    elements.forEach((child) => observer.observe(child))
    if (el.classList.contains('reveal') || el.classList.contains('stagger-children')) {
      observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  return ref
}

/* ===== Section Wrapper ===== */
function Section({
  id,
  children,
  className = '',
}: {
  id?: string
  children: React.ReactNode
  className?: string
}) {
  const ref = useReveal()
  return (
    <section id={id} ref={ref} className={`relative w-full ${className}`}>
      {children}
    </section>
  )
}

/* ===== Animated Counter ===== */
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

  return (
    <span ref={ref}>
      {count.toLocaleString('fr-FR')}
      {suffix}
    </span>
  )
}

/* ===== CATEGORY DATA ===== */
const categories = [
  {
    icon: Palette,
    title: 'Design & Création',
    count: 156,
    color: 'from-violet-500 to-purple-600',
    emoji: '🎨',
  },
  {
    icon: Monitor,
    title: 'Marketing Digital',
    count: 243,
    color: 'from-indigo-500 to-blue-600',
    emoji: '💻',
  },
  {
    icon: TrendingUp,
    title: 'Formation & Coaching',
    count: 189,
    color: 'from-purple-500 to-pink-600',
    emoji: '📈',
  },
  {
    icon: Store,
    title: 'E-commerce',
    count: 127,
    color: 'from-blue-500 to-cyan-600',
    emoji: '🏪',
  },
  {
    icon: Briefcase,
    title: 'Services B2B',
    count: 98,
    color: 'from-fuchsia-500 to-violet-600',
    emoji: '💼',
  },
  {
    icon: Sparkles,
    title: 'Santé & Bien-être',
    count: 187,
    color: 'from-emerald-500 to-teal-600',
    emoji: '🌟',
  },
]

/* ===== COMMISSION TIERS ===== */
const tiers = [
  {
    level: 1,
    label: 'Direct',
    percentage: 25,
    desc: 'Vente personnelle — chaque produit vendu par vos liens',
    color: 'violet',
    gradient: 'from-[#7B5CFF] to-[#6366f1]',
    borderColor: 'border-[#7B5CFF]/30',
    bgGlow: 'bg-[#7B5CFF]/10',
    icon: Zap,
  },
  {
    level: 2,
    label: 'Réseau',
    percentage: 10,
    desc: 'Ventes de vos filleuls directs — votre premier cercle',
    color: 'purple',
    gradient: 'from-[#6366f1] to-[#4f46e5]',
    borderColor: 'border-[#6366f1]/30',
    bgGlow: 'bg-[#6366f1]/10',
    icon: Network,
  },
  {
    level: 3,
    label: 'Étendu',
    percentage: 5,
    desc: 'Ventes de votre réseau étendu — votre communauté au large',
    color: 'indigo',
    gradient: 'from-[#4f46e5] to-[#3b1f8e]',
    borderColor: 'border-[#4f46e5]/30',
    bgGlow: 'bg-[#4f46e5]/10',
    icon: Globe,
  },
]

/* ===== VENDOR BENEFITS ===== */
const vendorBenefits = [
  'Vitrine premium avec design professionnel et personnalisable',
  'Système de paiement intégré et sécurisé',
  'Tableau de bord analytique en temps réel',
  'Accès prioritaire à la communauté de collaborateurs NyXia',
]

/* ===== AMBASSADOR BENEFITS ===== */
const ambassadorBenefits = [
  { icon: Gift, text: 'Gratuit' },
  { icon: TrendingUp, text: 'Commissions sur 3 niveaux' },
  { icon: GraduationCap, text: 'Formation offerte' },
  { icon: Lock, text: 'Communauté privée' },
]

/* ===== NAV LINKS ===== */
const navLinks = [
  { label: 'Boutique', href: '#boutique' },
  { label: 'Commissions', href: '#commissions' },
  { label: 'Devenir Collaborateur', href: '#collaborateur' },
  { label: 'Ambassadeur', href: '#ambassadeur' },
]

/* ===== MAIN COMPONENT ===== */
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on link click
  const handleLinkClick = useCallback(() => setMobileMenuOpen(false), [])

  return (
    <div className="min-h-screen relative flex flex-col items-center w-full overflow-hidden">
      {/* Starry Background */}
      <StarryBackground />

      {/* Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none -z-5 overflow-hidden">
        <div className="orb orb-violet" style={{ width: 600, height: 600, top: '-10%', right: '-10%' }} />
        <div className="orb orb-purple" style={{ width: 500, height: 500, bottom: '10%', left: '-8%' }} />
        <div className="orb orb-gold" style={{ width: 400, height: 400, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      </div>

      {/* ============================================ */}
      {/* SECTION A: NAVIGATION                        */}
      {/* ============================================ */}
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? 'glass-nav shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center shadow-lg shadow-[#7B5CFF]/30 group-hover:shadow-[#7B5CFF]/50 transition-shadow">
                <Diamond className="h-5 w-5 text-white" />
              </div>
              <span className="font-[var(--font-heading)] text-2xl sm:text-3xl font-bold gradient-text-violet tracking-wide">
                NyXia
              </span>
            </a>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-[#a5b4fc] hover:text-white transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#7B5CFF] to-[#F4C842] group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:block">
              <a href="#collaborateur">
                <Button className="btn-gold text-sm h-10 px-6 border-0">
                  <Crown className="h-4 w-4 mr-2" />
                  Espace Collaborateur
                </Button>
              </a>
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 overflow-hidden ${
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="glass-nav border-t border-[#7B5CFF]/10 px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className="block text-base text-[#a5b4fc] hover:text-white transition-colors py-2"
              >
                {link.label}
              </a>
            ))}
            <a href="#collaborateur" onClick={handleLinkClick}>
              <Button className="btn-gold w-full text-sm h-11 border-0 mt-2">
                <Crown className="h-4 w-4 mr-2" />
                Espace Collaborateur
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* ============================================ */}
      {/* SECTION B: HERO                             */}
      {/* ============================================ */}
      <section className="relative w-full min-h-screen flex items-center justify-center pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Star className="h-4 w-4 text-[#F4C842]" />
            <span className="text-sm font-medium text-[#a5b4fc]">
              La MarketPlace des entrepreneurs ambitieux
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-[var(--font-heading)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            Votre MarketPlace.{' '}
            <span className="gradient-text-violet">Votre Empire.</span>
            <br />
            Votre{' '}
            <span className="gradient-text-gold">Liberté.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-[#a5b4fc] max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.6s' }}>
            Affichez vos produits, créez votre communauté d&apos;ambassadeurs et gagnez
            sur 3 niveaux de commissions.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.8s' }}>
            <a href="#boutique">
              <Button className="btn-primary text-base px-8 py-4 border-0">
                Explorer la Boutique
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <a href="#collaborateur">
              <Button className="btn-outline-gold text-base px-8 py-4 bg-transparent border-2">
                <Store className="mr-2 h-5 w-5" />
                Devenir Collaborateur
              </Button>
            </a>
          </div>

          {/* Decorative line */}
          <div className="mt-16 animate-fade-in" style={{ animationDelay: '1.2s' }}>
            <div className="w-px h-16 mx-auto bg-gradient-to-b from-transparent via-[#7B5CFF]/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION C: STATS BAR                        */}
      {/* ============================================ */}
      <Section className="py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="glass-card p-6 sm:p-8 reveal">
            <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
              {[
                { value: 1000, suffix: '+', label: 'Produits' },
                { value: 500, suffix: '+', label: 'Collaborateurs' },
                { value: 50000, suffix: '+', label: 'Ambassadeurs' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-[var(--font-heading)] text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text-violet">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm sm:text-base text-[#a5b4fc] mt-1 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ============================================ */}
      {/* SECTION D: BOUTIQUE (Categories)            */}
      {/* ============================================ */}
      <Section id="boutique" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-14 reveal">
            <Badge className="mb-4 bg-[#7B5CFF]/10 text-[#a5b4fc] border-[#7B5CFF]/20 text-sm px-4 py-1.5">
              <Store className="h-3.5 w-3.5 mr-1.5" />
              Boutique
            </Badge>
            <h2 className="font-[var(--font-heading)] text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Explorez nos <span className="gradient-text-violet">Catégories</span>
            </h2>
            <p className="text-[#a5b4fc] max-w-xl mx-auto text-lg">
              Des produits et services sélectionnés pour booster votre business.
            </p>
            <div className="section-divider mt-6" />
          </div>

          {/* Category Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 stagger-children">
            {categories.map((cat) => (
              <div key={cat.title} className="gradient-border group cursor-pointer">
                <div className="relative p-6 sm:p-7">
                  {/* Icon + Title */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <span className="text-2xl">{cat.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[#F4C842] transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-[#a5b4fc] text-sm">
                        {cat.count} produits
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#6b7280] group-hover:text-[#7B5CFF] group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>

                  {/* Bottom shimmer on hover */}
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#7B5CFF]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ============================================ */}
      {/* SECTION E: COMMISSIONS 3 NIVEAUX             */}
      {/* ============================================ */}
      <Section id="commissions" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-14 reveal">
            <Badge className="mb-4 bg-[#F4C842]/10 text-[#F4C842] border-[#F4C842]/20 text-sm px-4 py-1.5">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              Rétribution
            </Badge>
            <h2 className="font-[var(--font-heading)] text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Gagnez sur <span className="gradient-text-gold">3 Niveaux</span>
            </h2>
            <p className="text-[#a5b4fc] max-w-xl mx-auto text-lg">
              Un système de rétribution unique qui récompense votre impact à chaque niveau de votre réseau.
            </p>
            <div className="section-divider mt-6" />
          </div>

          {/* Commission Tiers */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch stagger-children">
            {tiers.map((tier) => {
              const Icon = tier.icon
              return (
                <div
                  key={tier.level}
                  className={`relative glass-card ${tier.borderColor} p-6 sm:p-8 text-center group`}
                >
                  {/* Level Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111b30] border border-[#7B5CFF]/10 mb-6">
                    <span className="text-xs font-semibold text-[#a5b4fc] uppercase tracking-wider">
                      Niveau {tier.level}
                    </span>
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Percentage */}
                  <div className="font-[var(--font-heading)] text-5xl sm:text-6xl font-bold gradient-text-violet mb-3">
                    {tier.percentage}%
                  </div>

                  {/* Label */}
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {tier.label}
                  </h3>

                  {/* Description */}
                  <p className="text-[#a5b4fc] text-sm leading-relaxed">
                    {tier.desc}
                  </p>

                  {/* Connection Arrow (not on last) */}
                  {tier.level < 3 && (
                    <div className="hidden md:flex absolute -right-4 lg:-right-5 top-1/2 -translate-y-1/2 z-10">
                      <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-full bg-[#0c1a2e] border border-[#7B5CFF]/20 flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-[#7B5CFF]" />
                      </div>
                    </div>
                  )}

                  {/* Mobile Arrow (not on last) */}
                  {tier.level < 3 && (
                    <div className="flex md:hidden justify-center mt-6">
                      <ArrowRight className="h-5 w-5 text-[#7B5CFF] rotate-90" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Section>

      {/* ============================================ */}
      {/* SECTION F: DEVENIR COLLABORATEUR            */}
      {/* ============================================ */}
      <Section id="collaborateur" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card-gold p-8 sm:p-12 lg:p-16 reveal relative overflow-hidden">
            {/* Decorative orb */}
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#F4C842]/5 blur-[80px] pointer-events-none" />

            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center relative z-10">
              {/* Left - Text */}
              <div>
                <Badge className="mb-4 bg-[#F4C842]/10 text-[#F4C842] border-[#F4C842]/20 text-sm px-4 py-1.5">
                  <Crown className="h-3.5 w-3.5 mr-1.5" />
                  Espace Collaborateur
                </Badge>
                <h2 className="font-[var(--font-heading)] text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
                  Créez, partagez et{' '}
                  <span className="gradient-text-gold">prospérez ensemble</span>
                </h2>
                <p className="text-[#a5b4fc] text-lg leading-relaxed mb-8">
                  Vous avez des formations, des services ou des produits ? Rejoignez la marketPlace
                  collaborative NyXia et donnez à vos créations la visibilité qu&apos;elles méritent.
                  En tant que collaborateur NyXia, vous accédez à un écosystème conçu pour maximiser
                  votre impact et vos revenus.
                </p>

                {/* Benefits */}
                <div className="space-y-4 mb-10">
                  {vendorBenefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F4C842] to-[#c9a23a] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3.5 w-3.5 text-[#06101f]" />
                      </div>
                      <span className="text-[#a5b4fc] text-base">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <a href="#">
                  <Button className="btn-gold text-base px-8 py-4 border-0">
                    <Store className="mr-2 h-5 w-5" />
                    Devenir Collaborateur
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>

              {/* Right - Visual Card */}
              <div className="hidden lg:flex items-center justify-center">
                <div className="relative">
                  {/* Decorative ring */}
                  <div className="absolute inset-0 -m-6 rounded-3xl border border-[#F4C842]/10 animate-[spin_30s_linear_infinite]" />
                  <div className="absolute inset-0 -m-12 rounded-3xl border border-[#7B5CFF]/5" />

                  <div className="glass-card p-8 text-center max-w-xs mx-auto">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#F4C842] to-[#c9a23a] flex items-center justify-center mb-5 shadow-lg shadow-[#F4C842]/20">
                      <Crown className="h-10 w-10 text-[#06101f]" />
                    </div>
                    <h3 className="font-[var(--font-heading)] text-2xl font-bold text-white mb-2">
                      Espace Premium
                    </h3>
                    <p className="text-[#a5b4fc] text-sm">
                      Votre boutique, vos règles, vos revenus.
                    </p>
                    <div className="mt-5 flex justify-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-[#7B5CFF]" />
                      <div className="w-3 h-3 rounded-full bg-[#F4C842]" />
                      <div className="w-3 h-3 rounded-full bg-[#6366f1]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ============================================ */}
      {/* SECTION G: AMBASSADEUR CTA                   */}
      {/* ============================================ */}
      <Section id="ambassadeur" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-8 sm:p-12 lg:p-16 reveal relative overflow-hidden">
            {/* Decorative orbs */}
            <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[#7B5CFF]/5 blur-[80px] pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#6366f1]/5 blur-[60px] pointer-events-none" />

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-12">
                <Badge className="mb-4 bg-[#7B5CFF]/10 text-[#a5b4fc] border-[#7B5CFF]/20 text-sm px-4 py-1.5">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  Programme Ambassadeur
                </Badge>
                <h2 className="font-[var(--font-heading)] text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
                  Devenez Ambassadeur NyXia —{' '}
                  <span className="gradient-text-violet">C&apos;est Gratuit</span>
                </h2>
                <p className="text-[#a5b4fc] text-lg max-w-2xl mx-auto leading-relaxed">
                  Rejoignez notre communauté d&apos;ambassadeurs et promouvez les produits NyXia.
                  Vous n&apos;avez rien à vendre — juste à partager, et les commissions suivent.
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12 stagger-children">
                {ambassadorBenefits.map((benefit) => {
                  const Icon = benefit.icon
                  return (
                    <div
                      key={benefit.text}
                      className="text-center p-6 rounded-2xl bg-[#111b30]/50 border border-[#7B5CFF]/10 hover:border-[#7B5CFF]/30 transition-all duration-300 group"
                    >
                      <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-[#7B5CFF]/20 to-[#6366f1]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon className="h-6 w-6 text-[#7B5CFF]" />
                      </div>
                      <p className="text-white font-medium text-base">{benefit.text}</p>
                    </div>
                  )
                })}
              </div>

              {/* CTA */}
              <div className="text-center">
                <a href="#">
                  <Button className="btn-primary text-base px-8 py-4 border-0">
                    <Users className="mr-2 h-5 w-5" />
                    Rejoindre le Programme
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
                <p className="mt-5 text-sm text-[#a5b4fc]/70 italic max-w-md mx-auto">
                  💜 Les ambassadeurs sont chouchoutés car ils font le gros du travail
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ============================================ */}
      {/* SECTION H: FOOTER                           */}
      {/* ============================================ */}
      <footer className="w-full relative mt-16">
        {/* Top border gradient */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#7B5CFF]/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Logo & Tagline */}
            <div className="sm:col-span-2 lg:col-span-1">
              <a href="#" className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center shadow-lg shadow-[#7B5CFF]/20">
                  <Diamond className="h-5 w-5 text-white" />
                </div>
                <span className="font-[var(--font-heading)] text-2xl font-bold gradient-text-violet">
                  NyXia
                </span>
              </a>
              <p className="text-[#a5b4fc] text-sm leading-relaxed max-w-xs">
                Votre MarketPlace. Votre Empire. Votre Liberté. La plateforme premium pour les entrepreneurs ambitieux.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Navigation
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Boutique', href: '#boutique' },
                  { label: 'Commissions', href: '#commissions' },
                  { label: 'Devenir Collaborateur', href: '#collaborateur' },
                  { label: 'Ambassadeur', href: '#ambassadeur' },
                ].map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-[#a5b4fc] text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Légal
              </h4>
              <ul className="space-y-2.5">
                {['CGV', 'Confidentialité', 'Contact', 'FAQ'].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-[#a5b4fc] text-sm hover:text-white transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Communauté
              </h4>
              <div className="flex gap-3">
                {[
                  { icon: Facebook, label: 'Facebook' },
                  { icon: Instagram, label: 'Instagram' },
                  { icon: Globe, label: 'TikTok' },
                ].map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.label}
                      href="#"
                      aria-label={social.label}
                      className="w-10 h-10 rounded-xl glass-card flex items-center justify-center hover:!border-[#7B5CFF]/40 hover:!bg-[#7B5CFF]/10 transition-all"
                    >
                      <Icon className="h-4.5 w-4.5 text-[#a5b4fc]" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[#6b7280] text-sm">
                © 2026 NyXia MarketPlace. Tous droits réservés.
              </p>
              <p className="text-sm text-[#6b7280]">
                Fait avec <Heart className="inline h-3.5 w-3.5 text-[#7B5CFF] mx-0.5" /> pour les entrepreneurs
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
