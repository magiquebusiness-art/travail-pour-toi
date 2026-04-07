'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StarryBackground } from '@/components/starry-background'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Users,
  DollarSign,
  Copy,
  Check,
  Sparkles,
  ShoppingCart,
  Clock,
  Share2,
  Gift,
  UserPlus,
  BarChart3,
  Eye,
  Loader2,
  Crown,
  Calendar,
  Settings,
  CreditCard,
  LogOut,
  MessageSquare,
  TrendingUp,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import type { Profile, Affiliate, Sale } from '@/types/database'

// Interface pour les membres de l'équipe
interface TeamMember {
  id: string
  full_name: string | null
  email: string
  level: number
  created_at: string
}

// Interface pour les messages
interface AdminMessage {
  id: string
  subject: string
  content: string
  created_at: string
  read: boolean
}

interface DashboardStats {
  totalEarnings: number
  pendingCommissions: number
  totalClicks: number
  l1Referrals: number
  l2Referrals: number
  l3Referrals: number
  recentSales: Sale[]
  weeklySales: { date: string; total: number; count: number }[]
}

interface DashboardData {
  profile: Profile & { paypal_email?: string | null }
  affiliate: (Affiliate & { program: { name: string; commission_l1: number; commission_l2: number; commission_l3: number } | null }) | null
  stats: DashboardStats
  parentInfo: { full_name: string | null; email: string } | null
  isAdmin?: boolean
  team?: TeamMember[]
  messages?: AdminMessage[]
}

