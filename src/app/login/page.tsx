'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StarryBackground } from '@/components/StarryBackground'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sparkles, Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { login } from '@/lib/auth-client'

function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const message = params.get('message')
    const redirect = params.get('redirect')
    if (message) {
      toast.success(message)
    }
    if (redirect) {
      setRedirectTo(redirect)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      })

      if (!result.success) {
        toast.error(result.error || 'Erreur de connexion')
        return
      }

      toast.success('Connexion réussie !')

      // Redirect based on role
      if (result.user?.role === 'super_admin') {
        router.push('/super-admin')
      } else if (result.user?.role === 'admin') {
        router.push('/admin')
      } else if (result.user?.role === 'client') {
        router.push('/dashboard')
      } else if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.push('/ambassadeur')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="glass-card w-full max-w-md relative z-10">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">NyXia</span>
        </div>
        <CardTitle className="text-2xl text-white">Connexion</CardTitle>
        <CardDescription className="text-zinc-400">
          Connecte-toi à ton espace créateur
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Courriel</Label>
            <Input
              id="email"
              type="email"
              placeholder="toi@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full glass-button text-white border-0 py-6 text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connexion...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Se connecter
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
            Connexion réservée aux membres
          </Link>
        </div>

        <div className="mt-4 text-center text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-400">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <StarryBackground />
      <LoginForm />
    </div>
  )
}
