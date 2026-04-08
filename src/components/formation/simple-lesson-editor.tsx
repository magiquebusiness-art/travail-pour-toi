'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Pilcrow,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  ImageIcon,
  Video,
  Music,
  Save,
  X,
  ChevronDown,
  Palette,
  Unlink,
} from 'lucide-react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Props ───────────────────────────────────────────────────────────────────

interface SimpleLessonEditorProps {
  /** Existing HTML content to load into the editor */
  initialHtml?: string
  /** Called when the user clicks "Sauvegarder" */
  onSave?: (data: { html_content: string }) => void
  /** Called when the user clicks the close button */
  onClose?: () => void
  /** If true, the toolbar is hidden and the editor is read-only */
  readOnly?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract YouTube video ID from various URL formats */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/** Remove link at current selection */
function removeLinkAtSelection() {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  let node = range.startContainer

  // Walk up to find the anchor element
  while (node && node !== document.body) {
    if (node instanceof HTMLAnchorElement) {
      const parent = node.parentNode
      if (!parent) return

      // Replace <a> with its children
      while (node.firstChild) {
        parent.insertBefore(node.firstChild, node)
      }
      parent.removeChild(node)
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    node = (node as any).parentNode
  }
}

// ─── Preset colors ──────────────────────────────────────────────────────────

const PRESET_COLORS = [
  { name: 'Blanc', value: '#ffffff' },
  { name: 'Violet', value: '#7B5CFF' },
  { name: 'Or', value: '#F4C842' },
  { name: 'Gris clair', value: '#94a3b8' },
  { name: 'Rose', value: '#f472b6' },
  { name: 'Cyan', value: '#22d3ee' },
  { name: 'Vert', value: '#4ade80' },
  { name: 'Orange', value: '#fb923c' },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

/** A single toolbar button with tooltip */
function ToolbarButton({
  tooltip,
  children,
  onClick,
  active = false,
  disabled = false,
}: {
  tooltip: string
  children: ReactNode
  onClick?: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-150 shrink-0',
            active
              ? 'bg-purple-500/25 ring-1 ring-purple-500/40 text-purple-200 shadow-md shadow-purple-500/10'
              : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-200',
            disabled && 'opacity-30 pointer-events-none'
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={4}
        className="bg-[#1a1a2e] text-zinc-300 text-xs border border-purple-500/20 rounded-lg px-3 py-1.5 z-[100]"
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

/** Visual separator between toolbar groups */
function ToolbarSeparator() {
  return <div className="w-px h-9 bg-purple-500/25 mx-1 shrink-0" />
}

/** Inline popover for URL inputs (link / video / audio) */
function InlineUrlInput({
  placeholder,
  value,
  onChange,
  onSubmit,
  onCancel,
}: {
  placeholder: string
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <>
      {/* Invisible backdrop to detect outside click */}
      <div className="fixed inset-0 z-[60]" onClick={onCancel} />
      <div className="absolute top-full left-0 mt-1 z-[70] flex items-center gap-2 p-4 rounded-xl bg-[#1a1a2e] border border-purple-500/20 shadow-2xl shadow-black/40 min-w-[440px]">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-12 px-4 text-[15px] text-white bg-[#0a0f1e] border border-purple-500/20 rounded-xl outline-none focus:border-purple-500/50 placeholder:text-zinc-600 font-[Outfit,sans-serif]"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit()
            if (e.key === 'Escape') onCancel()
          }}
          autoFocus
        />
        <button
          type="button"
          onClick={onSubmit}
          className="h-12 px-5 text-[15px] font-medium text-white bg-[#7B5CFF] hover:bg-[#6a4ce8] rounded-xl transition-colors font-[Outfit,sans-serif]"
        >
          OK
        </button>
      </div>
    </>
  )
}

// ─── Editor styles ───────────────────────────────────────────────────────────
// These styles target elements inside the contentEditable div.

const EDITOR_STYLES = `
/* ── Base ── */
.nyxia-editor {
  font-family: 'Outfit', ui-sans-serif, system-ui, sans-serif;
  font-size: 20px;
  line-height: 1.9;
  color: #f1f5f9;
  min-height: 600px;
  padding: 48px;
  outline: none;
  caret-color: #7B5CFF;
  background-color: #0a0f1e;
  overflow-y: auto;
  box-shadow: inset 0 1px 0 0 rgba(123, 92, 255, 0.08), inset 0 0 60px rgba(123, 92, 255, 0.04);
}

.nyxia-editor:empty::before {
  content: "Commence à écrire ta leçon ici…";
  color: #4a4a6a;
  font-style: italic;
  pointer-events: none;
  position: absolute;
  font-size: 22px;
}

/* ── Headings ── */
.nyxia-editor h1 {
  font-size: 2.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #e9d5ff 0%, #c4b5fd 50%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 28px 0 14px;
  line-height: 1.25;
  letter-spacing: -0.01em;
}
.nyxia-editor h2 {
  font-size: 1.65rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 24px 0 12px;
  line-height: 1.35;
}

/* ── Paragraph ── */
.nyxia-editor p {
  margin: 0 0 12px;
}

/* ── Links ── */
.nyxia-editor a {
  color: #7B5CFF;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.15s;
}
.nyxia-editor a:hover {
  color: #a78bfa;
}

/* ── Lists ── */
.nyxia-editor ul,
.nyxia-editor ol {
  margin: 8px 0;
  padding-left: 24px;
}
.nyxia-editor li {
  margin: 4px 0;
}
.nyxia-editor li::marker {
  color: #7B5CFF;
}

/* ── Images ── */
.nyxia-editor img {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  margin: 14px 0;
  border: 1px solid rgba(123, 92, 255, 0.15);
}

/* ── Blockquotes ── */
.nyxia-editor blockquote {
  border-left: 3px solid #7B5CFF;
  padding: 10px 20px;
  margin: 14px 0;
  background: rgba(123, 92, 255, 0.06);
  border-radius: 0 10px 10px 0;
  color: #cbd5e1;
}

/* ── Code ── */
.nyxia-editor code {
  background: rgba(123, 92, 255, 0.12);
  color: #c4b5fd;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 0.9em;
  font-family: 'Fira Code', monospace;
}
.nyxia-editor pre {
  background: #0e1425;
  border: 1px solid rgba(123, 92, 255, 0.15);
  border-radius: 10px;
  padding: 18px;
  margin: 14px 0;
  overflow-x: auto;
}
.nyxia-editor pre code {
  background: none;
  padding: 0;
  color: #f1f5f9;
}

/* ── Horizontal rule ── */
.nyxia-editor hr {
  border: none;
  border-top: 1px solid rgba(123, 92, 255, 0.2);
  margin: 24px 0;
}

/* ── Scrollbar ── */
.nyxia-editor::-webkit-scrollbar {
  width: 8px;
}
.nyxia-editor::-webkit-scrollbar-track {
  background: transparent;
}
.nyxia-editor::-webkit-scrollbar-thumb {
  background: rgba(123, 92, 255, 0.2);
  border-radius: 4px;
}
.nyxia-editor::-webkit-scrollbar-thumb:hover {
  background: rgba(123, 92, 255, 0.35);
}

/* ── Selection ── */
.nyxia-editor ::selection {
  background: rgba(123, 92, 255, 0.3);
  color: #fff;
}

/* ── Iframe (video) responsive ── */
.nyxia-editor div[data-video-wrapper] {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  border-radius: 12px;
  margin: 18px 0;
  border: 1px solid rgba(123, 92, 255, 0.2);
}
.nyxia-editor div[data-video-wrapper] iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* ── Audio player ── */
.nyxia-editor div[data-audio-wrapper] {
  margin: 14px 0;
  padding: 18px;
  background: rgba(123, 92, 255, 0.08);
  border-radius: 12px;
  border: 1px solid rgba(123, 92, 255, 0.2);
}
.nyxia-editor audio {
  width: 100%;
  outline: none;
  border-radius: 8px;
}
`

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SimpleLessonEditor({
  initialHtml,
  onSave,
  onClose,
  readOnly = false,
}: SimpleLessonEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const styleRef = useRef<HTMLStyleElement | null>(null)

  // ── Popover states ──
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [showVideoInput, setShowVideoInput] = useState(false)
  const [showAudioInput, setShowAudioInput] = useState(false)

  // ── Input values ──
  const [linkUrl, setLinkUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [audioUrl, setAudioUrl] = useState('')

  // ── UI state ──
  const [isSaving, setIsSaving] = useState(false)

  // ── Active formatting tracking ──
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    insertOrderedList: false,
    insertUnorderedList: false,
    createLink: false,
  })
  const [blockType, setBlockType] = useState('p')

  // ── Inject editor styles once ──
  useEffect(() => {
    if (styleRef.current) return
    const style = document.createElement('style')
    style.textContent = EDITOR_STYLES
    document.head.appendChild(style)
    styleRef.current = style
    return () => {
      if (styleRef.current) {
        styleRef.current.remove()
        styleRef.current = null
      }
    }
  }, [])

  // ── Load initial HTML ──
  useEffect(() => {
    if (editorRef.current && initialHtml !== undefined) {
      editorRef.current.innerHTML = initialHtml
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Close all popovers helper ──
  const closeAllPopovers = useCallback(() => {
    setShowColorPicker(false)
    setShowLinkInput(false)
    setShowVideoInput(false)
    setShowAudioInput(false)
  }, [])

  // ── Format command helper ──
  const execCommand = useCallback((command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
  }, [])

  // ── Update active formatting states ──
  const updateActiveStates = useCallback(() => {
    setActiveStates({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikeThrough'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      createLink: document.queryCommandState('createLink'),
    })

    const block = document.queryCommandValue('formatBlock')
    setBlockType(block.replace(/[<>]/g, '').toLowerCase())
  }, [])

  // ── Listen for selection changes ──
  useEffect(() => {
    const handler = () => updateActiveStates()
    document.addEventListener('selectionchange', handler)
    return () => document.removeEventListener('selectionchange', handler)
  }, [updateActiveStates])

  // ── Handle input in the editor ──
  const handleInput = useCallback(() => {
    updateActiveStates()
  }, [updateActiveStates])

  // ── Handle paste — rich text from clipboard ──
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      // Allow default rich-text paste; just update states after
      requestAnimationFrame(updateActiveStates)
    },
    [updateActiveStates]
  )

  // ── Handle block type change (heading / paragraph) ──
  const handleBlockType = useCallback(
    (tag: string) => {
      execCommand('formatBlock', `<${tag}>`)
      updateActiveStates()
    },
    [execCommand, updateActiveStates]
  )

  // ── Handle text color ──
  const handleTextColor = useCallback(
    (color: string) => {
      execCommand('foreColor', color)
      setShowColorPicker(false)
      updateActiveStates()
    },
    [execCommand, updateActiveStates]
  )

  // ── Toggle link popover ──
  const toggleLink = useCallback(() => {
    const wasOpen = showLinkInput
    closeAllPopovers()

    if (!wasOpen) {
      // Pre-fill with existing link if selection is inside one
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        let node = selection.anchorNode as HTMLElement | null
        while (node && node !== editorRef.current) {
          if (node instanceof HTMLAnchorElement) {
            setLinkUrl(node.href || '')
            break
          }
          node = node.parentNode as HTMLElement | null
        }
      }
      setShowLinkInput(true)
    }
  }, [showLinkInput, closeAllPopovers])

  // ── Insert link ──
  const handleInsertLink = useCallback(() => {
    if (!linkUrl.trim()) {
      toast.error('Veuillez entrer une URL')
      return
    }
    editorRef.current?.focus()
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) {
      document.execCommand(
        'createLink',
        false,
        linkUrl.trim()
      )
      // Set link to open in new tab
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        let node = sel.anchorNode as HTMLElement | null
        while (node && node !== editorRef.current) {
          if (node instanceof HTMLAnchorElement) {
            node.target = '_blank'
            node.rel = 'noopener noreferrer'
            break
          }
          node = node.parentNode as HTMLElement | null
        }
      }
    } else {
      document.execCommand(
        'insertHTML',
        false,
        `<a href="${linkUrl.trim()}" target="_blank" rel="noopener noreferrer" style="color:#7B5CFF;text-decoration:underline;">${linkUrl.trim()}</a>`
      )
    }
    setLinkUrl('')
    setShowLinkInput(false)
    updateActiveStates()
  }, [linkUrl, updateActiveStates])

  // ── Remove link ──
  const handleUnlink = useCallback(() => {
    editorRef.current?.focus()
    document.execCommand('unlink', false)
    updateActiveStates()
  }, [updateActiveStates])

  // ── Upload image → base64 ──
  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return

      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5 Mo")
        return
      }

