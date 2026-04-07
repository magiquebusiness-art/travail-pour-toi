'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
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

/* NyXia compact theme for GrapesJS — comfortable and clean */
const NYXIA_THEME = `
  /* === Global sizing & fonts === */
  .gjs-one-bg,
  .gjs-two-bg,
  .gjs-three-bg,
  .gjs-four-bg { font-family: 'Outfit', ui-sans-serif, system-ui, sans-serif !important; }

  /* === Toolbar (top) — compact === */
  .gjs-toolbar { display: none !important; }

  /* === Panels (layers, styles, blocks) — narrow & compact === */
  .gjs-pn-panel {
    padding: 0 !important;
    width: 220px !important;
    min-width: 220px !important;
  }
  .gjs-pn-commands,
  .gjs-pn-buttons { padding: 4px 6px !important; }
  .gjs-pn-btn {
    width: 24px !important;
    height: 24px !important;
    font-size: 11px !important;
    margin: 1px !important;
    line-height: 24px !important;
  }
  .gjs-pn-btn svg { width: 12px !important; height: 12px !important; }
  .gjs-pn-label { font-size: 10px !important; padding: 0 2px !important; }
  .gjs-pn-title {
    font-size: 11px !important;
    padding: 6px 8px !important;
    letter-spacing: 0.3px !important;
  }
  .gjs-sm-label { font-size: 10px !important; }
  .gjs-sm-title { font-size: 11px !important; padding: 4px 6px !important; }
  .gjs-sm-section-title { font-size: 10px !important; padding: 4px 6px !important; }

  /* === Device Manager buttons === */
  .gjs-devices-c { gap: 2px !important; }
  .gjs-devices-c .gjs-devices-btn {
    padding: 3px 6px !important;
    font-size: 11px !important;
  }

  /* === Layer Manager — compact tree === */
  .gjs-layers { font-size: 11px !important; }
  .gjs-layer { padding: 2px 6px !important; min-height: 22px !important; }
  .gjs-layer-name { font-size: 11px !important; }
  .gjs-layer-cv { font-size: 11px !important; }
  .gjs-layer-count { font-size: 9px !important; }
  .gjs-layers-header { padding: 4px 6px !important; font-size: 11px !important; }
  .gjs-layer-item { padding: 1px 4px !important; }
  .gjs-layer-item.gjs-selected { padding: 1px 4px !important; }
  .gjs-layer-vis { width: 16px !important; height: 16px !important; font-size: 10px !important; }
  .gjs-layer-move { width: 14px !important; height: 14px !important; }

  /* === Style Manager — compact === */
  .gjs-sm-undo,
  .gjs-sm-redo { width: 20px !important; height: 20px !important; font-size: 10px !important; }
  .gjs-sm-sector-title { font-size: 11px !important; padding: 5px 6px !important; }
  .gjs-sm-property { font-size: 11px !important; padding: 3px 6px !important; }
  .gjs-sm-input {
    height: 22px !important;
    font-size: 11px !important;
    padding: 0 4px !important;
  }
  .gjs-sm-range { height: 22px !important; }
  .gjs-sm-unit {
    font-size: 10px !important;
    padding: 2px 4px !important;
  }
  .gjs-sm-composite { font-size: 11px !important; }

  /* === Block Manager — smaller blocks === */
  .gjs-block { padding: 6px !important; margin: 2px !important; }
  .gjs-block__media { font-size: 18px !important; margin-bottom: 2px !important; }
  .gjs-block__label { font-size: 10px !important; }
  .gjs-blocks-header { padding: 4px 6px !important; font-size: 11px !important; }
  .gjs-category-title { font-size: 11px !important; padding: 4px 6px !important; }

  /* === Canvas area === */
  .gjs-cv-canvas { background-color: #0a0f1e !important; }
  .gjs-canvas { background-color: #0a0f1e !important; }

  /* === Modal dialogs — compact === */
  .gjs-modal { font-size: 12px !important; }
  .gjs-modal-title { font-size: 13px !important; padding: 8px 12px !important; }
  .gjs-modal-content { padding: 8px 12px !important; }

  /* === Asset Manager === */
  .gjs-am-title { font-size: 11px !important; padding: 5px 8px !important; }
  .gjs-am-assets-header { font-size: 11px !important; padding: 4px 8px !important; }
  .gjs-am-file { font-size: 10px !important; padding: 3px 6px !important; }
  .gjs-am-meta { font-size: 9px !important; }

  /* === Context menu === */
  .gjs-context { font-size: 11px !important; }
  .gjs-context-item { padding: 4px 10px !important; font-size: 11px !important; }

  /* === Input & Select sizing === */
  .gjs-field { font-size: 11px !important; }
  .gjs-field input,
  .gjs-field select,
  .gjs-field textarea {
    font-size: 11px !important;
    padding: 3px 5px !important;
    height: 24px !important;
  }

  /* === Typography Manager === */
  .gjs-typography { font-size: 11px !important; }

  /* === Trait Manager — compact === */
  .gjs-trt-traits { font-size: 11px !important; }
  .gjs-trt-trait { padding: 3px 6px !important; }
  .gjs-trt-label { font-size: 10px !important; }
  .gjs-tr { height: 24px !important; font-size: 11px !important; }
  .gjs-tr-select { font-size: 11px !important; height: 24px !important; }
  .gjs-tr-input { font-size: 11px !important; height: 24px !important; }

  /* === Scrollbar — thin === */
  .gjs-pn-panel::-webkit-scrollbar,
  .gjs-sm-scroll::-webkit-scrollbar,
  .gjs-layers::-webkit-scrollbar,
  .gjs-blocks::-webkit-scrollbar,
  .gjs-am-assets::-webkit-scrollbar { width: 4px !important; }
  .gjs-pn-panel::-webkit-scrollbar-thumb,
  .gjs-sm-scroll::-webkit-scrollbar-thumb,
  .gjs-layers::-webkit-scrollbar-thumb,
  .gjs-blocks::-webkit-scrollbar-thumb,
  .gjs-am-assets::-webkit-scrollbar-thumb { background: #7B5CFF44 !important; border-radius: 2px !important; }
  .gjs-pn-panel::-webkit-scrollbar-track,
  .gjs-sm-scroll::-webkit-scrollbar-track,
  .gjs-layers::-webkit-scrollbar-track,
  .gjs-blocks::-webkit-scrollbar-track,
  .gjs-am-assets::-webkit-scrollbar-track { background: transparent !important; }

  /* === Highlight box on select — thinner === */
  .gjs-selected { outline-width: 1px !important; }

  /* === Badge/tag on blocks === */
  .gjs-badge { font-size: 9px !important; padding: 1px 3px !important; }

  /* === Notification toast === */
  .gjs-toast { font-size: 11px !important; padding: 6px 10px !important; }

  /* === Color picker — compact === */
  .gjs-field-color-picker { height: 24px !important; }

  /* === Keep NyXia colors === */
  .gjs-one-bg { background-color: #0c1a2e !important; }
  .gjs-two-color { color: #94a3b8 !important; }
  .gjs-three-bg { background-color: #111b30 !important; }
  .gjs-four-color, .gjs-four-color-h:hover { color: #7B5CFF !important; }
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
          canvas: {
            styles: initialCss || undefined,
          },
          components: parsedComponents || initialHtml || '<h1 style="color:#fff;text-align:center;padding:40px;">Commencez à construire votre page...</h1>',
          style: parsedStyles || undefined,
        })

        editorInstance.current = editor

        // Apply compact NyXia theme
        editor.addStyle(NYXIA_THEME)

        if (isMounted) setIsLoading(false)
      } catch (error) {
        console.error('GrapesJS init error:', error)
        if (isMounted) {
          setIsLoading(false)
          toast.error("Erreur lors du chargement de l'éditeur")
        }
      }
    }

    initEditor()

    return () => {
      isMounted = false
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
        body: JSON.stringify({
          html_content: html,
          css_content: css,
          components_json: components,
          style_json: styles,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      if (onSave) {
        onSave({ html_content: html, css_content: css, components_json: components, style_json: styles })
      }

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
    const previewWindow = window.open('', '_blank')
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html><head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>${css}</style>
          <style>body { margin: 0; padding: 20px; background: #06101f; }</style>
        </head><body>${html}</body></html>
      `)
      previewWindow.document.close()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] bg-[#06101f] flex flex-col">
      {/* Toolbar — clean & compact */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-purple-500/20 bg-[#0c1a2e] shrink-0">
        <h2 className="text-zinc-300 font-medium text-xs tracking-wide">ÉDITEUR DE PAGE</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePreview}
            className="flex items-center gap-1 px-2.5 h-7 rounded text-[11px] text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Eye className="w-3 h-3" />
            Aperçu
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1 px-3 h-7 rounded bg-[#7B5CFF] hover:bg-[#6a4ce8] text-white text-[11px] font-medium transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Sauver
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#06101f]">
            <div className="text-center">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin mx-auto mb-2" />
              <p className="text-zinc-500 text-xs">Chargement...</p>
            </div>
          </div>
        )}
        <div ref={editorRef} className="w-full h-full" />
      </div>
    </div>
  )
}