export default function DashboardPage() {
  const router = useRouter()
  const { logout, isLoggingOut } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [paypalEmail, setPaypalEmail] = useState('')
  const [isSavingPaypal, setIsSavingPaypal] = useState(false)

  useEffect(() => {
    fetchDashboard()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard')
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(result.error)
      }

      if (result.isSuperAdmin) {
        router.push('/super-admin')
        return
      }

      if (result.isAdmin) {
        router.push('/admin')
        return
      }

      setData(result)
      setPaypalEmail(result.profile?.paypal_email || '')
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
    }
  }

  const copyLink = () => {
    const link = data?.affiliate?.affiliate_link || `${window.location.origin}/r/${data?.profile?.affiliate_code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Lien copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSavePaypal = async () => {
    setIsSavingPaypal(true)
    try {
      const response = await fetch('/api/affiliate/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paypalEmail }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('PayPal enregistré !')
      fetchDashboard()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsSavingPaypal(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    })
  }

  const handleNativeShare = () => {
    const link = data?.affiliate?.affiliate_link || `${window.location.origin}/r/${data?.profile?.affiliate_code}`
    const shareData = {
      title: 'AffiliationPro',
      text: 'Rejoignez mon équipe !',
      url: link,
    }
    if (navigator.share) {
      navigator.share(shareData)
        .then(() => toast.success('Partagé !'))
        .catch(() => toast.info('Annulé'))
    } else {
      copyLink()
      toast.info('Lien copié ! Collez-le sur Instagram ou TikTok.')
    }
  }

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { weekday: 'short' })
  }

  const maxWeeklyTotal = Math.max(...(data?.stats.weeklySales.map(s => s.total) || [1]), 1)

  const maskEmail = (email: string) => {
    const [user, domain] = email.split('@')
    if (!domain) return email
    return `${user.slice(0, 2)}***@${domain}`
  }

  const formatDateFull = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const shareText = 'Rejoignez mon équipe avec AffiliationPro !'

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <StarryBackground />
        <div className="relative z-10 text-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <StarryBackground />
        <Card className="glass-card max-w-md relative z-10">
          <CardContent className="p-8 text-center">
            <p className="text-zinc-400 mb-4">Impossible de charger les données</p>
            <Button onClick={fetchDashboard} className="glass-button">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { profile, affiliate, stats, team = [], messages = [] } = data
  const referralLink = affiliate?.affiliate_link || `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${profile.affiliate_code}`
  const totalReferrals = stats.l1Referrals + stats.l2Referrals + stats.l3Referrals

  return (
    <div className="relative min-h-screen">
      <StarryBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-purple-500/10">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">AffiliationPro</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className={`text-zinc-400 hover:text-white ${showSettings ? 'text-white bg-white/10' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4 mr-2" />
            PayPal
          </Button>
          <div className="hidden md:block text-right">
            <p className="text-sm text-white font-medium">{profile.full_name || 'Affilié'}</p>
            <p className="text-xs text-zinc-500">{profile.email}</p>
          </div>
          <Button 
            variant="ghost" 
            className="text-zinc-400 hover:text-white"
            onClick={logout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
            Déconnexion
          </Button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="relative z-10 px-6 pt-4 md:px-12 lg:px-24 border-b border-purple-500/10 pb-6">
          <div className="max-w-6xl mx-auto">
            <Card className="glass-card border-0 max-w-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  Configuration PayPal
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Indiquez votre email PayPal pour recevoir vos paiements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    className="bg-white/5 border-purple-500/20 text-white"
                  />
                  <Button onClick={handleSavePaypal} disabled={isSavingPaypal} className="glass-button">
                    {isSavingPaypal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </Button>
                </div>
                {data?.profile?.paypal_email && (
                  <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    PayPal configuré: {data.profile.paypal_email}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 px-6 py-8 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Bienvenue, {profile.full_name?.split(' ')[0] || 'Affilié'} 👋
            </h1>
            <p className="text-zinc-400">
              Voici un aperçu de vos performances d&apos;affiliation
            </p>
          </div>

          {/* MESSAGES DU SUPER ADMIN */}
          {messages.length > 0 && (
            <Card className="glass-card mb-8 border-blue-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Messages de l'Administration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`p-3 rounded-lg ${msg.read ? 'bg-white/5' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                    <p className="text-sm text-zinc-300">{msg.content}</p>
                    <p className="text-xs text-zinc-500 mt-1">{formatDate(msg.created_at)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Referral Link - Parrainer Section */}
          <Card className="glass-card mb-8 border-green-500/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-emerald-500/10" />
            <CardContent className="p-6 relative">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Parrainez et gagnez</h3>
                  </div>
                  <p className="text-zinc-400 text-sm mb-3">
                    Partagez votre lien unique et gagnez des commissions sur 3 niveaux
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      Niveau 1: {affiliate?.program?.commission_l1 || 25}%
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      Niveau 2: {affiliate?.program?.commission_l2 || 10}%
                    </Badge>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Niveau 3: {affiliate?.program?.commission_l3 || 5}%
                    </Badge>
                  </div>
                </div>
                <div className="w-full lg:w-auto space-y-3">
                  <Label className="text-zinc-300 text-sm">Votre lien d&apos;affiliation</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 lg:w-80 bg-white/5 rounded-lg px-4 py-3 border border-purple-500/20 font-mono text-sm text-zinc-300 truncate">
                      {referralLink}
                    </div>
                    <Button onClick={copyLink} className="glass-button shrink-0 h-11">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  {/* BOUTONS DE PARTAGE CORRIGÉS */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[120px] border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                      onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank')}
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Facebook
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[120px] border-black/30 text-zinc-200 hover:bg-black/10 hover:text-white"
                      onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`, '_blank')}
                    >
                      <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      X (Twitter)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[120px] border-green-500/30 text-green-400 hover:bg-green-500/10"
                      onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`, '_blank')}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[120px] border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
                      onClick={handleNativeShare}
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Insta/TikTok
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[120px] border-purple-500/20 text-zinc-300 hover:text-white hover:bg-purple-500/10"
                      onClick={() => {
                        navigator.clipboard.writeText(`${profile.full_name} vous invite à rejoindre AffiliationPro! ${referralLink}`)
                        toast.success('Message copié !')
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Inviter
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass-card glass-card-hover border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-green-500" />
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                    +{stats.weeklySales.reduce((sum, s) => sum + s.count, 0)} sem.
                  </Badge>
                </div>
                <p className="text-zinc-400 text-sm mb-1">Gains totaux</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalEarnings)}</p>
              </CardContent>
            </Card>

            <Card className="glass-card glass-card-hover border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-8 h-8 text-amber-500" />
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                    En attente
                  </Badge>
                </div>
                <p className="text-zinc-400 text-sm mb-1">Commissions en attente</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.pendingCommissions)}</p>
              </CardContent>
            </Card>

            <Card className="glass-card glass-card-hover border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-zinc-400 text-sm mb-1">Filleuls (L1/L2/L3)</p>
                <p className="text-2xl font-bold text-white">{totalReferrals}</p>
                <div className="flex gap-2 mt-2 text-xs text-zinc-500">
                  <span>L1: {stats.l1Referrals}</span>
                  <span>L2: {stats.l2Referrals}</span>
                  <span>L3: {stats.l3Referrals}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card glass-card-hover border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Eye className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-zinc-400 text-sm mb-1">Clics totaux</p>
                <p className="text-2xl font-bold text-white">{stats.totalClicks}</p>
              </CardContent>
            </Card>
          </div>

          {/* 📊 Ventes de la semaine + Répartition des commissions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="glass-card border-0 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Ventes de la semaine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.weeklySales.map((sale, index) => {
                    const percentage = maxWeeklyTotal > 0 ? (sale.total / maxWeeklyTotal) * 100 : 0
                    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
                    const date = new Date(sale.date)
                    const dayName = dayNames[date.getDay()]
                    return (
                      <div key={sale.date} className="flex items-center gap-3">
                        <span className="w-10 text-xs text-zinc-500 font-medium shrink-0">{dayName}</span>
                        <div className="flex-1 h-7 bg-white/5 rounded-full overflow-hidden">
                          {sale.total > 0 ? (
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                              style={{ width: `${Math.max(percentage, 5)}%`, transitionDelay: `${index * 100}ms` }}
                            >
                              <span className="text-xs font-medium text-white drop-shadow-sm whitespace-nowrap">
                                {formatCurrency(sale.total)}
                                {sale.count > 1 && <span className="text-emerald-200/70 ml-1">({sale.count})</span>}
                              </span>
                            </div>
                          ) : (
                            <div className="h-full w-full bg-zinc-800/50 rounded-full" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Répartition des commissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <p className="text-2xl font-bold text-purple-300">{stats.l1Referrals}</p>
                    <p className="text-xs text-zinc-400 mt-1">Filleuls directs</p>
                    <Badge className="mt-2 bg-purple-500/20 text-purple-300 border-purple-500/30">Niveau 1</Badge>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-2xl font-bold text-blue-300">{stats.l2Referrals}</p>
                    <p className="text-xs text-zinc-400 mt-1">Filleuls N2</p>
                    <Badge className="mt-2 bg-blue-500/20 text-blue-300 border-blue-500/30">Niveau 2</Badge>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-2xl font-bold text-green-300">{stats.l3Referrals}</p>
                    <p className="text-xs text-zinc-400 mt-1">Filleuls N3</p>
                    <Badge className="mt-2 bg-green-500/20 text-green-300 border-green-500/30">Niveau 3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 💰 Ventes récentes */}
          <Card className="glass-card border-0 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Ventes récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentSales.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Aucune vente récente</p>
                  <p className="text-sm">Partagez votre lien pour commencer à gagner !</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentSales.slice(0, 5).map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold text-green-400">{formatCurrency(sale.amount)}</span>
                          <Badge className={
                            sale.status === 'paid'
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }>
                            {sale.status === 'paid' ? 'Payé' : 'En attente'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          {sale.customer_email && (
                            <span>{maskEmail(sale.customer_email)}</span>
                          )}
                          <span>{formatDateFull(sale.created_at)}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <p className="text-xs text-zinc-500">Commission</p>
                        <p className="text-sm font-medium text-emerald-400">{formatCurrency(sale.commission_l1)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* MON ÉQUIPE */}
          <Card className="glass-card border-0 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Mon Équipe (Détails)
              </CardTitle>
              <CardDescription>Liste de vos filleuls et leurs coordonnées</CardDescription>
            </CardHeader>
            <CardContent>
              {team.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Vous n'avez pas encore de filleuls directs.</p>
                  <p className="text-sm">Partagez votre lien pour recruter !</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-purple-500/10">
                        <th className="text-left text-xs text-zinc-500 font-medium pb-3">Nom</th>
                        <th className="text-left text-xs text-zinc-500 font-medium pb-3">Email</th>
                        <th className="text-center text-xs text-zinc-500 font-medium pb-3">Niveau</th>
                        <th className="text-left text-xs text-zinc-500 font-medium pb-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-500/5">
                      {team.map((member) => (
                        <tr key={member.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 text-zinc-300">{member.full_name || 'Nouveau'}</td>
                          <td className="py-3 text-zinc-400">{member.email}</td>
                          <td className="py-3 text-center">
                            <Badge variant="outline" className={
                              member.level === 1 ? 'border-purple-500 text-purple-300' :
                              member.level === 2 ? 'border-blue-500 text-blue-300' :
                              'border-green-500 text-green-300'
                            }>
                              Niveau {member.level}
                            </Badge>
                          </td>
                          <td className="py-3 text-zinc-500 text-sm">{formatDate(member.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Affiliate Code Footer */}
          <div className="mt-8 p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 text-center">
            <p className="text-zinc-500 text-sm mb-2">Votre code d&apos;affiliation</p>
            <p className="text-2xl font-mono font-bold gradient-text">{profile.affiliate_code}</p>
          </div>
        </div>
      </main>
    </div>
  )
}
