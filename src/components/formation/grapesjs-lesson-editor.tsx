'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
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

const DEFAULT_LESSON_HTML = `
<h2 style="color: #fff;">Titre de la leçon</h2>
<p style="color: #a5b4fc;">Commencez à rédiger le contenu de votre leçon ici...</p>
`

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
        // Dynamic imports for GrapesJS (client-side only)
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
              modalImportTitle: 'Importer un template',
              modalImportLabel: '<div style="margin-bottom: 10px; font-size: 13px;">Collez votre HTML/CSS ici</div>',
              modalImportContent: '',
            },
          },
          canvas: {
            styles: (initialCss || undefined) as unknown as undefined,
          },
          components: initialHtml || DEFAULT_LESSON_HTML,
          style: undefined,
        })

        // Store editor instance
        editorInstance.current = editor

        // Add custom NyXia dark theme styles
        editor.addStyle(`
          .gjs-one-bg { background-color: #0c1a2e !important; }
          .gjs-two-color { color: #a5b4fc !important; }
          .gjs-three-bg { background-color: #111b30 !important; }
          .gjs-four-color, .gjs-four-color-h:hover { color: #7B5CFF !important; }
        `)

        if (isMounted) {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('GrapesJS initialization error:', error)
        if (isMounted) {
          setIsLoading(false)
          toast.error("Erreur lors du chargement de l'éditeur")
        }
      }
    }

    initEditor()

    return () => {
      isMounted = false
      // Cleanup editor
      if (editorInstance.current) {
        try {
          editorInstance.current.destroy()
        } catch {
          // Ignore destroy errors
        }
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

      if (onSave) {
        onSave({ html_content: html, css_content: css })
      }

      toast.success('Leçon sauvegardée !')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }, [onSave])

  return (
    <div className="flex flex-col rounded-lg overflow-hidden border border-purple-500/20" style={{ height: '500px' }}>
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-purple-500/20 bg-[#0c1a2e] shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold text-sm">Éditeur de Leçon</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#7B5CFF] hover:bg-[#6a4ce8] text-white"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Sauvegarder
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 relative bg-[#06101f]">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#06101f]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
              <p className="text-zinc-400 text-sm">Chargement de l&apos;éditeur...</p>
            </div>
          </div>
        )}
        <div ref={editorRef} className="w-full h-full" />
      </div>
    </div>
  )
}
