'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StarryBackground } from '@/components/starry-background'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Crown, Loader2, CheckCircle, UserPlus, DollarSign, BarChart3, Rocket } from 'lucide-react'
import { toast } from 'sonner'
import { signup } from '@/lib/auth-client'

const AMBASSADOR_REFERRAL_CODE = 'SUPERADM'

const benefits = [
  {
    icon: DollarSign,
    title: '💰 Gagnez 25% sur chaque vente',
    description:
      'Recevez une commission généreuse sur chaque client que vous apportez. Pas de plafond, pas de limite.',
    gradient: 'from-yellow-500 to-amber-600',
    border: 'border-yellow-500/20',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-300',
  },
  {
    icon: BarChart3,
    title: '📊 Dashboard complet en temps réel',
    description:
      'Suivez vos clics, conversions et revenus en direct. Des analytics puissants pour optimiser votre stratégie.',
    gradient: 'from-blue-500 to-cyan-600',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/10',
    text: 'text-blue-300',
  },
  {
    icon: Rocket,
    title: '🚀 Programme 3 niveaux de commissions',
    description:
      'Gagnez sur 3 niveaux : vos ventes directes, les ventes de vos filleuls, et les ventes de leurs filleuls.',
    gradient: 'from-purple-500 to-pink-600',
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/10',
    text: 'text-purple-300',
  },
]

function AmbassadeurSignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signup({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        referralCode: AMBASSADOR_REFERRAL_CODE,
      })

      if (!result.success) {
        toast.error(result.error || "Erreur lors de l'inscription")
        return
      }

      setIsSuccess(true)
      toast.success('Bienvenue dans le programme Ambassadeur !')

      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'inscription")
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
          <h2 className="text-2xl font-bold text-white mb-2">
            Bienvenue, Ambassadeur !
          </h2>
          <p className="text-zinc-400 mb-4">
            Votre compte ambassadeur a été créé avec succès.
          </p>
          <p className="text-sm text-zinc-500">
            Redirection vers votre dashboard...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card w-full max-w-md relative z-10">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">AffiliationPro</span>
        </div>
        <CardTitle className="text-2xl text-white">
          Rejoignez le programme
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Créez votre compte ambassadeur et commencez à gagner
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-zinc-300">
              Nom complet
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Diane Boyer"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">
              Mot de passe
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              minLength={6}
              className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500"
            />
            <p className="text-xs text-zinc-500">Minimum 6 caractères</p>
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
                <Crown className="w-5 h-5 mr-2" />
                Devenir Ambassadeur
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          Déjà un compte ?{' '}
          <Link
            href="/login"
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            Se connecter
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-purple-500/10">
          <div className="flex flex-wrap justify-center gap-2">
            <Badge className="bg-yellow-500/10 text-yellow-300 border-yellow-500/20">
              🏆 Statut Ambassadeur
            </Badge>
            <Badge className="bg-green-500/10 text-green-300 border-green-500/20">
              Inscription gratuite
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AmbassadeurPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 py-8 overflow-auto">
      <StarryBackground />

      {/* Hero Section */}
      <div className="relative z-10 text-center mt-12 mb-10 max-w-3xl">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/25">
          <Crown className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          Devenez{' '}
          <span className="gradient-text">Ambassadeur</span>{' '}
          AffiliationPro
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Rejoignez notre programme exclusif et transformez votre réseau en
          revenus récurrents. Des commissions sur 3 niveaux, un dashboard
          premium, et un accompagnement dédié.
        </p>
      </div>

      {/* Benefits Section */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-12">
        {benefits.map((benefit) => (
          <Card
            key={benefit.title}
            className={`glass-card ${benefit.border} hover:scale-[1.02] transition-transform duration-300`}
          >
            <CardContent className="p-6">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-4`}
              >
                <benefit.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {benefit.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Signup Form */}
      <div className="relative z-10 w-full flex justify-center mb-16">
        <AmbassadeurSignupForm />
      </div>

      {/* Footer CTA */}
      <div className="relative z-10 text-center mb-8">
        <p className="text-sm text-zinc-500">
          En rejoignant le programme Ambassadeur, vous acceptez nos{' '}
          <span className="text-zinc-400 cursor-pointer hover:text-zinc-300">
            conditions d&apos;utilisation
          </span>
        </p>
      </div>
    </div>
  )
}
