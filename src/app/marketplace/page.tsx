'use client'
export const runtime = 'edge'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { StarryBackground } from '@/components/StarryBackground'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Copy,
  Check,
  ShoppingCart,
  ExternalLink,
  Loader2,
  ArrowLeft,
  Lightbulb,
  Star,
  DollarSign,
  X,
  LinkIcon,
} from 'lucide-react'
import { toast } from 'sonner'

interface MarketplaceProduct {
  id: string
  title: string
  description_short: string
  description_long: string | null
  price: number
  commission_n1: number
  commission_n2: number | null
  commission_n3: number | null
  affiliate_link: string | null
  image_url: string | null
  category_name: string | null
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedLinks, setCopiedLinks] = useState<Record<string, boolean>>({})
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/public/marketplace')
      const result = await response.json()
      if (response.ok) {
        setProducts(result.products || [])
      } else {
        toast.error('Erreur lors du chargement des produits')
      }
    } catch (error) {
      console.error('Error fetching marketplace:', error)
      toast.error('Erreur lors du chargement des produits')
    } finally {
      setIsLoading(false)
    }
  }

  const copyLink = (productId: string, link: string) => {
    navigator.clipboard.writeText(link)
    setCopiedLinks(prev => ({ ...prev, [productId]: true }))
    toast.success('Lien copié !')
    setTimeout(() => setCopiedLinks(prev => ({ ...prev, [productId]: false })), 2000)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <StarryBackground />
        <div className="relative z-10 text-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Chargement du marketplace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <StarryBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-purple-500/10">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" />
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">AffiliationPro</span>
          </Link>
        </div>
        <Link href="/ambassadeur">
          <Button className="glass-button">
            <Star className="w-4 h-4 mr-2" />
            Devenir Ambassadeur
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-8 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              🛍️ Marketplace
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Découvrez nos produits recommandés
            </p>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <Card className="glass-card border-0">
              <CardContent className="p-12 text-center">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                <h3 className="text-xl text-zinc-400 mb-2">Aucun produit disponible</h3>
                <p className="text-zinc-500">De nouveaux produits seront bientôt ajoutés. Revenez vérifier !</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="glass-card border-0 glass-card-hover overflow-hidden group cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  {/* Product Image */}
                  {product.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-purple-500/80 text-white border-0 backdrop-blur-sm">
                          {product.category_name || 'Produit'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <CardContent className="p-6">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                      {product.title}
                    </h3>

                    {/* Description */}
                    <p className="text-zinc-400 text-sm mb-4 line-clamp-3">
                      {product.description_short}
                    </p>

                    {/* Price & Commission */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-xl font-bold text-green-400">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        {product.commission_n1}% commission
                      </Badge>
                    </div>

                    {/* Commission Levels */}
                    {(product.commission_n2 || product.commission_n3) && (
                      <div className="flex gap-2 mb-4">
                        {product.commission_n1 !== null && (
                          <div className="text-xs text-zinc-500 px-2 py-1 rounded bg-white/5">
                            N1: {product.commission_n1}%
                          </div>
                        )}
                        {product.commission_n2 !== null && (
                          <div className="text-xs text-zinc-500 px-2 py-1 rounded bg-white/5">
                            N2: {product.commission_n2}%
                          </div>
                        )}
                        {product.commission_n3 !== null && (
                          <div className="text-xs text-zinc-500 px-2 py-1 rounded bg-white/5">
                            N3: {product.commission_n3}%
                          </div>
                        )}
                      </div>
                    )}

                    {/* CTA: Voir le produit */}
                    <Button
                      className="w-full glass-button text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedProduct(product)
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Voir le produit
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Banner Commission */}
          <Card className="glass-card border-amber-500/30 overflow-hidden relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-purple-500/10" />
            <CardContent className="p-6 md:p-8 relative">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">
                    💡 Pour recevoir des commissions sur tes ventes, tu dois t&apos;inscrire comme ambassadeur.
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Sinon, réfère-nous à vos amis ! Rejoins notre programme d&apos;affiliation et commence à gagner de l&apos;argent en promouvant nos produits.
                  </p>
                </div>
                <Link href="/ambassadeur" className="shrink-0">
                  <Button className="glass-button whitespace-nowrap">
                    <Star className="w-4 h-4 mr-2" />
                    Devenir Ambassadeur
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </main>

      {/* ===== MODAL PRODUIT ===== */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="glass-card border border-purple-500/20 bg-[#0c1222] w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header avec image */}
            {selectedProduct.image_url && (
              <div className="relative h-56 overflow-hidden rounded-t-2xl">
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-transparent to-transparent" />
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute top-3 left-3">
                  <Badge className="bg-purple-500/80 text-white border-0 backdrop-blur-sm">
                    {selectedProduct.category_name || 'Produit'}
                  </Badge>
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6">
              {!selectedProduct.image_url && (
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {selectedProduct.category_name || 'Produit'}
                  </Badge>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/20 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Titre */}
              <h2 className="text-2xl font-bold text-white mb-2">
                {selectedProduct.title}
              </h2>

              {/* Prix */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-bold text-green-400">
                  {formatCurrency(selectedProduct.price)}
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  {selectedProduct.commission_n1}% commission
                </Badge>
              </div>

              {/* Description */}
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                {selectedProduct.description_short}
              </p>

              {/* Commissions niveaux */}
              {(selectedProduct.commission_n2 || selectedProduct.commission_n3) && (
                <div className="flex gap-3 mb-6">
                  <div className="flex-1 text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <p className="text-purple-300 font-semibold">{selectedProduct.commission_n1}%</p>
                    <p className="text-xs text-zinc-500">Niveau 1</p>
                  </div>
                  {selectedProduct.commission_n2 !== null && (
                    <div className="flex-1 text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-blue-300 font-semibold">{selectedProduct.commission_n2}%</p>
                      <p className="text-xs text-zinc-500">Niveau 2</p>
                    </div>
                  )}
                  {selectedProduct.commission_n3 !== null && (
                    <div className="flex-1 text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-green-300 font-semibold">{selectedProduct.commission_n3}%</p>
                      <p className="text-xs text-zinc-500">Niveau 3</p>
                    </div>
                  )}
                </div>
              )}

              {/* ===== LIEN DU CLIENT — TOUJOURS VISIBLE ===== */}
              <div className="border-t border-purple-500/20 pt-5">
                {selectedProduct.affiliate_link ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-green-400" />
                        Lien du produit
                      </p>
                      <p className="text-xs text-zinc-500 mb-3">
                        Cliquez sur le lien ou copiez-le pour accéder au produit
                      </p>
                    </div>

                    {/* Le lien VISIBLE en entier */}
                    <div className="bg-green-500/5 rounded-xl px-4 py-4 border border-green-500/30">
                      <div className="font-mono text-sm text-white break-all leading-relaxed select-all">
                        {selectedProduct.affiliate_link}
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 glass-button text-white py-5 text-base"
                        onClick={() => copyLink(selectedProduct.id, selectedProduct.affiliate_link!)}
                      >
                        {copiedLinks[selectedProduct.id] ? (
                          <>
                            <Check className="w-4 h-4 mr-2 text-green-400" />
                            Copié !
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copier le lien
                          </>
                        )}
                      </Button>
                      <a
                        href={selectedProduct.affiliate_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-5 text-base font-semibold">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ouvrir le lien
                        </Button>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/10 rounded-lg px-4 py-3 border border-amber-500/20">
                    <p className="text-amber-400 text-sm flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Le lien du produit sera bientôt ajouté
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
