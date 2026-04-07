'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface GrapesJSLessonEditorProps {
  initialHtml?: string
  initialCss?: string
  onSave?: (data: { html_content: string; css_content: string }) => void
  onClose?: () => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GrapesJSEditor = any

/* Inject theme CSS into document <head> — NOT editor.addStyle() */
function injectThemeCSS() {
  const id = 'nyxia-grapesjs-ui-theme'
  if (document.getElementById(id)) return
  const style = document.createElement('style')
  style.id = id
  style.textContent = `
    .gjs-editor, .gjs-one-bg, .gjs-two-bg, .gjs-three-bg, .gjs-four-bg, [class*="gjs-"] {
      font-family: 'Outfit', ui-sans-serif, system-ui, -apple-system, sans-serif !important;
      font-size: 12px !important;
    }
    .gjs-toolbar { display: none !important; }
    .gjs-pn { width: 200px !important; min-width: 200px !important; max-width: 200px !important; }
    .gjs-pn-panel { padding: 0 !important; width: 200px !important; min-width: 200px !important; }
    .gjs-pn-commands, .gjs-pn-buttons { padding: 2px 4px !important; }
    .gjs-pn-btn { width: 22px !important; height: 22px !important; font-size: 10px !important; margin: 0 !important; padding: 0 !important; line-height: 22px !important; }
    .gjs-pn-btn svg { width: 11px !important; height: 11px !important; }
    .gjs-pn-label { font-size: 9px !important; padding: 0 !important; }
    .gjs-pn-title { font-size: 10px !important; padding: 4px 6px !important; margin: 0 !important; }
    .gjs-sm { font-size: 11px !important; }
    .gjs-sm-label { font-size: 9px !important; }
    .gjs-sm-title { font-size: 10px !important; padding: 3px 5px !important; }
    .gjs-sm-section-title { font-size: 10px !important; padding: 3px 5px !important; }
    .gjs-sm-sector-title { font-size: 10px !important; padding: 4px 5px !important; }
    .gjs-sm-property { font-size: 10px !important; padding: 2px 5px !important; }
    .gjs-sm-input { height: 20px !important; font-size: 10px !important; padding: 0 3px !important; }
    .gjs-sm-range { height: 20px !important; }
    .gjs-sm-unit { font-size: 9px !important; padding: 1px 3px !important; }
    .gjs-sm-composite { font-size: 10px !important; }
    .gjs-sm-undo, .gjs-sm-redo { width: 18px !important; height: 18px !important; font-size: 9px !important; }
    .gjs-devices-c { gap: 1px !important; }
    .gjs-devices-c .gjs-devices-btn { padding: 2px 5px !important; font-size: 10px !important; margin: 0 !important; }
    .gjs-layers { font-size: 10px !important; }
    .gjs-layer { padding: 1px 4px !important; min-height: 20px !important; font-size: 10px !important; }
    .gjs-layer-name { font-size: 10px !important; }
    .gjs-layer-cv { font-size: 10px !important; }
    .gjs-layer-count { font-size: 8px !important; }
    .gjs-layers-header { padding: 3px 5px !important; font-size: 10px !important; }
    .gjs-layer-item { padding: 0 3px !important; }
    .gjs-layer-vis { width: 14px !important; height: 14px !important; font-size: 8px !important; }
    .gjs-layer-move { width: 12px !important; height: 12px !important; }
    .gjs-block { padding: 4px !important; margin: 1px !important; }
    .gjs-block__media { font-size: 16px !important; margin-bottom: 1px !important; }
    .gjs-block__label { font-size: 9px !important; }
    .gjs-blocks-header { padding: 3px 5px !important; font-size: 10px !important; }
    .gjs-category-title { font-size: 10px !important; padding: 3px 5px !important; }
    .gjs-cv-canvas { background-color: #0a0f1e !important; }
    .gjs-canvas { background-color: #0a0f1e !important; }
    .gjs-trt-traits { font-size: 10px !important; }
    .gjs-trt-trait { padding: 2px 5px !important; }
    .gjs-trt-label { font-size: 9px !important; }
    .gjs-tr { height: 20px !important; font-size: 10px !important; }
    .gjs-tr-select { font-size: 10px !important; height: 20px !important; }
    .gjs-tr-input { font-size: 10px !important; height: 20px !important; }
    .gjs-field { font-size: 10px !important; }
    .gjs-field input, .gjs-field select, .gjs-field textarea { font-size: 10px !important; padding: 2px 4px !important; height: 20px !important; }
    .gjs-modal { font-size: 11px !important; }
    .gjs-modal-title { font-size: 12px !important; padding: 6px 10px !important; }
    .gjs-modal-content { padding: 6px 10px !important; }
    .gjs-context { font-size: 10px !important; }
    .gjs-context-item { padding: 3px 8px !important; font-size: 10px !important; }
    .gjs-toast { font-size: 10px !important; padding: 4px 8px !important; }
    .gjs-badge { font-size: 8px !important; padding: 0 2px !important; }
    .gjs-am-title { font-size: 10px !important; padding: 3px 6px !important; }
    .gjs-am-file { font-size: 9px !important; padding: 2px 5px !important; }
    .gjs-field-color-picker { height: 20px !important; }
    .gjs-selected { outline-width: 1px !important; }
    .gjs-pn-panel::-webkit-scrollbar, .gjs-sm-scroll::-webkit-scrollbar, .gjs-layers::-webkit-scrollbar, .gjs-blocks::-webkit-scrollbar, .gjs-cv-canvas::-webkit-scrollbar, [class*="gjs-"]::-webkit-scrollbar { width: 3px !important; height: 3px !important; }
    .gjs-pn-panel::-webkit-scrollbar-thumb, .gjs-sm-scroll::-webkit-scrollbar-thumb, .gjs-layers::-webkit-scrollbar-thumb, .gjs-blocks::-webkit-scrollbar-thumb, [class*="gjs-"]::-webkit-scrollbar-thumb { background: #7B5CFF33 !important; border-radius: 2px !important; }
    .gjs-pn-panel::-webkit-scrollbar-track, .gjs-sm-scroll::-webkit-scrollbar-track, .gjs-layers::-webkit-scrollbar-track, .gjs-blocks::-webkit-scrollbar-track, [class*="gjs-"]::-webkit-scrollbar-track { background: transparent !important; }
    .gjs-one-bg { background-color: #0c1a2e !important; }
    .gjs-two-color { color: #94a3b8 !important; }
    .gjs-three-bg { background-color: #111b30 !important; }
    .gjs-four-color, .gjs-four-color-h:hover { color: #7B5CFF !important; }
  `
  document.head.appendChild(style)
}

