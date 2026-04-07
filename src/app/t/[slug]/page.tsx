'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Diamond,
  Store,
  GraduationCap,
  Star,
  ArrowRight,
  ExternalLink,
  Mail,
  Globe,
  Instagram,
  Youtube,
  Facebook,
  Sparkles,
  Package,
  Heart,
  Users,
  Zap,
} from 'lucide-react'

// ─── Data Fetching (client-side) ─────────────────────────
function useTenantData(slug: string) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setNotFound(false)
        const res = await fetch(`/api/tenant?slug=${slug}`)
        if (cancelled) return
        if (!res.ok) {
          setNotFound(true)
          return
        }
        const json = await res.json()
        if (cancelled) return
        setData(json)
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  return { data, loading, notFound }
}

// ─── Animated Section Wrapper ──────────────────────────────
function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <section className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </section>
  )
}

// ─── Social Icon Mapper ────────────────────────────────────
function SocialIcon({ platform }: { platform: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    instagram: <Instagram className="w-4 h-4" />,
    youtube: <Youtube className="w-4 h-4" />,
    facebook: <Facebook className="w-4 h-4" />,
    website: <Globe className="w-4 h-4" />,
    email: <Mail className="w-4 h-4" />,
  }
  return <>{iconMap[platform.toLowerCase()] || <Globe className="w-4 h-4" />}</>
}

