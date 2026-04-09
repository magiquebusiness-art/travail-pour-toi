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

// ─── THÈME CSS — préfixé #nyxia-gjs-editor + double couverture sans préfixe ───
function getThemeCSS(): string {
  return `
/* =========================================
   NYXIA PREMIUM THEME — GrapesJS
   ========================================= */

/* ── FONT GLOBALE ── */
.gjs-one-bg, .gjs-two-bg, .gjs-three-bg, .gjs-four-bg {
  font-family: 'Outfit', ui-sans-serif, system-ui, sans-serif !important;
  font-size: 14px !important;
}

/* ── TOOLBAR FLOTTANT — MASQUÉ ── */
.gjs-toolbar, .gjs-tools .gjs-toolbar { display: none !important; }
.gjs-badge { display: none !important; }

/* ── PANEL GAUCHE ── */
.gjs-pn {
  width: 260px !important;
  min-width: 260px !important;
  max-width: 260px !important;
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
  width: 260px !important;
  min-width: 260px !important;
  max-width: 260px !important;
  padding: 0 !important;
  margin: 0 !important;
  background: transparent !important;
  overflow: hidden !important;
}

/* ── BOUTONS DE NAVIGATION ── */
.gjs-pn-commands, .gjs-pn-buttons {
  display: flex !important;
  flex-direction: row !important;
  gap: 4px !important;
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
  padding: 0 8px !important;
  line-height: 34px !important;
  border-radius: 9px !important;
  background: transparent !important;
  border: 1px solid transparent !important;
  color: #564e78 !important;
  transition: all 0.15s ease !important;
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

/* ── BLOCS — GRILLE 2 COLONNES ── */
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
  padding: 14px 8px 10px !important;
  margin: 0 0 0 0 !important;
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
  clear: none !important;
}
.gjs-block:hover {
  background: rgba(123,92,255,0.11) !important;
  border-color: rgba(123,92,255,0.28) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 24px rgba(123,92,255,0.12) !important;
}
.gjs-block:active { transform: scale(0.97) !important; }

/* Icône badge */
.gjs-block__media {
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
  margin: 0 !important;
}
.gjs-block svg,
.gjs-block__media svg,
.gjs-block__media i {
  width: 22px !important;
  height: 22px !important;
  color: #8b6cff !important;
  font-size: 22px !important;
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

/* ── CANVAS — GRILLE DE POINTS ── */
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
  transition: border-color 0.15s !important;
}
.gjs-field input:focus, .gjs-field select:focus {
  border-color: rgba(123,92,255,0.4) !important;
  outline: none !important;
}

/* ── TRAIT MANAGER ── */
.gjs-trt-trait { padding: 8px 12px !important; }
.gjs-trt-label { font-size: 12px !important; color: #8d89ae !important; }

/* ── SÉLECTION — VIOLET pas bleu ── */
.gjs-selected,
.gjs-selected * {
  outline: 2px solid #7B5CFF !important;
  outline-offset: 1px !important;
}

/* ── SCROLLBARS ── */
.gjs-pn-panel::-webkit-scrollbar,
.gjs-blocks::-webkit-scrollbar,
.gjs-layers::-webkit-scrollbar { width: 4px !important; }
.gjs-pn-panel::-webkit-scrollbar-thumb,
.gjs-blocks::-webkit-scrollbar-thumb,
.gjs-layers::-webkit-scrollbar-thumb {
  background: rgba(123,92,255,0.25) !important;
  border-radius: 2px !important;
}
.gjs-pn-panel::-webkit-scrollbar-track { background: transparent !important; }

/* ── COULEURS DE BASE NYXIA ── */
.gjs-one-bg { background-color: #0b1428 !important; }
.gjs-two-color { color: #c4bde0 !important; }
.gjs-three-bg { background-color: #091020 !important; }
.gjs-four-color, .gjs-four-color-h:hover { color: #8b6cff !important; }

/* ── VUES PANEL ── */
.gjs-pn-views-container { display: none !important; }
.gjs-pn-views {
  width: 258px !important;
  left: 0 !important;
  top: auto !important;
  position: relative !important;
}

/* ── BRANDING — TOUT MASQUER ── */
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
  box-shadow: 0 20px 60px rgba(0,0,0,0.5) !important;
}
.gjs-modal-title { color: #e8e2f8 !important; font-family: 'Outfit', sans-serif !important; }
.gjs-modal-header { background: #091020 !important; border-bottom: 1px solid rgba(123,92,255,0.1) !important; }
.gjs-modal-content { background: #0b1428 !important; }
.gjs-footer { background: #091020 !important; border-top: 1px solid rgba(123,92,255,0.1) !important; }
.gjs-btn-primary {
  background: #7B5CFF !important;
  color: white !important;
  border-radius: 10px !important;
  border: none !important;
}
.gjs-btn-grey {
  background: rgba(123,92,255,0.15) !important;
  color: #b09eff !important;
  border-radius: 10px !important;
  border: 1px solid rgba(123,92,255,0.2) !important;
}
.gjs-sm-sectors { background: transparent !important; }
.gjs-sm-sector { border-bottom: 1px solid rgba(123,92,255,0.07) !important; }
.gjs-input {
  background: rgba(7,16,31,0.7) !important;
  border: 1px solid rgba(123,92,255,0.13) !important;
  color: #d4d0e0 !important;
  border-radius: 9px !important;
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
`
}

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
    let themeInterval: ReturnType<typeof setInterval> | null = null

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

        // ──────────────────────────────────────────────
        // ÉTAPE 1 : Injecter le CSS AVANT init
        // ──────────────────────────────────────────────
        styleEl = document.createElement('style')
        styleEl.id = 'nyxia-gjs-theme'
        styleEl.textContent = getThemeCSS()
        document.head.appendChild(styleEl)

        const editor = grapesjs.init({
          container: editorRef.current,
          height: '100%',
          width: 'auto',
          fromElement: false,
          storageManager: false,
          // ──────────────────────────────────────
          // ÉTAPE 2 : Écraser les configs internes
          // ──────────────────────────────────────
          stylePrefix: 'gjs-',
          fromElement: false,
          forceClass: false,
          protectedCss: '',
          canvasCss: '',
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

        // ──────────────────────────────────────────────
        // ÉTAPE 3 : Force le thème — combi CSS + inline
        // ──────────────────────────────────────────────
        const forceTheme = () => {
          if (!editorRef.current) return

          // === 1) Ré-injecter <style> en DERNIER dans <head> ===
          if (styleEl && styleEl.parentNode) styleEl.remove()
          styleEl = document.createElement('style')
          styleEl.id = 'nyxia-gjs-theme'
          styleEl.textContent = getThemeCSS()
          document.head.appendChild(styleEl)

          // === 2) Supprimer les <style> que GrapesJS a pu injecter DANS l'iframe canvas ===
          try {
            const canvasDoc = editor.Canvas.getDocument()
            if (canvasDoc) {
              // Remplacer les styles de sélection bleu par violet dans l'iframe
              canvasDoc.querySelectorAll('style').forEach((s: HTMLStyleElement) => {
                if (s.textContent && s.textContent.includes('#3b97e3')) {
                  s.textContent = s.textContent.replace(/#3b97e3/g, '#7B5CFF')
                }
              })
              // Canvas background
              const body = canvasDoc.body
              if (body) {
                body.style.backgroundColor = '#060e1c'
                body.style.backgroundImage = 'radial-gradient(rgba(123,92,255,0.07) 1px, transparent 1px)'
                body.style.backgroundSize = '28px 28px'
              }
            }
          } catch (e) { /* iframe pas encore prêt */ }

          // === 3) Inline styles pour les conteneurs de blocs ===
          editorRef.current.querySelectorAll('.gjs-block-container, .gjs-block-list, [class*="block-list"]').forEach((el) => {
            const node = el as HTMLElement
            node.style.cssText = 'display:grid !important;grid-template-columns:1fr 1fr !important;gap:8px !important;padding:4px 12px 12px !important;width:100% !important;margin:0 !important;'
          })

          // === 4) Inline styles pour chaque bloc ===
          editorRef.current.querySelectorAll('.gjs-block').forEach((el) => {
            const node = el as HTMLElement
            node.style.cssText = 'width:100% !important;padding:14px 8px 10px !important;margin:0 !important;border-radius:12px !important;border:1px solid rgba(123,92,255,0.09) !important;background:rgba(123,92,255,0.03) !important;cursor:grab !important;min-height:88px !important;max-height:100px !important;display:flex !important;flex-direction:column !important;align-items:center !important;justify-content:center !important;gap:9px !important;box-sizing:border-box !important;float:none !important;'
          })

          // === 5) Masquer branding ===
          editorRef.current.querySelectorAll(
            '.gjs-off-prv, .gjs-no-ph, [class*="gjs-logo"], .gjs-brand, .gjs-logo, .gjs-logo-content, .gjs-badge, .gjs-cv-select, .gjs-editor-top'
          ).forEach(el => { (el as HTMLElement).style.display = 'none' })

          // === 6) Canvas grille ===
          editorRef.current.querySelectorAll('.gjs-cv-canvas, .gjs-canvas').forEach((el) => {
            const node = el as HTMLElement
            node.style.cssText = 'background-color:#060e1c !important;background-image:radial-gradient(rgba(123,92,255,0.07) 1px,transparent 1px) !important;background-size:28px 28px !important;'
          })

          // === 7) Vues panel ===
          editorRef.current.querySelectorAll('.gjs-pn-views-container').forEach(el => {
            (el as HTMLElement).style.display = 'none'
          })
        }

        // ──────────────────────────────────────────────
        // ÉTAPE 4 : Surveiller avec MULTIPLES stratégies
        // ──────────────────────────────────────────────

        editor.on('load', () => {
          forceTheme()

          // MutationObserver — permanent avec throttle
          if (editorRef.current && observer) observer.disconnect()
          observer = new MutationObserver(() => {
            if (rafId) return
            rafId = requestAnimationFrame(() => {
              forceTheme()
              rafId = null
            })
          })
          observer.observe(editorRef.current!, { childList: true, subtree: true, attributes: true })

          // Safety net — re-apply toutes les 500ms pendant 10s
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

        // Réagir aux événements GrapesJS
        ;['component:add', 'block:drag:start', 'canvas:render', 'sorter:drag:end', 'canvas:drop', 'run:open', 'run:close'].forEach(evt => {
          editor.on(evt, () => requestAnimationFrame(forceTheme))
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
      if (themeInterval) clearInterval(themeInterval)
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
