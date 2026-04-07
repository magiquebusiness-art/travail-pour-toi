'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StarryBackground } from '@/components/StarryBackground'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Crown,
  Loader2,
  CheckCircle,
  UserPlus,
  DollarSign,
  BarChart3,
  Rocket,
  Users,
  Copy,
  Check,
  Settings,
  CreditCard,
  LogOut,
  Package,
  ExternalLink,
  Gift,
  Eye,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Link2,
  Tag,
  Plus,
  X,
  Share2,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { signup } from '@/lib/auth-client'
import { NyXiaWidget } from '@/components/nyxia-widget'

const AMBASSADOR_REFERRAL_CODE = 'SUPERADM'

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: string
  affiliate_code: string
  paypal_email: string | null
  avatar_url: string | null
}

interface AmbassadorStats {
  totalEarnings: number
  pendingCommissions: number
  totalClicks: number
  l1Referrals: number
  l2Referrals: number
  l3Referrals: number
}

interface MarketplaceProduct {
  id: string
  title: string
  description_short: string
  price: number
  commission_n1: number
  commission_n2: number
  commission_n3: number
  affiliate_link: string | null
  image_url: string | null
  category_name: string | null
}

interface SelectedProduct {
  selection_id: string
  promo_code: string
  referral_link: string
  selected_at: string
  id: string
  title: string
  description_short: string
  price: number
  commission_n1: number
  commission_n2: number
  commission_n3: number
  affiliate_link: string | null
  image_url: string | null
  category_name: string | null
  product_status: string
}

type DashboardTab = 'dashboard' | 'products' | 'settings' | 'referral'

// ─── Signup Benefits (used in signup mode) ──────────────────────────────────

const benefits = [
  {
    icon: DollarSign,
    title: '💰 Gagnez 25% sur chaque vente',
    description: 'Recevez une commission généreuse sur chaque client que vous apportez. Pas de plafond, pas de limite.',
    gradient: 'from-yellow-500 to-amber-600',
    border: 'border-yellow-500/20',
  },
  {
    icon: BarChart3,
    title: '📊 Dashboard complet en temps réel',
    description: 'Suivez vos clics, conversions et revenus en direct. Des analytics puissants pour optimiser votre stratégie.',
    gradient: 'from-blue-500 to-cyan-600',
    border: 'border-blue-500/20',
  },
  {
    icon: Rocket,
    title: '🚀 Programme 3 niveaux de commissions',
    description: 'Gagnez sur 3 niveaux : vos ventes directes, les ventes de vos filleuls, et les ventes de leurs filleuls.',
    gradient: 'from-purple-500 to-pink-600',
    border: 'border-purple-500/20',
  },
]

// ─── Signup Form Component ──────────────────────────────────────────────────

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
      setTimeout(() => { router.push('/ambassadeur') }, 1500)
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
          <h2 className="text-2xl font-bold text-white mb-2">Bienvenue, Ambassadeur !</h2>
          <p className="text-zinc-400 mb-4">Votre compte ambassadeur a été créé avec succès.</p>
          <p className="text-sm text-zinc-500">Redirection vers votre tableau de bord...</p>
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
          <span className="text-xl font-bold gradient-text">NyXia MarketPlace</span>
        </div>
        <CardTitle className="text-2xl text-white">Rejoignez le programme</CardTitle>
        <CardDescription className="text-zinc-400">Créez votre compte ambassadeur et commencez à gagner</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-zinc-300">Nom complet</Label>
            <Input id="fullName" type="text" placeholder="Diane Boyer" value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required
              className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Courriel</Label>
            <Input id="email" type="email" placeholder="toi@email.com" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} required
              className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Mot de passe</Label>
            <Input id="password" type="password" placeholder="••••••••" value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6}
              className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 focus:border-purple-500" />
            <p className="text-xs text-zinc-500">Minimum 6 caractères</p>
          </div>
          <Button type="submit" disabled={isLoading}
            className="w-full glass-button text-white border-0 py-6 text-lg group">
            {isLoading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Création en cours...</>)
              : (<><Crown className="w-5 h-5 mr-2" />Devenir Ambassadeur</>)}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-zinc-400">
          Déjà un compte ?{' '}
          <Link href="/login?redirect=/ambassadeur" className="text-purple-400 hover:text-purple-300 font-medium">Se connecter</Link>
        </div>
        <div className="mt-6 pt-6 border-t border-purple-500/10">
          <div className="flex flex-wrap justify-center gap-2">
            <Badge className="bg-yellow-500/10 text-yellow-300 border-yellow-500/20">🏆 Statut Ambassadeur</Badge>
            <Badge className="bg-green-500/10 text-green-300 border-green-500/20">Inscription gratuite</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Signup Page (shown when not logged in) ─────────────────────────────────

function AmbassadeurSignupPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 py-8 overflow-auto">
      <StarryBackground />
      <div className="relative z-10 text-center mt-12 mb-10 max-w-3xl">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/25">
          <Crown className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          Devenez <span className="gradient-text">Ambassadeur</span> NyXia
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Rejoignez notre programme exclusif et transformez votre réseau en revenus récurrents.
          Des commissions sur 3 niveaux, un dashboard premium, et un accompagnement dédié.
        </p>
      </div>
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-12">
        {benefits.map((benefit) => (
          <Card key={benefit.title} className={`glass-card ${benefit.border} hover:scale-[1.02] transition-transform duration-300`}>
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-4`}>
                <benefit.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{benefit.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="relative z-10 w-full flex justify-center mb-16">
        <AmbassadeurSignupForm />
      </div>
      <div className="relative z-10 text-center mb-8">
        <p className="text-sm text-zinc-500">
          En rejoignant le programme Ambassadeur, vous acceptez nos{' '}
          <span className="text-zinc-400 cursor-pointer hover:text-zinc-300">conditions d&apos;utilisation</span>
        </p>
      </div>
      <NyXiaWidget mode="pastille" />
    </div>
  )
}

// ─── Ambassador Dashboard (shown when logged in) ────────────────────────────

function AmbassadeurDashboard({ user }: { user: UserProfile }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard')
  const [stats, setStats] = useState<AmbassadorStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  // Products state
  const [marketplaceProducts, setMarketplaceProducts] = useState<MarketplaceProduct[]>([])
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isLoadingSelected, setIsLoadingSelected] = useState(false)
  const [selectingProduct, setSelectingProduct] = useState<string | null>(null)

  // Settings state
  const [paypalEmail, setPaypalEmail] = useState(user.paypal_email || '')
  const [isSavingPaypal, setIsSavingPaypal] = useState(false)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount)

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${user.affiliate_code}`
    : ''

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    toast.success('Copié !')
    setTimeout(() => setCopied(null), 2000)
  }

  const handleLogout = () => {
    window.location.href = '/logout'
  }

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) return
      const data = await res.json()
      if (data.isSuperAdmin || data.isAdmin) return
      if (data.stats) {
        setStats({
          totalEarnings: data.stats.totalEarnings || 0,
          pendingCommissions: data.stats.pendingCommissions || 0,
          totalClicks: data.stats.totalClicks || 0,
          l1Referrals: data.stats.l1Referrals || 0,
          l2Referrals: data.stats.l2Referrals || 0,
          l3Referrals: data.stats.l3Referrals || 0,
        })
      }
    } catch {
      // silently fail
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  // Fetch marketplace products
  const fetchMarketplaceProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true)
      const res = await fetch('/api/public/marketplace')
      if (res.ok) {
        const data = await res.json()
        setMarketplaceProducts(data.products || [])
      }
    } catch {
      // silently fail
    } finally {
      setIsLoadingProducts(false)
    }
  }, [])

  // Fetch selected products
  const fetchSelectedProducts = useCallback(async () => {
    try {
      setIsLoadingSelected(true)
      const res = await fetch('/api/ambassadeur/products')
      if (res.ok) {
        const data = await res.json()
        setSelectedProducts(data.products || [])
      }
    } catch {
      // silently fail
    } finally {
      setIsLoadingSelected(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => {
    if (activeTab === 'products') {
      fetchMarketplaceProducts()
      fetchSelectedProducts()
    }
  }, [activeTab, fetchMarketplaceProducts, fetchSelectedProducts])

  // Select a product to promote
  const handleSelectProduct = async (productId: string) => {
    setSelectingProduct(productId)
    try {
      const res = await fetch('/api/ambassadeur/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erreur')
        return
      }
      toast.success('Produit ajouté à vos promotions !')
      fetchSelectedProducts()
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setSelectingProduct(null)
    }
  }

  // Remove product from promotions
  const handleRemoveProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/ambassadeur/products?product_id=${productId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Produit retiré de vos promotions')
        fetchSelectedProducts()
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  // Save PayPal
  const handleSavePaypal = async () => {
    setIsSavingPaypal(true)
    try {
      const res = await fetch('/api/affiliate/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paypalEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('PayPal enregistré !')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsSavingPaypal(false)
    }
  }

  const selectedProductIds = new Set(selectedProducts.map(p => p.id))
  const totalReferrals = stats ? stats.l1Referrals + stats.l2Referrals + stats.l3Referrals : 0

  const tabs = [
    { id: 'dashboard' as DashboardTab, label: 'Tableau de bord', icon: BarChart3 },
    { id: 'products' as DashboardTab, label: 'Produits', icon: Package },
    { id: 'referral' as DashboardTab, label: 'Parrainage', icon: Link2 },
    { id: 'settings' as DashboardTab, label: 'Paramètres', icon: Settings },
  ]

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
            <span className="font-bold gradient-text">NyXia MarketPlace</span>
          </Link>
          <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
            <Crown className="w-3 h-3 mr-1" />Ambassadeur
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white"
            onClick={() => { setIsLoadingStats(true); fetchStats(); fetchSelectedProducts(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />Actualiser
          </Button>
          <div className="hidden md:block text-right">
            <p className="text-sm text-white font-medium">{user.full_name || 'Ambassadeur'}</p>
            <p className="text-xs text-zinc-500">{user.email}</p>
          </div>
          <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />Déconnexion
          </Button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="relative z-10 px-6 pt-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 border-b border-purple-500/10 pb-4 overflow-x-auto">
            {tabs.map((tab) => (
              <Button key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className={`flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'glass-button text-white' : 'text-zinc-400 hover:text-white'}`}
                onClick={() => setActiveTab(tab.id)}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-6 md:px-12 lg:px-24 pb-24">
        <div className="max-w-6xl mx-auto">

          {/* ─── TABLEAU DE BORD ─── */}
          {activeTab === 'dashboard' && (
            <>
              {/* NyXia Chat intégré — closer avec Psychologie du Clic */}
              <NyXiaWidget mode="chat" userName={user.full_name?.split(' ')[0] || ''} />

              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">
                  Bienvenue, {user.full_name?.split(' ')[0] || 'Ambassadeur'} 👋
                </h1>
                <p className="text-zinc-400 text-sm">Voici un aperçu de vos performances d&apos;ambassadeur</p>
              </div>

              {isLoadingStats ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
                  <p className="text-zinc-400 mt-2">Chargement...</p>
                </div>
              ) : (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="glass-card border-0">
                      <CardContent className="p-4 text-center">
                        <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{formatCurrency(stats?.totalEarnings || 0)}</p>
                        <p className="text-zinc-500 text-xs">Gains totaux</p>
                      </CardContent>
                    </Card>
                    <Card className="glass-card border-0">
                      <CardContent className="p-4 text-center">
                        <TrendingUp className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{formatCurrency(stats?.pendingCommissions || 0)}</p>
                        <p className="text-zinc-500 text-xs">En attente</p>
                      </CardContent>
                    </Card>
                    <Card className="glass-card border-0">
                      <CardContent className="p-4 text-center">
                        <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{totalReferrals}</p>
                        <p className="text-zinc-500 text-xs">Filleuls</p>
                      </CardContent>
                    </Card>
                    <Card className="glass-card border-0">
                      <CardContent className="p-4 text-center">
                        <Eye className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{stats?.totalClicks || 0}</p>
                        <p className="text-zinc-500 text-xs">Clics</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Referral breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="glass-card border-0">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-purple-300">{stats?.l1Referrals || 0}</p>
                        <p className="text-xs text-zinc-400 mt-1">Filleuls directs (N1)</p>
                        <Badge className="mt-2 bg-purple-500/20 text-purple-300 border-purple-500/30">25%</Badge>
                      </CardContent>
                    </Card>
                    <Card className="glass-card border-0">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-300">{stats?.l2Referrals || 0}</p>
                        <p className="text-xs text-zinc-400 mt-1">Réseau (N2)</p>
                        <Badge className="mt-2 bg-blue-500/20 text-blue-300 border-blue-500/30">10%</Badge>
                      </CardContent>
                    </Card>
                    <Card className="glass-card border-0">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-300">{stats?.l3Referrals || 0}</p>
                        <p className="text-xs text-zinc-400 mt-1">Étendu (N3)</p>
                        <Badge className="mt-2 bg-green-500/20 text-green-300 border-green-500/30">5%</Badge>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick: Your Selected Products */}
                  {selectedProducts.length > 0 && (
                    <Card className="glass-card border-0 mb-6">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white flex items-center gap-2 text-lg">
                          <Package className="w-5 h-5 text-cyan-400" />
                          Mes produits à promouvoir ({selectedProducts.length})
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                          Copiez vos liens d&apos;affiliation pour chaque produit
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                          {selectedProducts.slice(0, 5).map((product) => (
                            <div key={product.selection_id} className="p-3 rounded-lg bg-white/5 border border-purple-500/10">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-white font-medium text-sm">{product.title}</h4>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                  {product.commission_n1}%
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-black/30 rounded-lg px-3 py-2 border border-purple-500/30 font-mono text-xs text-zinc-300 truncate">
                                  {product.referral_link}
                                </div>
                                <Button size="sm" className="glass-button shrink-0 h-8 px-2"
                                  onClick={() => copyToClipboard(product.id, product.referral_link)}>
                                  {copied === product.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {selectedProducts.length > 5 && (
                          <Button variant="ghost" className="mt-3 text-purple-400 hover:text-purple-300 text-sm"
                            onClick={() => setActiveTab('products')}>
                            Voir tout →
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </>
          )}

          {/* ─── PRODUITS ─── */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Selected Products Section */}
              <Card className="glass-card border-0 border-green-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5 text-green-400" />
                    Mes produits sélectionnés ({selectedProducts.length})
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Vos liens de promotion personnalisés pour chaque produit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSelected ? (
                    <div className="text-center py-6">
                      <Loader2 className="w-6 h-6 text-purple-500 animate-spin mx-auto" />
                    </div>
                  ) : selectedProducts.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>Aucun produit sélectionné</p>
                      <p className="text-sm mt-1">Parcourez la marketplace ci-dessous et choisissez vos produits</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                      {selectedProducts.map((product) => (
                        <div key={product.selection_id} className="p-4 rounded-lg bg-white/5 border border-green-500/10">
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-white font-medium truncate">{product.title}</h4>
                                {product.category_name && (
                                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 shrink-0 text-xs">
                                    {product.category_name}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-zinc-500 text-xs mb-2">{product.description_short}</p>
                              <div className="flex items-center gap-2 text-sm flex-wrap">
                                <span className="text-green-400 font-semibold">{formatCurrency(product.price)}</span>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                                  {product.commission_n1}%
                                </Badge>
                                {product.promo_code && (
                                  <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 font-mono text-xs">
                                    🏷️ {product.promo_code}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="w-full md:w-auto space-y-2">
                              <p className="text-xs text-green-300 font-medium">Votre lien de promotion :</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 md:w-72 bg-black/30 rounded-lg px-3 py-2 border border-green-500/30 font-mono text-xs text-zinc-300 truncate">
                                  {product.referral_link}
                                </div>
                                <Button size="sm" className="glass-button shrink-0 h-9 px-3"
                                  onClick={() => copyToClipboard(product.id, product.referral_link)}>
                                  {copied === product.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </Button>
                              </div>
                              <div className="flex gap-2">
                                {product.affiliate_link && (
                                  <a href={product.affiliate_link} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />Ouvrir le produit
                                  </a>
                                )}
                                <button onClick={() => handleRemoveProduct(product.id)}
                                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                                  <X className="w-3 h-3" />Retirer
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Marketplace Browse Section */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Marketplace — Parcourir les produits
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Sélectionnez les produits que vous souhaitez promouvoir
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProducts ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
                      <p className="text-zinc-400 mt-2">Chargement de la marketplace...</p>
                    </div>
                  ) : marketplaceProducts.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-lg">Aucun produit disponible</p>
                      <p className="text-sm mt-1">Revenez plus tard pour découvrir de nouveaux produits</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                      {marketplaceProducts.map((product) => {
                        const isSelected = selectedProductIds.has(product.id)
                        return (
                          <div key={product.id} className={`p-4 rounded-lg border transition-colors ${isSelected ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-purple-500/10 hover:border-purple-500/30'}`}>
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                              {product.image_url && (
                                <img src={product.image_url} alt={product.title}
                                  className="w-full md:w-16 h-16 object-cover rounded-lg border border-purple-500/20" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-white font-medium truncate">{product.title}</h4>
                                  {product.category_name && (
                                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 shrink-0 text-xs">
                                      {product.category_name}
                                    </Badge>
                                  )}
                                  {isSelected && <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">✓ Sélectionné</Badge>}
                                </div>
                                <p className="text-zinc-500 text-sm mb-2 line-clamp-2">{product.description_short}</p>
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="text-green-400 font-semibold">{formatCurrency(product.price)}</span>
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                    Commission: {product.commission_n1}%
                                  </Badge>
                                </div>
                              </div>
                              <div className="w-full md:w-auto">
                                {isSelected ? (
                                  <Button variant="outline" size="sm"
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 w-full md:w-auto"
                                    onClick={() => handleRemoveProduct(product.id)}>
                                    <X className="w-4 h-4 mr-1" />Retirer
                                  </Button>
                                ) : (
                                  <Button size="sm" className="glass-button w-full md:w-auto"
                                    disabled={selectingProduct === product.id}
                                    onClick={() => handleSelectProduct(product.id)}>
                                    {selectingProduct === product.id
                                      ? <Loader2 className="w-4 h-4 animate-spin" />
                                      : <><Plus className="w-4 h-4 mr-1" />Promouvoir</>}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── PARRAINAGE (Referral Link) ─── */}
          {activeTab === 'referral' && (
            <div className="space-y-6 max-w-2xl">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Lien de parrainage</h2>
                <p className="text-zinc-400 text-sm">Partagez votre lien unique pour recruter de nouveaux ambassadeurs</p>
              </div>

              <Card className="glass-card border-0 border-green-500/30">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-zinc-300 text-sm">Votre lien de parrainage</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-white/5 rounded-lg px-4 py-3 border border-purple-500/20 font-mono text-sm text-zinc-300 break-all">
                          {referralLink}
                        </div>
                        <Button onClick={() => copyToClipboard('referral', referralLink)} className="glass-button shrink-0 h-11">
                          {copied === 'referral' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-zinc-300 text-sm">Votre code d&apos;affiliation</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-white/5 rounded-lg px-4 py-3 border border-amber-500/20 font-mono text-lg text-white text-center font-bold">
                          {user.affiliate_code}
                        </div>
                        <Button onClick={() => copyToClipboard('code', user.affiliate_code)} className="glass-button shrink-0 h-11">
                          {copied === 'code' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Share buttons */}
                    <div className="pt-4 border-t border-purple-500/10">
                      <p className="text-sm text-zinc-400 mb-3">Partager sur les réseaux sociaux :</p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm"
                          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                          onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank')}>
                          <Share2 className="w-4 h-4 mr-1" />Facebook
                        </Button>
                        <Button variant="outline" size="sm"
                          className="border-black/30 text-zinc-200 hover:bg-black/10 hover:text-white"
                          onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Rejoignez le programme Ambassadeur NyXia !')}&url=${encodeURIComponent(referralLink)}`, '_blank')}>
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                          X (Twitter)
                        </Button>
                        <Button variant="outline" size="sm"
                          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Rejoins le programme Ambassadeur NyXia ! ${referralLink}`)}`, '_blank')}>
                          <MessageCircle className="w-4 h-4 mr-1" />WhatsApp
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Commission Info */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Gift className="w-5 h-5 text-purple-400" />
                    Commissions sur 3 niveaux
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Niveau 1 — Direct</p>
                          <p className="text-zinc-400 text-sm">Vos filleuls directs</p>
                        </div>
                        <p className="text-2xl font-bold text-purple-300">25%</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Niveau 2 — Réseau</p>
                          <p className="text-zinc-400 text-sm">Les filleuls de vos filleuls</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-300">10%</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Niveau 3 — Étendu</p>
                          <p className="text-zinc-400 text-sm">Les filleuls de niveau 3</p>
                        </div>
                        <p className="text-2xl font-bold text-green-300">5%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── PARAMÈTRES ─── */}
          {activeTab === 'settings' && (
            <div className="max-w-xl space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Paramètres</h2>
                <p className="text-zinc-400 text-sm">Gérez votre profil et vos informations de paiement</p>
              </div>

              {/* Profile Info */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-purple-400" />
                    Informations du profil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Nom complet</span>
                    <span className="text-white">{user.full_name || 'Non renseigné'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Courriel</span>
                    <span className="text-white">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Code d&apos;affiliation</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono font-bold">{user.affiliate_code}</span>
                      <button onClick={() => copyToClipboard('settings-code', user.affiliate_code)}
                        className="text-zinc-500 hover:text-white transition-colors">
                        {copied === 'settings-code' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Statut</span>
                    <Badge className="bg-yellow-500/10 text-yellow-300 border-yellow-500/20">
                      <Crown className="w-3 h-3 mr-1" />Ambassadeur
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* PayPal */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    Configuration PayPal
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Votre email PayPal pour recevoir vos commissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input type="email" placeholder="votre@email.com" value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      className="bg-white/5 border-purple-500/20 text-white" />
                    <Button onClick={handleSavePaypal} disabled={isSavingPaypal} className="glass-button">
                      {isSavingPaypal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </Button>
                  </div>
                  {user.paypal_email && (
                    <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                      <Check className="w-3 h-3" />PayPal configuré : {user.paypal_email}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Link2 className="w-5 h-5 text-purple-400" />
                    Liens rapides
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/" className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-white text-sm font-medium">🏠 Retour à la marketplace</p>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

// ─── Main Page: Switches between Signup and Dashboard ───────────────────────

export default function AmbassadeurPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setUser(data.user)
            // If user is super_admin or admin, redirect them
            if (data.user.role === 'super_admin') {
              window.location.href = '/super-admin'
              return
            }
            if (data.user.role === 'admin') {
              window.location.href = '/admin'
              return
            }
          }
        }
      } catch {
        // Not authenticated, show signup
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [])

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

  if (!user) {
    return <AmbassadeurSignupPage />
  }

  return <AmbassadeurDashboard user={user} />
}
