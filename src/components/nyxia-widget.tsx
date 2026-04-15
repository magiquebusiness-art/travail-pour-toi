'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface NyXiaMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface NyXiaWidgetProps {
  mode?: 'pastille' | 'chat'
  userName?: string
}

export function NyXiaWidget({ mode = 'pastille', userName = '' }: NyXiaWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<NyXiaMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest('.overflow-y-auto')
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Message d'accueil automatique après 3 secondes
  useEffect(() => {
    if (messages.length === 0) {
      const timer = setTimeout(() => {
        setMessages([{
          role: 'assistant',
          content: `Bonjour${userName ? ` ${userName}` : ''} ! ✨ Je suis NyXia, ton assistante IA. Comment puis-je t'aider aujourd'hui ?`,
          timestamp: new Date()
        }])
        if (!isOpen) setUnreadCount(1)
      }, 3000)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: NyXiaMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsTyping(true)

    try {
      // Envoyer l'historique pour éviter les répétitions
      const history = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }))

      // Mode chat (zones privées) → closer z-ai/glm-5v-turbo
      // Mode pastille (public) → helpdesk llama-3.1-8b-instant
      const chatEndpoint = mode === 'chat' ? '/api/nyxia-closer' : '/api/nyxia-chat'

      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content, history, userName })
      })

      if (response.ok) {
        const data = await response.json()
        const botMessage: NyXiaMessage = {
          role: 'assistant',
          content: data.reply || 'Comment puis-je t\'aider ? 💜',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botMessage])
        if (!isOpen) setUnreadCount(prev => prev + 1)
      } else {
        throw new Error('API non disponible')
      }
    } catch {
      const botMessage: NyXiaMessage = {
        role: 'assistant',
        content: 'Oups, un petit problème de connexion 🔄 Réessaie dans un instant, je suis toujours là pour toi ! 💜',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const speakMsg = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'fr-FR'
      utterance.rate = 1.05
      utterance.pitch = 1.1
      const voices = speechSynthesis.getVoices()
      const frVoice =
        voices.find(v => v.lang === 'fr-FR' && (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Amazon'))) ||
        voices.find(v => v.lang.startsWith('fr') && !v.localService) ||
        voices.find(v => v.lang.startsWith('fr')) ||
        voices[0]
      if (frVoice) utterance.voice = frVoice
      speechSynthesis.speak(utterance)
    }
  }

  // Mode chat intégré dans le dashboard (pas de pastille flottante)
  if (mode === 'chat') {
    return (
      <div className="glass-card border-purple-500/20 rounded-2xl overflow-hidden mb-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500/40">
                <Image src="/NyXia.png" alt="NyXia" width={40} height={40} className="object-cover" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">NyXia ✦</p>
              <p className="text-green-400 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                En ligne
              </p>
            </div>
          </div>
          <button
            onClick={() => speakMsg(messages[messages.length - 1]?.content || '')}
            className="text-zinc-400 hover:text-purple-400 transition-colors p-2 rounded-lg hover:bg-purple-500/10"
            title="Écouter (TTS)"
          >
            🔊
          </button>
        </div>

        {/* Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full overflow-hidden mr-2 shrink-0 border border-purple-500/30">
                  <Image src="/NyXia.png" alt="N" width={28} height={28} className="object-cover" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-br-sm'
                    : 'bg-white/10 text-zinc-200 border border-purple-500/15 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full overflow-hidden mr-2 shrink-0 border border-purple-500/30">
                <Image src="/NyXia.png" alt="N" width={28} height={28} className="object-cover" />
              </div>
              <div className="bg-white/10 border border-purple-500/15 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-purple-500/20 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); sendMessage() } }}
            placeholder="Écris à NyXia..."
            className="flex-1 bg-white/5 border border-purple-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
          <button
            onClick={(e) => { e.preventDefault(); sendMessage() }}
            disabled={isTyping || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium text-sm hover:from-purple-400 hover:to-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            type="button"
          >
            ➤
          </button>
        </div>
      </div>
    )
  }

  // Mode pastille flottante
  return (
    <>
      {/* Pastille flottante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] w-16 h-16 rounded-full border-2 border-purple-500/50 bg-purple-900/80 backdrop-blur-xl cursor-pointer flex items-center justify-center shadow-lg shadow-purple-500/30 hover:scale-110 hover:shadow-purple-500/50 transition-all duration-300 group"
      >
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <Image src="/NyXia.png" alt="NyXia" width={48} height={48} className="object-cover group-hover:scale-110 transition-transform" />
        </div>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full text-white text-xs font-bold flex items-center justify-center animate-pulse border-2 border-background">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panneau de chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9999] w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20 border border-purple-500/30 backdrop-blur-xl bg-[#0a0f23]/95">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-purple-500/40">
                  <Image src="/NyXia.png" alt="NyXia" width={36} height={36} className="object-cover" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0f23]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">NyXia ✦</p>
                <p className="text-green-400 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  En ligne
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white transition-colors p-1"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto p-3 space-y-2.5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full overflow-hidden mr-1.5 shrink-0 border border-purple-500/30 mt-1">
                    <Image src="/NyXia.png" alt="N" width={24} height={24} className="object-cover" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-br-sm'
                      : 'bg-white/10 text-zinc-200 border border-purple-500/10 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full overflow-hidden mr-1.5 shrink-0 border border-purple-500/30 mt-1">
                  <Image src="/NyXia.png" alt="N" width={24} height={24} className="object-cover" />
                </div>
                <div className="bg-white/10 border border-purple-500/10 rounded-2xl rounded-bl-sm px-3 py-2.5">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-purple-500/20 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); sendMessage() } }}
              placeholder="Écris à NyXia..."
              className="flex-1 bg-white/5 border border-purple-500/15 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/40 transition-colors"
            />
            <button
              onClick={(e) => { e.preventDefault(); sendMessage() }}
              disabled={isTyping || !input.trim()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium hover:from-purple-400 hover:to-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}
