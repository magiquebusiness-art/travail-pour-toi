'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Save,
  Eye,
  X,
  Monitor,
  Tablet,
  Smartphone,
  Undo2,
  Redo2,
  Code2,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

// ───────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────
interface GrapesJSEditorProps {
  formationId: string
  initialHtml?: string
  initialCss?: string
  initialComponents?: string
  initialStyles?: string
  onSave?: (data: { html_content: string; css_content: string; components_json: string; style_json: string }) => void
  onClose?: () => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GrapesJSEditor = any
type DeviceMode = 'desktop' | 'tablet' | 'mobile'

// ───────────────────────────────────────────────
// PALETTE & DESIGN TOKENS
// ───────────────────────────────────────────────
const P = {
  violet: '#7B5CFF',
  purple: '#6366f1',
  deepPurple: '#3b1f8e',
  gold: '#F4C842',
  goldDark: '#c9a23a',
  dark1: '#0b1428',
  dark2: '#06101f',
  dark3: '#091020',
  dark4: '#111b30',
  white: '#ffffff',
  textPrimary: '#e8e2f8',
  textSecondary: '#a09cc0',
  textMuted: '#564e78',
  fontStack: "'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'",
  headingFont: "'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'",
}

const SIZES = {
  device: { desktop: '100%', tablet: '768px', mobile: '375px' },
  borderRadius: { sm: '8px', md: '12px', lg: '16px', xl: '24px' },
  shadow: {
    sm: '0 2px 8px rgba(0,0,0,0.12)',
    md: '0 4px 16px rgba(0,0,0,0.18)',
    lg: '0 8px 32px rgba(0,0,0,0.25)',
    glow: `0 0 30px rgba(${123},${92},${255},0.15)`,
    goldGlow: `0 0 30px rgba(${244},${200},${66},0.15)`,
  },
}

function css(obj: Record<string, string | number | undefined>): string {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${v}`)
    .join(';')
}

// ───────────────────────────────────────────────
// BLOCK DEFINITIONS
// ───────────────────────────────────────────────

const HERO_BLOCKS = [
  {
    id: 'hero-gradient',
    label: 'Hero Gradient',
    category: 'Hero',
    content: `<div style="${css({
      background: `linear-gradient(135deg, ${P.dark1} 0%, ${P.dark3} 50%, #1a0d3e 100%)`,
      padding: '80px 40px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    })}">
      <div style="${css({
        maxWidth: '720px',
        margin: '0 auto',
        position: 'relative',
        zIndex: '1',
      })}">
        <div style="${css({
          display: 'inline-block',
          padding: '8px 20px',
          borderRadius: '50px',
          background: `rgba(${123},${92},${255},0.15)`,
          border: `1px solid rgba(${123},${92},${255},0.3)`,
          color: P.violet,
          fontSize: '13px',
          fontWeight: '600',
          letterSpacing: '0.5px',
          marginBottom: '24px',
        })}">✨ FORMATION PREMIUM</div>
        <h1 style="${css({
          fontSize: '48px',
          fontWeight: '800',
          color: P.white,
          lineHeight: '1.15',
          marginBottom: '20px',
          fontFamily: P.headingFont,
        })}">Transformez Votre Expertise en Empire</h1>
        <p style="${css({
          fontSize: '18px',
          color: P.textSecondary,
          lineHeight: '1.7',
          marginBottom: '36px',
          fontFamily: P.fontStack,
        })}">Découvrez notre formation complète qui vous guide étape par étape pour créer un business en ligne rentable et scalable.</p>
        <div style="${css({
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        })}">
          <a style="${css({
            display: 'inline-block',
            padding: '16px 36px',
            borderRadius: SIZES.borderRadius.md,
            background: `linear-gradient(135deg, ${P.violet} 0%, ${P.deepPurple} 100%)`,
            color: P.white,
            fontSize: '16px',
            fontWeight: '700',
            textDecoration: 'none',
            boxShadow: `0 4px 20px rgba(${123},${92},${255},0.35)`,
          })}">Commencer Maintenant</a>
          <a style="${css({
            display: 'inline-block',
            padding: '16px 36px',
            borderRadius: SIZES.borderRadius.md,
            background: 'transparent',
            color: P.textPrimary,
            fontSize: '16px',
            fontWeight: '600',
            textDecoration: 'none',
            border: `1px solid rgba(${123},${92},${255},0.3)`,
          })}">En Savoir Plus →</a>
        </div>
      </div>
    </div>`,
  },
  {
    id: 'hero-image-side',
    label: 'Hero + Image',
    category: 'Hero',
    content: `<div style="${css({
      background: P.dark1,
      padding: '80px 40px',
      display: 'flex',
      alignItems: 'center',
      gap: '60px',
      flexWrap: 'wrap',
    })}">
      <div style="${css({ flex: '1', minWidth: '300px' })}">
        <div style="${css({
          display: 'inline-block',
          padding: '6px 16px',
          borderRadius: '50px',
          background: `rgba(${244},${200},${66},0.12)`,
          border: `1px solid rgba(${244},${200},${66},0.25)`,
          color: P.gold,
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '1px',
          marginBottom: '20px',
        })}">NOUVEAU</div>
        <h1 style="${css({
          fontSize: '44px',
          fontWeight: '800',
          color: P.white,
          lineHeight: '1.15',
          marginBottom: '18px',
          fontFamily: P.headingFont,
        })}">Créez Votre Cours en Ligne en 7 Jours</h1>
        <p style="${css({
          fontSize: '17px',
          color: P.textSecondary,
          lineHeight: '1.7',
          marginBottom: '32px',
        })}">Notre méthode éprouvée vous permet de passer de l'idée au lancement en seulement une semaine.</p>
        <a style="${css({
          display: 'inline-block',
          padding: '15px 32px',
          borderRadius: SIZES.borderRadius.md,
          background: `linear-gradient(135deg, ${P.gold} 0%, ${P.goldDark} 100%)`,
          color: P.dark2,
          fontSize: '15px',
          fontWeight: '700',
          textDecoration: 'none',
          boxShadow: `0 4px 20px rgba(${244},${200},${66},0.3)`,
        })}">Démarrer Gratuitement</a>
      </div>
      <div style="${css({
        flex: '1',
        minWidth: '300px',
        height: '360px',
        borderRadius: SIZES.borderRadius.lg,
        background: `linear-gradient(135deg, rgba(${123},${92},${255},0.1) 0%, rgba(${99},${102},${241},0.1) 100%)`,
        border: `1px solid rgba(${123},${92},${255},0.15)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: P.textMuted,
        fontSize: '16px',
      })}">📷 Image Placeholder</div>
    </div>`,
  },
  {
    id: 'hero-video',
    label: 'Hero Vidéo',
    category: 'Hero',
    content: `<div style="${css({
      background: P.dark2,
      padding: '60px 40px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    })}">
      <div style="${css({
        maxWidth: '900px',
        margin: '0 auto',
      })}">
        <h1 style="${css({
          fontSize: '42px',
          fontWeight: '800',
          color: P.white,
          lineHeight: '1.15',
          marginBottom: '16px',
          fontFamily: P.headingFont,
        })}">Regardez Comment Ça Marche</h1>
        <p style="${css({
          fontSize: '17px',
          color: P.textSecondary,
          marginBottom: '40px',
          lineHeight: '1.7',
        })}">Découvrez notre plateforme en action — résultats garantis.</p>
        <div style="${css({
          width: '100%',
          maxWidth: '800px',
          height: '400px',
          margin: '0 auto',
          borderRadius: SIZES.borderRadius.lg,
          background: `linear-gradient(135deg, #0d1b35 0%, ${P.dark3} 100%)`,
          border: `1px solid rgba(${123},${92},${255},0.12)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        })}">
          <div style="${css({
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `rgba(${123},${92},${255},0.2)`,
            border: `2px solid ${P.violet}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            color: P.violet,
          })}">▶</div>
        </div>
      </div>
    </div>`,
  },
  {
    id: 'hero-centered-badge',
    label: 'Hero Centré Badge',
    category: 'Hero',
    content: `<div style="${css({
      background: `linear-gradient(180deg, ${P.dark2} 0%, ${P.dark1} 100%)`,
      padding: '100px 40px',
      textAlign: 'center',
    })}">
      <div style="${css({ maxWidth: '640px', margin: '0 auto' })}">
        <div style="${css({
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 24px',
          borderRadius: '50px',
          background: `linear-gradient(135deg, rgba(${123},${92},${255},0.2) 0%, rgba(${99},${102},${241},0.15) 100%)`,
          border: `1px solid rgba(${123},${92},${255},0.3)`,
          marginBottom: '28px',
        })}">
          <span style="${css({ fontSize: '18px' })}">🏆</span>
          <span style="${css({
            color: P.violet,
            fontSize: '13px',
            fontWeight: '700',
            letterSpacing: '0.5px',
          })}">PLUS DE 10 000 ÉLÈVES</span>
        </div>
        <h1 style="${css({
          fontSize: '52px',
          fontWeight: '800',
          color: P.white,
          lineHeight: '1.1',
          marginBottom: '20px',
          fontFamily: P.headingFont,
        })}">La Formation #1 Pour Entrepreneurs</h1>
        <p style="${css({
          fontSize: '18px',
          color: P.textSecondary,
          lineHeight: '1.7',
          marginBottom: '36px',
        })}">Joignez-vous à des milliers d'entrepreneurs qui ont transformé leur passion en business rentable.</p>
        <a style="${css({
          display: 'inline-block',
          padding: '18px 44px',
          borderRadius: SIZES.borderRadius.md,
          background: `linear-gradient(135deg, ${P.violet} 0%, ${P.deepPurple} 100%)`,
          color: P.white,
          fontSize: '17px',
          fontWeight: '700',
          textDecoration: 'none',
          boxShadow: `0 6px 24px rgba(${123},${92},${255},0.35)`,
          letterSpacing: '0.3px',
        })}">Rejoindre Maintenant</a>
        <p style="${css({
          marginTop: '16px',
          fontSize: '13px',
          color: P.textMuted,
        })}">✓ Garantie 30 jours • ✓ Accès à vie</p>
      </div>
    </div>`,
  },
]

const FEATURES_BLOCKS = [
  {
    id: 'features-3col',
    label: '3 Colonnes',
    category: 'Features',
    content: (() => {
      const items = [
        { icon: '🎯', title: 'Objectifs Clairs', desc: 'Définissez vos objectifs et suivez votre progression avec notre système de tracking intégré.' },
        { icon: '📈', title: 'Résultats Mesurables', desc: 'Obtenez des résultats concrets avec notre méthode éprouvée par des milliers de professionnels.' },
        { icon: '💡', title: 'Soutien Expert', desc: 'Bénéficiez du soutien de nos experts et d\'une communauté engagée pour réussir.' },
      ]
      const cards = items.map((item) => `
        <div style="${css({
          background: `rgba(${17},${27},${48},0.6)`,
          border: `1px solid rgba(${123},${92},${255},0.1)`,
          borderRadius: SIZES.borderRadius.lg,
          padding: '36px 28px',
          textAlign: 'center',
          transition: 'all 0.3s ease',
        })}">
          <div style="${css({
            width: '60px',
            height: '60px',
            borderRadius: SIZES.borderRadius.md,
            background: `rgba(${123},${92},${255},0.1)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            margin: '0 auto 20px',
          })}">${item.icon}</div>
          <h3 style="${css({
            fontSize: '20px',
            fontWeight: '700',
            color: P.white,
            marginBottom: '12px',
          })}">${item.title}</h3>
          <p style="${css({
            fontSize: '15px',
            color: P.textSecondary,
            lineHeight: '1.7',
          })}">${item.desc}</p>
        </div>`).join('')
      return `<div style="${css({
        background: P.dark2,
        padding: '80px 40px',
      })}">
        <div style="${css({ textAlign: 'center', maxWidth: '600px', margin: '0 auto 48px' })}">
          <h2 style="${css({
            fontSize: '36px',
            fontWeight: '800',
            color: P.white,
            marginBottom: '14px',
            fontFamily: P.headingFont,
          })}">Pourquoi Nous Choisir</h2>
          <p style="${css({
            fontSize: '17px',
            color: P.textSecondary,
            lineHeight: '1.7',
          })}">Tout ce dont vous avez besoin pour réussir, réuni en une seule plateforme.</p>
        </div>
        <div style="${css({
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          maxWidth: '960px',
          margin: '0 auto',
        })}">${cards}</div>
      </div>`
    })(),
  },
  {
    id: 'features-4col',
    label: '4 Colonnes Icônes',
    category: 'Features',
    content: (() => {
      const items = [
        { icon: '🚀', title: 'Rapidité' },
        { icon: '🔒', title: 'Sécurité' },
        { icon: '📊', title: 'Analytique' },
        { icon: '🌍', title: 'Accessibilité' },
      ]
      const cards = items.map((item) => `
        <div style="${css({
          background: `rgba(${17},${27},${48},0.4)`,
          border: `1px solid rgba(${123},${92},${255},0.08)`,
          borderRadius: SIZES.borderRadius.md,
          padding: '32px 20px',
          textAlign: 'center',
        })}">
          <div style="${css({
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, rgba(${123},${92},${255},0.15) 0%, rgba(${99},${102},${241},0.1) 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            margin: '0 auto 16px',
          })}">${item.icon}</div>
          <h3 style="${css({
            fontSize: '17px',
            fontWeight: '700',
            color: P.white,
          })}">${item.title}</h3>
        </div>`).join('')
      return `<div style="${css({
        background: P.dark1,
        padding: '80px 40px',
      })}">
        <div style="${css({ textAlign: 'center', maxWidth: '600px', margin: '0 auto 48px' })}">
          <h2 style="${css({
            fontSize: '36px',
            fontWeight: '800',
            color: P.white,
            marginBottom: '14px',
            fontFamily: P.headingFont,
          })}">Nos Avantages</h2>
          <p style="${css({
            fontSize: '17px',
            color: P.textSecondary,
            lineHeight: '1.7',
          })}">Les outils puissants qui font la différence.</p>
        </div>
        <div style="${css({
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          maxWidth: '960px',
          margin: '0 auto',
        })}">${cards}</div>
      </div>`
    })(),
  },
  {
    id: 'features-alternating',
    label: 'Alternance Image/Texte',
    category: 'Features',
    content: `<div style="${css({ background: P.dark2 })}">
      <div style="${css({
        display: 'flex',
        alignItems: 'center',
        padding: '80px 40px',
        gap: '60px',
        flexWrap: 'wrap',
      })}">
        <div style="${css({ flex: '1', minWidth: '300px' })}">
          <h2 style="${css({
            fontSize: '34px',
            fontWeight: '800',
            color: P.white,
            marginBottom: '18px',
            fontFamily: P.headingFont,
          })}">Apprenez à Votre Rythme</h2>
          <p style="${css({
            fontSize: '16px',
            color: P.textSecondary,
            lineHeight: '1.8',
            marginBottom: '24px',
          })}">Notre plateforme est conçue pour s'adapter à votre emploi du temps. Accédez aux contenus quand vous voulez, où vous voulez.</p>
          <div style="${css({ display: 'flex', flexDirection: 'column', gap: '12px' })}">
            <div style="${css({ display: 'flex', alignItems: 'center', gap: '10px' })}">
              <span style="${css({ color: P.gold, fontSize: '18px' })}">✓</span>
              <span style="${css({ color: P.textPrimary, fontSize: '15px' })}">Accès illimité 24h/24</span>
            </div>
            <div style="${css({ display: 'flex', alignItems: 'center', gap: '10px' })}">
              <span style="${css({ color: P.gold, fontSize: '18px' })}">✓</span>
              <span style="${css({ color: P.textPrimary, fontSize: '15px' })}">Compatible tous appareils</span>
            </div>
            <div style="${css({ display: 'flex', alignItems: 'center', gap: '10px' })}">
              <span style="${css({ color: P.gold, fontSize: '18px' })}">✓</span>
              <span style="${css({ color: P.textPrimary, fontSize: '15px' })}">Téléchargement hors ligne</span>
            </div>
          </div>
        </div>
        <div style="${css({
          flex: '1',
          minWidth: '300px',
          height: '320px',
          borderRadius: SIZES.borderRadius.lg,
          background: `linear-gradient(135deg, rgba(${123},${92},${255},0.08) 0%, rgba(${99},${102},${241},0.08) 100%)`,
          border: `1px solid rgba(${123},${92},${255},0.12)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: P.textMuted,
          fontSize: '15px',
        })}">📷 Image Placeholder</div>
      </div>
      <div style="${css({
        height: '1px',
        background: `linear-gradient(90deg, transparent, rgba(${123},${92},${255},0.15), transparent)`,
      })}"></div>
    </div>`,
  },
  {
    id: 'benefits-checklist',
    label: 'Checklist Avantages',
    category: 'Features',
    content: (() => {
      const items = [
        'Accès à vie à toutes les mises à jour',
        'Communauté privée de +5000 membres',
        'Support prioritaire par nos experts',
        'Certificat de complétion reconnu',
        'Ressources téléchargeables exclusives',
        'Sessions de coaching en groupe',
      ]
      const checklist = items.map((item) => `
        <div style="${css({
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 20px',
          borderRadius: SIZES.borderRadius.sm,
          background: `rgba(${123},${92},${255},0.04)`,
          border: `1px solid rgba(${123},${92},${255},0.06)`,
        })}">
          <div style="${css({
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${P.violet} 0%, ${P.deepPurple} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            color: P.white,
            flexShrink: '0',
          })}">✓</div>
          <span style="${css({ color: P.textPrimary, fontSize: '16px', fontWeight: '500' })}">${item}</span>
        </div>`).join('')
      return `<div style="${css({
        background: `linear-gradient(135deg, ${P.dark1} 0%, ${P.dark3} 100%)`,
        padding: '80px 40px',
      })}">
        <div style="${css({
          display: 'flex',
          gap: '60px',
          alignItems: 'flex-start',
          maxWidth: '900px',
          margin: '0 auto',
          flexWrap: 'wrap',
        })}">
          <div style="${css({ flex: '1', minWidth: '280px' })}">
            <h2 style="${css({
              fontSize: '34px',
              fontWeight: '800',
              color: P.white,
              marginBottom: '14px',
              fontFamily: P.headingFont,
            })}">Ce Qui Est Inclus</h2>
            <p style="${css({
              fontSize: '16px',
              color: P.textSecondary,
              lineHeight: '1.7',
            })}">Tout ce dont vous avez besoin pour réussir, sans frais supplémentaires.</p>
          </div>
          <div style="${css({
            flex: '1',
            minWidth: '300px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          })}">${checklist}</div>
        </div>
      </div>`
    })(),
  },
]

const PRICING_BLOCKS = [
  {
    id: 'pricing-3col',
    label: '3 Colonnes Tarifs',
    category: 'Pricing',
    content: (() => {
      const plans = [
        {
          name: 'Basic',
          price: '49€',
          period: '/mois',
          features: ['5 modules de formation', 'Support email', 'Accès communauté', 'Certificat de base'],
          highlighted: false,
        },
        {
          name: 'Pro',
          price: '97€',
          period: '/mois',
          features: ['Toutes les formations', 'Support prioritaire', 'Coaching 1-to-1', 'Ressources premium', 'Certificat avancé'],
          highlighted: true,
        },
        {
          name: 'Premium',
          price: '197€',
          period: '/mois',
          features: ['Tout dans Pro', 'Masterclasses exclusives', 'Mentorat privé', 'Partenariats', 'Badge Premium'],
          highlighted: false,
        },
      ]
      const cards = plans.map((plan) => `
        <div style="${css({
          background: plan.highlighted ? `linear-gradient(135deg, ${P.dark4} 0%, #151e38 100%)` : `rgba(${17},${27},${48},0.5)`,
          border: plan.highlighted ? `2px solid ${P.violet}` : `1px solid rgba(${123},${92},${255},0.1)`,
          borderRadius: SIZES.borderRadius.lg,
          padding: plan.highlighted ? '44px 32px' : '36px 28px',
          textAlign: 'center',
          position: 'relative',
          boxShadow: plan.highlighted ? `0 8px 40px rgba(${123},${92},${255},0.2)` : SIZES.shadow.sm,
          transform: plan.highlighted ? 'scale(1.03)' : 'none',
        })}">
          ${plan.highlighted ? `<div style="${css({
            position: 'absolute',
            top: '-14px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 20px',
            borderRadius: '50px',
            background: `linear-gradient(135deg, ${P.violet} 0%, ${P.deepPurple} 100%)`,
            color: P.white,
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.5px',
          })}">⭐ POPULAIRE</div>` : ''}
          <h3 style="${css({
            fontSize: '20px',
            fontWeight: '700',
            color: plan.highlighted ? P.violet : P.textSecondary,
            marginBottom: '8px',
          })}">${plan.name}</h3>
          <div style="${css({ margin: '20px 0 24px' })}">
            <span style="${css({
              fontSize: '48px',
              fontWeight: '800',
              color: P.white,
              fontFamily: P.headingFont,
            })}">${plan.price}</span>
            <span style="${css({
              fontSize: '15px',
              color: P.textMuted,
            })}">${plan.period}</span>
          </div>
          <div style="${css({ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' })}">
            ${plan.features.map((f) => `
              <div style="${css({ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' })}">
                <span style="${css({ color: plan.highlighted ? P.gold : P.violet, fontSize: '14px' })}">✓</span>
                <span style="${css({ color: P.textPrimary, fontSize: '14px' })}">${f}</span>
              </div>`).join('')}
          </div>
          <a style="${css({
            display: 'block',
            padding: '14px 28px',
            borderRadius: SIZES.borderRadius.md,
            background: plan.highlighted
              ? `linear-gradient(135deg, ${P.violet} 0%, ${P.deepPurple} 100%)`
              : `rgba(${123},${92},${255},0.1)`,
            color: plan.highlighted ? P.white : P.violet,
            fontSize: '15px',
            fontWeight: '700',
            textDecoration: 'none',
            border: plan.highlighted ? 'none' : `1px solid rgba(${123},${92},${255},0.2)`,
            boxShadow: plan.highlighted ? `0 4px 16px rgba(${123},${92},${255},0.3)` : 'none',
          })}">Choisir ${plan.name}</a>
        </div>`).join('')
      return `<div style="${css({
        background: P.dark2,
        padding: '80px 40px',
      })}">
        <div style="${css({ textAlign: 'center', maxWidth: '600px', margin: '0 auto 52px' })}">
          <h2 style="${css({
            fontSize: '36px',
            fontWeight: '800',
            color: P.white,
            marginBottom: '14px',
            fontFamily: P.headingFont,
          })}">Choisissez Votre Plan</h2>
          <p style="${css({
            fontSize: '17px',
            color: P.textSecondary,
            lineHeight: '1.7',
          })}">Des tarifs adaptés à chaque étape de votre parcours.</p>
        </div>
        <div style="${css({
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          maxWidth: '960px',
          margin: '0 auto',
          alignItems: 'start',
        })}">${cards}</div>
      </div>`
    })(),
  },
  {
    id: 'pricing-single',
    label: 'Carte Tarif Unique',
    category: 'Pricing',
    content: `<div style="${css({
      background: `linear-gradient(135deg, ${P.dark4} 0%, #151e38 100%)`,
      border: `1px solid rgba(${123},${92},${255},0.15)`,
      borderRadius: SIZES.borderRadius.xl,
      padding: '56px 48px',
      textAlign: 'center',
      maxWidth: '480px',
      margin: '40px auto',
      boxShadow: `0 12px 48px rgba(${123},${92},${255},0.12)`,
    })}">
      <div style="${css({
        padding: '6px 18px',
        borderRadius: '50px',
        background: `rgba(${244},${200},${66},0.12)`,
        border: `1px solid rgba(${244},${200},${66},0.25)`,
        color: P.gold,
        fontSize: '12px',
        fontWeight: '700',
        letterSpacing: '1px',
        display: 'inline-block',
        marginBottom: '20px',
      })}">MEILLEURE OFFRE</div>
      <h3 style="${css({
        fontSize: '24px',
        fontWeight: '700',
        color: P.white,
        marginBottom: '8px',
      })}">Accès Complet</h3>
      <div style="${css({ margin: '24px 0' })}">
        <span style="${css({ fontSize: '56px', fontWeight: '800', color: P.white, fontFamily: P.headingFont })}">297€</span>
        <span style="${css({ fontSize: '16px', color: P.textMuted })}">/ paiement unique</span>
      </div>
      <p style="${css({
        fontSize: '15px',
        color: P.textSecondary,
        lineHeight: '1.7',
        marginBottom: '32px',
      })}">Accédez à tout le contenu pour toujours. Aucun frais récurrent.</p>
      <a style="${css({
        display: 'block',
        padding: '16px 36px',
        borderRadius: SIZES.borderRadius.md,
        background: `linear-gradient(135deg, ${P.gold} 0%, ${P.goldDark} 100%)`,
        color: P.dark2,
        fontSize: '16px',
        fontWeight: '700',
        textDecoration: 'none',
        boxShadow: `0 4px 20px rgba(${244},${200},${66},0.3)`,
      })}">Obtenir l'Accès</a>
      <p style="${css({ marginTop: '16px', fontSize: '13px', color: P.textMuted })}">🔒 Garantie satisfait ou remboursé 30 jours</p>
    </div>`,
  },
  {
    id: 'pricing-comparison',
    label: 'Tableau Comparatif',
    category: 'Pricing',
    content: `<div style="${css({ background: P.dark1, padding: '80px 40px' })}">
      <div style="${css({ textAlign: 'center', marginBottom: '48px' })}">
        <h2 style="${css({
          fontSize: '36px',
          fontWeight: '800',
          color: P.white,
          marginBottom: '14px',
          fontFamily: P.headingFont,
        })}">Comparez les Plans</h2>
      </div>
      <div style="${css({
        maxWidth: '800px',
        margin: '0 auto',
        borderRadius: SIZES.borderRadius.lg,
        overflow: 'hidden',
        border: `1px solid rgba(${123},${92},${255},0.1)`,
      })}">
        <div style="${css({
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          background: `rgba(${123},${92},${255},0.06)`,
          borderBottom: `1px solid rgba(${123},${92},${255},0.1)`,
        })}">
          <div style="${css({ padding: '18px 24px', color: P.textMuted, fontSize: '14px', fontWeight: '600' })}">Fonctionnalité</div>
          <div style="${css({ padding: '18px 16px', color: P.textSecondary, fontSize: '14px', fontWeight: '700', textAlign: 'center' })}">Basic</div>
          <div style="${css({ padding: '18px 16px', color: P.violet, fontSize: '14px', fontWeight: '700', textAlign: 'center' })}">Pro ⭐</div>
          <div style="${css({ padding: '18px 16px', color: P.textSecondary, fontSize: '14px', fontWeight: '700', textAlign: 'center' })}">Premium</div>
        </div>
        ${['Formations', 'Support', 'Coaching', 'Certificat', 'Ressources'].map((feat) => `
          <div style="${css({
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            borderBottom: `1px solid rgba(${123},${92},${255},0.05)`,
          })}">
            <div style="${css({ padding: '16px 24px', color: P.textPrimary, fontSize: '14px' })}">${feat}</div>
            <div style="${css({ padding: '16px 16px', textAlign: 'center', color: P.textMuted, fontSize: '14px' })}">5 modules</div>
            <div style="${css({ padding: '16px 16px', textAlign: 'center', color: P.gold, fontSize: '14px', fontWeight: '700' })}">Illimité</div>
            <div style="${css({ padding: '16px 16px', textAlign: 'center', color: P.gold, fontSize: '14px', fontWeight: '700' })}">Illimité</div>
          </div>`).join('')}
      </div>
    </div>`,
  },
]

const TESTIMONIAL_BLOCKS = [
  {
    id: 'testimonial-3col',
    label: '3 Colonnes Avis',
    category: 'Testimonials',
    content: (() => {
      const items = [
        { name: 'Marie Dupont', role: 'Coach', text: 'Cette formation a complètement transformé mon business. En 3 mois, j\'ai doublé mes revenus.', avatar: '👩‍💼' },
        { name: 'Thomas B.', role: 'Entrepreneur', text: 'Le contenu est exceptionnel. L\'accompagnement personnalisé fait vraiment la différence.', avatar: '👨‍💻' },
        { name: 'Sophie L.', role: 'Formatrice', text: 'Je recommande cette plateforme à 100%. L\'investissement est rentabilisé dès le premier mois.', avatar: '👩‍🏫' },
      ]
      const cards = items.map((item) => `
        <div style="${css({
          background: `rgba(${17},${27},${48},0.6)`,
          border: `1px solid rgba(${123},${92},${255},0.08)`,
          borderRadius: SIZES.borderRadius.lg,
          padding: '32px 28px',
        })}">
          <div style="${css({
            fontSize: '32px',
            color: P.gold,
            marginBottom: '16px',
            lineHeight: '1',
          })}">★★★★★</div>
          <p style="${css({
            fontSize: '15px',
            color: P.textSecondary,
            lineHeight: '1.7',
            marginBottom: '24px',
            fontStyle: 'italic',
          })}">"${item.text}"</p>
          <div style="${css({ display: 'flex', alignItems: 'center', gap: '12px' })}">
            <div style="${css({
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, rgba(${123},${92},${255},0.15) 0%, rgba(${99},${102},${241},0.1) 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            })}">${item.avatar}</div>
            <div>
              <div style="${css({ fontSize: '15px', fontWeight: '700', color: P.white })}">${item.name}</div>
              <div style="${css({ fontSize: '13px', color: P.textMuted })}">${item.role}</div>
            </div>
          </div>
        </div>`).join('')
      return `<div style="${css({ background: P.dark2, padding: '80px 40px' })}">
        <div style="${css({ textAlign: 'center', maxWidth: '600px', margin: '0 auto 48px' })}">
          <h2 style="${css({
            fontSize: '36px',
            fontWeight: '800',
            color: P.white,
            marginBottom: '14px',
            fontFamily: P.headingFont,
          })}">Ce Que Disent Nos Élèves</h2>
          <p style="${css({
            fontSize: '17px',
            color: P.textSecondary,
            lineHeight: '1.7',
          })}">Rejoignez des milliers de personnes satisfaites.</p>
        </div>
        <div style="${css({
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          maxWidth: '960px',
          margin: '0 auto',
        })}">${cards}</div>
      </div>`
    })(),
  },
  {
    id: 'testimonial-single',
    label: 'Avis Large Citation',
    category: 'Testimonials',
    content: `<div style="${css({
      background: `linear-gradient(135deg, ${P.dark1} 0%, ${P.dark3} 100%)`,
      padding: '80px 40px',
      textAlign: 'center',
    })}">
      <div style="${css({ maxWidth: '700px', margin: '0 auto' })}">
        <div style="${css({
          fontSize: '48px',
          color: P.violet,
          marginBottom: '24px',
          lineHeight: '1',
          opacity: '0.5',
        })}">"</div>
        <p style="${css({
          fontSize: '22px',
          color: P.textPrimary,
          lineHeight: '1.7',
          fontStyle: 'italic',
          marginBottom: '32px',
          fontWeight: '400',
        })}">Cette formation a littéralement changé ma vie. En seulement 6 mois, j'ai quitté mon emploi pour me consacrer à 100% à mon business en ligne. La méthode est claire, actionnable et les résultats parlent d'eux-mêmes.</p>
        <div style="${css({
          fontSize: '32px',
          color: P.gold,
          marginBottom: '16px',
        })}">★★★★★</div>
        <div style="${css({
          fontSize: '16px',
          fontWeight: '700',
          color: P.white,
          marginBottom: '4px',
        })}">Alexandre Martin</div>
        <div style="${css({
          fontSize: '14px',
          color: P.textMuted,
        })}">Entrepreneur Digital — Revenus +300% en 6 mois</div>
      </div>
    </div>`,
  },
  {
    id: 'testimonial-carousel',
    label: 'Carousel Avis',
    category: 'Testimonials',
    content: `<div style="${css({ background: P.dark1, padding: '80px 40px' })}">
      <div style="${css({ textAlign: 'center', marginBottom: '48px' })}">
        <h2 style="${css({
          fontSize: '36px',
          fontWeight: '800',
          color: P.white,
          marginBottom: '14px',
          fontFamily: P.headingFont,
        })}">Témoignages</h2>
      </div>
      <div style="${css({
        display: 'flex',
        gap: '24px',
        maxWidth: '1100px',
        margin: '0 auto',
        overflowX: 'auto',
        paddingBottom: '8px',
      })}">
        ${[
          { name: 'Julie R.', text: 'Méthode incroyable, résultats au-delà de mes attentes !', avatar: '👩‍🔬' },
          { name: 'Marc P.', text: 'Le meilleur investissement que j\'ai fait pour ma carrière.', avatar: '👨‍🔧' },
          { name: 'Emma L.', text: 'Contenu de qualité supérieure, communauté très active.', avatar: '👩‍🎨' },
          { name: 'David S.', text: 'J\'ai lancé mon business en 30 jours grâce à cette formation.', avatar: '👨‍💼' },
        ].map((item) => `
          <div style="${css({
            minWidth: '280px',
            flex: '0 0 280px',
            background: `rgba(${17},${27},${48},0.5)`,
            border: `1px solid rgba(${123},${92},${255},0.08)`,
            borderRadius: SIZES.borderRadius.lg,
            padding: '28px 24px',
          })}">
            <div style="${css({
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, rgba(${123},${92},${255},0.15) 0%, rgba(${99},${102},${241},0.1) 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              marginBottom: '16px',
            })}">${item.avatar}</div>
            <p style="${css({
              fontSize: '14px',
              color: P.textSecondary,
              lineHeight: '1.7',
              marginBottom: '16px',
              fontStyle: 'italic',
            })}">"${item.text}"</p>
            <div style="${css({ fontSize: '14px', fontWeight: '700', color: P.white })}">${item.name}</div>
            <div style="${css({ fontSize: '13px', color: P.gold, marginTop: '4px' })}">★★★★★</div>
          </div>`).join('')}
      </div>
    </div>`,
  },
]

const CTA_BLOCKS = [
  {
    id: 'cta-fullwidth',
    label: 'CTA Pleine Largeur',
    category: 'CTA',
    content: `<div style="${css({
      background: `linear-gradient(135deg, ${P.violet} 0%, ${P.deepPurple} 50%, #2d1a7e 100%)`,
      padding: '80px 40px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    })}">
      <div style="${css({ maxWidth: '640px', margin: '0 auto', position: 'relative', zIndex: '1' })}">
        <h2 style="${css({
          fontSize: '40px',
          fontWeight: '800',
          color: P.white,
          marginBottom: '16px',
          fontFamily: P.headingFont,
        })}">Prêt à Transformer Votre Avenir ?</h2>
        <p style="${css({
          fontSize: '18px',
          color: 'rgba(255,255,255,0.75)',
          lineHeight: '1.7',
          marginBottom: '36px',
        })}">Ne laissez pas passer cette opportunité. Rejoignez-nous aujourd'hui et commencez à construire l'avenir que vous méritez.</p>
        <a style="${css({
          display: 'inline-block',
          padding: '18px 44px',
          borderRadius: SIZES.borderRadius.md,
          background: P.white,
          color: P.deepPurple,
          fontSize: '17px',
          fontWeight: '800',
          textDecoration: 'none',
          boxShadow: `0 6px 24px rgba(0,0,0,0.2)`,
        })}">Commencer Maintenant →</a>
      </div>
    </div>`,
  },
  {
    id: 'cta-email-optin',
    label: 'CTA Email Opt-in',
    category: 'CTA',
    content: `<div style="${css({
      background: `linear-gradient(135deg, ${P.dark4} 0%, #151e38 100%)`,
      border: `1px solid rgba(${123},${92},${255},0.15)`,
      borderRadius: SIZES.borderRadius.xl,
      padding: '60px 48px',
      textAlign: 'center',
      maxWidth: '600px',
      margin: '40px auto',
    })}">
      <div style="${css({
        fontSize: '36px',
        marginBottom: '16px',
      })}">💌</div>
      <h2 style="${css({
        fontSize: '30px',
        fontWeight: '800',
        color: P.white,
        marginBottom: '12px',
        fontFamily: P.headingFont,
      })}">Recevez Votre Guide Gratuit</h2>
      <p style="${css({
        fontSize: '16px',
        color: P.textSecondary,
        lineHeight: '1.7',
        marginBottom: '28px',
      })}">Inscrivez-vous pour recevoir nos meilleurs conseils directement dans votre boîte mail.</p>
      <div style="${css({
        display: 'flex',
        gap: '12px',
        maxWidth: '420px',
        margin: '0 auto',
      })}">
        <input type="email" placeholder="votre@email.com" style="${css({
          flex: '1',
          padding: '14px 18px',
          borderRadius: SIZES.borderRadius.md,
          border: `1px solid rgba(${123},${92},${255},0.2)`,
          background: `rgba(${7},${16},${31},0.6)`,
          color: P.textPrimary,
          fontSize: '15px',
          outline: 'none',
        })}" />
        <button style="${css({
          padding: '14px 24px',
          borderRadius: SIZES.borderRadius.md,
          background: `linear-gradient(135deg, ${P.violet} 0%, ${P.deepPurple} 100%)`,
          color: P.white,
          fontSize: '15px',
          fontWeight: '700',
          border: 'none',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        })}">S'inscrire</button>
      </div>
      <p style="${css({ marginTop: '14px', fontSize: '12px', color: P.textMuted })}">🔒 Pas de spam. Désabonnement en un clic.</p>
    </div>`,
  },
  {
    id: 'cta-countdown',
    label: 'CTA Compte à Rebours',
    category: 'CTA',
    content: `<div style="${css({
      background: `linear-gradient(135deg, ${P.dark1} 0%, #0d0a20 100%)`,
      padding: '60px 40px',
      textAlign: 'center',
      border: `1px solid rgba(${244},${200},${66},0.15)`,
      borderRadius: SIZES.borderRadius.xl,
      maxWidth: '700px',
      margin: '40px auto',
    })}">
      <div style="${css({
        display: 'inline-block',
        padding: '6px 16px',
        borderRadius: '50px',
        background: `rgba(${244},${200},${66},0.12)`,
        border: `1px solid rgba(${244},${200},${66},0.25)`,
        color: P.gold,
        fontSize: '12px',
        fontWeight: '700',
        letterSpacing: '1px',
        marginBottom: '20px',
      })}">⚡ OFFRE LIMITÉE</div>
      <h2 style="${css({
        fontSize: '32px',
        fontWeight: '800',
        color: P.white,
        marginBottom: '16px',
        fontFamily: P.headingFont,
      })}">-40% Pour les 50 Prochains Inscrits</h2>
      <p style="${css({
        fontSize: '16px',
        color: P.textSecondary,
        lineHeight: '1.7',
        marginBottom: '32px',
      })}">Cette offre expire bientôt. Ne manquez pas cette occasion unique !</p>
      <div style="${css({
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        marginBottom: '36px',
      })}">
        ${['12', '08', '45', '22'].map((n, i) => `
          <div style="${css({
            width: '72px',
            height: '80px',
            borderRadius: SIZES.borderRadius.md,
            background: `rgba(${123},${92},${255},0.08)`,
            border: `1px solid rgba(${123},${92},${255},0.15)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          })}">
            <span style="${css({ fontSize: '28px', fontWeight: '800', color: P.white, fontFamily: P.headingFont })}">${n}</span>
            <span style="${css({ fontSize: '11px', color: P.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' })}">${['Jours', 'Heures', 'Min', 'Sec'][i]}</span>
          </div>`).join('')}
      </div>
      <a style="${css({
        display: 'inline-block',
        padding: '16px 40px',
        borderRadius: SIZES.borderRadius.md,
        background: `linear-gradient(135deg, ${P.gold} 0%, ${P.goldDark} 100%)`,
        color: P.dark2,
        fontSize: '16px',
        fontWeight: '800',
        textDecoration: 'none',
        boxShadow: `0 4px 20px rgba(${244},${200},${66},0.3)`,
      })}">Profiter de l'Offre →</a>
    </div>`,
  },
]

