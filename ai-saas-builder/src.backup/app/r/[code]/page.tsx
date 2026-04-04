'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { StarryBackground } from '@/components/starry-background'
import { Sparkles } from 'lucide-react'

export const runtime = 'edge'

export default function ReferralRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const trackReferral = async () => {
      try {
        // Track the referral click
        const response = await fetch('/api/referrals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })

        if (response.ok) {
          setStatus('success')
          // Set a cookie or localStorage for tracking
          localStorage.setItem('referral_code', code)
          
          // Redirect to signup after a short delay
          setTimeout(() => {
            router.push('/signup')
          }, 2000)
        } else {
          setStatus('error')
        }
      } catch (error) {
        console.error('Referral tracking error:', error)
        setStatus('error')
      }
    }

    if (code) {
      trackReferral()
    }
  }, [code, router])

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <StarryBackground />
      
      <div className="relative z-10 text-center">
        {status === 'loading' && (
          <>
            <Sparkles className="w-12 h-12 text-purple-400 animate-pulse mx-auto mb-4" />
            <p className="text-white text-xl">Redirection en cours...</p>
            <p className="text-zinc-400 text-sm mt-2">Code de parrainage: {code}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-white text-xl">Parrainage détecté !</p>
            <p className="text-zinc-400 text-sm mt-2">Vous allez être redirigé...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-white text-xl">Code invalide</p>
            <p className="text-zinc-400 text-sm mt-2">
              <a href="/signup" className="text-purple-400 hover:underline">
                Continuer sans parrain
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
