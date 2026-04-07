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
        // Dynamic imports for GrapesJS (client-side only)
        const grapesjs = (await import('grapesjs')).default
        const grapesjsBlocksBasic = (await import('grapesjs-blocks-basic')).default
        const grapesjsPresetWebpage = (await import('grapesjs-preset-webpage')).default
        const grapesjsCustomCode = (await import('grapesjs-custom-code')).default
        const grapesjsPluginForms = (await import('grapesjs-plugin-forms')).default

        if (!isMounted || !editorRef.current) return

        // Parse initial data
        let parsedComponents
        try {
          parsedComponents = JSON.parse(initialComponents)
        } catch {
          parsedComponents = undefined
        }

        let parsedStyles
        try {
          parsedStyles = JSON.parse(initialStyles)
        } catch {
          parsedStyles = undefined
        }

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
              modalImportTitle: 'Importer un template',
              modalImportLabel: '<div style="margin-bottom: 10px; font-size: 13px;">Collez votre HTML/CSS ici</div>',
              modalImportContent: '',
            },
            [grapesjsCustomCode as unknown as string]: {
              modalTitle: 'Code personnalisé',
            },
          },
          canvas: {
            styles: initialCss || undefined,
          },
          // Load initial components
          components: parsedComponents || initialHtml || '<h1>Commencez à construire votre page de vente...</h1>',
          style: parsedStyles || undefined,
        })

        // Store editor instance
        editorInstance.current = editor

        // Add custom theme styles
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
      const components = JSON.stringify(editorInstance.current.getComponents())
      const styles = JSON.stringify(editorInstance.current.getStyle())

      // Save via API
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
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
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
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>${css}</style>
          <style>body { margin: 0; padding: 20px; background: #06101f; }</style>
        </head>
        <body>${html}</body>
        </html>
      `)
      previewWindow.document.close()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] bg-[#06101f] flex flex-col">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-purple-500/20 bg-[#0c1a2e] shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold text-sm">Éditeur de Page — GrapesJS</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
          >
            <Eye className="w-4 h-4 mr-1" />
            Aperçu
          </Button>
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
      <div className="flex-1 relative">
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
