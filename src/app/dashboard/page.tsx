'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  Users,
  GraduationCap,
  CheckCircle2,
  Plus,
  ArrowRight,
  Loader2,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'

interface Stats {
  totalRevenueCents: number
  totalNetCents: number
  totalFeesCents: number
  monthRevenueCents: number
  weekRevenueCents: number
  totalStudents: number
  totalFormations: number
  publishedFormations: number
  avgCompletion: number
}

interface ChartDataPoint {
  date: string
  total_cents: number
  count: number
}

interface Enrollment {
  id: string
  student_email: string
  student_name: string | null
  progress_percent: number
  status: string
  enrolled_at: string
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

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

function getFormattedDate() {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function DashboardHomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [recentEnrollments, setRecentEnrollments] = useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [statsRes, userRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/auth/me'),
      ])

      if (!statsRes.ok || !userRes.ok) {
        if (statsRes.status === 401 || userRes.status === 401) {
          window.location.href = '/login'
          return
        }
        throw new Error('Erreur de chargement')
      }

      const statsData = await statsRes.json()
      const userData = await userRes.json()

      setStats(statsData.stats)
      setChartData(statsData.chartData || [])
      setRecentEnrollments(statsData.recentEnrollments || [])
      setUserName(userData.user?.full_name?.split(' ')[0] || '')
    } catch {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Build 30-day chart array with zero-fill
  const chartBars = (() => {
    const days: { date: string; amount: number; day: string }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLabel = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      const found = chartData.find((c) => c.date === dateStr)
      days.push({
        date: dateStr,
        amount: found ? found.total_cents / 100 : 0,
        day: dayLabel,
      })
    }
    return days
  })()

  const maxAmount = Math.max(...chartBars.map((b) => b.amount), 1)

  const statCards = [
    {
      label: 'Total revenus',
      value: stats ? formatCurrency(stats.totalRevenueCents) : '--',
      icon: TrendingUp,
      accent: 'from-green-500/20 to-emerald-500/10',
      iconColor: 'text-green-400',
      borderColor: 'border-green-500/20',
    },
    {
      label: 'Étudiants actifs',
      value: stats ? stats.totalStudents.toString() : '--',
      icon: Users,
      accent: 'from-purple-500/20 to-violet-500/10',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/20',
    },
    {
      label: 'Formations publiées',
      value: stats ? stats.publishedFormations.toString() : '--',
      icon: GraduationCap,
      accent: 'from-blue-500/20 to-cyan-500/10',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/20',
    },
    {
      label: 'Taux de complétion',
      value: stats ? `${stats.avgCompletion}%` : '--',
      icon: CheckCircle2,
      accent: 'from-[#F4C842]/20 to-amber-500/10',
      iconColor: 'text-[#F4C842]',
      borderColor: 'border-[#F4C842]/20',
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {getGreeting()}, {userName || 'Créateur'}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <Calendar className="w-4 h-4 text-zinc-500" />
          <p className="text-zinc-400 text-sm capitalize">{getFormattedDate()}</p>
        </div>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="glass-card border-0 hover:transform-none">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-3 bg-zinc-800" />
                <Skeleton className="h-8 w-20 mb-3 bg-zinc-800" />
                <Skeleton className="h-8 w-8 rounded-lg bg-zinc-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Card key={card.label} className={`glass-card border-0 hover:transform-none ${card.borderColor}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-zinc-400 text-sm font-medium">{card.label}</p>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.accent} flex items-center justify-center`}>
                    <card.icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Revenue Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="glass-card border-0 lg:col-span-2 hover:transform-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Revenus (30 derniers jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full bg-zinc-800 rounded-lg" />
            ) : chartBars.length > 0 ? (
              <div className="flex items-end gap-[2px] h-48 mt-2">
                {chartBars.map((bar, i) => (
                  <div key={bar.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div
                      className="w-full rounded-t-sm bg-gradient-to-t from-[#7B5CFF] to-[#a78bfa] min-h-[2px] transition-all duration-300 group-hover:from-[#F4C842] group-hover:to-[#fde68a]"
                      style={{
                        height: `${Math.max((bar.amount / maxAmount) * 100, bar.amount > 0 ? 4 : 1)}%`,
                      }}
                    />
                    {/* Tooltip */}
                    {bar.amount > 0 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-[#0c1a2e] border border-purple-500/20 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {formatCurrency(bar.amount)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
                Aucune donnee de revenus
              </div>
            )}
            {/* X-axis labels */}
            <div className="flex justify-between mt-2 px-1">
              <span className="text-[10px] text-zinc-500">{chartBars[0]?.day}</span>
              <span className="text-[10px] text-zinc-500">{chartBars[Math.floor(chartBars.length / 2)]?.day}</span>
              <span className="text-[10px] text-zinc-500">{chartBars[chartBars.length - 1]?.day}</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="glass-card border-0 hover:transform-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/formations">
              <Button className="btn-gold w-full py-5 text-sm border-0 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Créer une formation
              </Button>
            </Link>
            <Link href="/dashboard/formations">
              <Button variant="ghost" className="w-full py-4 text-zinc-300 hover:text-white hover:bg-white/[0.03] flex items-center justify-between border border-purple-500/10 rounded-xl">
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  Voir mes formations
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-500" />
              </Button>
            </Link>
            <Link href="/dashboard/students">
              <Button variant="ghost" className="w-full py-4 text-zinc-300 hover:text-white hover:bg-white/[0.03] flex items-center justify-between border border-purple-500/10 rounded-xl">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  Gérer mes étudiants
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-500" />
              </Button>
            </Link>
            <Link href="/dashboard/revenue">
              <Button variant="ghost" className="w-full py-4 text-zinc-300 hover:text-white hover:bg-white/[0.03] flex items-center justify-between border border-purple-500/10 rounded-xl">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  Voir mes revenus
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-500" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Students Table */}
      <Card className="glass-card border-0 hover:transform-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Users className="w-5 h-5 text-purple-400" />
              Étudiants récents
            </CardTitle>
            <Link href="/dashboard/students">
              <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 text-xs">
                Voir tout <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full bg-zinc-800 rounded-lg" />
              ))}
            </div>
          ) : recentEnrollments.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Aucun étudiant inscrit pour le moment</p>
              <p className="text-xs mt-1 text-zinc-600">Partagez vos formations pour attirer vos premiers étudiants</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-purple-500/10">
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Étudiant</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Formation</th>
                      <th className="text-left py-3 px-3 text-zinc-500 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Date</th>
                      <th className="text-right py-3 px-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/5">
                    {recentEnrollments.slice(0, 5).map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3">
                          <div>
                            <p className="text-white font-medium">{enrollment.student_name || 'Sans nom'}</p>
                            <p className="text-zinc-500 text-xs">{enrollment.student_email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3 hidden sm:table-cell">
                          <span className="text-zinc-300">{enrollment.formation_title}</span>
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell">
                          <span className="text-zinc-400 text-xs">{formatDate(enrollment.enrolled_at)}</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Badge
                            className={
                              enrollment.status === 'active'
                                ? 'bg-green-500/10 text-green-400'
                                : enrollment.status === 'refunded'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-zinc-500/10 text-zinc-400'
                            }
                          >
                            {enrollment.status === 'active' ? 'Actif' : enrollment.status === 'refunded' ? 'Remboursé' : enrollment.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
