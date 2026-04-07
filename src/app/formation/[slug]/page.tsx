export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Diamond,
  GraduationCap,
  BookOpen,
  Clock,
  Star,
  ArrowRight,
  Play,
  Lock,
  CheckCircle,
  Zap,
} from 'lucide-react'

interface FormationPageProps {
  params: Promise<{ slug: string }>
}

// ─── Data Fetching ──────────────────────────────────────────
async function getTenantData(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    const res = await fetch(`${baseUrl}/api/tenant?slug=${slug}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ─── Formation Detail Card ─────────────────────────────────
function FormationDetailCard({ formation }: { formation: Record<string, unknown> }) {
  const price = Number(formation.price || 0)
  const modulesCount = Number(formation.modules_count || 0)
  const totalDuration = Number(formation.total_duration || 0)

  return (
    <div className="glass-card-gold overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {formation.thumbnail_url ? (
          <img
            src={formation.thumbnail_url as string}
            alt={formation.title as string}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--gold)]/10 to-[var(--bg3)] flex items-center justify-center">
            <Play className="w-16 h-16 text-[var(--gold)] opacity-30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg1)]/80 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-3">
            {modulesCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-[var(--bg1)]/80 backdrop-blur-sm text-[var(--gold)] border border-[var(--gold)]/30">
                <BookOpen className="w-3 h-3" />
                {modulesCount} modules
              </span>
            )}
            {totalDuration > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-[var(--bg1)]/80 backdrop-blur-sm text-[var(--text-secondary)] border border-[var(--border)]">
                <Clock className="w-3 h-3" />
                {totalDuration}h
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <h3 className="text-xl font-bold text-white">{formation.title as string}</h3>
        <p className="text-[var(--text-secondary)] leading-relaxed">
          {formation.long_description as string || formation.description as string || 'Formation en cours de préparation...'}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
          <div>
            <span className="text-2xl font-bold gradient-text-gold">
              {price > 0 ? `${price.toFixed(2)} $` : 'Gratuit'}
            </span>
          </div>
          <button className="btn-gold flex items-center gap-2">
            {price > 0 ? 'S\'inscrire' : 'Commencer gratuitement'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────
export default async function FormationPage({ params }: FormationPageProps) {
  const { slug } = await params
  const data = await getTenantData(slug)

  if (!data) {
    notFound()
  }

  const { tenant, formations, stats } = data

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* ─── Background Effects ─── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="orb orb-gold w-[600px] h-[600px] -top-48 -left-48" />
        <div className="orb orb-violet w-[500px] h-[500px] -bottom-48 -right-48" />
      </div>

      {/* ─── Navigation ─── */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              <Diamond className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">NyXia</span>
            </Link>
            <div className="h-5 w-px bg-[var(--border)]" />
            <Link
              href={`/t/${slug}`}
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              {tenant.avatar_url ? (
                <img src={tenant.avatar_url} alt={tenant.display_name} className="w-7 h-7 rounded-full border border-[var(--gold)]/40 object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--nyxia-violet)] to-[var(--nyxia-purple)] flex items-center justify-center text-xs font-bold text-white">
                  {tenant.display_name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium">{tenant.display_name}</span>
            </Link>
            <div className="h-5 w-px bg-[var(--border)]" />
            <span className="text-[var(--gold)] font-semibold text-sm flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              Formations
            </span>
          </div>
          <Link href={`/t/${slug}`} className="btn-outline-gold text-sm py-2 px-4 flex items-center gap-2">
            Voir la boutique
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 mb-6">
            <GraduationCap className="w-5 h-5 text-[var(--gold)]" />
            <span className="text-sm font-semibold text-[var(--gold)]">Espace Formations</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text-gold">{tenant.display_name}</span>
            <span className="text-white"> Academy</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Apprenez directement avec {tenant.display_name} grâce à des formations conçues pour transformer vos compétences.
          </p>
        </div>
      </section>

      {/* ─── Formations List ─── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          {stats.formations_count > 0 ? (
            <div className="grid md:grid-cols-2 gap-8">
              {formations.map((formation: Record<string, unknown>) => (
                <FormationDetailCard key={formation.id as string} formation={formation} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--bg2)] flex items-center justify-center">
                <Lock className="w-12 h-12 text-[var(--gold)] opacity-30" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Formations à venir
              </h3>
              <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-8">
                {tenant.display_name} prépare actuellement des formations exclusives pour vous.
                Inscrivez-vous pour être notifié du lancement.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Votre courriel"
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg2)] border border-[var(--border)] text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)]/50 transition-colors"
                />
                <button className="btn-gold flex items-center justify-center gap-2 whitespace-nowrap">
                  <Zap className="w-4 h-4" />
                  Me notifier
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Why Learn Here ─── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            Pourquoi apprendre avec {tenant.display_name}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Star className="w-6 h-6 text-[var(--gold)]" />,
                title: 'Contenu premium',
                desc: 'Des formations conçues avec expertise et passion pour des résultats concrets.',
              },
              {
                icon: <BookOpen className="w-6 h-6 text-[var(--nyxia-violet)]" />,
                title: 'Apprentissage pratique',
                desc: 'Des exercices, des études de cas et un accompagnement personnalisé.',
              },
              {
                icon: <CheckCircle className="w-6 h-6 text-green-400" />,
                title: 'Certification',
                desc: 'Obtenez une certification reconnue à la fin de chaque formation.',
              },
            ].map((item, i) => (
              <div key={i} className="glass-card p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--bg2)] flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-10 px-4 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Diamond className="w-5 h-5 text-[var(--nyxia-violet)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              Propulsé par{' '}
              <Link href="https://travail-pour-toi.com" className="text-white font-semibold hover:text-[var(--nyxia-violet)] transition-colors">
                NyXia MarketPlace
              </Link>
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} {tenant.display_name} — Tous droits réservés
          </p>
        </div>
      </footer>

      {/* ─── IntersectionObserver ─── */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                  if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                  }
                });
              }, { threshold: 0.1 });
              document.querySelectorAll('.reveal, .stagger-children').forEach(function(el) {
                observer.observe(el);
              });
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
