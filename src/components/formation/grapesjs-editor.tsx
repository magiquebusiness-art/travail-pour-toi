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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let observer: MutationObserver | null = null
    let styleEl: HTMLStyleElement | null = null
    let rafId: number | null = null

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

        // =====================================================
        // THÈME AGRESSIF — on n'injecte le CSS QU'APRÈS le load
        // =====================================================

        const THEME_CSS = `
/* === FONT === */
#nyxia-gjs-editor .gjs-one-bg,
#nyxia-gjs-editor .gjs-two-bg,
#nyxia-gjs-editor .gjs-three-bg,
#nyxia-gjs-editor .gjs-four-bg {
  font-family: 'Outfit', ui-sans-serif, system-ui, sans-serif !important;
  font-size: 14px !important;
}

/* === TOOLBAR FLOTTANT — MASQUÉ === */
#nyxia-gjs-editor .gjs-toolbar { display: none !important; }
#nyxia-gjs-editor .gjs-badge { display: none !important; }

/* === PANEL GAUCHE === */
#nyxia-gjs-editor .gjs-pn {
  width: 260px !important;
  min-width: 260px !important;
  max-width: 260px !important;
  height: 100% !important;
  padding: 0 !important;
  border-right: 1px solid rgba(123,92,255,0.09) !important;
  background: linear-gradient(180deg, #0b1428 0%, #091020 100%) !important;
  display: flex !important;
  flex-direction: column !important;
}
#nyxia-gjs-editor .gjs-pn-left,
#nyxia-gjs-editor .gjs-pn-panel {
  width: 260px !important;
  min-width: 260px !important;
  max-width: 260px !important;
  padding: 0 !important;
  background: transparent !important;
}

/* === BOUTONS DE NAVIGATION === */
#nyxia-gjs-editor .gjs-pn-commands,
#nyxia-gjs-editor .gjs-pn-buttons {
  display: flex !important;
  flex-direction: row !important;
  gap: 4px !important;
  padding: 12px 12px 10px !important;
  border-bottom: 1px solid rgba(123,92,255,0.07) !important;
}
#nyxia-gjs-editor .gjs-pn-btn {
  flex: 1 !important;
  height: 34px !important;
  width: auto !important;
  font-size: 10px !important;
  font-weight: 700 !important;
  letter-spacing: 0.04em !important;
  text-transform: uppercase !important;
  margin: 0 !important;
  padding: 0 8px !important;
  line-height: 34px !important;
  border-radius: 9px !important;
  background: transparent !important;
  border: 1px solid transparent !important;
  color: #564e78 !important;
  transition: all 0.15s ease !important;
}
#nyxia-gjs-editor .gjs-pn-btn:hover {
  background: rgba(255,255,255,0.04) !important;
  color: #7a7498 !important;
}
#nyxia-gjs-editor .gjs-pn-btn.active,
#nyxia-gjs-editor .gjs-pn-btn.gjs-pn-active {
  background: rgba(123,92,255,0.13) !important;
  border-color: rgba(123,92,255,0.24) !important;
  color: #b09eff !important;
}
#nyxia-gjs-editor .gjs-pn-btn svg { width: 14px !important; height: 14px !important; }
#nyxia-gjs-editor .gjs-pn-title {
  font-size: 10px !important;
  padding: 14px 14px 7px !important;
  font-weight: 700 !important;
  color: rgba(123,92,255,0.5) !important;
  letter-spacing: 0.1em !important;
  text-transform: uppercase !important;
}

/* === BLOCS — GRILLE 2 COL COMPACTE === */
#nyxia-gjs-editor .gjs-blocks-c .gjs-block-category .gjs-block-list,
#nyxia-gjs-editor .gjs-block-container,
#nyxia-gjs-editor .gjs-sm-sectors,
#nyxia-gjs-editor [class*="blocks__blocks"],
#nyxia-gjs-editor [class*="block-list"] {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 8px !important;
  padding: 4px 12px 12px !important;
  width: 100% !important;
}

#nyxia-gjs-editor .gjs-block {
  width: 100% !important;
  padding: 14px 8px 10px !important;
  margin: 0 !important;
  border-radius: 12px !important;
  border: 1px solid rgba(123,92,255,0.09) !important;
  background: rgba(123,92,255,0.03) !important;
  cursor: grab !important;
  transition: all 0.2s cubic-bezier(0.4,0,0.2,1) !important;
  min-height: 88px !important;
  max-height: 100px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 9px !important;
  box-sizing: border-box !important;
  float: none !important;
}
#nyxia-gjs-editor .gjs-block:hover {
  background: rgba(123,92,255,0.11) !important;
  border-color: rgba(123,92,255,0.28) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 24px rgba(123,92,255,0.12) !important;
}
#nyxia-gjs-editor .gjs-block:active { transform: scale(0.97) !important; }

/* Icône dans un badge pill */
#nyxia-gjs-editor .gjs-block__media {
  width: 36px !important;
  height: 36px !important;
  font-size: 18px !important;
  line-height: 36px !important;
  text-align: center !important;
  background: rgba(123,92,255,0.1) !important;
  border: 1px solid rgba(123,92,255,0.18) !important;
  border-radius: 9px !important;
  color: #8b6cff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
#nyxia-gjs-editor .gjs-block svg,
#nyxia-gjs-editor .gjs-block__media svg {
  width: 22px !important;
  height: 22px !important;
  color: #8b6cff !important;
}
#nyxia-gjs-editor .gjs-block__label {
  font-size: 11px !important;
  font-weight: 600 !important;
  text-align: center !important;
  color: #8d89ae !important;
  letter-spacing: 0.01em !important;
  line-height: 1.3 !important;
}
#nyxia-gjs-editor .gjs-category-title,
#nyxia-gjs-editor .gjs-category-label {
  font-size: 10px !important;
  padding: 14px 14px 7px !important;
  font-weight: 700 !important;
  color: rgba(123,92,255,0.5) !important;
  text-transform: uppercase !important;
  letter-spacing: 0.1em !important;
}

/* === CANVAS — GRILLE POINTS === */
#nyxia-gjs-editor .gjs-cv-canvas,
#nyxia-gjs-editor .gjs-cv-canvas__frames,
#nyxia-gjs-editor .gjs-frame-wrapper,
#nyxia-gjs-editor .gjs-canvas {
  background-color: #060e1c !important;
  background-image: radial-gradient(rgba(123,92,255,0.07) 1px, transparent 1px) !important;
  background-size: 28px 28px !important;
}

/* === LAYERS === */
#nyxia-gjs-editor .gjs-layer {
  padding: 10px 12px !important;
  min-height: 40px !important;
  font-size: 13px !important;
  border-radius: 8px !important;
  margin: 2px 0 !important;
  transition: background 0.15s !important;
}
#nyxia-gjs-editor .gjs-layer:hover { background: rgba(123,92,255,0.07) !important; }
#nyxia-gjs-editor .gjs-layer-name { font-size: 13px !important; color: #a09cc0 !important; }

/* === STYLE MANAGER === */
#nyxia-gjs-editor .gjs-sm-sector-title {
  font-size: 10px !important;
  padding: 12px 14px 8px !important;
  font-weight: 700 !important;
  color: rgba(123,92,255,0.5) !important;
  text-transform: uppercase !important;
  letter-spacing: 0.1em !important;
}
#nyxia-gjs-editor .gjs-sm-property { padding: 8px 12px !important; }
#nyxia-gjs-editor .gjs-field input,
#nyxia-gjs-editor .gjs-field select,
#nyxia-gjs-editor .gjs-field textarea {
  font-size: 13px !important;
  padding: 7px 12px !important;
  height: 36px !important;
  border-radius: 9px !important;
  background: rgba(7,16,31,0.7) !important;
  border: 1px solid rgba(123,92,255,0.13) !important;
  color: #d4d0e0 !important;
  transition: border-color 0.15s !important;
}
#nyxia-gjs-editor .gjs-field input:focus,
#nyxia-gjs-editor .gjs-field select:focus {
  border-color: rgba(123,92,255,0.4) !important;
  outline: none !important;
}

/* === TRAIT MANAGER === */
#nyxia-gjs-editor .gjs-trt-trait { padding: 8px 12px !important; }
#nyxia-gjs-editor .gjs-trt-label { font-size: 12px !important; color: #8d89ae !important; }

/* === SÉLECTION === */
#nyxia-gjs-editor .gjs-selected {
  outline: 2px solid #7B5CFF !important;
  outline-offset: 1px !important;
}

/* === SCROLLBARS === */
#nyxia-gjs-editor .gjs-pn-panel::-webkit-scrollbar,
#nyxia-gjs-editor .gjs-blocks::-webkit-scrollbar,
#nyxia-gjs-editor .gjs-layers::-webkit-scrollbar { width: 4px !important; }
#nyxia-gjs-editor .gjs-pn-panel::-webkit-scrollbar-thumb,
#nyxia-gjs-editor .gjs-blocks::-webkit-scrollbar-thumb,
#nyxia-gjs-editor .gjs-layers::-webkit-scrollbar-thumb {
  background: rgba(123,92,255,0.25) !important;
  border-radius: 2px !important;
}
#nyxia-gjs-editor .gjs-pn-panel::-webkit-scrollbar-track { background: transparent !important; }

/* === COULEURS NYXIA === */
#nyxia-gjs-editor .gjs-one-bg { background-color: #0b1428 !important; }
#nyxia-gjs-editor .gjs-two-color { color: #c4bde0 !important; }
#nyxia-gjs-editor .gjs-three-bg { background-color: #091020 !important; }
#nyxia-gjs-editor .gjs-four-color,
#nyxia-gjs-editor .gjs-four-color-h:hover { color: #8b6cff !important; }

/* === VUES PANEL === */
#nyxia-gjs-editor .gjs-pn-views-container { display: none !important; }
#nyxia-gjs-editor .gjs-pn-views {
  width: 258px !important;
  left: 0 !important;
  top: auto !important;
  position: relative !important;
}

/* === BRANDING MASQUÉ === */
#nyxia-gjs-editor .gjs-logo,
#nyxia-gjs-editor .gjs-logo-content,
#nyxia-gjs-editor .gjs-brand,
#nyxia-gjs-editor .gjs-off-prv,
#nyxia-gjs-editor .gjs-no-ph,
#nyxia-gjs-editor .gjs-cv-select,
#nyxia-gjs-editor [title*="GrapesJS"],
#nyxia-gjs-editor [aria-label*="GrapesJS"] { display: none !important; }
`

        // Fonction qui force le thème — inline styles + ré-injection CSS
        const forceTheme = () => {
          if (!editorRef.current) return
          const container = editorRef.current

          // === Ré-injecter le <style> TOUJOURS EN DERNIER dans <head> ===
          if (styleEl) styleEl.remove()
          styleEl = document.createElement('style')
          styleEl.id = 'nyxia-gjs-theme'
          styleEl.textContent = THEME_CSS
          document.head.appendChild(styleEl)

          // === Inline styles pour les conteneurs de blocs ===
          container.querySelectorAll('.gjs-block-container, .gjs-block-list, [class*="block-list"]').forEach((el) => {
            const node = el as HTMLElement
            node.style.cssText = 'display:grid !important;grid-template-columns:1fr 1fr !important;gap:8px !important;padding:4px 12px 12px !important;width:100% !important;'
          })

          // === Inline styles pour chaque bloc ===
          container.querySelectorAll('.gjs-block').forEach((el) => {
            const node = el as HTMLElement
            node.style.float = 'none'
            node.style.display = 'flex'
            node.style.flexDirection = 'column'
            node.style.alignItems = 'center'
            node.style.justifyContent = 'center'
            node.style.width = '100%'
            node.style.margin = '0'
            node.style.minHeight = '88px'
            node.style.maxHeight = '100px'
          })

          // === Masquer branding ===
          container.querySelectorAll(
            '.gjs-off-prv, .gjs-no-ph, [class*="gjs-logo"], .gjs-brand, .gjs-logo, .gjs-logo-content, .gjs-badge, .gjs-cv-select'
          ).forEach(el => { (el as HTMLElement).style.display = 'none' })
          container.querySelectorAll(
            '[title*="GrapesJS"], [title*="grapesjs"], [aria-label*="GrapesJS"], [aria-label*="grapesjs"]'
          ).forEach(el => { (el as HTMLElement).style.display = 'none' })

          // === Canvas grille de points ===
          container.querySelectorAll('.gjs-cv-canvas, .gjs-cv-canvas__frames, .gjs-frame-wrapper').forEach((el) => {
            const node = el as HTMLElement
            node.style.backgroundColor = '#060e1c'
            node.style.backgroundImage = 'radial-gradient(rgba(123,92,255,0.07) 1px, transparent 1px)'
            node.style.backgroundSize = '28px 28px'
          })

          // === Vues panel ===
          container.querySelectorAll('.gjs-pn-views-container').forEach(el => {
            (el as HTMLElement).style.display = 'none'
          })
          container.querySelectorAll('.gjs-pn-views').forEach(el => {
            const node = el as HTMLElement
            node.style.width = '258px'
            node.style.left = '0'
            node.style.top = 'auto'
            node.style.position = 'relative'
          })
        }

        // Après le load complet de l'éditeur
        editor.on('load', () => {
          // Premier passage immédiat
          forceTheme()

          // MutationObserver PERMANENT avec throttle via rAF
          if (editorRef.current && observer) observer.disconnect()
          observer = new MutationObserver(() => {
            if (rafId) return
            rafId = requestAnimationFrame(() => {
              forceTheme()
              rafId = null
            })
          })
          observer.observe(editorRef.current!, { childList: true, subtree: true })
        })

        // Aussi réagir aux événements clés de GrapesJS
        ;['component:add', 'block:drag:start', 'canvas:render', 'sorter:drag:end', 'canvas:drop'].forEach(evt => {
          editor.on(evt, () => {
            requestAnimationFrame(forceTheme)
          })
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
      if (rafId) cancelAnimationFrame(rafId)
      if (observer) observer.disconnect()
      if (styleEl) styleEl.remove()
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

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-5 h-[58px] border-b border-purple-500/10 bg-[#0b1428]/95 backdrop-blur-sm shrink-0">

        {/* Gauche — logo + titre + badge */}
        <div className="flex items-center gap-3">
          <div
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center font-bold text-[14px] text-white"
            style={{
              background: 'linear-gradient(135deg, #8b6cff 0%, #5a3dd6 100%)',
              boxShadow: '0 4px 16px rgba(123,92,255,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            N
          </div>
          <span className="text-[#e8e2f8] font-semibold text-[14px] tracking-wide">
            Éditeur de Page
          </span>
          <span className="px-[9px] py-[3px] rounded-[6px] bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold uppercase tracking-[0.05em] text-purple-400">
            Pro
          </span>
        </div>

        {/* Droite — actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreview}
            className="flex items-center gap-[7px] px-4 h-[36px] rounded-[10px] text-[13px] font-medium text-[#b4aecf] border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.06] hover:text-[#e8e2f8] hover:border-white/[0.12] transition-all"
          >
            <Eye className="w-[14px] h-[14px]" />
            Aperçu
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-[7px] px-5 h-[36px] rounded-[10px] text-[13px] font-semibold text-white border border-purple-400/40 transition-all disabled:opacity-50 hover:-translate-y-px"
            style={{
              background: 'linear-gradient(135deg, rgba(123,92,255,0.9) 0%, rgba(90,61,214,0.9) 100%)',
              boxShadow: '0 4px 18px rgba(123,92,255,0.28), inset 0 1px 0 rgba(255,255,255,0.12)',
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
              className="flex items-center justify-center w-[36px] h-[36px] rounded-[9px] text-[#5c5880] border border-white/[0.05] hover:bg-white/[0.05] hover:text-[#a09cc0] transition-all"
            >
              <X className="w-[15px] h-[15px]" />
            </button>
          )}
        </div>
      </div>

      {/* ZONE ÉDITEUR */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#06101f]">
            <div className="text-center">
              <div
                className="w-9 h-9 rounded-full border-2 border-t-purple-500 animate-spin mx-auto mb-3"
                style={{ borderColor: 'rgba(123,92,255,0.2)', borderTopColor: '#7B5CFF' }}
              />
              <p className="text-[#564e78] text-[13px] font-medium tracking-wide">
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