function removeThemeCSS() {
  const el = document.getElementById('nyxia-grapesjs-ui-theme')
  if (el) el.remove()
}

const DEFAULT_LESSON_HTML = '<div style="padding:20px;"><h2 style="color:#fff;font-size:20px;margin-bottom:10px;">Titre de la leçon</h2><p style="color:#94a3b8;font-size:13px;line-height:1.6;">Commencez à rédiger le contenu de votre leçon ici...</p></div>'

export default function GrapesJSLessonEditor({
  initialHtml,
  initialCss,
  onSave,
  onClose,
}: GrapesJSLessonEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorInstance = useRef<GrapesJSEditor>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function initEditor() {
      try {
        injectThemeCSS()

        const grapesjs = (await import('grapesjs')).default
        const grapesjsBlocksBasic = (await import('grapesjs-blocks-basic')).default
        const grapesjsPresetWebpage = (await import('grapesjs-preset-webpage')).default

        if (!isMounted || !editorRef.current) return

        const editor = grapesjs.init({
          container: editorRef.current,
          height: '100%',
          width: 'auto',
          fromElement: false,
          storageManager: false,
          plugins: [grapesjsBlocksBasic, grapesjsPresetWebpage],
          pluginsOpts: {
            [grapesjsPresetWebpage as unknown as string]: {
              modalImportTitle: 'Importer',
              modalImportLabel: 'Collez votre HTML/CSS ici',
              modalImportContent: '',
            },
          },
          canvas: {
            styles: (initialCss || undefined) as unknown as undefined,
          },
          components: initialHtml || DEFAULT_LESSON_HTML,
          style: undefined,
        })

        editorInstance.current = editor

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
      removeThemeCSS()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async () => {
    if (!editorInstance.current) return

    setIsSaving(true)
    try {
      const html = editorInstance.current.getHtml()
      const css = editorInstance.current.getCss()

      if (onSave) {
        onSave({ html_content: html, css_content: css })
      }

      toast.success('Leçon sauvegardée !')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsSaving(false)
    }
  }, [onSave])

  return (
    <div className="flex flex-col rounded-lg overflow-hidden border border-purple-500/20 bg-[#06101f]" style={{ height: '500px' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 h-7 border-b border-purple-500/20 bg-[#0c1a2e] shrink-0">
        <span className="text-zinc-400 font-medium text-[9px] tracking-widest uppercase">Éditeur de Leçon</span>
        <div className="flex items-center gap-1">
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-1 px-2 h-5 rounded bg-[#7B5CFF] hover:bg-[#6a4ce8] text-white text-[9px] font-medium transition-colors disabled:opacity-50">
            {isSaving ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Save className="w-2.5 h-2.5" />}
            Sauver
          </button>
          {onClose && (
            <button onClick={onClose} className="flex items-center justify-center w-5 h-5 rounded text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#06101f]">
            <div className="text-center">
              <Loader2 className="w-4 h-4 text-purple-500 animate-spin mx-auto mb-1" />
              <p className="text-zinc-500 text-[9px]">Chargement...</p>
            </div>
          </div>
        )}
        <div ref={editorRef} className="w-full h-full" />
      </div>
    </div>
  )
}
