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

/* Compact UI theme — injected AFTER GrapesJS loads to win specificity war */
const NYXIA_UI_CSS = `
/* ========== NYXIA COMPACT EDITOR THEME ========== */

/* Global: shrink everything */
.gjs-editor,
.gjs-one-bg,
.gjs-two-bg,
.gjs-three-bg,
.gjs-four-bg {
  font-family: 'Outfit', ui-sans-serif, system-ui, sans-serif !important;
  font-size: 11px !important;
}

/* Kill floating toolbar */
.gjs-toolbar { display: none !important; }

/* ---- LEFT PANEL: force narrow ---- */
.gjs-pn,
.gjs-pn-left,
.gjs-pn-panel {
  width: 180px !important;
  min-width: 180px !important;
  max-width: 180px !important;
  padding: 0 !important;
}
.gjs-pn-btn {
  width: 20px !important;
  height: 20px !important;
  font-size: 9px !important;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 20px !important;
}
.gjs-pn-btn svg { width: 10px !important; height: 10px !important; }
.gjs-pn-label { font-size: 8px !important; padding: 0 !important; }
.gjs-pn-title { font-size: 9px !important; padding: 3px 5px !important; margin: 0 !important; }
.gjs-pn-commands, .gjs-pn-buttons { padding: 2px 3px !important; }

/* ---- BLOCKS: much smaller ---- */
.gjs-block { padding: 3px !important; margin: 1px !important; }
.gjs-block__media { font-size: 14px !important; margin-bottom: 0 !important; }
.gjs-block__label { font-size: 8px !important; }
.gjs-blocks-header { padding: 2px 4px !important; font-size: 9px !important; }
.gjs-category-title { font-size: 9px !important; padding: 2px 4px !important; }
.gjs-category { font-size: 9px !important; }
.gjs-block-container { width: 100% !important; }
.gjs-block-box { width: 100% !important; }
.gjs-block .gjs-block__media-inner { width: 100% !important; }
.gjs-block svg { width: 24px !important; height: 24px !important; }
.gjs-block__media-svg { width: 24px !important; height: 24px !important; }
.gjs-block-icon { width: 24px !important; height: 24px !important; font-size: 14px !important; }

/* ---- LAYERS: compact ---- */
.gjs-layers { font-size: 9px !important; }
.gjs-layer { padding: 1px 3px !important; min-height: 18px !important; font-size: 9px !important; }
.gjs-layer-name { font-size: 9px !important; }
.gjs-layer-cv { font-size: 9px !important; }
.gjs-layer-count { font-size: 7px !important; }
.gjs-layers-header { padding: 2px 4px !important; font-size: 9px !important; }
.gjs-layer-item { padding: 0 2px !important; }
.gjs-layer-vis { width: 12px !important; height: 12px !important; font-size: 7px !important; }
.gjs-layer-move { width: 10px !important; height: 10px !important; }
.gjs-layer-caret { font-size: 7px !important; }

/* ---- STYLE MANAGER: compact ---- */
.gjs-sm { font-size: 10px !important; }
.gjs-sm-label { font-size: 8px !important; }
.gjs-sm-title { font-size: 9px !important; padding: 2px 4px !important; }
.gjs-sm-section-title { font-size: 9px !important; padding: 2px 4px !important; }
.gjs-sm-sector-title { font-size: 9px !important; padding: 3px 4px !important; }
.gjs-sm-property { font-size: 9px !important; padding: 2px 4px !important; }
.gjs-sm-input { height: 18px !important; font-size: 9px !important; padding: 0 2px !important; }
.gjs-sm-range { height: 18px !important; }
.gjs-sm-unit { font-size: 8px !important; padding: 1px 2px !important; }
.gjs-sm-composite { font-size: 9px !important; }
.gjs-sm-undo, .gjs-sm-redo { width: 16px !important; height: 16px !important; font-size: 8px !important; }
.gjs-sm-switch { font-size: 9px !important; }
.gjs-sm-integer { font-size: 9px !important; }
.gjs-sm-select { font-size: 9px !important; }

/* ---- TRAIT MANAGER ---- */
.gjs-trt-traits { font-size: 9px !important; }
.gjs-trt-trait { padding: 2px 4px !important; }
.gjs-trt-label { font-size: 8px !important; }
.gjs-tr { height: 18px !important; font-size: 9px !important; }
.gjs-tr-select { font-size: 9px !important; height: 18px !important; }
.gjs-tr-input { font-size: 9px !important; height: 18px !important; }

/* ---- INPUTS ---- */
.gjs-field { font-size: 9px !important; }
.gjs-field input, .gjs-field select, .gjs-field textarea {
  font-size: 9px !important; padding: 1px 3px !important; height: 18px !important;
}

/* ---- DEVICE MANAGER ---- */
.gjs-devices-c { gap: 1px !important; }
.gjs-devices-c .gjs-devices-btn { padding: 1px 4px !important; font-size: 9px !important; margin: 0 !important; }

/* ---- CANVAS ---- */
.gjs-cv-canvas { background-color: #0a0f1e !important; }
.gjs-canvas { background-color: #0a0f1e !important; }

/* ---- MODALS ---- */
.gjs-modal { font-size: 10px !important; }
.gjs-modal-title { font-size: 11px !important; padding: 5px 8px !important; }
.gjs-modal-content { padding: 5px 8px !important; }

/* ---- CONTEXT MENU ---- */
.gjs-context { font-size: 9px !important; }
.gjs-context-item { padding: 2px 6px !important; font-size: 9px !important; }

/* ---- TOAST ---- */
.gjs-toast { font-size: 9px !important; padding: 3px 6px !important; }

/* ---- BADGE ---- */
.gjs-badge { font-size: 7px !important; padding: 0 2px !important; }

/* ---- COLOR PICKER ---- */
.gjs-field-color-picker { height: 18px !important; }

/* ---- HIGHLIGHT ---- */
.gjs-selected { outline-width: 1px !important; }

/* ---- SCROLLBARS: ultra thin ---- */
.gjs-pn-panel::-webkit-scrollbar,
.gjs-sm-scroll::-webkit-scrollbar,
.gjs-layers::-webkit-scrollbar,
.gjs-blocks::-webkit-scrollbar,
.gjs-cv-canvas::-webkit-scrollbar,
.gjs-am-assets::-webkit-scrollbar { width: 3px !important; }
.gjs-pn-panel::-webkit-scrollbar-thumb,
.gjs-sm-scroll::-webkit-scrollbar-thumb,
.gjs-layers::-webkit-scrollbar-thumb,
.gjs-blocks::-webkit-scrollbar-thumb,
.gjs-cv-canvas::-webkit-scrollbar-thumb { background: #7B5CFF33 !important; border-radius: 2px !important; }
.gjs-pn-panel::-webkit-scrollbar-track,
.gjs-sm-scroll::-webkit-scrollbar-track,
.gjs-layers::-webkit-scrollbar-track,
.gjs-blocks::-webkit-scrollbar-track,
.gjs-cv-canvas::-webkit-scrollbar-track { background: transparent !important; }

/* ---- NYXIA COLORS ---- */
.gjs-one-bg { background-color: #0c1a2e !important; }
.gjs-two-color { color: #94a3b8 !important; }
.gjs-three-bg { background-color: #111b30 !important; }
.gjs-four-color, .gjs-four-color-h:hover { color: #7B5CFF !important; }

/* ---- CATCH-ALL for any gjs- class ---- */
[class*="gjs-sm-"] { font-size: 9px !important; }
[class*="gjs-layer"] { font-size: 9px !important; }
[class*="gjs-block"] { font-size: 9px !important; }
[class*="gjs-pn"] { font-size: 9px !important; }
[class*="gjs-field"] { font-size: 9px !important; }

/* ---- REMOVE ALL GRAPESJS BRANDING ---- */
.gjs-cv-canvas__frame { pointer-events: auto !important; }
.gjs-logo, .gjs-logo-content, [title*="GrapesJS"], [title*="grapesjs"] { display: none !important; }
.gjs-brand { display: none !important; }
.gjs-panel__switcher { font-size: 9px !important; }
.gjs-off-prv, .gjs-no-ph { display: none !important; }
/* Hide "GrapesJS" in any title/aria-label attributes */
[aria-label*="GrapesJS"], [aria-label*="grapesjs"], [title*="GrapesJS"], [title*="grapesjs"],
[data-tooltip*="GrapesJS"], [data-tooltip*="grapesjs"] { display: none !important; }
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

        // Inject theme AFTER editor loads so we win the CSS specificity war
        themeEl = document.createElement('style')
        themeEl.textContent = NYXIA_UI_CSS
        document.head.appendChild(themeEl)

        // Remove GrapesJS branding after DOM is ready
        setTimeout(() => {
          document.querySelectorAll('[title*="GrapesJS"], [title*="grapesjs"], [aria-label*="GrapesJS"], .gjs-logo, .gjs-brand, [class*="gjs-logo"]').forEach(el => {
            (el as HTMLElement).style.display = 'none'
          })
        }, 500)

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
      <div className="flex items-center justify-between px-4 h-8 border-b border-purple-500/20 bg-[#0c1a2e] shrink-0">
        <span className="text-zinc-400 font-medium text-[10px] tracking-widest uppercase">Éditeur de Page</span>
        <div className="flex items-center gap-1">
          <button onClick={handlePreview} className="flex items-center gap-1 px-2 h-6 rounded text-[10px] text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
            <Eye className="w-3 h-3" /> Aperçu
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-1 px-2.5 h-6 rounded bg-[#7B5CFF] hover:bg-[#6a4ce8] text-white text-[10px] font-medium transition-colors disabled:opacity-50">
            {isSaving ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Save className="w-2.5 h-2.5" />}
            Sauver
          </button>
          {onClose && (
            <button onClick={onClose} className="flex items-center justify-center w-6 h-6 rounded text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#06101f]">
            <div className="text-center">
              <Loader2 className="w-5 h-5 text-purple-500 animate-spin mx-auto mb-1.5" />
              <p className="text-zinc-500 text-[10px]">Chargement de l&apos;éditeur...</p>
            </div>
          </div>
        )}
        <div ref={editorRef} className="w-full h-full" />
      </div>
    </div>
  )
}
