'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2, Save, Eye, X, Search } from 'lucide-react'
import { toast } from 'sonner'

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

const NYXIA_PREMIUM_CSS = `
/* === RESET & BASE === */
.gjs-one-bg, .gjs-two-bg, .gjs-three-bg, .gjs-four-bg,
.gjs-editor, .gjs-frame, .gjs-pn {
  font-family: 'Outfit', ui-sans-serif, system-ui, -apple-system, sans-serif !important;
}

/* === TOOLBAR FLOTTANT — MASQUÉ === */
.gjs-toolbar { display: none !important; }
.gjs-badge { display: none !important; }

/* === TOP BAR / HEADER === */
.gjs-cv-canvas {
  top: 58px !important;
}

/* === PANEL GAUCHE — 280px PREMIUM === */
.gjs-pn {
  width: 280px !important;
  min-width: 280px !important;
  max-width: 280px !important;
  height: calc(100% - 58px) !important;
  padding: 0 !important;
  margin-top: 58px !important;
  border-right: 1px solid rgba(108,92,231,0.12) !important;
  background: #121826 !important;
  display: flex !important;
  flex-direction: column !important;
  z-index: 10 !important;
}
.gjs-pn-left, .gjs-pn-panel {
  width: 280px !important;
  min-width: 280px !important;
  max-width: 280px !important;
  padding: 0 !important;
  background: transparent !important;
  overflow-y: auto !important;
}

/* === BOUTONS DE NAVIGATION === */
.gjs-pn-commands, .gjs-pn-buttons {
  display: flex !important;
  flex-direction: row !important;
  gap: 3px !important;
  padding: 10px 12px 8px !important;
  border-bottom: 1px solid rgba(108,92,231,0.08) !important;
}
.gjs-pn-btn {
  flex: 1 !important;
  height: 32px !important;
  width: auto !important;
  font-size: 9px !important;
  font-weight: 700 !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase !important;
  margin: 0 !important;
  padding: 0 6px !important;
  line-height: 32px !important;
  border-radius: 8px !important;
  background: transparent !important;
  border: 1px solid transparent !important;
  color: #4a4668 !important;
  transition: all 0.2s ease !important;
}
.gjs-pn-btn:hover {
  background: rgba(108,92,231,0.08) !important;
  color: #6c5ce7 !important;
}
.gjs-pn-btn.active, .gjs-pn-btn.gjs-pn-active {
  background: rgba(108,92,231,0.15) !important;
  border-color: rgba(108,92,231,0.3) !important;
  color: #a29bfe !important;
}
.gjs-pn-btn svg { width: 13px !important; height: 13px !important; }

/* === CATEGORY TITLES === */
.gjs-pn-title {
  font-size: 9px !important;
  padding: 16px 16px 8px !important;
  font-weight: 800 !important;
  color: rgba(108,92,231,0.55) !important;
  letter-spacing: 0.14em !important;
  text-transform: uppercase !important;
}
.gjs-category-title, .gjs-category-label {
  font-size: 9px !important;
  padding: 16px 16px 8px !important;
  font-weight: 800 !important;
  color: rgba(108,92,231,0.55) !important;
  letter-spacing: 0.14em !important;
  text-transform: uppercase !important;
}

/* === BLOCS — GRILLE 2 COL PREMIUM === */
.gjs-block-container {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 10px !important;
  padding: 6px 14px 14px !important;
  width: 100% !important;
  overflow-x: hidden !important;
}
.gjs-block {
  width: 100% !important;
  padding: 20px 10px 16px !important;
  margin: 0 !important;
  border-radius: 14px !important;
  border: 1px solid rgba(108,92,231,0.12) !important;
  background: #1e2139 !important;
  cursor: grab !important;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1) !important;
  min-height: 110px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 10px !important;
  box-sizing: border-box !important;
}
.gjs-block:hover {
  background: #2a2d4a !important;
  border-color: rgba(108,92,231,0.35) !important;
  transform: translateY(-3px) !important;
  box-shadow: 0 12px 32px rgba(108,92,231,0.18) !important;
}
.gjs-block:active {
  transform: scale(0.96) !important;
}

/* === ICÔNE BLOC — BADGE VIOLET === */
.gjs-block__media {
  width: 42px !important;
  height: 42px !important;
  font-size: 20px !important;
  line-height: 42px !important;
  text-align: center !important;
  background: linear-gradient(135deg, rgba(108,92,231,0.25) 0%, rgba(75,63,138,0.2) 100%) !important;
  border: 1px solid rgba(108,92,231,0.2) !important;
  border-radius: 12px !important;
  color: #a29bfe !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
.gjs-block svg {
  width: 20px !important;
  height: 20px !important;
  color: #a29bfe !important;
}
.gjs-block__label {
  font-size: 11px !important;
  font-weight: 600 !important;
  text-align: center !important;
  color: #c4c0d8 !important;
  letter-spacing: 0.02em !important;
  line-height: 1.3 !important;
}

/* === CANVAS — FOND DARK + GRILLE POINTS === */
.gjs-cv-canvas {
  background-color: #0f1424 !important;
  background-image: radial-gradient(rgba(108,92,231,0.06) 1px, transparent 1px) !important;
  background-size: 24px 24px !important;
}

/* === LAYERS === */
.gjs-layer {
  padding: 10px 14px !important;
  min-height: 38px !important;
  font-size: 12px !important;
  border-radius: 8px !important;
  margin: 2px 0 !important;
  transition: background 0.15s !important;
}
.gjs-layer:hover { background: rgba(108,92,231,0.08) !important; }
.gjs-layer-name { font-size: 12px !important; color: #9b95b8 !important; }

/* === STYLE MANAGER === */
.gjs-sm-sector-title {
  font-size: 9px !important;
  padding: 14px 14px 8px !important;
  font-weight: 800 !important;
  color: rgba(108,92,231,0.55) !important;
  text-transform: uppercase !important;
  letter-spacing: 0.12em !important;
}
.gjs-sm-property { padding: 7px 14px !important; }
.gjs-field input, .gjs-field select, .gjs-field textarea {
  font-size: 12px !important;
  padding: 7px 12px !important;
  height: 34px !important;
  border-radius: 8px !important;
  background: #1a1d35 !important;
  border: 1px solid rgba(108,92,231,0.15) !important;
  color: #d4d0e0 !important;
  transition: border-color 0.15s !important;
}
.gjs-field input:focus, .gjs-field select:focus {
  border-color: rgba(108,92,231,0.5) !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(108,92,231,0.1) !important;
}

/* === TRAIT MANAGER === */
.gjs-trt-trait { padding: 7px 14px !important; }
.gjs-trt-label { font-size: 11px !important; color: #8d89ae !important; }

/* === SÉLECTION === */
.gjs-selected {
  outline: 2px solid #6c5ce7 !important;
  outline-offset: 1px !important;
}

/* === SCROLLBARS === */
.gjs-pn-panel::-webkit-scrollbar,
.gjs-blocks::-webkit-scrollbar,
.gjs-layers::-webkit-scrollbar { width: 4px !important; }
.gjs-pn-panel::-webkit-scrollbar-thumb,
.gjs-blocks::-webkit-scrollbar-thumb,
.gjs-layers::-webkit-scrollbar-thumb {
  background: rgba(108,92,231,0.3) !important;
  border-radius: 2px !important;
}
.gjs-pn-panel::-webkit-scrollbar-track { background: transparent !important; }

/* === COULEURS NYXIA PREMIUM === */
.gjs-one-bg { background-color: #121826 !important; }
.gjs-two-color { color: #c4bde0 !important; }
.gjs-three-bg { background-color: #0f1424 !important; }
.gjs-four-color, .gjs-four-color-h:hover { color: #6c5ce7 !important; }

/* === BRANDING MASQUÉ === */
.gjs-logo, .gjs-logo-content, .gjs-brand,
.gjs-off-prv, .gjs-no-ph,
[title*="GrapesJS"], [aria-label*="GrapesJS"] { display: none !important; }

/* === GJS INTERNAL HEADER HIDDEN === */
.gjs-editor-top {
  display: none !important;
}
`

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

  useEffect(() => {
    let isMounted = true
    let themeEl: HTMLStyleElement | null = null

    async function initEditor() {
      try {
        const grapesjs = (await import('grapesjs')).default
        const grapesjsBlocksBasic = (await import('grapesjs-blocks-basic')).default
        const grapesjsPresetWebpage = (await import('grapesjs-preset-webpage')).default
        const grapesjsCustomCode = (await import('grapesjs-custom-code')).default
        const grapesjsPluginForms = (await import('grapesjs-plugin-forms')).default

        if (!isMounted || !editorRef.current) return

        let parsedComponents
        try { parsedComponents = JSON.parse(initialComponents) } catch { parsedComponents = undefined }

        let parsedStyles
        try { parsedStyles = JSON.parse(initialStyles) } catch { parsedStyles = undefined }

        editorRef.current.id = 'nyxia-gjs-editor'

        const editor = grapesjs.init({
          container: editorRef.current,
          height: '100%',
          width: 'auto',
          fromElement: false,
          storageManager: false,
          plugins: [
            grapesjsBlocksBasic,
            grapesjsPresetWebpage,
            grapesjsCustomCode,
            grapesjsPluginForms,
          ],
          pluginsOpts: {
            [grapesjsPresetWebpage as unknown as string]: {
              modalImportTitle: 'Importer',
              modalImportLabel: 'Collez votre HTML/CSS ici',
              modalImportContent: '',
            },
            [grapesjsCustomCode as unknown as string]: {
              modalTitle: 'Code personnalisé',
            },
          },
          canvas: { styles: initialCss || undefined },
          components: parsedComponents || initialHtml || `
            <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f1424;">
              <div style="text-align:center;max-width:700px;padding:60px 40px;">
                <div style="display:inline-block;padding:6px 16px;border-radius:20px;background:rgba(108,92,231,0.2);border:1px solid rgba(108,92,231,0.3);margin-bottom:24px;">
                  <span style="font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;color:#a29bfe;letter-spacing:0.05em;text-transform:uppercase;">Formation Premium</span>
                </div>
                <h1 style="font-family:'Cormorant Garamond',serif;font-size:48px;color:#fff;margin-bottom:20px;font-weight:300;line-height:1.2;">
                  Maîtrisez l'Art du Digital en 30 Jours
                </h1>
                <p style="font-family:'Outfit',sans-serif;font-size:17px;color:rgba(255,255,255,0.5);line-height:1.7;max-width:560px;margin:0 auto 32px;">
                  Rejoignez 4 200+ entrepreneurs qui ont transformé leur activité avec notre méthode exclusive et éprouvée.
                </p>
                <div style="display:inline-flex;align-items:center;gap:10px;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#6c5ce7,#4b3f8a);color:#fff;font-family:'Outfit',sans-serif;font-size:15px;font-weight:600;cursor:pointer;">
                  Accéder à la Formation
                  <span style="font-size:18px;">→</span>
                </div>
                <div style="display:flex;justify-content:center;gap:48px;margin-top:48px;">
                  <div style="text-align:center;">
                    <div style="font-family:'Outfit',sans-serif;font-size:22px;font-weight:700;color:#fff;">4.2K</div>
                    <div style="font-family:'Outfit',sans-serif;font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">Étudiants</div>
                  </div>
                  <div style="text-align:center;">
                    <div style="font-family:'Outfit',sans-serif;font-size:22px;font-weight:700;color:#fff;">97%</div>
                    <div style="font-family:'Outfit',sans-serif;font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">Satisfaction</div>
                  </div>
                  <div style="text-align:center;">
                    <div style="font-family:'Outfit',sans-serif;font-size:22px;font-weight:700;color:#fff;">30j</div>
                    <div style="font-family:'Outfit',sans-serif;font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">Accès à vie</div>
                  </div>
                </div>
              </div>
            </div>
          `,
          style: parsedStyles || undefined,
        })

        editorInstance.current = editor

        // Inject premium theme CSS
        themeEl = document.createElement('style')
        themeEl.textContent = NYXIA_PREMIUM_CSS
        document.head.appendChild(themeEl)

        const setupTheme = () => {
          if (!editorRef.current) return
          const gjsEditor = editorRef.current.querySelector('.gjs-editor') || editorRef.current

          // Masquer le branding
          gjsEditor.querySelectorAll(
            '.gjs-off-prv, .gjs-no-ph, [class*="gjs-logo"], .gjs-brand, .gjs-logo, .gjs-logo-content, .gjs-badge, .gjs-editor-top'
          ).forEach(el => { (el as HTMLElement).style.display = 'none' })

          gjsEditor.querySelectorAll(
            '[title*="GrapesJS"], [title*="grapesjs"], [aria-label*="GrapesJS"], [aria-label*="grapesjs"]'
          ).forEach(el => { (el as HTMLElement).style.display = 'none' })

          // Forcer la grille 2 colonnes premium
          gjsEditor.querySelectorAll('.gjs-block-container').forEach((container) => {
            const el = container as HTMLElement
            el.style.display = 'grid'
            el.style.gridTemplateColumns = '1fr 1fr'
            el.style.gap = '10px'
            el.style.padding = '6px 14px 14px'
            el.style.width = '100%'
          })

          // Style premium sur les blocs
          gjsEditor.querySelectorAll('.gjs-block').forEach((block) => {
            const el = block as HTMLElement
            el.style.background = '#1e2139'
            el.style.minHeight = '110px'
            el.style.borderRadius = '14px'
            el.style.border = '1px solid rgba(108,92,231,0.12)'
            el.style.padding = '20px 10px 16px'
          })
        }

        ;[100, 300, 600, 1000, 2000, 3000].forEach(delay => setTimeout(setupTheme, delay))

        editor.on('load', () => {
          ;[100, 500, 1000, 2000].forEach(delay => setTimeout(setupTheme, delay))
        })

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
      if (themeEl) themeEl.remove()
      if (editorInstance.current) {
        try { editorInstance.current.destroy() } catch { /* ignore */ }
        editorInstance.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const handlePreview = useCallback(() => {
    if (!editorInstance.current) return
    const html = editorInstance.current.getHtml()
    const css = editorInstance.current.getCss()
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#0f1424;}</style></head><body>${html}</body></html>`)
      w.document.close()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] bg-[#121826] flex flex-col">

      {/* ===== TOP BAR PREMIUM ===== */}
      <div
        className="flex items-center justify-between px-5 h-[58px] shrink-0 relative z-50"
        style={{
          background: 'linear-gradient(180deg, #161b30 0%, #121826 100%)',
          borderBottom: '1px solid rgba(108,92,231,0.12)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >

        {/* Gauche — Logo + Titre + Badge */}
        <div className="flex items-center gap-3">
          <div
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center font-bold text-[15px] text-white"
            style={{
              background: 'linear-gradient(135deg, #6c5ce7 0%, #4b3f8a 100%)',
              boxShadow: '0 4px 16px rgba(108,92,231,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            N
          </div>
          <span className="text-white font-semibold text-[14px] tracking-wide">
            Éditeur de Page
          </span>
          <span
            className="px-[10px] py-[3px] rounded-full text-[9px] font-extrabold uppercase tracking-[0.1em] text-white"
            style={{
              background: 'linear-gradient(135deg, rgba(108,92,231,0.35) 0%, rgba(75,63,138,0.3) 100%)',
              border: '1px solid rgba(108,92,231,0.3)',
            }}
          >
            NyXia Pro
          </span>
        </div>

        {/* Centre — Barre de recherche */}
        <div
          className="hidden md:flex items-center gap-2 px-4 h-[34px] rounded-[10px] w-[280px]"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(108,92,231,0.1)',
          }}
        >
          <Search className="w-[14px] h-[14px] text-[#4a4668]" />
          <span className="text-[12px] text-[#4a4668]">Rechercher...</span>
        </div>

        {/* Droite — Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreview}
            className="flex items-center gap-[6px] px-4 h-[34px] rounded-[9px] text-[12px] font-medium text-[#9b95b8] transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(108,92,231,0.1)',
            }}
          >
            <Eye className="w-[13px] h-[13px]" />
            Aperçu
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-[6px] px-5 h-[34px] rounded-[9px] text-[12px] font-semibold text-white transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #6c5ce7 0%, #4b3f8a 100%)',
              border: '1px solid rgba(108,92,231,0.4)',
              boxShadow: '0 4px 16px rgba(108,92,231,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {isSaving
              ? <Loader2 className="w-[13px] h-[13px] animate-spin" />
              : <Save className="w-[13px] h-[13px]" />
            }
            Sauvegarder
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center w-[34px] h-[34px] rounded-[9px] text-[#4a4668] transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(108,92,231,0.06)',
              }}
            >
              <X className="w-[14px] h-[14px]" />
            </button>
          )}
        </div>
      </div>

      {/* ===== RÈGLE GRILLE ===== */}
      <div
        className="flex items-center px-5 h-[24px] shrink-0 overflow-hidden"
        style={{
          background: '#0f1424',
          borderBottom: '1px solid rgba(108,92,231,0.06)',
        }}
      >
        <div className="flex items-center w-full text-[9px] text-[#2e2b4a] font-mono">
          {Array.from({ length: 30 }, (_, i) => (
            <span key={i} className="shrink-0" style={{ width: '80px' }}>
              {i * 80}
            </span>
          ))}
        </div>
      </div>

      {/* ===== ZONE ÉDITEUR ===== */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#121826]">
            <div className="text-center">
              <div
                className="w-10 h-10 rounded-full border-2 border-t-purple-500 animate-spin mx-auto mb-4"
                style={{ borderColor: 'rgba(108,92,231,0.2)', borderTopColor: '#6c5ce7' }}
              />
              <p className="text-[#4a4668] text-[13px] font-medium tracking-wide">
                Chargement de l&apos;éditeur…
              </p>
            </div>
          </div>
        )}
        <div ref={editorRef} className="w-full h-full" />
      </div>
    </div>
  )
}