const CONTENT_BLOCKS = [
  {
    id: 'text-image-side',
    label: 'Texte + Image',
    category: 'Content',
    content: `<div style="${css({
      background: P.dark2,
      padding: '80px 40px',
      display: 'flex',
      alignItems: 'center',
      gap: '48px',
      flexWrap: 'wrap',
    })}">
      <div style="${css({
        flex: '1',
        minWidth: '300px',
        height: '380px',
        borderRadius: SIZES.borderRadius.lg,
        background: `linear-gradient(135deg, rgba(${123},${92},${255},0.06) 0%, rgba(${99},${102},${241},0.06) 100%)`,
        border: `1px solid rgba(${123},${92},${255},0.1)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: P.textMuted,
        fontSize: '15px',
      })}">📷 Image Placeholder</div>
      <div style="${css({ flex: '1', minWidth: '300px' })}">
        <div style="${css({
          padding: '6px 16px',
          borderRadius: '50px',
          background: `rgba(${123},${92},${255},0.1)`,
          color: P.violet,
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '1px',
          display: 'inline-block',
          marginBottom: '16px',
        })}">À PROPOS</div>
        <h2 style="${css({
          fontSize: '32px',
          fontWeight: '800',
          color: P.white,
          marginBottom: '16px',
          fontFamily: P.headingFont,
          lineHeight: '1.2',
        })}">Notre Mission Est De Vous Accompagner</h2>
        <p style="${css({
          fontSize: '16px',
          color: P.textSecondary,
          lineHeight: '1.8',
          marginBottom: '20px',
        })}">Nous croyons que chaque personne a le potentiel de créer quelque chose d'extraordinaire. Notre rôle est de vous donner les outils et le savoir-faire pour y parvenir.</p>
        <a style="${css({
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: P.violet,
          fontSize: '15px',
          fontWeight: '600',
          textDecoration: 'none',
        })}">En savoir plus →</a>
      </div>
    </div>`,
  },
  {
    id: 'content-faq',
    label: 'FAQ Accordéon',
    category: 'Content',
    content: (() => {
      const faqs = [
        { q: 'Comment fonctionne la formation ?', a: 'La formation est 100% en ligne. Vous accédez aux modules à votre rythme via notre plateforme sécurisée.' },
        { q: 'Y a-t-il une garantie ?', a: 'Oui ! Nous offrons une garantie satisfait ou remboursé de 30 jours, sans condition.' },
        { q: 'Combien de temps ai-je accès ?', a: 'Vous avez un accès à vie à toute la formation, incluant les futures mises à jour.' },
        { q: 'Puis-je payer en plusieurs fois ?', a: 'Absolument ! Nous proposons des facilités de paiement en 3 ou 6 fois sans frais.' },
      ]
      const items = faqs.map((faq) => `
        <div style="${css({
          borderBottom: `1px solid rgba(${123},${92},${255},0.08)`,
          padding: '20px 0',
        })}">
          <div style="${css({
            fontSize: '16px',
            fontWeight: '700',
            color: P.white,
            marginBottom: '8px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          })}">${faq.q} <span style="${css({ color: P.violet, fontSize: '20px' })}">+</span></div>
          <div style="${css({
            fontSize: '15px',
            color: P.textSecondary,
            lineHeight: '1.7',
            paddingLeft: '4px',
          })}">${faq.a}</div>
        </div>`).join('')
      return `<div style="${css({
        background: P.dark1,
        padding: '80px 40px',
      })}">
        <div style="${css({
          maxWidth: '680px',
          margin: '0 auto',
        })}">
          <div style="${css({ textAlign: 'center', marginBottom: '48px' })}">
            <h2 style="${css({
              fontSize: '36px',
              fontWeight: '800',
              color: P.white,
              marginBottom: '14px',
              fontFamily: P.headingFont,
            })}">Questions Fréquentes</h2>
            <p style="${css({
              fontSize: '17px',
              color: P.textSecondary,
            })}">Tout ce que vous devez savoir avant de commencer.</p>
          </div>
          ${items}
        </div>
      </div>`
    })(),
  },
  {
    id: 'content-team',
    label: 'Grille Équipe',
    category: 'Content',
    content: (() => {
      const members = [
        { name: 'Marie Laurent', role: 'Fondatrice & CEO', avatar: '👩‍💼' },
        { name: 'Thomas Bernard', role: 'Directeur Technique', avatar: '👨‍💻' },
        { name: 'Sophie Martin', role: 'Responsable Pédagogique', avatar: '👩‍🏫' },
        { name: 'Lucas Petit', role: 'Community Manager', avatar: '👨‍🎨' },
      ]
      const cards = members.map((m) => `
        <div style="${css({
          background: `rgba(${17},${27},${48},0.5)`,
          border: `1px solid rgba(${123},${92},${255},0.08)`,
          borderRadius: SIZES.borderRadius.lg,
          padding: '32px 24px',
          textAlign: 'center',
        })}">
          <div style="${css({
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, rgba(${123},${92},${255},0.12) 0%, rgba(${99},${102},${241},0.08) 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            margin: '0 auto 16px',
          })}">${m.avatar}</div>
          <h3 style="${css({
            fontSize: '17px',
            fontWeight: '700',
            color: P.white,
            marginBottom: '6px',
          })}">${m.name}</h3>
          <p style="${css({
            fontSize: '14px',
            color: P.textMuted,
          })}">${m.role}</p>
        </div>`).join('')
      return `<div style="${css({ background: P.dark2, padding: '80px 40px' })}">
        <div style="${css({ textAlign: 'center', marginBottom: '48px' })}">
          <h2 style="${css({
            fontSize: '36px',
            fontWeight: '800',
            color: P.white,
            marginBottom: '14px',
            fontFamily: P.headingFont,
          })}">Notre Équipe</h2>
          <p style="${css({
            fontSize: '17px',
            color: P.textSecondary,
          })}">Les personnes derrière votre réussite.</p>
        </div>
        <div style="${css({
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          maxWidth: '900px',
          margin: '0 auto',
        })}">${cards}</div>
      </div>`
    })(),
  },
  {
    id: 'content-stats',
    label: 'Section Chiffres',
    category: 'Content',
    content: `<div style="${css({
      background: `linear-gradient(135deg, ${P.dark1} 0%, ${P.dark3} 100%)`,
      padding: '80px 40px',
    })}">
      <div style="${css({ textAlign: 'center', marginBottom: '52px' })}">
        <h2 style="${css({
          fontSize: '36px',
          fontWeight: '800',
          color: P.white,
          marginBottom: '14px',
          fontFamily: P.headingFont,
        })}">Nos Chiffres Parlent</h2>
      </div>
      <div style="${css({
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '24px',
        maxWidth: '960px',
        margin: '0 auto',
      })}">
        ${[
          { value: '10K+', label: 'Élèves Formés' },
          { value: '95%', label: 'Taux de Satisfaction' },
          { value: '200+', label: 'Modules de Contenu' },
          { value: '50+', label: 'Experts Formateurs' },
        ].map((stat) => `
          <div style="${css({
            background: `rgba(${123},${92},${255},0.05)`,
            border: `1px solid rgba(${123},${92},${255},0.08)`,
            borderRadius: SIZES.borderRadius.lg,
            padding: '32px 20px',
            textAlign: 'center',
          })}">
            <div style="${css({
              fontSize: '40px',
              fontWeight: '800',
              color: P.violet,
              marginBottom: '8px',
              fontFamily: P.headingFont,
            })}">${stat.value}</div>
            <div style="${css({
              fontSize: '14px',
              color: P.textSecondary,
              fontWeight: '500',
            })}">${stat.label}</div>
          </div>`).join('')}
      </div>
    </div>`,
  },
]

const FOOTER_BLOCKS = [
  {
    id: 'footer-multicol',
    label: 'Footer Multi-Colonnes',
    category: 'Footer',
    content: `<div style="${css({
      background: P.dark1,
      borderTop: `1px solid rgba(${123},${92},${255},0.1)`,
      padding: '60px 40px 32px',
    })}">
      <div style="${css({
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr',
        gap: '40px',
        maxWidth: '1000px',
        margin: '0 auto 40px',
      })}">
        <div>
          <div style="${css({
            fontSize: '22px',
            fontWeight: '800',
            color: P.white,
            marginBottom: '12px',
            fontFamily: P.headingFont,
          })}">NyXia</div>
          <p style="${css({
            fontSize: '14px',
            color: P.textSecondary,
            lineHeight: '1.7',
            maxWidth: '260px',
          })}">Votre MarketPlace. Votre Empire. Votre Liberté.</p>
        </div>
        <div>
          <h4 style="${css({
            fontSize: '13px',
            fontWeight: '700',
            color: P.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '16px',
          })}">Produits</h4>
          ${['Formations', 'Services', 'Ressources', 'Blog'].map((l) => `
            <a style="${css({
              display: 'block',
              fontSize: '14px',
              color: P.textSecondary,
              textDecoration: 'none',
              marginBottom: '10px',
            })}">${l}</a>`).join('')}
        </div>
        <div>
          <h4 style="${css({
            fontSize: '13px',
            fontWeight: '700',
            color: P.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '16px',
          })}">Entreprise</h4>
          ${['À Propos', 'Contact', 'Carrières', 'Presse'].map((l) => `
            <a style="${css({
              display: 'block',
              fontSize: '14px',
              color: P.textSecondary,
              textDecoration: 'none',
              marginBottom: '10px',
            })}">${l}</a>`).join('')}
        </div>
        <div>
          <h4 style="${css({
            fontSize: '13px',
            fontWeight: '700',
            color: P.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '16px',
          })}">Suivez-nous</h4>
          <div style="${css({ display: 'flex', gap: '10px' })}">
            ${['📘', '📸', '🐦'].map((s) => `
              <a style="${css({
                width: '36px',
                height: '36px',
                borderRadius: SIZES.borderRadius.sm,
                background: `rgba(${123},${92},${255},0.08)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                textDecoration: 'none',
              })}">${s}</a>`).join('')}
          </div>
        </div>
      </div>
      <div style="${css({
        borderTop: `1px solid rgba(${123},${92},${255},0.06)`,
        paddingTop: '24px',
        textAlign: 'center',
      })}">
        <p style="${css({ fontSize: '13px', color: P.textMuted })}">© 2025 NyXia. Tous droits réservés.</p>
      </div>
    </div>`,
  },
  {
    id: 'footer-simple',
    label: 'Footer Simple',
    category: 'Footer',
    content: `<div style="${css({
      background: P.dark2,
      borderTop: `1px solid rgba(${123},${92},${255},0.08)`,
      padding: '40px',
      textAlign: 'center',
    })}">
      <div style="${css({
        fontSize: '20px',
        fontWeight: '800',
        color: P.white,
        marginBottom: '12px',
        fontFamily: P.headingFont,
      })}">NyXia</div>
      <p style="${css({
        fontSize: '14px',
        color: P.textMuted,
        marginBottom: '20px',
      })}">Votre MarketPlace. Votre Empire. Votre Liberté.</p>
      <div style="${css({
        display: 'flex',
        gap: '24px',
        justifyContent: 'center',
        marginBottom: '24px',
      })}">
        ${['Mentions Légales', 'CGV', 'Contact'].map((l) => `
          <a style="${css({
            fontSize: '13px',
            color: P.textSecondary,
            textDecoration: 'none',
          })}">${l}</a>`).join('')}
      </div>
      <p style="${css({ fontSize: '12px', color: P.textMuted })}">© 2025 NyXia. Tous droits réservés.</p>
    </div>`,
  },
]

const ECOMMERCE_BLOCKS = [
  {
    id: 'ecommerce-product-grid',
    label: 'Grille Produits',
    category: 'E-commerce',
    content: (() => {
      const products = [
        { title: 'Formation Marketing Digital', price: '97€', oldPrice: '197€', badge: '-50%' },
        { title: 'Pack Templates Premium', price: '47€', oldPrice: '127€', badge: 'Populaire' },
        { title: 'Coaching 1-to-1 (3h)', price: '297€', badge: '' },
      ]
      const cards = products.map((p) => `
        <div style="${css({
          background: `rgba(${17},${27},${48},0.6)`,
          border: `1px solid rgba(${123},${92},${255},0.08)`,
          borderRadius: SIZES.borderRadius.lg,
          overflow: 'hidden',
        })}">
          <div style="${css({
            height: '200px',
            background: `linear-gradient(135deg, rgba(${123},${92},${255},0.06) 0%, rgba(${99},${102},${241},0.04) 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: P.textMuted,
            fontSize: '14px',
            position: 'relative',
          })}">
            ${p.badge ? `<div style="${css({
              position: 'absolute',
              top: '12px',
              right: '12px',
              padding: '4px 10px',
              borderRadius: '50px',
              background: p.badge === 'Populaire' ? P.gold : P.violet,
              color: p.badge === 'Populaire' ? P.dark2 : P.white,
              fontSize: '11px',
              fontWeight: '700',
            })}">${p.badge}</div>` : ''}
            📷 Image
          </div>
          <div style="${css({ padding: '20px' })}">
            <h3 style="${css({
              fontSize: '16px',
              fontWeight: '700',
              color: P.white,
              marginBottom: '12px',
              lineHeight: '1.4',
            })}">${p.title}</h3>
            <div style="${css({ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' })}">
              <span style="${css({
                fontSize: '22px',
                fontWeight: '800',
                color: P.violet,
                fontFamily: P.headingFont,
              })}">${p.price}</span>
              ${p.oldPrice ? `<span style="${css({
                fontSize: '14px',
                color: P.textMuted,
                textDecoration: 'line-through',
              })}">${p.oldPrice}</span>` : ''}
            </div>
            <a style="${css({
              display: 'block',
              padding: '12px 20px',
              borderRadius: SIZES.borderRadius.sm,
              background: `linear-gradient(135deg, ${P.violet} 0%, ${P.deepPurple} 100%)`,
              color: P.white,
              fontSize: '14px',
              fontWeight: '700',
              textDecoration: 'none',
              textAlign: 'center',
            })}">Voir le Produit</a>
          </div>
        </div>`).join('')
      return `<div style="${css({ background: P.dark2, padding: '80px 40px' })}">
        <div style="${css({ textAlign: 'center', marginBottom: '48px' })}">
          <h2 style="${css({
            fontSize: '36px',
            fontWeight: '800',
            color: P.white,
            marginBottom: '14px',
            fontFamily: P.headingFont,
          })}">Nos Produits</h2>
          <p style="${css({
            fontSize: '17px',
            color: P.textSecondary,
          })}">Découvrez notre sélection de produits et formations.</p>
        </div>
        <div style="${css({
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          maxWidth: '960px',
          margin: '0 auto',
        })}">${cards}</div>
      </div>`
    })(),
  },
  {
    id: 'ecommerce-product-detail',
    label: 'Détail Produit',
    category: 'E-commerce',
    content: `<div style="${css({
      background: P.dark1,
      padding: '80px 40px',
      display: 'flex',
      gap: '60px',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      maxWidth: '960px',
      margin: '0 auto',
    })}">
      <div style="${css({
        flex: '1',
        minWidth: '300px',
        height: '420px',
        borderRadius: SIZES.borderRadius.lg,
        background: `linear-gradient(135deg, rgba(${123},${92},${255},0.06) 0%, rgba(${99},${102},${241},0.04) 100%)`,
        border: `1px solid rgba(${123},${92},${255},0.1)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: P.textMuted,
        fontSize: '15px',
      })}">📷 Image du Produit</div>
      <div style="${css({ flex: '1', minWidth: '300px' })}">
        <div style="${css({
          padding: '5px 14px',
          borderRadius: '50px',
          background: `rgba(${123},${92},${255},0.1)`,
          color: P.violet,
          fontSize: '12px',
          fontWeight: '700',
          display: 'inline-block',
          marginBottom: '16px',
        })}">FORMATION</div>
        <h1 style="${css({
          fontSize: '30px',
          fontWeight: '800',
          color: P.white,
          marginBottom: '12px',
          fontFamily: P.headingFont,
          lineHeight: '1.2',
        })}">Formation Marketing Digital Complète</h1>
        <div style="${css({
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        })}">
          <span style="${css({ color: P.gold, fontSize: '18px' })}">★★★★★</span>
          <span style="${css({ fontSize: '14px', color: P.textMuted })}">4.9 (237 avis)</span>
        </div>
        <p style="${css({
          fontSize: '16px',
          color: P.textSecondary,
          lineHeight: '1.8',
          marginBottom: '24px',
        })}">Maîtrisez toutes les techniques de marketing digital pour développer votre business en ligne : SEO, publicité, email marketing, réseaux sociaux et plus encore.</p>
        <div style="${css({ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' })}">
          <span style="${css({
            fontSize: '36px',
            fontWeight: '800',
            color: P.violet,
            fontFamily: P.headingFont,
          })}">97€</span>
          <span style="${css({
            fontSize: '18px',
            color: P.textMuted,
            textDecoration: 'line-through',
          })}">197€</span>
          <span style="${css({
            padding: '4px 12px',
            borderRadius: '50px',
            background: `rgba(${244},${200},${66},0.12)`,
            color: P.gold,
            fontSize: '13px',
            fontWeight: '700',
          })}">-50%</span>
        </div>
        <a style="${css({
          display: 'block',
          padding: '16px 32px',
          borderRadius: SIZES.borderRadius.md,
          background: `linear-gradient(135deg, ${P.violet} 0%, ${P.deepPurple} 100%)`,
          color: P.white,
          fontSize: '16px',
          fontWeight: '700',
          textDecoration: 'none',
          textAlign: 'center',
          boxShadow: `0 4px 20px rgba(${123},${92},${255},0.3)`,
          marginBottom: '16px',
        })}">Acheter Maintenant</a>
        <p style="${css({
          textAlign: 'center',
          fontSize: '13px',
          color: P.textMuted,
        })}">🔒 Paiement sécurisé • Garantie 30 jours</p>
      </div>
    </div>`,
  },
]

