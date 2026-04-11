'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StarryBackground } from '@/components/StarryBackground'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Diamond, Loader2, CheckCircle, UserPlus, GraduationCap, DollarSign, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caracteres')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          businessName: formData.businessName || null,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Erreur lors de l\'inscription')
      }

      setIsSuccess(true)
      toast.success('Compte cree avec succes !')

      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'inscription')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <StarryBackground />
        <Card className="glass-card w-full max-w-md relative z-10 border-green-500/30">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Bienvenue sur NyXia !</h2>
            <p className="text-zinc-400 mb-4">
              Ton espace createur est pret. Tu peux maintenant creer tes formations.
            </p>
            <p className="text-sm text-zinc-500">
              Redirection vers ton tableau de bord...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
      <StarryBackground />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center shadow-lg shadow-[#7B5CFF]/30">
              <Diamond className="h-5 w-5 text-white" />
            </div>
            <span className="font-[var(--font-heading)] text-2xl font-bold gradient-text-violet">NyXia MarketPlace</span>
          </Link>
        </div>

        <Card className="glass-card border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Creer mon espace createur</CardTitle>
            <CardDescription className="text-zinc-400">
              Cree et vends tes formations en ligne
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-zinc-300">Nom complet *</Label>
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
                <Label htmlFor="email" className="text-zinc-300">Courriel *</Label>
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
                <Label htmlFor="businessName" className="text-zinc-300">
                  Nom de ton entreprise <span className="text-zinc-500">(optionnel)</span>
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder="Mon entreprise"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-zinc-300">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repete ton mot de passe"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-gold text-white border-0 py-6 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creation en cours...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Creer mon espace
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-zinc-400">
              Deja un compte ?{' '}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                Se connecter
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: GraduationCap, label: 'Formations illimitees' },
            { icon: DollarSign, label: 'Paiements securises' },
            { icon: BarChart3, label: 'Statistiques detaillees' },
          ].map((feature) => (
            <div key={feature.label} className="text-center">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
                <feature.icon className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-xs text-zinc-400">{feature.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-400">
            &larr; Retour a l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
