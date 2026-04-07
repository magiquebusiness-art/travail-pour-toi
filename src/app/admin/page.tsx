'use client'
export const runtime = 'edge'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StarryBackground } from '@/components/StarryBackground'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Users,
  DollarSign,
  Sparkles,
  ShoppingCart,
  Clock,
  Shield,
  Loader2,
  UserCheck,
  Calendar,
  Building,
  BarChart3,
  RefreshCw,
  Settings,
  CreditCard,
  Wallet,
  Copy,
  Check,
  Send,
  LogOut,
  Search,
  ChevronDown,
  ChevronRight,
  Info,
  Link2,
  Key,
  Package,
  Plus,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

type TabType = 'dashboard' | 'affiliates' | 'products' | 'payouts' | 'settings'

interface MarketplaceCategory {
  id: number
  name: string
  slug: string
  icon: string | null
}

interface MarketplaceProduct {
  id: string
  title: string
  description_short: string
  price: number
  category_id: number | null
  category_name: string | null
  affiliate_link: string | null
  promo_code: string | null
  commission_n1: number
  commission_n2: number
  commission_n3: number
  status: string
  created_at: string
}

interface Level3Member {
  id: string
  full_name: string | null
  email: string
  paypal_email: string | null
  created_at: string
}

interface Affiliate {
  id: string
  user_id: string
  profile: {
    id: string
    email: string
    full_name: string | null
    paypal_email: string | null
    affiliate_code: string
    created_at: string
  }
  total_earnings: number
  total_referrals: number
  status: string
  level3?: Level3Member[]
}

interface Sale {
  id: string
  amount: number
  status: string
  created_at: string
  commission_l1: number
  customer_email: string | null
}

