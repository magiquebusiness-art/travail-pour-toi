'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  GraduationCap,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'

interface Enrollment {
  id: string
  student_email: string
  student_name: string | null
  progress_percent: number
  status: string
  enrolled_at: string
  completed_at: string | null
  last_accessed_at: string | null
  formation_title: string
  formation_id: string
  thumbnail_url: string | null
}

interface FormationOption {
  id: string
  title: string
  student_count: number
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#7B5CFF] to-[#a78bfa] transition-all duration-500"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className="text-xs text-zinc-400 w-8 text-right">{percent}%</span>
    </div>
  )
}

export default function DashboardStudentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [formations, setFormations] = useState<FormationOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFormation, setSelectedFormation] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalStudents, setTotalStudents] = useState(0)

  const fetchStudents = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '10')
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (selectedFormation !== 'all') params.set('formationId', selectedFormation)

      const res = await fetch(`/api/dashboard/students?${params.toString()}`)
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login'
          return
        }
        throw new Error('Erreur')
      }

      const data = await res.json()
      setEnrollments(data.enrollments || [])
      setFormations(data.formations || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalStudents(data.pagination?.total || 0)
    } catch {
      toast.error('Erreur lors du chargement des étudiants')
    } finally {
      setIsLoading(false)
    }
  }, [page, searchQuery, selectedFormation])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedFormation])

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-400" />
          Mes Étudiants
        </h2>
        <p className="text-zinc-400 text-sm mt-1">
          {totalStudents} étudiant{totalStudents !== 1 ? 's' : ''} inscrit{totalStudents !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Rechercher par nom, email ou formation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/[0.03] border-purple-500/15 text-white placeholder:text-zinc-600 pl-10 h-10 text-sm rounded-xl"
          />
        </div>
        <div className="w-full sm:w-56">
          <Select value={selectedFormation} onValueChange={setSelectedFormation}>
            <SelectTrigger className="bg-white/[0.03] border-purple-500/15 text-zinc-300 h-10 text-sm rounded-xl">
              <SelectValue placeholder="Toutes les formations" />
            </SelectTrigger>
            <SelectContent className="bg-[#0c1a2e] border-purple-500/20">
              <SelectItem value="all">Toutes les formations</SelectItem>
              {formations.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.title} ({f.student_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="glass-card border-0 hover:transform-none overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <Skeleton key={i} className="h-12 w-full bg-zinc-800 rounded-lg" />
              ))}
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <Users className="w-14 h-14 mx-auto mb-4 opacity-20" />
              <p className="text-base font-medium mb-1">Aucun étudiant trouvé</p>
              <p className="text-sm text-zinc-600">
                {searchQuery || selectedFormation !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Vos étudiants apparaîtront ici apres leurs inscriptions'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-purple-500/10">
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium text-xs uppercase tracking-wider">Étudiant</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Formation</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Date inscription</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Progression</th>
                    <th className="text-right py-3 px-4 text-zinc-500 font-medium text-xs uppercase tracking-wider">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/5">
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B5CFF] to-[#6C4FE0] flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                            {getInitials(enrollment.student_name, enrollment.student_email)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium text-sm truncate">
                              {enrollment.student_name || 'Sans nom'}
                            </p>
                            <p className="text-zinc-500 text-xs truncate">
                              {enrollment.student_email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="text-zinc-300 text-sm">{enrollment.formation_title}</span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-zinc-400 text-xs">{formatDate(enrollment.enrolled_at)}</span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <ProgressBar percent={enrollment.progress_percent || 0} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge
                          className={
                            enrollment.status === 'active'
                              ? 'bg-green-500/10 text-green-400'
                              : enrollment.status === 'refunded'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-zinc-500/10 text-zinc-400'
                          }
                        >
                          {enrollment.status === 'active' ? 'Actif' : enrollment.status === 'refunded' ? 'Rembourse' : enrollment.status}
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