// Flatten all blocks
const ALL_BLOCKS = [
  ...HERO_BLOCKS,
  ...FEATURES_BLOCKS,
  ...PRICING_BLOCKS,
  ...TESTIMONIAL_BLOCKS,
  ...CTA_BLOCKS,
  ...CONTENT_BLOCKS,
  ...FOOTER_BLOCKS,
  ...ECOMMERCE_BLOCKS,
]

// ───────────────────────────────────────────────
// THEME CSS — NyXia Premium Dark
// ───────────────────────────────────────────────
function getThemeCSS(): string {
  return `
/* ═══════════════════════════════════════════════
   NYXIA PREMIUM THEME — GrapesJS v2
   ═══════════════════════════════════════════════ */

/* ── FONTS ── */
.gjs-one-bg, .gjs-two-bg, .gjs-three-bg, .gjs-four-bg {
  font-family: ${P.fontStack} !important;
  font-size: 14px !important;
}

/* ── TOOLBAR — hidden (we use custom) ── */
.gjs-toolbar, .gjs-tools .gjs-toolbar { display: none !important; }
.gjs-badge { display: none !important; }

/* ── LEFT PANEL ── */
.gjs-pn {
  width: 270px !important;
  min-width: 270px !important;
  max-width: 270px !important;
  height: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
  border-right: 1px solid rgba(123,92,255,0.09) !important;
  background: linear-gradient(180deg, #0b1428 0%, #091020 100%) !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}
.gjs-pn-left, .gjs-pn-panel {
  width: 270px !important;
  min-width: 270px !important;
  max-width: 270px !important;
  padding: 0 !important;
  margin: 0 !important;
  background: transparent !important;
  overflow: hidden !important;
}

/* ── PANEL NAV BUTTONS ── */
.gjs-pn-commands, .gjs-pn-buttons {
  display: flex !important;
  flex-direction: row !important;
  gap: 3px !important;
  padding: 12px 12px 10px !important;
  margin: 0 !important;
  border-bottom: 1px solid rgba(123,92,255,0.07) !important;
  background: transparent !important;
}
.gjs-pn-btn {
  flex: 1 !important;
  height: 34px !important;
  width: auto !important;
  font-size: 10px !important;
  font-weight: 700 !important;
  letter-spacing: 0.04em !important;
  text-transform: uppercase !important;
  margin: 0 !important;
  padding: 0 6px !important;
  line-height: 34px !important;
  border-radius: 9px !important;
  background: transparent !important;
  border: 1px solid transparent !important;
  color: #564e78 !important;
  transition: all 0.2s ease !important;
}
.gjs-pn-btn:hover {
  background: rgba(255,255,255,0.04) !important;
  color: #7a7498 !important;
}
.gjs-pn-btn.active, .gjs-pn-btn.gjs-pn-active {
  background: rgba(123,92,255,0.13) !important;
  border-color: rgba(123,92,255,0.24) !important;
  color: #b09eff !important;
}
.gjs-pn-btn svg { width: 14px !important; height: 14px !important; }
.gjs-pn-title {
  font-size: 10px !important;
  padding: 14px 14px 7px !important;
  margin: 0 !important;
  font-weight: 700 !important;
  color: rgba(123,92,255,0.5) !important;
  letter-spacing: 0.1em !important;
  text-transform: uppercase !important;
}

/* ── BLOCKS — 2-COL GRID ── */
.gjs-blocks-c .gjs-block-category .gjs-block-list,
.gjs-block-container,
.gjs-sm-sectors,
.gjs-block-list,
[class*="blocks__blocks"],
[class*="block-list"] {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 8px !important;
  padding: 4px 12px 12px !important;
  width: 100% !important;
  margin: 0 !important;
  box-sizing: border-box !important;
}

.gjs-block {
  width: 100% !important;
  padding: 12px 8px 10px !important;
  margin: 0 !important;
  border-radius: 11px !important;
  border: 1px solid rgba(123,92,255,0.09) !important;
  background: rgba(123,92,255,0.03) !important;
  cursor: grab !important;
  transition: all 0.2s cubic-bezier(0.4,0,0.2,1) !important;
  min-height: 80px !important;
  max-height: 96px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  box-sizing: border-box !important;
  float: none !important;
  clear: none !important;
}
.gjs-block:hover {
  background: rgba(123,92,255,0.11) !important;
  border-color: rgba(123,92,255,0.28) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 24px rgba(123,92,255,0.12) !important;
}
.gjs-block:active { transform: scale(0.97) !important; }

.gjs-block__media {
  width: 34px !important;
  height: 34px !important;
  font-size: 16px !important;
  line-height: 34px !important;
  text-align: center !important;
  background: rgba(123,92,255,0.1) !important;
  border: 1px solid rgba(123,92,255,0.18) !important;
  border-radius: 8px !important;
  color: #8b6cff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 !important;
}
.gjs-block svg,
.gjs-block__media svg,
.gjs-block__media i {
  width: 20px !important;
  height: 20px !important;
  color: #8b6cff !important;
  font-size: 20px !important;
}
.gjs-block__label {
  font-size: 11px !important;
  font-weight: 600 !important;
  text-align: center !important;
  color: #8d89ae !important;
  letter-spacing: 0.01em !important;
  line-height: 1.3 !important;
  margin: 0 !important;
}
.gjs-category-title, .gjs-category-label, .gjs-block-category__title {
  font-size: 10px !important;
  padding: 14px 14px 7px !important;
  margin: 0 !important;
  font-weight: 700 !important;
  color: rgba(123,92,255,0.5) !important;
  text-transform: uppercase !important;
  letter-spacing: 0.1em !important;
}

/* ── CANVAS — dot grid ── */
.gjs-cv-canvas,
.gjs-cv-canvas__frames,
.gjs-frame-wrapper,
.gjs-canvas,
#gjs-canvas {
  background-color: #060e1c !important;
  background-image: radial-gradient(rgba(123,92,255,0.07) 1px, transparent 1px) !important;
  background-size: 28px 28px !important;
}

/* ── LAYERS ── */
.gjs-layer {
  padding: 10px 12px !important;
  min-height: 40px !important;
  font-size: 13px !important;
  border-radius: 8px !important;
  margin: 2px 0 !important;
  transition: background 0.15s !important;
}
.gjs-layer:hover { background: rgba(123,92,255,0.07) !important; }
.gjs-layer-name { font-size: 13px !important; color: #a09cc0 !important; }

/* ── STYLE MANAGER ── */
.gjs-sm-sector-title {
  font-size: 10px !important;
  padding: 12px 14px 8px !important;
  margin: 0 !important;
  font-weight: 700 !important;
  color: rgba(123,92,255,0.5) !important;
  text-transform: uppercase !important;
  letter-spacing: 0.1em !important;
}
.gjs-sm-property { padding: 8px 12px !important; }
.gjs-field input, .gjs-field select, .gjs-field textarea {
  font-size: 13px !important;
  padding: 7px 12px !important;
  height: 36px !important;
  border-radius: 9px !important;
  background: rgba(7,16,31,0.7) !important;
  border: 1px solid rgba(123,92,255,0.13) !important;
  color: #d4d0e0 !important;
  transition: border-color 0.2s ease !important;
}
.gjs-field input:focus, .gjs-field select:focus {
  border-color: rgba(123,92,255,0.5) !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(123,92,255,0.08) !important;
}

/* ── TRAIT MANAGER ── */
.gjs-trt-trait { padding: 8px 12px !important; }
.gjs-trt-label { font-size: 12px !important; color: #8d89ae !important; }

/* ── SELECTION ── */
.gjs-selected,
.gjs-selected * {
  outline: 2px solid #7B5CFF !important;
  outline-offset: 1px !important;
  transition: outline-color 0.15s ease !important;
}

/* ── SCROLLBARS ── */
.gjs-pn-panel::-webkit-scrollbar,
.gjs-blocks::-webkit-scrollbar,
.gjs-layers::-webkit-scrollbar { width: 5px !important; }
.gjs-pn-panel::-webkit-scrollbar-thumb,
.gjs-blocks::-webkit-scrollbar-thumb,
.gjs-layers::-webkit-scrollbar-thumb {
  background: rgba(123,92,255,0.25) !important;
  border-radius: 3px !important;
  transition: background 0.2s ease !important;
}
.gjs-pn-panel::-webkit-scrollbar-thumb:hover,
.gjs-blocks::-webkit-scrollbar-thumb:hover {
  background: rgba(123,92,255,0.4) !important;
}
.gjs-pn-panel::-webkit-scrollbar-track { background: transparent !important; }

/* ── BASE COLORS ── */
.gjs-one-bg { background-color: #0b1428 !important; }
.gjs-two-color { color: #c4bde0 !important; }
.gjs-three-bg { background-color: #091020 !important; }
.gjs-four-color, .gjs-four-color-h:hover { color: #8b6cff !important; }

/* ── VIEWS PANEL ── */
.gjs-pn-views-container { display: none !important; }
.gjs-pn-views {
  width: 268px !important;
  left: 0 !important;
  top: auto !important;
  position: relative !important;
}

/* ── BRANDING — ALL HIDDEN ── */
.gjs-logo, .gjs-logo-content, .gjs-brand,
.gjs-off-prv, .gjs-no-ph, .gjs-cv-select,
.gjs-editor-top,
[title*="GrapesJS"], [aria-label*="GrapesJS"],
[data-gjs-type="wrapper"] + div { display: none !important; }

/* ── MODAL ── */
.gjs-modal {
  background: #0b1428 !important;
  border: 1px solid rgba(123,92,255,0.2) !important;
  border-radius: 16px !important;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5) !important;
}
.gjs-modal-title { color: #e8e2f8 !important; }
.gjs-modal-header { background: #091020 !important; border-bottom: 1px solid rgba(123,92,255,0.1) !important; }
.gjs-modal-content { background: #0b1428 !important; }
.gjs-footer { background: #091020 !important; border-top: 1px solid rgba(123,92,255,0.1) !important; }
.gjs-btn-primary {
  background: #7B5CFF !important;
  color: white !important;
  border-radius: 10px !important;
  border: none !important;
  transition: all 0.2s ease !important;
}
.gjs-btn-primary:hover {
  background: #6a4cee !important;
  box-shadow: 0 4px 16px rgba(123,92,255,0.3) !important;
}
.gjs-btn-grey {
  background: rgba(123,92,255,0.15) !important;
  color: #b09eff !important;
  border-radius: 10px !important;
  border: 1px solid rgba(123,92,255,0.2) !important;
  transition: all 0.2s ease !important;
}
.gjs-sm-sectors { background: transparent !important; }
.gjs-sm-sector { border-bottom: 1px solid rgba(123,92,255,0.07) !important; }
.gjs-input {
  background: rgba(7,16,31,0.7) !important;
  border: 1px solid rgba(123,92,255,0.13) !important;
  color: #d4d0e0 !important;
  border-radius: 9px !important;
  transition: border-color 0.2s ease !important;
}
.gjs-textarea {
  background: rgba(7,16,31,0.7) !important;
  border: 1px solid rgba(123,92,255,0.13) !important;
  color: #d4d0e0 !important;
  border-radius: 9px !important;
}
.gjs-select {
  background: rgba(7,16,31,0.7) !important;
  border: 1px solid rgba(123,92,255,0.13) !important;
  color: #d4d0e0 !important;
  border-radius: 9px !important;
}
.gjs-color-picker { border: 1px solid rgba(123,92,255,0.13) !important; border-radius: 9px !important; }
.gjs-one-bg { color: #c4bde0 !important; }
.gjs-field-arrow { border-color: rgba(123,92,255,0.3) !important; }
.gjs-checkbox { background: rgba(123,92,255,0.15) !important; border-color: rgba(123,92,255,0.3) !important; }
.gjs-field-range input { background: rgba(123,92,255,0.15) !important; }
.gjs-field-radio label { color: #a09cc0 !important; }
.gjs-clm-tags { background: rgba(123,92,255,0.1) !important; border-color: rgba(123,92,255,0.2) !important; }
.gjs-clm-tag { background: rgba(123,92,255,0.2) !important; color: #b09eff !important; border-radius: 6px !important; }
.gjs-clm-close { color: #8d89ae !important; }
.gjs-sm-composite { border-top: 1px solid rgba(123,92,255,0.07) !important; }
.gjs-sm-legend { color: #8d89ae !important; }
.gjs-sm-stack { color: #a09cc0 !important; }
.gjs-layer-vis { color: #8d89ae !important; }
.gjs-layer-lock { color: #8d89ae !important; }
.gjs-layer-count { background: rgba(123,92,255,0.15) !important; color: #b09eff !important; border-radius: 6px !important; }
.gjs-layer-cursor { cursor: pointer !important; }
.gjs-layer-move { cursor: grab !important; }
.gjs-layers { background: transparent !important; }
.gjs-layer-inner { color: #a09cc0 !important; }
.gjs-blocks { background: transparent !important; }
.gjs-assets { background: transparent !important; }
.gjs-asset { color: #a09cc0 !important; }
.gjs-asset-image { border: 1px solid rgba(123,92,255,0.1) !important; border-radius: 8px !important; }
.gjs-caret { border-color: rgba(123,92,255,0.3) transparent transparent transparent !important; }
.gjs-caret-down { border-color: transparent transparent rgba(123,92,255,0.3) transparent !important; }
.gjs-radio-item input[type="radio"] { background: rgba(123,92,255,0.15) !important; border-color: rgba(123,92,255,0.3) !important; }
.gjs-radio-item input[type="radio"]:checked { background: #7B5CFF !important; border-color: #7B5CFF !important; }
.gjs-field-checkbox input[type="checkbox"] { background: rgba(123,92,255,0.15) !important; border-color: rgba(123,92,255,0.3) !important; }
.gjs-field-checkbox input[type="checkbox"]:checked { background: #7B5CFF !important; border-color: #7B5CFF !important; }

/* ── DEVICE FRAME ── */
.nyxia-device-frame {
  transition: width 0.35s cubic-bezier(0.4,0,0.2,1),
              height 0.35s cubic-bezier(0.4,0,0.2,1),
              box-shadow 0.35s ease;
  margin: 0 auto;
  box-shadow: 0 0 0 1px rgba(123,92,255,0.08),
              0 8px 40px rgba(0,0,0,0.3);
}
.nyxia-device-frame.tablet {
  box-shadow: 0 0 0 1px rgba(123,92,255,0.12),
              0 12px 48px rgba(0,0,0,0.4),
              0 0 60px rgba(123,92,255,0.05);
}
.nyxia-device-frame.mobile {
  box-shadow: 0 0 0 1px rgba(123,92,255,0.15),
              0 16px 56px rgba(0,0,0,0.5),
              0 0 80px rgba(123,92,255,0.06);
}
`
}

