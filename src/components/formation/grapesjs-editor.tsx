'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2, Save, Eye, X } from 'lucide-react'
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

/* ================================================================
   NYXIA PREMIUM GRAPESJS THEME
   - Panel LEFT side (GrapesJS default — DO NOT move it)
   - Blocks in 2-column grid, ENORMOUS premium cards
   - Dark luxury theme with purple accents
   ================================================================ */
const NYXIA_PREMIUM_CSS = `
/* ===== GLOBAL FONT ===== */
.gjs-one-bg,
.gjs-two-bg,
.gjs-three-bg,
.gjs-four-bg {
  font-family: 'Outfit', ui-sans-serif, system-ui, sans-serif !important;
  font-size: 15px !important;
}

/* ===== KILL FLOATING TOOLBAR ===== */
.gjs-toolbar { display: none !important; }

/* ===== PANEL — LEFT SIDE, WIDE, PREMIUM ===== */
.gjs-pn {
  width: 420px !important;
  min-width: 420px !important;
  max-width: 420px !important;
  height: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
  border-right: 1px solid rgba(123, 92, 255, 0.15) !important;
  border-left: none !important;
  background: linear-gradient(180deg, #0d1b33 0%, #0a1428 100%) !important;
  display: flex !important;
  flex-direction: column !important;
}

.gjs-pn-left,
.gjs-pn-panel {
  width: 420px !important;
  min-width: 420px !important;
  max-width: 420px !important;
  padding: 0 !important;
  background: transparent !important;
}

/* Panel header buttons (view switcher) */
.gjs-pn-commands,
.gjs-pn-buttons {
  padding: 10px 12px !important;
  gap: 8px !important;
  display: flex !important;
  flex-wrap: wrap !important;
}
.gjs-pn-btn {
  width: 46px !important;
  height: 46px !important;
  font-size: 18px !important;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 46px !important;
  border-radius: 12px !important;
  background: rgba(123, 92, 255, 0.08) !important;
  border: 1px solid rgba(123, 92, 255, 0.12) !important;
  color: #c4b5fd !important;
  transition: all 0.2s ease !important;
}
.gjs-pn-btn:hover {
  background: rgba(123, 92, 255, 0.2) !important;
  color: #fff !important;
  transform: translateY(-1px) !important;
}
.gjs-pn-btn.active,
.gjs-pn-btn.gjs-pn-active {
  background: rgba(123, 92, 255, 0.25) !important;
  border-color: #7B5CFF !important;
  color: #fff !important;
}
.gjs-pn-btn svg { width: 22px !important; height: 22px !important; }
.gjs-pn-label {
  font-size: 13px !important;
  padding: 2px 6px !important;
  color: #a78bfa !important;
}
.gjs-pn-title {
  font-size: 16px !important;
  padding: 14px 16px !important;
  margin: 0 !important;
  font-weight: 700 !important;
  color: #e2d9f3 !important;
  letter-spacing: 0.02em !important;
  text-transform: uppercase !important;
}

/* ===== BLOCKS — 2-COLUMN GRID, ENORMOUS PREMIUM CARDS ===== */
.gjs-blocks {
  padding: 8px 10px !important;
  display: flex !important;
  flex-direction: column !important;
  overflow-y: auto !important;
}
.gjs-blocks-header {
  padding: 14px 16px 10px !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  color: #a78bfa !important;
  text-transform: uppercase !important;
  letter-spacing: 0.08em !important;
}

/* Force 2-column grid for block containers */
.gjs-block-container {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 12px !important;
  padding: 6px 8px !important;
  width: 100% !important;
}
.gjs-block-box {
  width: 100% !important;
}

/* Individual block — PREMIUM LARGE CARD */
.gjs-block {
  width: 100% !important;
  padding: 20px 12px 16px !important;
  margin: 0 !important;
  border-radius: 16px !important;
  border: 1px solid rgba(123, 92, 255, 0.12) !important;
  background: linear-gradient(145deg, rgba(123, 92, 255, 0.06) 0%, rgba(15, 23, 42, 0.6) 100%) !important;
  cursor: grab !important;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  min-height: 110px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 10px !important;
  box-sizing: border-box !important;
}
.gjs-block:hover {
  background: linear-gradient(145deg, rgba(123, 92, 255, 0.18) 0%, rgba(15, 23, 42, 0.8) 100%) !important;
  border-color: rgba(123, 92, 255, 0.4) !important;
  transform: translateY(-3px) scale(1.02) !important;
  box-shadow:
    0 12px 35px rgba(123, 92, 255, 0.18),
    0 0 0 1px rgba(123, 92, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
}
.gjs-block:active {
  transform: scale(0.97) !important;
  box-shadow: 0 4px 15px rgba(123, 92, 255, 0.12) !important;
}

/* Block icons — VERY LARGE */
.gjs-block__media {
  font-size: 42px !important;
  margin-bottom: 0 !important;
  width: 100% !important;
  height: 52px !important;
  line-height: 52px !important;
  text-align: center !important;
  color: #7B5CFF !important;
}
.gjs-block__media-svg {
  width: 52px !important;
  height: 52px !important;
  color: #7B5CFF !important;
}
.gjs-block__media-inner {
  width: 100% !important;
  height: 52px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
.gjs-block svg {
  width: 52px !important;
  height: 52px !important;
  color: #7B5CFF !important;
}
.gjs-block-icon {
  width: 52px !important;
  height: 52px !important;
  font-size: 38px !important;
}

/* Block labels — clear and readable */
.gjs-block__label {
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  width: 100% !important;
  color: #d4d0e0 !important;
  letter-spacing: 0.01em !important;
  line-height: 1.3 !important;
}

/* Category titles */
.gjs-category-title,
.gjs-category-label {
  font-size: 13px !important;
  padding: 14px 16px 8px !important;
  font-weight: 700 !important;
  color: #a78bfa !important;
  text-transform: uppercase !important;
  letter-spacing: 0.06em !important;
}
.gjs-category { padding: 0 !important; }

/* ===== CANVAS ===== */
.gjs-cv-canvas {
  background-color: #080e1c !important;
  min-height: 100% !important;
}
.gjs-canvas {
  background-color: #080e1c !important;
}

/* ===== LAYERS ===== */
.gjs-layers { font-size: 14px !important; padding: 8px 10px !important; }
.gjs-layer {
  padding: 12px 14px !important;
  min-height: 44px !important;
  font-size: 14px !important;
  border-radius: 8px !important;
  margin: 2px 0 !important;
  transition: background 0.15s ease !important;
}
.gjs-layer:hover { background: rgba(123, 92, 255, 0.08) !important; }
.gjs-layer-name { font-size: 14px !important; }
.gjs-layer-cv { font-size: 14px !important; }
.gjs-layer-count { font-size: 12px !important; }
.gjs-layers-header {
  padding: 14px 16px 10px !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  color: #a78bfa !important;
  text-transform: uppercase !important;
}
.gjs-layer-item { padding: 0 6px !important; }
.gjs-layer-vis { width: 30px !important; height: 30px !important; font-size: 15px !important; }
.gjs-layer-move { width: 22px !important; height: 22px !important; }
.gjs-layer-caret { font-size: 14px !important; }

/* ===== STYLE MANAGER ===== */
.gjs-sm { font-size: 14px !important; padding: 8px 10px !important; }
.gjs-sm-label { font-size: 13px !important; }
.gjs-sm-title {
  font-size: 13px !important;
  padding: 14px 16px 10px !important;
  font-weight: 700 !important;
  color: #a78bfa !important;
  text-transform: uppercase !important;
}
.gjs-sm-section-title { font-size: 14px !important; padding: 12px 14px !important; }
.gjs-sm-sector-title { font-size: 14px !important; padding: 10px 14px !important; }
.gjs-sm-property { font-size: 14px !important; padding: 10px 14px !important; }
.gjs-sm-input { height: 42px !important; font-size: 14px !important; padding: 0 14px !important; border-radius: 10px !important; }
.gjs-sm-range { height: 42px !important; }
.gjs-sm-unit { font-size: 13px !important; padding: 4px 10px !important; }
.gjs-sm-composite { font-size: 14px !important; }
.gjs-sm-undo, .gjs-sm-redo { width: 36px !important; height: 36px !important; font-size: 15px !important; }
.gjs-sm-switch { font-size: 14px !important; }
.gjs-sm-integer { font-size: 14px !important; }
.gjs-sm-select { font-size: 14px !important; height: 42px !important; }

/* ===== TRAIT MANAGER ===== */
.gjs-trt-traits { font-size: 14px !important; padding: 8px 10px !important; }
.gjs-trt-trait { padding: 10px 14px !important; }
.gjs-trt-label { font-size: 13px !important; }
.gjs-tr { height: 42px !important; font-size: 14px !important; border-radius: 10px !important; }
.gjs-tr-select { font-size: 14px !important; height: 42px !important; }
.gjs-tr-input { font-size: 14px !important; height: 42px !important; }

/* ===== INPUTS ===== */
.gjs-field { font-size: 14px !important; }
.gjs-field input,
.gjs-field select,
.gjs-field textarea {
  font-size: 14px !important;
  padding: 8px 14px !important;
  height: 42px !important;
  border-radius: 10px !important;
  background: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(123, 92, 255, 0.15) !important;
  color: #e2d9f3 !important;
}

/* ===== DEVICE MANAGER ===== */
.gjs-devices-c { gap: 8px !important; padding: 8px 0 !important; }
.gjs-devices-c .gjs-devices-btn {
  padding: 8px 16px !important;
  font-size: 14px !important;
  margin: 0 !important;
  border-radius: 10px !important;
}

/* ===== MODALS ===== */
.gjs-modal { font-size: 15px !important; }
.gjs-modal-title { font-size: 18px !important; padding: 18px 24px !important; }
.gjs-modal-content { padding: 18px 24px !important; }

/* ===== CONTEXT MENU ===== */
.gjs-context { font-size: 14px !important; }
.gjs-context-item { padding: 12px 18px !important; font-size: 14px !important; }

/* ===== TOAST ===== */
.gjs-toast { font-size: 14px !important; padding: 14px 18px !important; }

/* ===== BADGE ===== */
.gjs-badge { font-size: 11px !important; padding: 2px 8px !important; border-radius: 6px !important; }

/* ===== COLOR PICKER ===== */
.gjs-field-color-picker { height: 42px !important; }

/* ===== HIGHLIGHT ===== */
.gjs-selected { outline-width: 2px !important; outline-color: #7B5CFF !important; }

/* ===== SCROLLBARS — PREMIUM ===== */
.gjs-pn-panel::-webkit-scrollbar,
.gjs-sm-scroll::-webkit-scrollbar,
.gjs-layers::-webkit-scrollbar,
.gjs-blocks::-webkit-scrollbar,
.gjs-cv-canvas::-webkit-scrollbar,
.gjs-am-assets::-webkit-scrollbar { width: 6px !important; }
.gjs-pn-panel::-webkit-scrollbar-thumb,
.gjs-sm-scroll::-webkit-scrollbar-thumb,
.gjs-layers::-webkit-scrollbar-thumb,
.gjs-blocks::-webkit-scrollbar-thumb,
.gjs-cv-canvas::-webkit-scrollbar-thumb {
  background: rgba(123, 92, 255, 0.3) !important;
  border-radius: 3px !important;
}
.gjs-pn-panel::-webkit-scrollbar-thumb:hover,
.gjs-sm-scroll::-webkit-scrollbar-thumb:hover,
.gjs-layers::-webkit-scrollbar-thumb:hover,
.gjs-blocks::-webkit-scrollbar-thumb:hover {
  background: rgba(123, 92, 255, 0.5) !important;
}
.gjs-pn-panel::-webkit-scrollbar-track,
.gjs-sm-scroll::-webkit-scrollbar-track,
.gjs-layers::-webkit-scrollbar-track,
.gjs-blocks::-webkit-scrollbar-track,
.gjs-cv-canvas::-webkit-scrollbar-track { background: transparent !important; }

/* ===== NYXIA THEME COLORS ===== */
.gjs-one-bg { background-color: #0d1b33 !important; }
.gjs-two-color { color: #d4d0e0 !important; }
.gjs-three-bg { background-color: #111b30 !important; }
.gjs-four-color, .gjs-four-color-h:hover { color: #7B5CFF !important; }

/* ===== REMOVE ALL GRAPESJS BRANDING ===== */
.gjs-cv-canvas__frame { pointer-events: auto !important; }
.gjs-logo,
.gjs-logo-content,
.gjs-brand,
[title*="GrapesJS"],
[title*="grapesjs"],
[aria-label*="GrapesJS"],
[aria-label*="grapesjs"],
[data-tooltip*="GrapesJS"],
[data-tooltip*="grapesjs"] { display: none !important; }
.gjs-off-prv, .gjs-no-ph { display: none !important; }
.gjs-panel__switcher { font-size: 14px !important; }

/* ===== FIX WHITE BLOCK / ARTIFACTS ===== */
.gjs-canvas-frame { position: relative !important; }
.gjs-canvas__frames { position: relative !important; }

/* ===== ASSETS MANAGER ===== */
.gjs-am { font-size: 14px !important; }
.gjs-am-assets { font-size: 14px !important; }
.gjs-am-header { font-size: 14px !important; padding: 12px 14px !important; }

/* ===== UNDO/REDO ===== */
.gjs-undo, .gjs-redo { font-size: 16px !important; }

/* ===== TOP BAR (inside GrapesJS) ===== */
.gjs-top-bar {
  background: #0d1b33 !important;
  border-bottom: 1px solid rgba(123, 92, 255, 0.15) !important;
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
            <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#06101f;">
              <div style="text-align:center;max-width:600px;padding:40px;">
                <h1 style="font-family:'Cormorant Garamond',serif;font-size:42px;color:#fff;margin-bottom:16px;font-weight:300;">
                  Votre Page de Vente
                </h1>
                <p style="font-family:'Outfit',sans-serif;font-size:16px;color:rgba(255,255,255,0.6);line-height:1.7;">
                  Glissez des blocs depuis le panneau de gauche pour construire votre page.
                </p>
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

        // Only hide branding and force block grid — DO NOT move panels
        const setupTheme = () => {
          if (!editorRef.current) return
          const gjsEditor = editorRef.current.querySelector('.gjs-editor') || editorRef.current

          // Remove GrapesJS branding
          gjsEditor.querySelectorAll('.gjs-off-prv, .gjs-no-ph, [class*="gjs-logo"], .gjs-brand, .gjs-logo, .gjs-logo-content').forEach(el => {
            (el as HTMLElement).style.display = 'none'
          })
          gjsEditor.querySelectorAll('[title*="GrapesJS"], [title*="grapesjs"], [aria-label*="GrapesJS"], [aria-label*="grapesjs"]').forEach(el => {
            (el as HTMLElement).style.display = 'none'
          })

          // Force block containers into 2-column grid
          gjsEditor.querySelectorAll('.gjs-block-container').forEach((container) => {
            const el = container as HTMLElement
            el.style.display = 'grid'
            el.style.gridTemplateColumns = '1fr 1fr'
            el.style.gap = '12px'
            el.style.padding = '6px 8px'
            el.style.width = '100%'
          })
        }

        // Run after plugins load
        setTimeout(setupTheme, 100)
        setTimeout(setupTheme, 300)
        setTimeout(setupTheme, 600)
        setTimeout(setupTheme, 1000)
        setTimeout(setupTheme, 2000)

        const onLoad = () => {
          setTimeout(setupTheme, 100)
          setTimeout(setupTheme, 500)
          setTimeout(setupTheme, 1000)
        }
        editor.on('load', onLoad)

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
      w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#06101f;}</style></head><body>${html}</body></html>`)
      w.document.close()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] bg-[#06101f] flex flex-col">
      {/* ===== TOP BAR ===== */}
      <div className="flex items-center justify-between px-6 h-[60px] border-b border-purple-500/20 bg-[#0d1b33] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7B5CFF] to-[#5a3dd6] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-zinc-100 font-semibold text-[15px] tracking-wide">Éditeur de Page</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePreview}
            className="flex items-center gap-2 px-5 h-10 rounded-xl text-[14px] text-zinc-300 hover:text-white hover:bg-white/5 border border-white/10 transition-all"
          >
            <Eye className="w-4 h-4" /> Aperçu
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 h-10 rounded-xl bg-gradient-to-r from-[#7B5CFF] to-[#6a4ce8] hover:from-[#8b6cff] hover:to-[#7a5cf8] text-white text-[14px] font-semibold shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ===== EDITOR AREA ===== */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#06101f]">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mx-auto mb-3" />
              <p className="text-zinc-400 text-sm">Chargement de l&apos;éditeur...</p>
            </div>
          </div>
        )}
        <div ref={editorRef} className="w-full h-full" />
      </div>
    </div>
  )
}
