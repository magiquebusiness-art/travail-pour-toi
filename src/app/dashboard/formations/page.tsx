'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  GraduationCap,
  Users,
  BookOpen,
  FileText,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

interface Formation {
  id: string
  title: string
  description: string
  price: number
  currency: string
  status: string
  thumbnail_url: string | null
  category: string | null
  module_count: number
  lesson_count: number
  student_count: number
  created_at: string
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(cents)
}

export default function DashboardFormationsPage() {
  const router = useRouter()
  const [formations, setFormations] = useState<Formation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Formation | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPrice, setFormPrice] = useState('')

  const fetchFormations = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/dashboard/formations')
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login'
          return
        }
        throw new Error('Erreur')
      }
      const data = await res.json()
      setFormations(data.formations || [])
    } catch {
      toast.error('Erreur lors du chargement des formations')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFormations()
  }, [fetchFormations])

  const handleCreate = async () => {
    if (!formTitle.trim()) {
      toast.error('Le titre est requis')
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch('/api/dashboard/formations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim(),
          price: formPrice ? parseFloat(formPrice) * 100 : 0, // Convert to cents
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur')
      }

      toast.success('Formation creee avec succes !')
      setShowCreateModal(false)
      setFormTitle('')
      setFormDescription('')
      setFormPrice('')
      fetchFormations()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la creation')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      const res = await fetch(`/api/formations/${deleteTarget.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Formation supprimee')
        fetchFormations()
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-purple-400" />
            Mes Formations
          </h2>
          <p className="text-zinc-400 text-sm mt-1">Créez et gerez vos formations en ligne</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="btn-gold border-0 text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle formation
        </Button>
      </div>

      {/* Formations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full bg-zinc-800 rounded-2xl" />
          ))}
        </div>
      ) : formations.length === 0 ? (
        /* Empty state */
        <div className="glass-card border-0 hover:transform-none py-20 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/10 flex items-center justify-center mb-6">
            <GraduationCap className="w-10 h-10 text-purple-400/50" />
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">Aucune formation</h3>
          <p className="text-zinc-400 text-sm mb-6 max-w-sm mx-auto">
            Créez votre premiere formation et commencez a partager votre expertise avec le monde.
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="btn-gold border-0 flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Creer ma premiere formation
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formations.map((formation) => (
            <Card
              key={formation.id}
              className="glass-card border-0 overflow-hidden group hover:transform-none"
            >
              {/* Thumbnail / gradient */}
              <div className="h-36 relative overflow-hidden">
                {formation.thumbnail_url ? (
                  <img
                    src={formation.thumbnail_url}
                    alt={formation.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#7B5CFF]/20 via-purple-500/10 to-transparent" />
                )}
                <div className="absolute top-3 right-3">
                  <Badge
                    className={
                      formation.status === 'published'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20 backdrop-blur-sm'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20 backdrop-blur-sm'
                    }
                  >
                    {formation.status === 'published' ? 'Publiee' : 'Brouillon'}
                  </Badge>
                </div>
                <div className="absolute top-3 left-3">
                  <Badge className="bg-black/30 text-white/70 backdrop-blur-sm border-0">
                    {formatCurrency(formation.price)}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-5">
                <h3 className="text-white font-semibold text-base mb-1 line-clamp-1">
                  {formation.title}
                </h3>
                <p className="text-zinc-400 text-sm line-clamp-2 mb-4">
                  {formation.description || 'Aucune description'}
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-zinc-400 mb-4">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    {formation.module_count} module{formation.module_count !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    {formation.lesson_count} lecon{formation.lesson_count !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    {formation.student_count} étudiant{formation.student_count !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-zinc-300 hover:text-white hover:bg-white/[0.05] text-xs border border-purple-500/10 rounded-lg h-8"
                    onClick={() => router.push(`/admin/formations`)}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-zinc-300 hover:text-white hover:bg-white/[0.05] text-xs border border-purple-500/10 rounded-lg h-8"
                    asChild
                  >
                    <Link href={`/formations/${formation.id}`}>
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      Voir
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs border border-red-500/10 rounded-lg h-8 px-2"
                    onClick={() => setDeleteTarget(formation)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Formation Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md bg-[#0c1a2e] border-purple-500/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B5CFF]/20 to-purple-500/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-[#7B5CFF]" />
              </div>
              Nouvelle formation
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Créez une nouvelle formation pour vos étudiants
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-zinc-300 text-sm">
                Titre de la formation *
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="Ex: Marketing Digital Avance"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="bg-white/[0.05] border-purple-500/20 text-white placeholder:text-zinc-600 focus:border-purple-500/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-300 text-sm">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Decrivez votre formation en quelques lignes..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="bg-white/[0.05] border-purple-500/20 text-white placeholder:text-zinc-600 focus:border-purple-500/50 min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-zinc-300 text-sm">
                Prix (CAD)
              </Label>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="bg-white/[0.05] border-purple-500/20 text-white placeholder:text-zinc-600 focus:border-purple-500/50"
              />
              <p className="text-zinc-500 text-xs">Laissez 0 pour une formation gratuite</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 text-zinc-400 hover:text-white border border-purple-500/10 rounded-xl"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || !formTitle.trim()}
                className="btn-primary flex-1 border-0 disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creation...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Creer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#0c1a2e] border-red-500/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Supprimer la formation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Etes-vous sur de vouloir supprimer <span className="text-white font-medium">&quot;{deleteTarget?.title}&quot;</span> ?
              Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-zinc-400 border-purple-500/20 hover:bg-white/[0.05]">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
