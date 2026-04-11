'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TrendingUp,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Wallet,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  RotateCcw,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'

interface PaymentSummary {
  totalRevenueCents: number
  totalNetCents: number
  totalFeesCents: number
  totalPayments: number
  paidCount: number
  pendingCount: number
  refundedCount: number
  monthRevenueCents: number
  weekRevenueCents: number
}

interface Payment {
  id: string
  student_email: string
  student_name: string | null
  amount: number
  currency: string
  net_amount: number
  platform_fee_amount: number
  status: string
  created_at: string
  paid_at: string | null
  formation_title: string
  formation_id: string
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function DashboardRevenuePage() {
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchRevenue = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '10')
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/dashboard/revenue?${params.toString()}`)
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login'
          return
        }
        throw new Error('Erreur')
      }

      const data = await res.json()
      setSummary(data.summary)
      setPayments(data.payments || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch {
      toast.error('Erreur lors du chargement des revenus')
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetchRevenue()
  }, [fetchRevenue])

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  const handleExport = () => {
    toast.info('Export CSV bientot disponible')
  }

  const summaryCards = summary
    ? [
        {
          label: 'Total revenus',
          value: formatCurrency(summary.totalRevenueCents),
          icon: TrendingUp,
          accent: 'from-green-500/20 to-emerald-500/10',
          iconColor: 'text-green-400',
          subtext: `${summary.paidCount} paiement${summary.paidCount !== 1 ? 's' : ''}`,
        },
        {
          label: 'Ce mois',
          value: formatCurrency(summary.monthRevenueCents),
          icon: Calendar,
          accent: 'from-purple-500/20 to-violet-500/10',
          iconColor: 'text-purple-400',
          subtext: 'Revenus mensuels',
        },
        {
          label: 'Cette semaine',
          value: formatCurrency(summary.weekRevenueCents),
          icon: Clock,
          accent: 'from-blue-500/20 to-cyan-500/10',
          iconColor: 'text-blue-400',
          subtext: '7 derniers jours',
        },
        {
          label: 'Commission plateforme',
          value: formatCurrency(summary.totalFeesCents),
          icon: Wallet,
          accent: 'from-[#F4C842]/20 to-amber-500/10',
          iconColor: 'text-[#F4C842]',
          subtext: `Revenu net: ${formatCurrency(summary.totalNetCents)}`,
        },
      ]
    : []

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            Revenus
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Suivez vos revenus et paiements en temps reel
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={handleExport}
          className="text-zinc-400 hover:text-white border border-purple-500/10 rounded-xl flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full bg-zinc-800 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <Card key={card.label} className="glass-card border-0 hover:transform-none">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">{card.label}</p>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.accent} flex items-center justify-center`}>
                    <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                </div>
                <p className="text-xl font-bold text-white">{card.value}</p>
                <p className="text-zinc-500 text-xs mt-1">{card.subtext}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payments Table */}
      <Card className="glass-card border-0 hover:transform-none overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <CreditCard className="w-5 h-5 text-purple-400" />
              Historique des paiements
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white/[0.03] border-purple-500/15 text-zinc-300 h-9 w-40 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0c1a2e] border-purple-500/20">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="paid">Payes</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="refunded">Rembourses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full bg-zinc-800 rounded-lg" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <CreditCard className="w-14 h-14 mx-auto mb-4 opacity-20" />
              <p className="text-base font-medium mb-1">Aucun paiement</p>
              <p className="text-sm text-zinc-600">
                {statusFilter !== 'all'
                  ? 'Aucun paiement avec ce statut'
                  : 'Les paiements apparaîtront ici une fois vos formations achetees'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-purple-500/10">
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium text-xs uppercase tracking-wider">Étudiant</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Formation</th>
                    <th className="text-right py-3 px-4 text-zinc-500 font-medium text-xs uppercase tracking-wider">Montant</th>
                    <th className="text-right py-3 px-4 text-zinc-500 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Commission</th>
                    <th className="text-right py-3 px-4 text-zinc-500 font-medium text-xs uppercase tracking-wider">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/5">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-zinc-400 text-xs">
                          {formatDate(payment.paid_at || payment.created_at)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-medium text-sm">
                            {payment.student_name || 'Anonyme'}
                          </p>
                          <p className="text-zinc-500 text-xs">{payment.student_email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="text-zinc-300 text-sm truncate block max-w-[200px]">
                          {payment.formation_title}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-white font-medium text-sm">
                          {formatCurrency(payment.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right hidden md:table-cell">
                        <span className="text-[#F4C842] text-xs font-medium">
                          {formatCurrency(payment.platform_fee_amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge
                          className={
                            payment.status === 'paid'
                              ? 'bg-green-500/10 text-green-400'
                              : payment.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400'
                              : payment.status === 'refunded'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-zinc-500/10 text-zinc-400'
                          }
                        >
                          <span className="flex items-center gap-1">
                            {payment.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                            {payment.status === 'pending' && <Clock className="w-3 h-3" />}
                            {payment.status === 'refunded' && <RotateCcw className="w-3 h-3" />}
                            {payment.status === 'paid' ? 'Paye' : payment.status === 'pending' ? 'En attente' : payment.status === 'refunded' ? 'Rembourse' : payment.status}
                          </span>
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-purple-500/10">
              <p className="text-zinc-500 text-xs">
                Page {page} sur {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 text-xs ${page === pageNum ? 'bg-purple-500/10 text-purple-400' : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'}`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