// ───────────────────────────────────────────────
// UTILITY: debounce
// ───────────────────────────────────────────────
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: unknown[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

// ───────────────────────────────────────────────
// MAIN COMPONENT
// ───────────────────────────────────────────────
export default function GrapesJSEditorComponent({
  formationId,
  initialHtml = '',
  initialCss = '',
  initialComponents = '[]',
  initialStyles = '{}',
  onSave,
  onClose,
}: GrapesJSEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorInstance = useRef<GrapesJSEditor>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')
  const [pageTitle, setPageTitle] = useState('Page sans titre')
  const deviceFrameRef = useRef<HTMLDivElement>(null)
  const canvasWrapperRef = useRef<HTMLDivElement>(null)

  // ── Device frame resize ──
  useEffect(() => {
    const frame = deviceFrameRef.current
    if (!frame) return
    const wrapper = canvasWrapperRef.current
    if (!wrapper) return

    const parentH = wrapper.clientHeight
    const parentW = wrapper.clientWidth

    switch (deviceMode) {
      case 'desktop':
        frame.style.width = `${parentW}px`
        frame.style.height = `${parentH}px`
        break
      case 'tablet':
        frame.style.width = '768px'
        frame.style.height = `${parentH}px`
        break
      case 'mobile':
        frame.style.width = '375px'
        frame.style.height = `${parentH}px`
        break
    }
  }, [deviceMode, isLoading])

  // ── Initialize editor ──
  useEffect(() => {
    let isMounted = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let observer: MutationObserver | null = null
    let styleEl: HTMLStyleElement | null = null
    let rafId: number | null = null
    let themeInterval: ReturnType<typeof setInterval> | null = null

    async function initEditor() {
      try {
        const grapesjs = (await import('grapesjs')).default
        const grapesjsBlocksBasic = (await import('grapesjs-blocks-basic')).default
        const grapesjsPresetWebpage = (await import('grapesjs-preset-webpage')).default
        const grapesjsCustomCode = (await import('grapesjs-custom-code')).default
        const grapesjsPluginForms = (await import('grapesjs-plugin-forms')).default
        const grapesjsComponentCountdown = (await import('grapesjs-component-countdown')).default
        const grapesjsTabs = (await import('grapesjs-tabs')).default

        if (!isMounted || !editorRef.current) return

        let parsedComponents
        try { parsedComponents = JSON.parse(initialComponents) } catch { parsedComponents = undefined }

        let parsedStyles
        try { parsedStyles = JSON.parse(initialStyles) } catch { parsedStyles = undefined }

        editorRef.current.id = 'nyxia-gjs-editor'

        // ── Inject CSS ──
        styleEl = document.createElement('style')
        styleEl.id = 'nyxia-gjs-theme'
        styleEl.textContent = getThemeCSS()
        document.head.appendChild(styleEl)

        // ── Init editor ──
        const editor = grapesjs.init({
          container: editorRef.current,
          height: '100%',
          width: 'auto',
          fromElement: false,
          storageManager: false,
          stylePrefix: 'gjs-',
          forceClass: false,
          protectedCss: '',
          canvasCss: '',
          plugins: [
            grapesjsBlocksBasic,
            grapesjsPresetWebpage,
            grapesjsCustomCode,
            grapesjsPluginForms,
            grapesjsComponentCountdown,
            grapesjsTabs,
          ],
          pluginsOpts: {
            [grapesjsPresetWebpage as unknown as string]: {
              modalImportTitle: 'Importer',
              modalImportLabel: 'Collez votre HTML/CSS ici',
              modalImportContent: '',
              useCustomTheme: false,
            },
            [grapesjsCustomCode as unknown as string]: {
              modalTitle: 'Code personnalisé',
            },
          },
          canvas: {
            styles: initialCss || undefined,
          },
          components: parsedComponents || initialHtml || `
            <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#06101f;">
              <div style="text-align:center;max-width:600px;padding:40px;">
                <h1 style="font-family:${P.headingFont};font-size:42px;color:#fff;margin-bottom:16px;font-weight:800;">
                  Votre Page de Vente
                </h1>
                <p style="font-family:${P.fontStack};font-size:16px;color:rgba(255,255,255,0.6);line-height:1.7;">
                  Glissez des blocs depuis le panneau de gauche pour construire votre page.
                </p>
              </div>
            </div>
          `,
          style: parsedStyles || undefined,
        })

        editorInstance.current = editor

        // ── Register custom blocks ──
        ALL_BLOCKS.forEach((block) => {
          editor.BlockManager.add(block.id, {
            label: block.label,
            category: block.category,
            content: block.content,
            select: true,
            activate: true,
          })
        })

        // ── Force theme function ──
        const forceTheme = () => {
          if (!editorRef.current) return

          // Re-inject <style> last in head
          if (styleEl && styleEl.parentNode) styleEl.remove()
          styleEl = document.createElement('style')
          styleEl.id = 'nyxia-gjs-theme'
          styleEl.textContent = getThemeCSS()
          document.head.appendChild(styleEl)

          // Canvas iframe styles
          try {
            const canvasDoc = editor.Canvas.getDocument()
            if (canvasDoc) {
              canvasDoc.querySelectorAll('style').forEach((s: HTMLStyleElement) => {
                if (s.textContent && s.textContent.includes('#3b97e3')) {
                  s.textContent = s.textContent.replace(/#3b97e3/g, '#7B5CFF')
                }
              })
              const body = canvasDoc.body
              if (body) {
                body.style.backgroundColor = '#060e1c'
                body.style.backgroundImage = 'radial-gradient(rgba(123,92,255,0.07) 1px, transparent 1px)'
                body.style.backgroundSize = '28px 28px'
              }
            }
          } catch { /* iframe not ready */ }

          // Block container grid
          editorRef.current.querySelectorAll('.gjs-block-container, .gjs-block-list, [class*="block-list"]').forEach((el) => {
            const node = el as HTMLElement
            node.style.cssText = 'display:grid !important;grid-template-columns:1fr 1fr !important;gap:8px !important;padding:4px 12px 12px !important;width:100% !important;margin:0 !important;'
          })

          // Each block
          editorRef.current.querySelectorAll('.gjs-block').forEach((el) => {
            const node = el as HTMLElement
            node.style.cssText = 'width:100% !important;padding:12px 8px 10px !important;margin:0 !important;border-radius:11px !important;border:1px solid rgba(123,92,255,0.09) !important;background:rgba(123,92,255,0.03) !important;cursor:grab !important;min-height:80px !important;max-height:96px !important;display:flex !important;flex-direction:column !important;align-items:center !important;justify-content:center !important;gap:8px !important;box-sizing:border-box !important;float:none !important;'
          })

          // Hide branding
          editorRef.current.querySelectorAll(
            '.gjs-off-prv, .gjs-no-ph, [class*="gjs-logo"], .gjs-brand, .gjs-logo, .gjs-logo-content, .gjs-badge, .gjs-cv-select, .gjs-editor-top'
          ).forEach(el => { (el as HTMLElement).style.display = 'none' })

          // Canvas grid
          editorRef.current.querySelectorAll('.gjs-cv-canvas, .gjs-canvas').forEach((el) => {
            const node = el as HTMLElement
            node.style.cssText = 'background-color:#060e1c !important;background-image:radial-gradient(rgba(123,92,255,0.07) 1px,transparent 1px) !important;background-size:28px 28px !important;'
          })

          // Views panel
          editorRef.current.querySelectorAll('.gjs-pn-views-container').forEach(el => {
            (el as HTMLElement).style.display = 'none'
          })
        }

        // ── Post-load theme enforcement ──
        editor.on('load', () => {
          forceTheme()

          // MutationObserver
          if (editorRef.current && observer) observer.disconnect()
          observer = new MutationObserver(() => {
            if (rafId) return
            rafId = requestAnimationFrame(() => {
              forceTheme()
              rafId = null
            })
          })
          observer.observe(editorRef.current!, { childList: true, subtree: true, attributes: true })

          // Safety net — re-apply every 500ms for 10s
          let count = 0
          themeInterval = setInterval(() => {
            count++
            if (count > 20) {
              if (themeInterval) clearInterval(themeInterval)
              return
            }
            forceTheme()
          }, 500)
        })

        // React to GrapesJS events
        ;['component:add', 'block:drag:start', 'canvas:render', 'sorter:drag:end', 'canvas:drop', 'run:open', 'run:close'].forEach(evt => {
          editor.on(evt, () => requestAnimationFrame(forceTheme))
        })

        // ── LocalStorage auto-save (debounced) ──
        const autoSave = debounce(() => {
          if (!editorInstance.current) return
          try {
            const data = {
              html: editorInstance.current.getHtml(),
              css: editorInstance.current.getCss(),
              components: JSON.stringify(editorInstance.current.getComponents()),
              styles: JSON.stringify(editorInstance.current.getStyle()),
              savedAt: new Date().toISOString(),
            }
            localStorage.setItem(`nyxia-editor-${formationId}`, JSON.stringify(data))
          } catch { /* storage full or unavailable */ }
        }, 2000)

        editor.on('component:add', autoSave)
        editor.on('component:remove', autoSave)
        editor.on('component:update', autoSave)
        editor.on('style:update', autoSave)
        editor.on('change:canvasOffset', autoSave)

        if (isMounted) setIsLoading(false)
      } catch (error) {
        console.error('Editor init error:', error)
        if (isMounted) {
          setIsLoading(false)
          toast.error("Erreur lors du chargement de l'éditeur")
        }
      }
    }

    initEditor()

    return () => {
      isMounted = false
      if (rafId) cancelAnimationFrame(rafId)
      if (observer) observer.disconnect()
      if (themeInterval) clearInterval(themeInterval)
      if (styleEl) styleEl.remove()
      if (editorInstance.current) {
        try { editorInstance.current.destroy() } catch { /* ignore */ }
        editorInstance.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S / Cmd+S — Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      // Ctrl+Z — Undo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        editorInstance.current?.undo()
      }
      // Ctrl+Shift+Z — Redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault()
        editorInstance.current?.redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [formationId, onSave]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (!editorInstance.current) return
    setIsSaving(true)
    try {
      const html = editorInstance.current.getHtml()
      const css = editorInstance.current.getCss()
      const components = JSON.stringify(editorInstance.current.getComponents())
      const styles = JSON.stringify(editorInstance.current.getStyle())

      const response = await fetch(`/api/formations/${formationId}/page`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html_content: html, css_content: css, components_json: components, style_json: styles }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      if (onSave) onSave({ html_content: html, css_content: css, components_json: components, style_json: styles })
      toast.success('Page sauvegardée avec succès !')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur de sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }, [formationId, onSave])

  // ── Preview ──
  const handlePreview = useCallback(() => {
    if (!editorInstance.current) return
    const html = editorInstance.current.getHtml()
    const css = editorInstance.current.getCss()
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${pageTitle}</title><style>${css}</style><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#06101f;}</style></head><body>${html}</body></html>`)
      w.document.close()
    }
  }, [pageTitle])

  // ── Export HTML ──
  const handleExportHTML = useCallback(() => {
    if (!editorInstance.current) return
    const html = editorInstance.current.getHtml()
    const css = editorInstance.current.getCss()
    const fullHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${pageTitle}</title>
  <style>${css}</style>
  <style>* { margin: 0; padding: 0; box-sizing: border-box; } body { background: #06101f; }</style>
</head>
<body>
${html}
</body>
</html>`
    navigator.clipboard.writeText(fullHTML).then(() => {
      toast.success('HTML copié dans le presse-papiers !')
    }).catch(() => {
      toast.error('Impossible de copier le HTML')
    })
  }, [pageTitle])

  // ── Undo / Redo ──
  const handleUndo = useCallback(() => {
    editorInstance.current?.undo()
  }, [])

  const handleRedo = useCallback(() => {
    editorInstance.current?.redo()
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#06101f' }}>

      {/* ═══════ TOP TOOLBAR ═══════ */}
      <div
        className="flex items-center justify-between px-4 h-[54px] shrink-0"
        style={{
          borderBottom: '1px solid rgba(123,92,255,0.08)',
          background: 'linear-gradient(180deg, rgba(11,20,40,0.98) 0%, rgba(9,16,32,0.98) 100%)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Left — Logo + Page Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="w-[32px] h-[32px] rounded-[9px] flex items-center justify-center font-bold text-[13px] text-white shrink-0"
            style={{
              background: 'linear-gradient(135deg, #8b6cff 0%, #5a3dd6 100%)',
              boxShadow: '0 3px 14px rgba(123,92,255,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            N
          </div>
          <div className="h-5 w-px shrink-0" style={{ background: 'rgba(123,92,255,0.12)' }} />
          <input
            type="text"
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
            className="bg-transparent border-none outline-none text-[14px] font-semibold min-w-0 truncate"
            style={{ color: '#e8e2f8', maxWidth: '200px' }}
          />
          <span
            className="px-[8px] py-[2px] rounded-[5px] text-[10px] font-bold uppercase tracking-[0.04em] shrink-0"
            style={{
              background: 'rgba(123,92,255,0.1)',
              border: '1px solid rgba(123,92,255,0.2)',
              color: '#b09eff',
            }}
          >
            Pro
          </span>
        </div>

        {/* Center — Device Toggle + Undo/Redo */}
        <div className="flex items-center gap-1">
          {/* Device Toggle */}
          <div
            className="flex items-center gap-[2px] p-[3px] rounded-[10px] mr-2"
            style={{
              background: 'rgba(123,92,255,0.06)',
              border: '1px solid rgba(123,92,255,0.08)',
            }}
          >
            {[
              { mode: 'desktop' as DeviceMode, icon: Monitor, label: 'Desktop' },
              { mode: 'tablet' as DeviceMode, icon: Tablet, label: 'Tablet' },
              { mode: 'mobile' as DeviceMode, icon: Smartphone, label: 'Mobile' },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setDeviceMode(mode)}
                className="flex items-center justify-center w-[34px] h-[30px] rounded-[8px] transition-all duration-200"
                style={{
                  background: deviceMode === mode ? 'rgba(123,92,255,0.18)' : 'transparent',
                  color: deviceMode === mode ? '#b09eff' : '#564e78',
                  boxShadow: deviceMode === mode ? '0 2px 8px rgba(123,92,255,0.15)' : 'none',
                }}
                title={label}
              >
                <Icon className="w-[15px] h-[15px]" />
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="h-5 w-px mx-1" style={{ background: 'rgba(123,92,255,0.08)' }} />

          {/* Undo */}
          <button
            onClick={handleUndo}
            className="flex items-center justify-center w-[34px] h-[34px] rounded-[9px] transition-all duration-200"
            style={{ color: '#564e78' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
              ;(e.currentTarget as HTMLElement).style.color = '#7a7498'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = '#564e78'
            }}
            title="Annuler (Ctrl+Z)"
          >
            <Undo2 className="w-[15px] h-[15px]" />
          </button>

          {/* Redo */}
          <button
            onClick={handleRedo}
            className="flex items-center justify-center w-[34px] h-[34px] rounded-[9px] transition-all duration-200"
            style={{ color: '#564e78' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
              ;(e.currentTarget as HTMLElement).style.color = '#7a7498'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = '#564e78'
            }}
            title="Rétablir (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-[15px] h-[15px]" />
          </button>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleExportHTML}
            className="flex items-center gap-[6px] px-3 h-[34px] rounded-[9px] text-[12px] font-medium transition-all duration-200"
            style={{
              color: '#b4aecf',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'rgba(255,255,255,0.06)'
              el.style.color = '#e8e2f8'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'rgba(255,255,255,0.02)'
              el.style.color = '#b4aecf'
            }}
            title="Exporter le HTML"
          >
            <Code2 className="w-[14px] h-[14px]" />
            <span className="hidden sm:inline">Exporter</span>
          </button>

          <button
            onClick={handlePreview}
            className="flex items-center gap-[6px] px-3 h-[34px] rounded-[9px] text-[12px] font-medium transition-all duration-200"
            style={{
              color: '#b4aecf',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'rgba(255,255,255,0.06)'
              el.style.color = '#e8e2f8'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'rgba(255,255,255,0.02)'
              el.style.color = '#b4aecf'
            }}
            title="Aperçu"
          >
            <Eye className="w-[14px] h-[14px]" />
            <span className="hidden sm:inline">Aperçu</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-[6px] px-4 h-[34px] rounded-[9px] text-[12px] font-semibold text-white border transition-all duration-200 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, rgba(123,92,255,0.9) 0%, rgba(90,61,214,0.9) 100%)',
              border: '1px solid rgba(123,92,255,0.35)',
              boxShadow: '0 3px 14px rgba(123,92,255,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {isSaving
              ? <Loader2 className="w-[14px] h-[14px] animate-spin" />
              : <Save className="w-[14px] h-[14px]" />
            }
            Sauvegarder
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center w-[34px] h-[34px] rounded-[9px] transition-all duration-200"
              style={{ color: '#5c5880', border: '1px solid rgba(255,255,255,0.04)' }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'rgba(255,255,255,0.05)'
                el.style.color = '#a09cc0'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'transparent'
                el.style.color = '#5c5880'
              }}
            >
              <X className="w-[15px] h-[15px]" />
            </button>
          )}
        </div>
      </div>

      {/* ═══════ EDITOR AREA ═══════ */}
      <div ref={canvasWrapperRef} className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: '#06101f' }}>
            <div className="text-center">
              <div
                className="w-9 h-9 rounded-full animate-spin mx-auto mb-4"
                style={{
                  border: '2px solid rgba(123,92,255,0.2)',
                  borderTopColor: '#7B5CFF',
                }}
              />
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" style={{ color: '#7B5CFF' }} />
                <span className="text-[14px] font-semibold" style={{ color: '#8d89ae' }}>
                  Chargement de l&apos;éditeur
                </span>
              </div>
              <p className="text-[12px]" style={{ color: '#564e78' }}>
                Préparation des blocs professionnels…
              </p>
            </div>
          </div>
        )}

        {/* Device frame wrapper */}
        <div
          className="w-full h-full flex items-start justify-center"
          style={{
            paddingTop: deviceMode !== 'desktop' ? '24px' : '0',
            paddingBottom: deviceMode !== 'desktop' ? '24px' : '0',
          }}
        >
          <div
            ref={deviceFrameRef}
            className={`nyxia-device-frame ${deviceMode !== 'desktop' ? deviceMode : ''} overflow-hidden`}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: deviceMode !== 'desktop' ? '12px' : '0',
            }}
          >
            <div ref={editorRef} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
