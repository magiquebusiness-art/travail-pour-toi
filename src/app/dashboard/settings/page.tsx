'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  Mail,
  CreditCard,
  Wallet,
  ArrowRight,
  Shield,
  Check,
  X,
  Loader2,
  Upload,
  Palette,
  Clock,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  affiliate_code: string
  avatar_url: string | null
  paypal_email: string | null
  created_at: string
}

interface StripeConnectStatus {
  connected: boolean
  onboardingComplete?: boolean
  payoutsEnabled?: boolean
  chargesEnabled?: boolean
  detailsSubmitted?: boolean
  businessName?: string
  email?: string
  country?: string
}

export default function DashboardSettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnectingStripe, setIsConnectingStripe] = useState(false)

  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatus | null>(null)

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) throw new Error('Erreur')
      const data = await res.json()
      setUser(data.user)
    } catch {
      toast.error('Erreur de chargement')
    }
  }, [])

  const fetchStripeStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/connect/status')
      if (res.ok) {
        const data = await res.json()
        setStripeStatus(data)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchUser(), fetchStripeStatus()]).finally(() => setIsLoading(false))
  }, [fetchUser, fetchStripeStatus])

  const handleConnectStripe = async () => {
    setIsConnectingStripe(true)
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur de connexion Stripe')
      setIsConnectingStripe(false)
    }
  }

  const userInitials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48 bg-zinc-800" />
        <Skeleton className="h-60 w-full bg-zinc-800 rounded-2xl" />
        <Skeleton className="h-48 w-full bg-zinc-800 rounded-2xl" />
        <Skeleton className="h-48 w-full bg-zinc-800 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <User className="w-6 h-6 text-purple-400" />
          Paramètres
        </h2>
        <p className="text-zinc-400 text-sm mt-1">Gerez votre profil et vos preferences</p>
      </div>

      {/* Profile Section */}
      <Card className="glass-card border-0 hover:transform-none">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <User className="w-5 h-5 text-purple-400" />
            Profil
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Vos informations personnelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-[#7B5CFF] to-[#6C4FE0] text-white text-lg font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-white font-semibold text-lg">
                {user?.full_name || 'Sans nom'}
              </h3>
              <p className="text-zinc-400 text-sm">{user?.email}</p>
            </div>
          </div>

          <Separator className="bg-purple-500/10" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-500 text-xs uppercase tracking-wider">Nom complet</Label>
              <Input
                value={user?.full_name || ''}
                readOnly
                className="bg-white/[0.03] border-purple-500/10 text-zinc-300 text-sm rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-500 text-xs uppercase tracking-wider">Email</Label>
              <Input
                value={user?.email || ''}
                readOnly
                className="bg-white/[0.03] border-purple-500/10 text-zinc-300 text-sm rounded-xl"
              />
            </div>
          </div>

          <p className="text-zinc-500 text-xs flex items-center gap-1">
            <Mail className="w-3 h-3" />
            Contactez le support pour modifier vos informations personnelles
          </p>
        </CardContent>
      </Card>

      {/* Stripe Connect Section */}
      <Card className="glass-card border-0 hover:transform-none">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <CreditCard className="w-5 h-5 text-[#F4C842]" />
            Paiements Stripe
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Connectez votre compte Stripe pour recevoir vos paiements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {stripeStatus?.connected ? (
            <>
              {/* Connected state */}
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/15">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-green-400 font-medium text-sm">Compte connecte</p>
                    <p className="text-zinc-400 text-xs">
                      {stripeStatus.businessName || stripeStatus.email || 'Compte Stripe Express'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-purple-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    {stripeStatus.chargesEnabled ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span className="text-zinc-400 text-xs">Paiements</span>
                  </div>
                  <p className={`text-sm font-medium ${stripeStatus.chargesEnabled ? 'text-green-400' : 'text-red-400'}`}>
                    {stripeStatus.chargesEnabled ? 'Actives' : 'Inactifs'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-purple-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    {stripeStatus.payoutsEnabled ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span className="text-zinc-400 text-xs">Versements</span>
                  </div>
                  <p className={`text-sm font-medium ${stripeStatus.payoutsEnabled ? 'text-green-400' : 'text-amber-400'}`}>
                    {stripeStatus.payoutsEnabled ? 'Actives' : 'En attente'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-purple-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    {stripeStatus.onboardingComplete ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span className="text-zinc-400 text-xs">Statut</span>
                  </div>
                  <p className={`text-sm font-medium ${stripeStatus.onboardingComplete ? 'text-green-400' : 'text-amber-400'}`}>
                    {stripeStatus.onboardingComplete ? 'Complet' : 'Incomplet'}
                  </p>
                </div>
              </div>

              {!stripeStatus.onboardingComplete && (
                <Button
                  onClick={handleConnectStripe}
                  disabled={isConnectingStripe}
                  className="btn-primary border-0 text-sm"
                >
                  {isConnectingStripe ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Completer l&apos;onboarding Stripe
                    </>
                  )}
                </Button>
              )}
            </>
          ) : (
            <>
              {/* Not connected state */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-purple-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Aucun compte connecte</p>
                    <p className="text-zinc-400 text-xs">
                      Connectez votre compte Stripe pour recevoir les paiements de vos formations
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleConnectStripe}
                disabled={isConnectingStripe}
                className="btn-gold border-0 text-sm"
              >
                {isConnectingStripe ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Connecter Stripe
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Branding Section (Placeholder) */}
      <Card className="glass-card border-0 hover:transform-none relative overflow-hidden">
        <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Palette className="w-5 h-5 text-purple-400" />
                Branding
              </CardTitle>
              <CardDescription className="text-zinc-500 mt-1">
                Personnalisez l&apos;apparence de vos formations
              </CardDescription>
            </div>
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">
              Bientôt disponible
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 opacity-60 pointer-events-none">
          <div className="space-y-2">
            <Label className="text-zinc-500 text-xs uppercase tracking-wider">Logo de marque</Label>
            <div className="border-2 border-dashed border-purple-500/20 rounded-xl p-8 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-zinc-500" />
              <p className="text-zinc-500 text-sm">Glissez votre logo ici</p>
              <p className="text-zinc-600 text-xs mt-1">PNG, JPG, max 2 Mo</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-500 text-xs uppercase tracking-wider">Couleur principale</Label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#7B5CFF] border border-purple-500/20" />
              <Input
                value="#7B5CFF"
                readOnly
                className="bg-white/[0.03] border-purple-500/10 text-zinc-300 text-sm rounded-xl w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="glass-card border-0 border-red-500/20 hover:transform-none relative overflow-hidden">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2 text-base">
            <AlertTriangle className="w-5 h-5" />
            Zone dangereuse
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Actions irreversibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
            <div>
              <p className="text-white font-medium text-sm">Supprimer mon compte</p>
              <p className="text-zinc-500 text-xs mt-0.5">
                Cette action est definitive et supprimera toutes vos donnees
              </p>
            </div>
            <Button
              variant="ghost"
              disabled
              className="text-red-400/50 border border-red-500/10 rounded-xl text-xs cursor-not-allowed"
            >
              Bientôt disponible
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
