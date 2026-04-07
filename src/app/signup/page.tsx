'use client'
export const runtime = 'edge'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StarryBackground } from '@/components/StarryBackground'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Loader2, CheckCircle, UserPlus, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { signup } from '@/lib/auth-client'
import { NyXiaWidget } from '@/components/nyxia-widget'

function SignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    referralCode: '',
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      setFormData(prev => ({ ...prev, referralCode: ref.toUpperCase() }))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signup({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        referralCode: formData.referralCode || undefined,
      })

      if (!result.success) {
        toast.error(result.error || 'Erreur lors de l\'inscription')
        return
      }

      setIsSuccess(true)
      toast.success('Compte créé avec succès !')

      // Redirect based on role
      setTimeout(() => {
        if (result.user?.role === 'super_admin') {
          router.push('/super-admin')
        } else if (result.user?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      }, 1500)
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'inscription')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="glass-card w-full max-w-md relative z-10 border-green-500/30">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Bienvenue !</h2>
          <p className="text-zinc-400 mb-4">
            Ton compte a été créé avec succès.
          </p>
          <p className="text-sm text-zinc-500">
            Redirection vers ton dashboard...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card w-full max-w-md relative z-10">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">AffiliationPro</span>
        </div>
        <CardTitle className="text-2xl text-white">Créer un compte</CardTitle>
        <CardDescription className="text-zinc-400">
          Rejoins le programme d&apos;affiliation 3 niveaux
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-zinc-300">Nom complet</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Diane Boyer"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500"
            />
          </div>

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
              minLength={6}
              className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500"
            />
            <p className="text-xs text-zinc-500">Minimum 6 caractères</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referralCode" className="text-zinc-300">
              Code de parrainage <span className="text-zinc-500">(optionnel)</span>
            </Label>
            <Input
              id="referralCode"
              type="text"
              placeholder="ABC123XYZ"
              value={formData.referralCode}
              onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
              className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500 font-mono uppercase"
            />
            {formData.referralCode && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Gift className="w-4 h-4" />
                <span>Tu seras parrainé !</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full glass-button text-white border-0 py-6 text-lg group"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                Créer mon compte gratuit
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
            Se connecter
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-purple-500/10">
          <p className="text-xs text-zinc-500 text-center mb-3">En créant un compte, tu obtiens :</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20">
              3 niveaux de commissions
            </Badge>
            <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20">
              Dashboard complet
            </Badge>
            <Badge className="bg-green-500/10 text-green-300 border-green-500/20">
              Lien d&apos;affiliation unique
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SignupPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
      <StarryBackground />
      <SignupForm />
      <NyXiaWidget mode="pastille" />
    </div>
  )
}
