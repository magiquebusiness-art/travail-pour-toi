'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Copy, FileCode, Loader2 } from 'lucide-react'

interface CodeFile {
  name: string
  path: string
  content: string
  language: string
  lines: number
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }, [text])

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleCopy}
        className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 cursor-pointer border-0 ${
          copied
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-[#7B5CFF]/15 text-[#a78bfa] border border-[#7B5CFF]/30 hover:bg-[#7B5CFF]/25 hover:text-[#c4b5fd]'
        }`}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copié !
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copier le code
          </>
        )}
      </Button>
      {copied && (
        <span className="text-emerald-400 text-sm font-medium animate-fade-in">
          ✓ Contenu copié dans le presse-papier
        </span>
      )}
    </div>
  )
}

function CodeBlock({ content, language }: { content: string; language: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-[#1e293b] bg-[#0d1117]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#1e293b]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-xs text-[#8b949e] font-mono">{language.toUpperCase()}</span>
      </div>

      {/* Code content */}
      <div className="overflow-auto max-h-[500px] custom-scrollbar">
        <pre className="p-4 text-[13px] leading-[1.7] font-mono">
          <code className="text-[#c9d1d9]">{content}</code>
        </pre>
      </div>
    </div>
  )
}

function FileSection({ file }: { file: CodeFile }) {
  return (
    <section className="w-full">
      {/* File header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#7B5CFF]/15 border border-[#7B5CFF]/25 flex items-center justify-center flex-shrink-0">
            <FileCode className="h-5 w-5 text-[#a78bfa]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white font-mono">
              📁 {file.path}
            </h2>
            <p className="text-sm text-[#8b949e] mt-0.5">
              {file.lines} lignes · {languageLabel(file.language)}
            </p>
          </div>
        </div>
        <CopyButton text={file.content} label={file.path} />
      </div>

      {/* Code display */}
      <CodeBlock content={file.content} language={file.language} />
    </section>
  )
}

function languageLabel(lang: string): string {
  switch (lang) {
    case 'html': return 'HTML'
    case 'javascript': return 'JavaScript'
    case 'css': return 'CSS'
    default: return lang.toUpperCase()
  }
}

export default function CodeViewerPage() {
  const [files, setFiles] = useState<CodeFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await fetch('/api/code-files')
        if (!res.ok) throw new Error('Erreur serveur')
        const data = await res.json()
        setFiles(data.files)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }
    fetchFiles()
  }, [])

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0A1628' }}
    >
      {/* Header */}
      <header className="w-full sticky top-0 z-50 border-b border-[#7B5CFF]/12 backdrop-blur-xl" style={{ background: 'rgba(10, 22, 40, 0.92)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #7B5CFF, #5A6CFF)',
                boxShadow: '0 0 20px rgba(123, 92, 255, 0.35)',
              }}
            >
              <FileCode className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                📋 NyXia TTS — Fichiers à copier
              </h1>
              <p className="text-xs sm:text-sm text-[#8891B8] hidden sm:block">
                Copie le code de chaque fichier pour ton projet
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#7B5CFF]/20 bg-[#7B5CFF]/5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-[#a78bfa]">
              {files.length > 0 ? `${files.length} fichiers prêts` : 'Chargement...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 text-[#7B5CFF] animate-spin" />
            <p className="text-[#8891B8] text-sm">Chargement des fichiers...</p>
          </div>
        )}

        {error && (
          <div
            className="rounded-xl p-6 border border-red-500/25 text-center"
            style={{ background: 'rgba(239, 68, 68, 0.06)' }}
          >
            <p className="text-red-400 font-medium text-lg mb-2">
              ⚠️ Erreur de chargement
            </p>
            <p className="text-red-300/70 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-12">
            {/* Intro */}
            <div
              className="rounded-xl p-5 border border-[#7B5CFF]/15"
              style={{ background: 'rgba(123, 92, 255, 0.04)' }}
            >
              <p className="text-[#D6D9F0] text-sm leading-relaxed">
                💜 Voici les deux fichiers nécessaires pour intégrer la synthèse vocale NyXia TTS (voix Denise).
                Clique sur <strong className="text-[#a78bfa]">« Copier le code »</strong> pour chaque fichier,
                puis colle-le dans ton projet aux bons emplacements.
              </p>
            </div>

            {/* File sections */}
            {files.map((file) => (
              <FileSection key={file.path} file={file} />
            ))}

            {/* Footer note */}
            <div
              className="rounded-xl p-5 border border-[#F4C842]/15 text-center mt-8"
              style={{ background: 'rgba(244, 200, 66, 0.03)' }}
            >
              <p className="text-[#F4C842] text-sm font-medium">
                ⭐ N&apos;oublie pas de créer le dossier <code className="font-mono bg-[#1a2554] px-2 py-0.5 rounded text-[#a78bfa]">functions/api/</code> pour le fichier JS
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="w-full mt-auto border-t border-[#7B5CFF]/8 py-6"
        style={{ background: 'rgba(10, 22, 40, 0.6)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-[#4a5278]">
            NyXia TTS · Outil de copie de fichiers ·{' '}
            <span style={{ color: '#7B5CFF' }}>💡</span> Utilise les boutons ci-dessus pour copier
          </p>
        </div>
      </footer>

      {/* Inline keyframes for fade-in */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease forwards;
        }

        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0d1117;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #30363d;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #484f58;
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: #0d1117;
        }
      `}</style>
    </div>
  )
}