      const reader = new FileReader()
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string
        editorRef.current?.focus()
        document.execCommand(
          'insertHTML',
          false,
          `<img src="${base64}" alt="${file.name}" />`
        )
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }, [])

  // ── Toggle video popover ──
  const toggleVideo = useCallback(() => {
    const wasOpen = showVideoInput
    closeAllPopovers()
    if (!wasOpen) setShowVideoInput(true)
  }, [showVideoInput, closeAllPopovers])

  // ── Insert YouTube embed ──
  const handleInsertVideo = useCallback(() => {
    if (!videoUrl.trim()) {
      toast.error("Veuillez entrer une URL YouTube")
      return
    }
    const videoId = extractYouTubeId(videoUrl.trim())
    if (!videoId) {
      toast.error('URL YouTube non valide')
      return
    }
    editorRef.current?.focus()
    document.execCommand(
      'insertHTML',
      false,
      `<div data-video-wrapper><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
    )
    setVideoUrl('')
    setShowVideoInput(false)
  }, [videoUrl])

  // ── Toggle audio popover ──
  const toggleAudio = useCallback(() => {
    const wasOpen = showAudioInput
    closeAllPopovers()
    if (!wasOpen) setShowAudioInput(true)
  }, [showAudioInput, closeAllPopovers])

  // ── Insert audio player ──
  const handleInsertAudio = useCallback(() => {
    if (!audioUrl.trim()) {
      toast.error("Veuillez entrer une URL audio")
      return
    }
    editorRef.current?.focus()
    document.execCommand(
      'insertHTML',
      false,
      `<div data-audio-wrapper><audio controls><source src="${audioUrl.trim()}" />Votre navigateur ne supporte pas l'élément audio.</audio></div>`
    )
    setAudioUrl('')
    setShowAudioInput(false)
  }, [audioUrl])

  // ── Save ──
  const handleSave = useCallback(() => {
    if (!editorRef.current) return
    setIsSaving(true)
    try {
      const htmlContent = editorRef.current.innerHTML
      if (onSave) onSave({ html_content: htmlContent })
      toast.success('Leçon sauvegardée !')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }, [onSave])

  // ── Render ──

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-purple-500/30 bg-[#0a0f1e] shadow-2xl shadow-purple-900/30 ring-1 ring-purple-500/10">
      {/* ─── Header bar ─── */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-purple-500/25 bg-[#0c1a2e] shrink-0">
        <span className="bg-gradient-to-r from-purple-300 to-purple-100 bg-clip-text text-transparent font-medium text-base tracking-widest uppercase font-[Outfit,sans-serif] select-none">
          ✏️ Éditeur de Leçon
        </span>
        <div className="flex items-center gap-2">
          {onSave && (
            <button
              onClick={handleSave}
              disabled={isSaving || readOnly}
              className="flex items-center gap-2.5 px-6 h-11 rounded-xl bg-gradient-to-r from-[#7B5CFF] to-[#6a4ce8] hover:from-[#6a4ce8] hover:to-[#5b3dd6] text-white text-sm font-semibold transition-all disabled:opacity-50 font-[Outfit,sans-serif] shadow-lg shadow-purple-500/25"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Sauvegarder
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Toolbar ─── */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-4 border-b border-purple-500/25 bg-gradient-to-b from-[#111b30] to-[#0e1425] shrink-0 overflow-x-auto">
          {/* ── Text formatting ── */}
          <ToolbarButton
            tooltip="Gras (Ctrl+B)"
            active={activeStates.bold}
            onClick={() => execCommand('bold')}
          >
            <Bold className="w-[22px] h-[22px]" />
          </ToolbarButton>

          <ToolbarButton
            tooltip="Italique (Ctrl+I)"
            active={activeStates.italic}
            onClick={() => execCommand('italic')}
          >
            <Italic className="w-[22px] h-[22px]" />
          </ToolbarButton>

          <ToolbarButton
            tooltip="Souligné (Ctrl+U)"
            active={activeStates.underline}
            onClick={() => execCommand('underline')}
          >
            <Underline className="w-[22px] h-[22px]" />
          </ToolbarButton>

          <ToolbarButton
            tooltip="Barré"
            active={activeStates.strikethrough}
            onClick={() => execCommand('strikeThrough')}
          >
            <Strikethrough className="w-[22px] h-[22px]" />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* ── Block types ── */}
          <ToolbarButton
            tooltip="Titre 1"
            active={blockType === 'h1'}
            onClick={() => handleBlockType('h1')}
          >
            <Heading1 className="w-[22px] h-[22px]" />
          </ToolbarButton>

          <ToolbarButton
            tooltip="Titre 2"
            active={blockType === 'h2'}
            onClick={() => handleBlockType('h2')}
          >
            <Heading2 className="w-[22px] h-[22px]" />
          </ToolbarButton>

          <ToolbarButton
            tooltip="Paragraphe"
            active={blockType === 'p' || blockType === ''}
            onClick={() => handleBlockType('p')}
          >
            <Pilcrow className="w-[22px] h-[22px]" />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* ── Lists ── */}
          <ToolbarButton
            tooltip="Liste à puces"
            active={activeStates.insertUnorderedList}
            onClick={() => execCommand('insertUnorderedList')}
          >
            <List className="w-[22px] h-[22px]" />
          </ToolbarButton>

          <ToolbarButton
            tooltip="Liste numérotée"
            active={activeStates.insertOrderedList}
            onClick={() => execCommand('insertOrderedList')}
          >
            <ListOrdered className="w-[22px] h-[22px]" />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* ── Alignment ── */}
          <ToolbarButton
            tooltip="Aligner à gauche"
            active={activeStates.justifyLeft}
            onClick={() => execCommand('justifyLeft')}
          >
            <AlignLeft className="w-[22px] h-[22px]" />
          </ToolbarButton>

          <ToolbarButton
            tooltip="Centrer"
            active={activeStates.justifyCenter}
            onClick={() => execCommand('justifyCenter')}
          >
            <AlignCenter className="w-[22px] h-[22px]" />
          </ToolbarButton>

          <ToolbarButton
            tooltip="Aligner à droite"
            active={activeStates.justifyRight}
            onClick={() => execCommand('justifyRight')}
          >
            <AlignRight className="w-[22px] h-[22px]" />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* ── Text color ── */}
          <div className="relative">
            <ToolbarButton
              tooltip="Couleur du texte"
              onClick={() => {
                closeAllPopovers()
                setShowColorPicker((v) => !v)
              }}
            >
              <Palette className="w-[22px] h-[22px]" />
            </ToolbarButton>

            {showColorPicker && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setShowColorPicker(false)} />
                <div className="absolute top-full left-0 mt-1 z-[70] p-3 rounded-xl bg-[#1a1a2e] border border-purple-500/20 shadow-2xl shadow-black/40">
                  <p className="text-sm text-zinc-500 uppercase tracking-wider mb-3 font-[Outfit,sans-serif]">
                    Couleur du texte
                  </p>
                  <div className="grid grid-cols-4 gap-2.5">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => handleTextColor(color.value)}
                        className="w-12 h-12 rounded-xl border-2 border-white/10 hover:border-purple-400 hover:scale-110 transition-all duration-150"
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <ToolbarSeparator />

          {/* ── Link ── */}
          <div className="relative">
            <ToolbarButton
              tooltip="Insérer un lien"
              active={activeStates.createLink}
              onClick={toggleLink}
            >
              <Link className="w-[22px] h-[22px]" />
            </ToolbarButton>

            {showLinkInput && (
              <InlineUrlInput
                placeholder="https://exemple.com"
                value={linkUrl}
                onChange={setLinkUrl}
                onSubmit={handleInsertLink}
                onCancel={() => setShowLinkInput(false)}
              />
            )}
          </div>

          {/* ── Unlink ── */}
          <ToolbarButton
            tooltip="Supprimer le lien"
            onClick={handleUnlink}
          >
            <Unlink className="w-[22px] h-[22px]" />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* ── Image ── */}
          <ToolbarButton
            tooltip="Insérer une image"
            onClick={handleImageUpload}
          >
            <ImageIcon className="w-[22px] h-[22px]" />
          </ToolbarButton>

          {/* ── Video ── */}
          <div className="relative">
            <ToolbarButton
              tooltip="Vidéo YouTube"
              onClick={toggleVideo}
            >
              <Video className="w-[22px] h-[22px]" />
            </ToolbarButton>

            {showVideoInput && (
              <InlineUrlInput
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={setVideoUrl}
                onSubmit={handleInsertVideo}
                onCancel={() => setShowVideoInput(false)}
              />
            )}
          </div>

          {/* ── Audio ── */}
          <div className="relative">
            <ToolbarButton
              tooltip="Insérer un audio"
              onClick={toggleAudio}
            >
              <Music className="w-[22px] h-[22px]" />
            </ToolbarButton>

            {showAudioInput && (
              <InlineUrlInput
                placeholder="https://exemple.com/audio.mp3"
                value={audioUrl}
                onChange={setAudioUrl}
                onSubmit={handleInsertAudio}
                onCancel={() => setShowAudioInput(false)}
              />
            )}
          </div>
        </div>
      )}

      {/* ─── Editor content area ─── */}
      <div className="flex-1 relative">
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyUp={updateActiveStates}
          onMouseUp={updateActiveStates}
          className="nyxia-editor"
          role="textbox"
          aria-multiline="true"
          aria-label="Éditeur de contenu de leçon"
          data-placeholder="Commence à écrire ta leçon ici…"
        />
      </div>
    </div>
  )
}
