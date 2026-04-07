'use client'
export const runtime = 'edge'

import { useEffect } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

export default function LogoutPage() {
  useEffect(() => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    const timer = setTimeout(() => {
      window.location.href = '/'
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
          <p className="text-white text-lg">À bientôt !</p>
        </div>
      </div>
    </div>
  )
}
