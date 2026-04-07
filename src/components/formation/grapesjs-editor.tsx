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
   NYXIA GRAPESJS THEME — Panel RIGHT, blocks ENORMOUS, premium look
   ================================================================ */
const NYXIA_UI_CSS = `
/* ===== FORCE PANEL TO RIGHT ===== */
#gjs {
  display: flex !important;
  flex-direction: row-reverse !important;
}

/* ===== GLOBAL ===== */
.gjs-one-bg,
.gjs-two-bg,
.gjs-three-bg,
.gjs-four-bg {
  font-family: 'Outfit', ui-sans-serif, system-ui, sans-serif !important;
  font-size: 16px !important;
}

/* Kill floating toolbar */
.gjs-toolbar { display: none !important; }

/* ===== PANEL — WIDE, ON RIGHT ===== */
.gjs-pn {
  width: 340px !important;
  min-width: 340px !important;
  max-width: 340px !important;
  padding: 0 !important;
  border-left: 1px solid rgba(123, 92, 255, 0.2) !important;
  border-right: none !important;
  background: #0c1a2e !important;
}
.gjs-pn-left,
.gjs-pn-panel {
  width: 340px !important;
  min-width: 340px !important;
  max-width: 340px !important;
  padding: 0 !important;
}
.gjs-pn-btn {
  width: 40px !important;
  height: 40px !important;
  font-size: 15px !important;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 40px !important;
  border-radius: 10px !important;
}
.gjs-pn-btn svg { width: 20px !important; height: 20px !important; }
.gjs-pn-label { font-size: 14px !important; padding: 0 !important; }
.gjs-pn-title {
  font-size: 15px !important;
  padding: 12px 14px !important;
  margin: 0 !important;
  font-weight: 600 !important;
  color: #e2d9f3 !important;
}
.gjs-pn-commands, .gjs-pn-buttons { padding: 8px 10px !important; gap: 6px !important; }

/* ===== BLOCKS — EXTREMELY LARGE ===== */
.gjs-block {
  padding: 20px 14px !important;
  margin: 6px 8px !important;
  border-radius: 14px !important;
  border: 1px solid rgba(123, 92, 255, 0.15) !important;
  background: linear-gradient(135deg, rgba(123, 92, 255, 0.08) 0%, rgba(123, 92, 255, 0.03) 100%) !important;
  cursor: grab !important;
  transition: all 0.2s ease !important;
  min-height: 80px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
}
.gjs-block:hover {
  background: linear-gradient(135deg, rgba(123, 92, 255, 0.2) 0%, rgba(123, 92, 255, 0.08) 100%) !important;
  border-color: rgba(123, 92, 255, 0.4) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 25px rgba(123, 92, 255, 0.15) !important;
}
.gjs-block:active {
  transform: scale(0.97) !important;
}
.gjs-block__media {
  font-size: 44px !important;
  margin-bottom: 0 !important;
  width: 100% !important;
  height: 44px !important;
  line-height: 44px !important;
  text-align: center !important;
}
.gjs-block__label {
  font-size: 15px !important;
  font-weight: 600 !important;
  text-align: center !important;
  width: 100% !important;
  color: #d4d0e0 !important;
  letter-spacing: 0.01em !important;
}
.gjs-blocks-header {
  padding: 12px 14px !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  color: #e2d9f3 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
}
.gjs-category-title {
  font-size: 14px !important;
  padding: 12px 14px !important;
  font-weight: 600 !important;
  color: #c4b5fd !important;
}
.gjs-category { font-size: 15px !important; }
.gjs-block-container { width: 100% !important; }
.gjs-block-box { width: 100% !important; }
.gjs-block .gjs-block__media-inner { width: 100% !important; }
.gjs-block svg { width: 50px !important; height: 50px !important; }
.gjs-block__media-svg { width: 50px !important; height: 50px !important; }
.gjs-block-icon { width: 50px !important; height: 50px !important; font-size: 36px !important; }

/* ===== LAYERS ===== */
.gjs-layers { font-size: 15px !important; }
.gjs-layer { padding: 10px 12px !important; min-height: 42px !important; font-size: 15px !important; }
.gjs-layer-name { font-size: 15px !important; }
.gjs-layer-cv { font-size: 15px !important; }
.gjs-layer-count { font-size: 13px !important; }
.gjs-layers-header { padding: 12px 14px !important; font-size: 15px !important; }
.gjs-layer-item { padding: 0 6px !important; }
.gjs-layer-vis { width: 28px !important; height: 28px !important; font-size: 14px !important; }
.gjs-layer-move { width: 20px !important; height: 20px !important; }
.gjs-layer-caret { font-size: 14px !important; }

/* ===== STYLE MANAGER ===== */
.gjs-sm { font-size: 15px !important; }
.gjs-sm-label { font-size: 14px !important; }
.gjs-sm-title { font-size: 15px !important; padding: 12px 14px !important; }
.gjs-sm-section-title { font-size: 15px !important; padding: 12px 14px !important; }
.gjs-sm-sector-title { font-size: 15px !important; padding: 12px 14px !important; }
.gjs-sm-property { font-size: 15px !important; padding: 10px 14px !important; }
.gjs-sm-input { height: 40px !important; font-size: 15px !important; padding: 0 12px !important; }
.gjs-sm-range { height: 40px !important; }
.gjs-sm-unit { font-size: 14px !important; padding: 4px 8px !important; }
.gjs-sm-composite { font-size: 15px !important; }
.gjs-sm-undo, .gjs-sm-redo { width: 34px !important; height: 34px !important; font-size: 14px !important; }
.gjs-sm-switch { font-size: 15px !important; }
.gjs-sm-integer { font-size: 15px !important; }
.gjs-sm-select { font-size: 15px !important; }

/* ===== TRAIT MANAGER ===== */
.gjs-trt-traits { font-size: 15px !important; }
.gjs-trt-trait { padding: 10px 14px !important; }
.gjs-trt-label { font-size: 14px !important; }
.gjs-tr { height: 40px !important; font-size: 15px !important; }
.gjs-tr-select { font-size: 15px !important; height: 40px !important; }
.gjs-tr-input { font-size: 15px !important; height: 40px !important; }

/* ===== INPUTS ===== */
.gjs-field { font-size: 15px !important; }
.gjs-field input, .gjs-field select, .gjs-field textarea {
  font-size: 15px !important; padding: 8px 12px !important; height: 40px !important;
  border-radius: 10px !important;
}

/* ===== DEVICE MANAGER ===== */
.gjs-devices-c { gap: 6px !important; }
.gjs-devices-c .gjs-devices-btn { padding: 6px 14px !important; font-size: 15px !important; margin: 0 !important; }

/* ===== CANVAS ===== */
.gjs-cv-canvas { background-color: #0a0f1e !important; }
.gjs-canvas { background-color: #0a0f1e !important; }

/* ===== MODALS ===== */
.gjs-modal { font-size: 16px !important; }
.gjs-modal-title { font-size: 18px !important; padding: 16px 20px !important; }
.gjs-modal-content { padding: 16px 20px !important; }

/* ===== CONTEXT MENU ===== */
.gjs-context { font-size: 15px !important; }
.gjs-context-item { padding: 10px 16px !important; font-size: 15px !important; }

/* ===== TOAST ===== */
.gjs-toast { font-size: 15px !important; padding: 12px 16px !important; }

/* ===== BADGE ===== */
.gjs-badge { font-size: 11px !important; padding: 0 5px !important; }

/* ===== COLOR PICKER ===== */
.gjs-field-color-picker { height: 36px !important; }

/* ===== HIGHLIGHT ===== */
.gjs-selected { outline-width: 2px !important; }

/* ===== SCROLLBARS ===== */
.gjs-pn-panel::-webkit-scrollbar,
.gjs-sm-scroll::-webkit-scrollbar,
.gjs-layers::-webkit-scrollbar,
.gjs-blocks::-webkit-scrollbar,
.gjs-cv-canvas::-webkit-scrollbar,
.gjs-am-assets::-webkit-scrollbar { width: 8px !important; }
.gjs-pn-panel::-webkit-scrollbar-thumb,
.gjs-sm-scroll::-webkit-scrollbar-thumb,
.gjs-layers::-webkit-scrollbar-thumb,
.gjs-blocks::-webkit-scrollbar-thumb,
.gjs-cv-canvas::-webkit-scrollbar-thumb { background: #7B5CFF44 !important; border-radius: 4px !important; }
.gjs-pn-panel::-webkit-scrollbar-track,
.gjs-sm-scroll::-webkit-scrollbar-track,
.gjs-layers::-webkit-scrollbar-track,
.gjs-blocks::-webkit-scrollbar-track,
.gjs-cv-canvas::-webkit-scrollbar-track { background: transparent !important; }

/* ===== NYXIA COLORS ===== */
.gjs-one-bg { background-color: #0c1a2e !important; }
.gjs-two-color { color: #d4d0e0 !important; }
.gjs-three-bg { background-color: #111b30 !important; }
.gjs-four-color, .gjs-four-color-h:hover { color: #7B5CFF !important; }

/* ===== CATCH-ALL — FORCE LARGE FONTS ===== */
[class*="gjs-sm-"] { font-size: 15px !important; }
[class*="gjs-layer"] { font-size: 15px !important; }
[class*="gjs-block"] { font-size: 15px !important; }
[class*="gjs-pn"] { font-size: 15px !important; }
[class*="gjs-field"] { font-size: 15px !important; }

/* ===== REMOVE ALL GRAPESJS BRANDING ===== */
.gjs-cv-canvas__frame { pointer-events: auto !important; }
.gjs-logo, .gjs-logo-content, [title*="GrapesJS"], [title*="grapesjs"] { display: none !important; }
.gjs-brand { display: none !important; }
.gjs-panel__switcher { font-size: 15px !important; }
.gjs-off-prv, .gjs-no-ph { display: none !important; }
[aria-label*="GrapesJS"], [aria-label*="grapesjs"], [title*="GrapesJS"], [title*="grapesjs"],
[data-tooltip*="GrapesJS"], [data-tooltip*="grapesjs"] { display: none !important; }

/* ===== FIX WHITE BLOCK IN TOP-LEFT ===== */
.gjs-canvas-frame { position: relative !important; }
.gjs-canvas__frames { position: relative !important; }
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

        // Set the container ID for targeted CSS
        editorRef.current.id = 'gjs'

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
              modalTitle: 'Code',
            },
          },
          canvas: { styles: initialCss || undefined },
          components: parsedComponents || initialHtml || '<h1 style="color:#fff;text-align:center;padding:40px;">Commencez à construire votre page...</h1>',
          style: parsedStyles || undefined,
        })

        editorInstance.current = editor

        // Inject theme CSS directly into the editor container's head
        themeEl = document.createElement('style')
        themeEl.textContent = NYXIA_UI_CSS
        document.head.appendChild(themeEl)

        // Aggressively move panel to RIGHT after DOM is ready
        const movePanelToRight = () => {
          const container = editorRef.current
          if (!container) return

          const pn = container.querySelector('.gjs-pn') as HTMLElement
          const cv = container.querySelector('.gjs-cv') as HTMLElement

          if (pn && cv && pn.nextElementSibling !== null) {
            // Force panel after canvas using CSS
            pn.style.order = '2'
            cv.style.order = '1'
            pn.style.marginLeft = 'auto'

            // Also force the parent to use flex with row-reverse
            const parent = pn.parentElement
            if (parent) {
              parent.style.display = 'flex'
              parent.style.flexDirection = 'row'
            }
          }

          // Remove any white blocks
          container.querySelectorAll('.gjs-off-prv, .gjs-no-ph, [class*="gjs-logo"], .gjs-brand').forEach(el => {
            (el as HTMLElement).style.display = 'none'
          })

          // Remove branding text
          container.querySelectorAll('[title*="GrapesJS"], [title*="grapesjs"], [aria-label*="GrapesJS"]').forEach(el => {
            (el as HTMLElement).style.display = 'none'
          })
        }

        // Try multiple times with increasing delays
        setTimeout(movePanelToRight, 200)
        setTimeout(movePanelToRight, 500)
        setTimeout(movePanelToRight, 1000)
        setTimeout(movePanelToRight, 2000)

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
      toast.success('Page sauvegardée !')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
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
      w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><style>body{margin:0;padding:20px;background:#06101f;}</style></head><body>${html}</body></html>`)
      w.document.close()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] bg-[#06101f] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 h-14 border-b border-purple-500/25 bg-gradient-to-r from-[#0c1a2e] to-[#111b30] shrink-0">
        <span className="text-zinc-200 font-semibold text-base tracking-wide">Éditeur de Page de Vente</span>
        <div className="flex items-center gap-3">
          <button onClick={handlePreview} className="flex items-center gap-2 px-5 h-11 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-white/5 border border-purple-500/20 transition-colors">
            <Eye className="w-4 h-4" /> Aperçu
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 h-11 rounded-xl bg-gradient-to-r from-[#7B5CFF] to-[#6a4ce8] hover:from-[#6a4ce8] hover:to-[#5a3dd6] text-white text-sm font-semibold shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder
          </button>
          {onClose && (
            <button onClick={onClose} className="flex items-center justify-center w-11 h-11 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      {/* Editor canvas */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#06101f]">
            <div className="text-center">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin mx-auto mb-2" />
              <p className="text-zinc-400 text-sm">Chargement de l&apos;éditeur...</p>
            </div>
          </div>
        )}
        <div ref={editorRef} className="w-full h-full" />
      </div>
    </div>
  )
}