interface AdminData {
  profile: {
    id: string
    email: string
    full_name: string | null
    paypal_email: string | null
    affiliate_code: string
    subdomain: string | null
    webhook_secret?: string | null
    custom_slug?: string | null
  }
  stats: {
    totalAffiliates: number
    totalSales: number
    totalRevenue: number
    pendingPayouts: number
    paidPayouts: number
  }
  affiliates: Affiliate[]
  recentSales: Sale[]
  pendingCommissions: { affiliate_id: string; amount: number; profile: { full_name: string | null; email: string; paypal_email: string | null } }[]
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { logout, isLoggingOut } = useAuth()
  const [data, setData] = useState<AdminData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [paypalEmail, setPaypalEmail] = useState('')
  const [isSavingPaypal, setIsSavingPaypal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [processingPayout, setProcessingPayout] = useState<string | null>(null)

  // New state for enhanced features
  const [searchQuery, setSearchQuery] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [expandedL2, setExpandedL2] = useState<Set<string>>(new Set())
  const [webhookSecret, setWebhookSecret] = useState('')
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [isSavingSlug, setIsSavingSlug] = useState(false)
  const [isSavingWebhook, setIsSavingWebhook] = useState(false)
  const [copiedDns, setCopiedDns] = useState(false)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Products tab state
  const [categories, setCategories] = useState<MarketplaceCategory[]>([])
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [isProductsLoading, setIsProductsLoading] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [productForm, setProductForm] = useState({
    title: '',
    description_short: '',
    category_id: '',
    price: '',
    affiliate_link: '',
    promo_code: '',
    commission_n1: '25',
    commission_n2: '10',
    commission_n3: '5',
  })
  const [isCreatingProduct, setIsCreatingProduct] = useState(false)
  const [copiedProductLinks, setCopiedProductLinks] = useState<Record<string, boolean>>({})

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin')
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) router.push('/login')
        else if (response.status === 403) router.push('/dashboard')
        else throw new Error(result.error)
        return
      }

      // If API returns redirect (super_admin accessing /admin), redirect them
      if (result.redirect) {
        router.push(result.redirect)
        return
      }

      setData(result)
      setPaypalEmail(result.profile?.paypal_email || '')
      setCustomSlug(result.profile?.custom_slug || '')
      setWebhookSecret(result.profile?.webhook_secret || generateUUID())
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const fetchProducts = useCallback(async () => {
    try {
      setIsProductsLoading(true)
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/marketplace/categories'),
        fetch('/api/marketplace/products'),
      ])
      if (catRes.ok) {
        const catData = await catRes.json()
        setCategories(catData.categories || [])
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json()
        setProducts(prodData.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsProductsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts()
    }
  }, [activeTab, fetchProducts])

  const handleSavePaypal = async () => {
    setIsSavingPaypal(true)
    try {
      const response = await fetch('/api/admin/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paypalEmail }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('PayPal enregistré')
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsSavingPaypal(false)
    }
  }

  const handlePayout = async (affiliateId: string, amount: number) => {
    setProcessingPayout(affiliateId)
    try {
      const response = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateId, amount }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Paiement effectué')
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setProcessingPayout(null)
    }
  }

  const copyLink = () => {
    const link = data?.profile?.subdomain
      ? `https://${data.profile.subdomain}.affiliationpro.cashflowecosysteme.com/r/${data.profile.affiliate_code}`
      : `${window.location.origin}/r/${data?.profile?.affiliate_code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Lien copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  const copyWebhookUrl = () => {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/webhooks/systemeio`
    navigator.clipboard.writeText(url)
    setCopiedWebhookUrl(true)
    toast.success('URL copiée !')
    setTimeout(() => setCopiedWebhookUrl(false), 2000)
  }

  const copySecretKey = () => {
    navigator.clipboard.writeText(webhookSecret)
    setCopiedSecret(true)
    toast.success('Clé secrète copiée !')
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  const handleSaveSlug = async () => {
    if (!customSlug) {
      toast.error('Veuillez entrer un slug')
      return
    }
    setIsSavingSlug(true)
    try {
      const response = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_slug: customSlug }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      toast.success('Slug sauvegardé !')
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSavingSlug(false)
    }
  }

  const handleSaveWebhook = async () => {
    if (!webhookSecret.trim()) {
      toast.error('Veuillez entrer une clé secrète')
      return
    }
    setIsSavingWebhook(true)
    try {
      const response = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_secret: webhookSecret.trim() }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      toast.success('Configuration webhook sauvegardée !')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSavingWebhook(false)
    }
  }

  const toggleL2Expand = (affiliateId: string) => {
    setExpandedL2((prev) => {
      const next = new Set(prev)
      if (next.has(affiliateId)) {
        next.delete(affiliateId)
      } else {
        next.add(affiliateId)
      }
      return next
    })
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productForm.title || !productForm.description_short || !productForm.category_id || !productForm.price) {
      toast.error('Veuillez remplir tous les champs requis')
      return
    }
    setIsCreatingProduct(true)
    try {
      const response = await fetch('/api/marketplace/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: productForm.title,
          description_short: productForm.description_short,
          category_id: Number(productForm.category_id),
          price: Number(productForm.price),
          affiliate_link: productForm.affiliate_link || null,
          promo_code: productForm.promo_code || null,
          commission_n1: Number(productForm.commission_n1),
          commission_n2: Number(productForm.commission_n2),
          commission_n3: Number(productForm.commission_n3),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Produit créé avec succès !')
      setShowProductForm(false)
      setProductForm({
        title: '',
        description_short: '',
        category_id: '',
        price: '',
        affiliate_link: '',
        promo_code: '',
        commission_n1: '25',
        commission_n2: '10',
        commission_n3: '5',
      })
      fetchProducts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création')
    } finally {
      setIsCreatingProduct(false)
    }
  }

  const copyProductLink = (productId: string, link: string) => {
    navigator.clipboard.writeText(link)
    setCopiedProductLinks(prev => ({ ...prev, [productId]: true }))
    toast.success('Lien copié !')
    setTimeout(() => setCopiedProductLinks(prev => ({ ...prev, [productId]: false })), 2000)
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Les deux mots de passe ne correspondent pas')
      return
    }
    setIsChangingPassword(true)
    try {
      const response = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Mot de passe modifié avec succès !')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors du changement')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

  // Filtered affiliates based on search query
  const filteredAffiliates = useMemo(() => {
    if (!searchQuery.trim()) return data?.affiliates || []
    const q = searchQuery.toLowerCase().trim()
    return (data?.affiliates || []).filter(
      (a) =>
        a.profile.full_name?.toLowerCase().includes(q) ||
        a.profile.email.toLowerCase().includes(q)
    )
  }, [data?.affiliates, searchQuery])

  // Compute total team count including L3
  const totalTeamCount = useMemo(() => {
    if (!data?.affiliates) return 0
    return data.affiliates.reduce((acc, a) => {
      return acc + 1 + (a.level3?.length || 0)
    }, 0)
  }, [data?.affiliates])

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
            <p className="text-zinc-400 mb-4">Accès non autorisé</p>
            <Button onClick={() => router.push('/login')} className="glass-button">Connexion</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const referralLink = data.profile?.subdomain
    ? `https://${data.profile.subdomain}.affiliationpro.cashflowecosysteme.com/r/${data.profile.affiliate_code}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${data.profile.affiliate_code}`

  const customSlugValid = /^[a-z0-9-]*$/.test(customSlug) && customSlug.length > 0
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/webhooks/systemeio`
  const slugPreview = customSlug
    ? `https://www.affiliationpro.cashflowecosysteme.com/r/${customSlug}`
    : ''

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
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
            <Building className="w-3 h-3 mr-1" />Admin
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={() => { setIsLoading(true); fetchData(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />Actualiser
          </Button>
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

      {/* Tab Navigation */}
      <div className="relative z-10 px-6 pt-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 border-b border-purple-500/10 pb-4 overflow-x-auto">
            {[
              { id: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
              { id: 'affiliates' as TabType, label: 'Mon équipe', icon: Users },
              { id: 'payouts' as TabType, label: 'Paiements', icon: Wallet },
              { id: 'products' as TabType, label: 'Mes Produits', icon: Package },
              { id: 'settings' as TabType, label: 'Paramètres', icon: Settings },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className={`flex items-center gap-2 ${activeTab === tab.id ? 'glass-button text-white' : 'text-zinc-400 hover:text-white'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">
                  Bienvenue, {data.profile?.full_name?.split(' ')[0] || 'Admin'} 👋
                </h1>
                <p className="text-zinc-400 text-sm">Gérez votre programme d'affiliation</p>
              </div>

              {/* Referral Link */}
              <Card className="glass-card border-0 border-green-500/30 mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">Votre lien de recrutement</p>
                      <p className="font-mono text-white text-sm break-all">{referralLink}</p>
                    </div>
                    <Button onClick={copyLink} className="glass-button shrink-0">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <Card className="glass-card border-0">
                  <CardContent className="p-4 text-center">
                    <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{data.stats.totalAffiliates}</p>
                    <p className="text-zinc-500 text-xs">Affiliés</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-0">
                  <CardContent className="p-4 text-center">
                    <ShoppingCart className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{data.stats.totalSales}</p>
                    <p className="text-zinc-500 text-xs">Ventes</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-0">
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{formatCurrency(data.stats.totalRevenue)}</p>
                    <p className="text-zinc-500 text-xs">Revenus</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-0">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{formatCurrency(data.stats.pendingPayouts)}</p>
                    <p className="text-zinc-500 text-xs">À payer</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-0">
                  <CardContent className="p-4 text-center">
                    <Wallet className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{formatCurrency(data.stats.paidPayouts)}</p>
                    <p className="text-zinc-500 text-xs">Payés</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Sales */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <ShoppingCart className="w-5 h-5 text-purple-400" />
                    Dernières ventes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {data.recentSales.length === 0 ? (
                      <div className="text-center py-8 text-zinc-500">
                        <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>Aucune vente</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {data.recentSales.map((sale) => (
                          <div key={sale.id} className="p-3 rounded-lg bg-white/5 border border-purple-500/10 flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{formatCurrency(sale.amount)}</p>
                              <p className="text-zinc-500 text-xs">{sale.customer_email || 'Client anonyme'}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={sale.status === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}>
                                {sale.status === 'paid' ? 'Payé' : 'En attente'}
                              </Badge>
                              <p className="text-xs text-zinc-500 mt-1">{formatDate(sale.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* AFFILIATES TAB */}
          {activeTab === 'affiliates' && (
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-purple-400" />
                    Mon équipe ({totalTeamCount})
                  </CardTitle>
                  {/* Search Input */}
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      placeholder="Rechercher par nom ou email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white/5 border-purple-500/20 text-white pl-9 pr-4 h-9 text-sm"
                    />
                  </div>
                </div>
                {searchQuery.trim() && (
                  <p className="text-zinc-500 text-sm mt-2">
                    {filteredAffiliates.length} résultat{filteredAffiliates.length !== 1 ? 's' : ''} trouvé{filteredAffiliates.length !== 1 ? 's' : ''}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-3">
                  {filteredAffiliates.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>{searchQuery.trim() ? 'Aucun résultat pour cette recherche' : 'Aucun affilié pour le moment'}</p>
                      {!searchQuery.trim() && (
                        <p className="text-sm mt-1">Partagez votre lien pour recruter</p>
                      )}
                    </div>
                  ) : (
                    filteredAffiliates.map((affiliate) => {
                      const hasL3 = affiliate.level3 && affiliate.level3.length > 0
                      const isExpanded = expandedL2.has(affiliate.id)

                      return (
                        <div key={affiliate.id}>
                          {/* L2 Affiliate Card */}
                          <div className="p-4 rounded-lg bg-white/5 border border-purple-500/10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                                  {affiliate.profile.full_name?.[0]?.toUpperCase() || affiliate.profile.email[0].toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-white font-medium">{affiliate.profile.full_name || 'Sans nom'}</p>
                                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                                      Niveau 2
                                    </Badge>
                                  </div>
                                  <p className="text-zinc-400 text-sm">{affiliate.profile.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={affiliate.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-500/10 text-zinc-400'}>
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  {affiliate.status === 'active' ? 'Actif' : affiliate.status}
                                </Badge>
                                {hasL3 && (
                                  <button
                                    onClick={() => toggleL2Expand(affiliate.id)}
                                    className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-purple-500/10 text-sm text-zinc-400">
                              <span>Gains: <span className="text-green-400 font-medium">{formatCurrency(affiliate.total_earnings || 0)}</span></span>
                              <span>Filleuls: <span className="text-white font-medium">{affiliate.total_referrals || 0}</span></span>
                              <span>PayPal: <span className={affiliate.profile.paypal_email ? 'text-green-400' : 'text-amber-400'}>{affiliate.profile.paypal_email || 'Non configuré'}</span></span>
                              {hasL3 && (
                                <span>Niveau 3: <span className="text-purple-400 font-medium">{affiliate.level3!.length}</span></span>
                              )}
                            </div>
                          </div>

                          {/* L3 Members (expandable sub-section) */}
                          {hasL3 && isExpanded && (
                            <div className="ml-6 mt-2 space-y-2 border-l-2 border-purple-500/20 pl-4">
                              {affiliate.level3!.map((l3) => (
                                <div
                                  key={l3.id}
                                  className="p-3 rounded-lg bg-white/[0.03] border border-purple-500/5"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">
                                        {l3.full_name?.[0]?.toUpperCase() || l3.email[0].toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="text-white text-sm font-medium">{l3.full_name || 'Sans nom'}</p>
                                          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] px-1.5 py-0">
                                            Niveau 3
                                          </Badge>
                                        </div>
                                        <p className="text-zinc-500 text-xs">{l3.email}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <Badge className={l3.paypal_email ? 'bg-green-500/10 text-green-400 text-xs' : 'bg-amber-500/10 text-amber-400 text-xs'}>
                                        {l3.paypal_email ? 'PayPal ✓' : 'PayPal ✗'}
                                      </Badge>
                                      <p className="text-[10px] text-zinc-500 mt-1">{formatDate(l3.created_at)}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* PRODUCTS TAB (Mes Produits) */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Create Product Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-cyan-400" />
                    Mes Produits
                  </h2>
                  <p className="text-zinc-400 text-sm">Créez et gérez vos produits dans la marketplace</p>
                </div>
                <Button onClick={() => setShowProductForm(!showProductForm)} className="glass-button">
                  {showProductForm ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {showProductForm ? 'Annuler' : 'Nouveau produit'}
                </Button>
              </div>

              {/* Product Creation Form */}
              {showProductForm && (
                <Card className="glass-card border-0 border-cyan-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Créer un produit</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Remplissez les informations de votre produit
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateProduct} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-zinc-300">Titre du produit *</Label>
                          <Input
                            type="text"
                            placeholder="Ex: Formation Marketing Digital"
                            value={productForm.title}
                            onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                            required
                            className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-zinc-300">Catégorie *</Label>
                          <select
                            value={productForm.category_id}
                            onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                            required
                            className="w-full h-10 bg-white/5 border-purple-500/20 text-white rounded-md px-3 text-sm focus:outline-none focus:border-purple-500 appearance-none"
                          >
                            <option value="" className="bg-zinc-900 text-zinc-400">Sélectionner...</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id} className="bg-zinc-900">
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-zinc-300">Description courte *</Label>
                        <Textarea
                          placeholder="Décrivez votre produit en quelques lignes..."
                          value={productForm.description_short}
                          onChange={(e) => setProductForm({ ...productForm, description_short: e.target.value })}
                          required
                          rows={3}
                          className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-zinc-300">Prix (CAD) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="49.99"
                            value={productForm.price}
                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                            required
                            className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-zinc-300">Lien d&apos;affiliation</Label>
                          <Input
                            type="url"
                            placeholder="https://votre-produit.com"
                            value={productForm.affiliate_link}
                            onChange={(e) => setProductForm({ ...productForm, affiliate_link: e.target.value })}
                            className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-zinc-300">Code parrainage</Label>
                          <Input
                            type="text"
                            value={data.profile.affiliate_code}
                            readOnly
                            className="bg-white/5 border-green-500/30 text-green-400 font-mono uppercase cursor-not-allowed"
                          />
                          <p className="text-xs text-zinc-500">Votre code unique — attribué automatiquement à votre compte</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-zinc-300">Commission N1 / N2 / N3 (%)</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={productForm.commission_n1}
                              onChange={(e) => setProductForm({ ...productForm, commission_n1: e.target.value })}
                              className="bg-white/5 border-purple-500/20 text-white text-center w-1/3"
                            />
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={productForm.commission_n2}
                              onChange={(e) => setProductForm({ ...productForm, commission_n2: e.target.value })}
                              className="bg-white/5 border-purple-500/20 text-white text-center w-1/3"
                            />
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={productForm.commission_n3}
                              onChange={(e) => setProductForm({ ...productForm, commission_n3: e.target.value })}
                              className="bg-white/5 border-purple-500/20 text-white text-center w-1/3"
                            />
                          </div>
                          <p className="text-xs text-zinc-500">Direct / Réseau / Étendu (défaut: 25/10/5)</p>
                        </div>
                      </div>

                      <Button type="submit" disabled={isCreatingProduct} className="glass-button w-full">
                        {isCreatingProduct ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Création...</>
                        ) : (
                          <><Package className="w-4 h-4 mr-2" />Créer le produit</>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Products List */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-lg">
                    {products.length} produit{products.length !== 1 ? 's' : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isProductsLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
                      <p className="text-zinc-400 mt-2">Chargement des produits...</p>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-lg">Aucun produit créé</p>
                      <p className="text-sm mt-1">Cliquez sur « Nouveau produit » pour commencer</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                      {products.map((product) => (
                        <div key={product.id} className="p-4 rounded-lg bg-white/5 border border-purple-500/10 hover:border-purple-500/30 transition-colors">
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-white font-medium truncate">{product.title}</h4>
                                <Badge className={
                                  product.status === 'active'
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }>
                                  {product.status === 'active' ? 'Actif' : product.status === 'draft' ? 'Brouillon' : product.status}
                                </Badge>
                                {product.category_name && (
                                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 shrink-0">
                                    {product.category_name}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-zinc-500 text-sm mb-2">{product.description_short}</p>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="text-green-400 font-semibold">{formatCurrency(product.price)}</span>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                  {product.commission_n1}% / {product.commission_n2}% / {product.commission_n3}%
                                </Badge>
                              </div>
                            </div>
                            <div className="w-full md:w-auto space-y-2">
                              {product.affiliate_link && (
                                <>
                                  <p className="text-xs text-purple-300 font-medium">Lien d&apos;affiliation :</p>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 md:w-64 bg-black/30 rounded-lg px-3 py-2 border border-purple-500/30 font-mono text-xs text-zinc-300 truncate">
                                      {product.affiliate_link}
                                    </div>
                                    <Button
                                      size="sm"
                                      className="glass-button shrink-0 h-9 px-3"
                                      onClick={() => copyProductLink(product.id, product.affiliate_link!)}
                                    >
                                      {copiedProductLinks[product.id] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                  </div>
                                </>
                              )}
                              {product.promo_code && (
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 font-mono">
                                    🏷️ {product.promo_code}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* PAYOUTS TAB */}
          {activeTab === 'payouts' && (
            <div className="space-y-8">
              {/* En attente section */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-amber-400" />
                    Paiements en attente
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Payez vos affiliés pour leurs commissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-3">
                    {(!data.pendingCommissions || data.pendingCommissions.length === 0) ? (
                      <div className="text-center py-8 text-zinc-500">
                        <Wallet className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>Aucun paiement en attente</p>
                      </div>
                    ) : (
                      data.pendingCommissions.map((commission) => (
                        <div key={commission.affiliate_id} className="p-4 rounded-lg bg-white/5 border border-amber-500/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{commission.profile?.full_name || commission.profile?.email}</p>
                              <p className="text-zinc-400 text-sm">
                                PayPal: <span className={commission.profile?.paypal_email ? 'text-green-400' : 'text-red-400'}>
                                  {commission.profile?.paypal_email || 'Non configuré'}
                                </span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-amber-400">{formatCurrency(commission.amount)}</p>
                              <Button
                                size="sm"
                                className="glass-button mt-2"
                                disabled={!commission.profile?.paypal_email || processingPayout === commission.affiliate_id}
                                onClick={() => handlePayout(commission.affiliate_id, commission.amount)}
                              >
                                {processingPayout === commission.affiliate_id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Send className="w-4 h-4 mr-1" />
                                    Payer
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Visual Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                <span className="text-zinc-500 text-sm font-medium flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Historique
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              </div>

              {/* Historique section */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Wallet className="w-5 h-5 text-green-400" />
                    Historique des paiements
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Vos paiements déjà effectués
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Empty state for now - data will be wired up later */}
                  <div className="text-center py-12 text-zinc-500">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 opacity-30" />
                    </div>
                    <p className="text-lg font-medium text-zinc-400 mb-1">Aucun paiement effectué</p>
                    <p className="text-sm">Les paiements traités apparaîtront ici</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="max-w-xl space-y-6">
              {/* Changer le mot de passe */}
              <Card className="glass-card border-0 border-amber-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Shield className="w-5 h-5 text-amber-400" />
                    Changer le mot de passe
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Modifiez votre mot de passe de connexion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Mot de passe actuel */}
                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-sm">Mot de passe actuel</Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPwd ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Nouveau mot de passe */}
                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-sm">Nouveau mot de passe</Label>
                    <div className="relative">
                      <Input
                        type={showNewPwd ? 'text' : 'password'}
                        placeholder="Minimum 6 caractères"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd(!showNewPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newPassword && newPassword.length < 6 && (
                      <p className="text-xs text-amber-400">Minimum 6 caractères requis</p>
                    )}
                  </div>

                  {/* Confirmer le mot de passe */}
                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-sm">Confirmer le nouveau mot de passe</Label>
                    <div className="relative">
                      <Input
                        type={showNewPwd ? 'text' : 'password'}
                        placeholder="Retapez le nouveau mot de passe"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600 pr-10 ${confirmPassword && confirmPassword !== newPassword ? 'border-red-500/50' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd(!showNewPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-xs text-red-400">Les mots de passe ne correspondent pas</p>
                    )}
                  </div>

                  {/* Bouton sauvegarder */}
                  <Button
                    onClick={handleChangePassword}
                    disabled={
                      isChangingPassword ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword ||
                      newPassword !== confirmPassword ||
                      newPassword.length < 6
                    }
                    className="glass-button w-full"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Modification...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Changer le mot de passe
                      </>
                    )}
                  </Button>
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
                    Votre email PayPal pour recevoir les paiements
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
                </CardContent>
              </Card>

              {/* Webhook Systeme.io Configuration */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    🔗 Configuration Webhook Systeme.io
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Configurez l&apos;intégration avec Systeme.io
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Webhook URL */}
                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-sm">URL du Webhook</Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={webhookUrl}
                        readOnly
                        className="bg-white/5 border-purple-500/20 text-white font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 border-purple-500/20 hover:bg-purple-500/10 text-zinc-400 hover:text-white"
                        onClick={copyWebhookUrl}
                      >
                        {copiedWebhookUrl ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Secret Key */}
                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-sm flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      Clé secrète
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                        className="bg-white/5 border-purple-500/20 text-white font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 border-purple-500/20 hover:bg-purple-500/10 text-zinc-400 hover:text-white"
                        onClick={copySecretKey}
                      >
                        {copiedSecret ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <div className="text-zinc-400 text-sm">
                        <p className="mb-2">Configurez dans <span className="text-blue-300 font-medium">Systeme.io &gt; Automatisation &gt; Webhooks</span> :</p>
                        <p className="mb-1">1. Collez l&apos;URL et la clé secrète ci-dessus</p>
                        <p className="mb-1">2. Cochez <span className="text-green-300 font-medium">✅ Contact créé</span></p>
                        <p>3. Sauvegardez</p>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSaveWebhook}
                    disabled={isSavingWebhook}
                    className="glass-button w-full"
                  >
                    {isSavingWebhook ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Sauvegarder la configuration webhook
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* DNS Configuration */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    🌐 Configuration DNS
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* DNS Record Table */}
                  <div className="rounded-lg overflow-hidden border border-purple-500/20">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/5">
                          <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Type</th>
                          <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Nom</th>
                          <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Valeur</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-white/5">
                          <td className="px-4 py-3">
                            <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-xs">CNAME</Badge>
                          </td>
                          <td className="px-4 py-3 font-mono text-white text-xs">
                            {data?.profile?.subdomain
                              ? data.profile.subdomain.split('.')[0]
                              : 'votre-sous-domaine'}
                          </td>
                          <td className="px-4 py-3 font-mono text-green-400 text-xs">affiliationpro.cashflowecosysteme.com</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Copy full DNS info */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      const sub = data?.profile?.subdomain?.split('.')[0] || 'votre-sous-domaine'
                      const dnsText = `Type: CNAME\nNom: ${sub}\nValeur: affiliationpro.cashflowecosysteme.com`
                      navigator.clipboard.writeText(dnsText)
                      setCopiedDns(true)
                      toast.success('Configuration DNS copiée !')
                      setTimeout(() => setCopiedDns(false), 2000)
                    }}
                    className="w-full border-purple-500/20 hover:bg-purple-500/10 text-zinc-300 hover:text-white"
                  >
                    {copiedDns ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copiedDns ? 'Copié !' : 'Copier la configuration DNS'}
                  </Button>
                </CardContent>
              </Card>

              {/* Custom Slug */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    ✏️ Lien personnalisé
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Personnalisez votre lien de recrutement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Link */}
                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-sm">Lien actuel</Label>
                    <div className="p-3 rounded-lg bg-white/5 border border-purple-500/10">
                      <p className="font-mono text-white text-xs break-all">
                        {referralLink}
                      </p>
                    </div>
                  </div>

                  {/* Custom Slug Input */}
                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-sm">Slug personnalisé</Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="monprogramme"
                        value={customSlug}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                          setCustomSlug(val)
                        }}
                        className={`bg-white/5 border-purple-500/20 text-white font-mono ${customSlug && !customSlugValid ? 'border-red-500/50' : ''}`}
                      />
                    </div>
                    <p className="text-zinc-500 text-xs">
                      Seuls les lettres minuscules, chiffres et tirets sont autorisés.
                    </p>
                  </div>

                  {/* Preview */}
                  {customSlug && (
                    <div className="space-y-2">
                      <Label className="text-zinc-300 text-sm">Aperçu</Label>
                      <div className={`p-3 rounded-lg border ${customSlugValid ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                        <p className={`font-mono text-xs break-all flex items-center gap-2 ${customSlugValid ? 'text-green-400' : 'text-red-400'}`}>
                          <Link2 className="w-3.5 h-3.5 shrink-0" />
                          {slugPreview}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <Button
                    onClick={handleSaveSlug}
                    disabled={!customSlugValid || isSavingSlug}
                    className="glass-button w-full"
                  >
                    {isSavingSlug ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Subdomain */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Shield className="w-5 h-5 text-purple-400" />
                    Sous-domaine
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Contactez le support pour configurer votre sous-domaine personnalisé
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-white font-mono">
                    {data.profile?.subdomain 
                      ? `${data.profile.subdomain}.affiliationpro.cashflowecosysteme.com`
                      : 'Non configuré'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </main>

    </div>
  )
}