// ─── Product Card ──────────────────────────────────────────
function ProductCard({ product }: { product: Record<string, unknown> }) {
  const price = Number(product.price || 0)
  const hasImage = Boolean(product.thumbnail_url)

  return (
    <div className="glass-card group overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {hasImage ? (
          <img
            src={product.thumbnail_url as string}
            alt={product.title as string}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--bg2)] to-[var(--bg3)] flex items-center justify-center">
            <Package className="w-12 h-12 text-[var(--nyxia-violet)] opacity-40" />
          </div>
        )}
        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--bg1)]/80 backdrop-blur-sm text-[var(--text-secondary)] border border-[var(--border)]">
            {String(product.category || 'digital').charAt(0).toUpperCase() + String(product.category || 'digital').slice(1)}
          </span>
        </div>
        {/* Price */}
        {price > 0 && (
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 text-sm font-bold rounded-full bg-gradient-to-r from-[var(--nyxia-violet)] to-[var(--nyxia-purple)] text-white">
              {price.toFixed(2)} $
            </span>
          </div>
        )}
      </div>
      {/* Content */}
      <div className="p-5 space-y-3">
        <h3 className="text-lg font-semibold text-white group-hover:text-[var(--nyxia-violet)] transition-colors line-clamp-2">
          {product.title as string}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
          {product.description as string || 'Découvrez ce produit exclusif'}
        </p>
        {price === 0 && (
          <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30">
            Gratuit
          </span>
        )}
        <button className="w-full mt-2 btn-primary text-sm py-2.5 flex items-center justify-center gap-2">
          Voir le produit
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Formation Card ────────────────────────────────────────
function FormationCard({ formation }: { formation: Record<string, unknown> }) {
  const price = Number(formation.price || 0)

  return (
    <div className="glass-card-gold group overflow-hidden">
      <div className="relative aspect-[16/9] overflow-hidden">
        {formation.thumbnail_url ? (
          <img
            src={formation.thumbnail_url as string}
            alt={formation.title as string}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--gold)]/10 to-[var(--bg3)] flex items-center justify-center">
            <GraduationCap className="w-16 h-16 text-[var(--gold)] opacity-30" />
          </div>
        )}
        {Number(formation.modules_count || 0) > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-[var(--bg1)]/80 backdrop-blur-sm text-[var(--gold)] border border-[var(--gold)]/30">
            <GraduationCap className="w-3 h-3" />
            {formation.modules_count} modules
          </div>
        )}
      </div>
      <div className="p-5 space-y-3">
        <h3 className="text-lg font-semibold text-white group-hover:text-[var(--gold)] transition-colors">
          {formation.title as string}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
          {formation.description as string || 'Formation en développement'}
        </p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold gradient-text-gold">
            {price > 0 ? `${price.toFixed(2)} $` : 'Gratuit'}
          </span>
          <button className="btn-gold text-sm py-2 px-5 flex items-center gap-2">
            S&apos;inscrire
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Plan Badge ────────────────────────────────────────────
function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    free: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    pro: 'bg-[var(--nyxia-violet)]/20 text-[var(--nyxia-violet)] border-[var(--nyxia-violet)]/30',
    premium: 'bg-[var(--gold)]/15 text-[var(--gold)] border-[var(--gold)]/30',
  }
  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${styles[plan] || styles.free}`}>
      {plan?.toUpperCase()}
    </span>
  )
}

// ─── Loading Spinner ───────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-[var(--nyxia-violet)]/30 border-t-[var(--nyxia-violet)] animate-spin" />
        <Diamond className="w-8 h-8 text-[var(--nyxia-violet)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="mt-6 text-[var(--text-secondary)] text-sm">Chargement de la boutique...</p>
    </div>
  )
}

// ─── Not Found Component ─────────────────────────────────
function NotFoundComponent({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--bg2)] flex items-center justify-center">
          <Diamond className="w-12 h-12 text-[var(--nyxia-violet)] opacity-30" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Collaborateur introuvable</h2>
        <p className="text-[var(--text-secondary)] mb-8">
          Le collaborateur <span className="text-[var(--nyxia-violet)] font-semibold">/{slug}</span> n'existe pas encore sur NyXia MarketPlace.
        </p>
        <Link href="/" className="btn-primary flex items-center gap-2 mx-auto">
          <Diamond className="w-5 h-5" />
          Retourner au marché
        </Link>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────
export default function TenantPage() {
  const params = useParams()
  const slug = params.slug as string
  const { data, loading, notFound } = useTenantData(slug)

  if (loading) return <LoadingSpinner />
  if (notFound || !data) return <NotFoundComponent slug={slug} />

  const { tenant, products, formations, stats } = data
  const socialEntries = Object.entries(tenant.social_links || {}).filter(
    ([, url]) => typeof url === 'string' && url.length > 0
  )

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* ─── Background Effects ─── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="orb orb-violet w-[600px] h-[600px] -top-48 -right-48" />
        <div className="orb orb-purple w-[500px] h-[500px] -bottom-48 -left-48" />
        <div className="orb orb-gold w-[300px] h-[300px] top-1/2 left-1/2" />
      </div>

      {/* ─── Navigation ─── */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Left: Back + Logo */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              <Diamond className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">NyXia</span>
            </Link>
            <div className="h-5 w-px bg-[var(--border)]" />
            <div className="flex items-center gap-2">
              {tenant.avatar_url ? (
                <img
                  src={tenant.avatar_url}
                  alt={tenant.display_name}
                  className="w-8 h-8 rounded-full border-2 border-[var(--nyxia-violet)]/40 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--nyxia-violet)] to-[var(--nyxia-purple)] flex items-center justify-center text-sm font-bold text-white">
                  {tenant.display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <span className="text-white font-semibold text-sm sm:text-base">
                {tenant.display_name}
              </span>
              <PlanBadge plan={tenant.plan} />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {socialEntries.slice(0, 2).map(([platform, url]) => (
              <a
                key={platform}
                href={url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--nyxia-violet)]/50 transition-all"
              >
                <SocialIcon platform={platform} />
              </a>
            ))}
            <Link
              href={`/${slug}/contact`}
              className="btn-primary text-sm py-2 px-4 hidden sm:flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Contact
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Avatar */}
          <div className="flex justify-center mb-6">
            {tenant.avatar_url ? (
              <div className="relative">
                <img
                  src={tenant.avatar_url}
                  alt={tenant.display_name}
                  className="w-28 h-28 rounded-full border-4 border-[var(--nyxia-violet)]/40 object-cover shadow-lg shadow-[var(--nyxia-violet)]/20"
                />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-[var(--nyxia-violet)] to-[var(--nyxia-purple)] rounded-full flex items-center justify-center border-2 border-[var(--bg1)]">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[var(--nyxia-violet)] to-[var(--nyxia-purple)] flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-[var(--nyxia-violet)]/20">
                  {tenant.display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dim)] rounded-full flex items-center justify-center border-2 border-[var(--bg1)]">
                  <Star className="w-4 h-4 text-[var(--bg1)]" />
                </div>
              </div>
            )}
          </div>

          {/* Name & Bio */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="gradient-text-violet">{tenant.display_name}</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-8 leading-relaxed">
            {tenant.bio || 'Créateur de contenu passionné sur NyXia MarketPlace'}
          </p>

          {/* Stats Bar */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-8">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Store className="w-5 h-5 text-[var(--nyxia-violet)]" />
              <span className="font-semibold text-white">{stats.products_count}</span>
              <span className="text-sm hidden sm:inline">Produit{stats.products_count !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <GraduationCap className="w-5 h-5 text-[var(--gold)]" />
              <span className="font-semibold text-white">{stats.formations_count}</span>
              <span className="text-sm hidden sm:inline">Formation{stats.formations_count !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Heart className="w-5 h-5 text-pink-400" />
              <span className="font-semibold text-white">0</span>
              <span className="text-sm hidden sm:inline">Abonné{stats.products_count !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="#products" className="btn-primary flex items-center gap-2">
              <Store className="w-5 h-5" />
              Explorer la boutique
            </Link>
            {stats.formations_count > 0 && (
              <Link href="#formations" className="btn-gold flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Mes formations
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ─── Products Section ─── */}
      <RevealSection id="products" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Store className="w-6 h-6 text-[var(--nyxia-violet)]" />
              <h2 className="text-3xl md:text-4xl font-bold text-white font-[var(--font-heading)]">
                Boutique
              </h2>
            </div>
            <div className="section-divider mb-4" />
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              Découvrez les produits et services exclusifs de {tenant.display_name}
            </p>
          </div>

          {products.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: Record<string, unknown>) => (
                <ProductCard key={product.id as string} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg2)] flex items-center justify-center">
                <Package className="w-10 h-10 text-[var(--nyxia-violet)] opacity-40" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Boutique en construction
              </h3>
              <p className="text-[var(--text-secondary)]">
                {tenant.display_name} prépare actuellement ses produits exclusifs.
                <br />
                Revenez bientôt pour découvrir sa collection !
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = `https://travail-pour-toi.com#collaborateur`
                    }
                  }}
                  className="btn-outline-violet text-sm flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Devenir collaborateur aussi
                </button>
              </div>
            </div>
          )}
        </div>
      </RevealSection>

      {/* ─── Formations Section ─── */}
      {stats.formations_count > 0 && (
        <RevealSection id="formations" className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <GraduationCap className="w-6 h-6 text-[var(--gold)]" />
                <h2 className="text-3xl md:text-4xl font-bold text-white font-[var(--font-heading)]">
                  Formations
                </h2>
              </div>
              <div className="section-divider mb-4" />
              <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
                Apprenez avec {tenant.display_name} grâce à ses formations exclusives
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {formations.map((formation: Record<string, unknown>) => (
                <FormationCard key={formation.id as string} formation={formation} />
              ))}
            </div>
          </div>
        </RevealSection>
      )}

      {/* ─── Ambassador CTA ─── */}
      <RevealSection className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-border p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--nyxia-violet)]/5 via-transparent to-[var(--gold)]/5 pointer-events-none" />
            <div className="relative z-10">
              <Users className="w-12 h-12 text-[var(--nyxia-violet)] mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 font-[var(--font-heading)]">
                Devenir ambassadeur de {tenant.display_name}
              </h2>
              <p className="text-[var(--text-secondary)] max-w-xl mx-auto mb-8">
                Partagez les produits de {tenant.display_name} avec votre réseau et
                gagnez des commissions sur chaque vente. C&apos;est gratuit et ça prend 2 minutes.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button className="btn-primary flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Devenir ambassadeur
                </button>
                <Link
                  href="https://travail-pour-toi.com#ambassadeur"
                  className="btn-outline-gold flex items-center gap-2"
                >
                  En savoir plus
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ─── Footer ─── */}
      <footer className="py-10 px-4 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left */}
            <div className="flex items-center gap-3">
              <Diamond className="w-5 h-5 text-[var(--nyxia-violet)]" />
              <span className="text-sm text-[var(--text-secondary)]">
                Propulsé par{' '}
                <Link href="https://travail-pour-toi.com" className="text-white font-semibold hover:text-[var(--nyxia-violet)] transition-colors">
                  NyXia MarketPlace
                </Link>
              </span>
            </div>

            {/* Center: Social Links */}
            {socialEntries.length > 0 && (
              <div className="flex items-center gap-3">
                {socialEntries.map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--nyxia-violet)] transition-colors"
                  >
                    <SocialIcon platform={platform} />
                  </a>
                ))}
              </div>
            )}

            {/* Right */}
            <p className="text-xs text-[var(--text-muted)]">
              © {new Date().getFullYear()} {tenant.display_name} — Tous droits réservés
            </p>
          </div>
        </div>
      </footer>

      {/* ─── IntersectionObserver Script ─── */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                  if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                  }
                });
              }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

              document.querySelectorAll('.reveal, .stagger-children').forEach(function(el) {
                observer.observe(el);
              });

              // Fallback: show all after 3s
              setTimeout(function() {
                document.querySelectorAll('.reveal, .stagger-children').forEach(function(el) {
                  el.classList.add('visible');
                });
              }, 3000);
            })();
          `,
        }}
      />
    </div>
  )
}
