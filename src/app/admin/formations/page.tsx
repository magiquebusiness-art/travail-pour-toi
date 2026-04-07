'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { StarryBackground } from '@/components/StarryBackground'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  BookOpen,
  Video,
  FileText,
  Headphones,
  HelpCircle,
  GripVertical,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ImageIcon,
  Upload,
  X,
  Layers,
  Save,
  Sparkles,
  Layout,
  Users,
  Play,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '@/hooks/useAuth'

// Dynamic import for GrapesJS (SSR disabled)
const GrapesJSEditor = dynamic(
  () => import('@/components/formation/grapesjs-editor'),
  { ssr: false, loading: () => <EditorLoading /> }
)

/* ===== Interfaces ===== */
interface Formation {
  id: string
  title: string
  description: string
  long_description: string
  price: number
  category: string | null
  thumbnail_url: string | null
  status: string
  student_count: number
  module_count: number
  lesson_count: number
  created_at: string
  updated_at: string
}

interface Module {
  id: string
  formation_id: string
  title: string
  description: string
  sort_order: number
  is_free: number
  lesson_count?: number
  lessons: Lesson[]
  created_at: string
}

interface Lesson {
  id: string
  module_id: string
  formation_id: string
  title: string
  description: string
  content_type: string
  video_url: string
  content_html: string
  duration_minutes: number
  sort_order: number
  is_free: number
  created_at: string
}

interface FormationPage {
  id?: string
  html_content: string
  css_content: string
  components_json: string
  style_json: string
  is_published: number
  slug?: string
  title?: string
}

/* ===== Sortable Module Item ===== */
function SortableModule({ module, onEdit, onDelete, onToggleLessons, expanded, onSelectLesson }: {
  module: Module
  onEdit: () => void
  onDelete: () => void
  onToggleLessons: () => void
  expanded: boolean
  onSelectLesson: (lesson: Lesson) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  }

  const contentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-3.5 h-3.5" />
      case 'audio': return <Headphones className="w-3.5 h-3.5" />
      case 'pdf': return <FileText className="w-3.5 h-3.5" />
      case 'quiz': return <HelpCircle className="w-3.5 h-3.5" />
      default: return <FileText className="w-3.5 h-3.5" />
    }
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-purple-500/10 hover:border-purple-500/30 transition-all">
        {/* Drag Handle */}
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-purple-400 p-1">
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Expand Toggle */}
        <button onClick={onToggleLessons} className="text-zinc-500 hover:text-purple-400 p-1">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Module Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-white font-medium text-sm truncate">{module.title}</span>
            {module.is_free ? (
              <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] px-1.5 py-0">Gratuit</Badge>
            ) : null}
          </div>
          <p className="text-zinc-500 text-xs mt-0.5">{module.lesson_count || module.lessons?.length || 0} leçon(s)</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Lessons */}
      {expanded && module.lessons && module.lessons.length > 0 && (
        <div className="ml-12 mt-1 space-y-1">
          {module.lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => onSelectLesson(lesson)}
              className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-purple-500/5 hover:border-purple-500/20 hover:bg-white/5 transition-all text-left"
            >
              {contentTypeIcon(lesson.content_type)}
              <span className="text-zinc-300 text-sm truncate flex-1">{lesson.title}</span>
              {lesson.is_free ? (
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] px-1.5 py-0 shrink-0">Gratuit</Badge>
              ) : null}
              {lesson.duration_minutes > 0 && (
                <span className="text-zinc-500 text-xs shrink-0">{lesson.duration_minutes}min</span>
              )}
              <Play className="w-3 h-3 text-zinc-500 shrink-0" />
            </button>
          ))}
          {module.lessons.length === 0 && (
            <p className="text-zinc-600 text-xs py-2 px-2">Aucune leçon</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ===== Editor Loading ===== */
function EditorLoading() {
  return (
    <div className="fixed inset-0 z-[100] bg-[#06101f] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  )
}

/* ===== Helper: Format Currency ===== */
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount)
}

/* ===== MAIN COMPONENT ===== */
export default function AdminFormationsPage() {
  const router = useRouter()
  const { logout } = useAuth()

  // State
  const [formations, setFormations] = useState<Formation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // Dialogs
  const [showFormationDialog, setShowFormationDialog] = useState(false)
  const [showModuleDialog, setShowModuleDialog] = useState(false)
  const [showLessonDialog, setShowLessonDialog] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [activeTargetModule, setActiveTargetModule] = useState<string>('')

  // Form state
  const [formationForm, setFormationForm] = useState({ title: '', description: '', long_description: '', price: '0', category: '', thumbnail_url: '' })
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', is_free: false })
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', content_type: 'text', video_url: '', content_html: '', duration_minutes: '0', is_free: false })

  // Page editor state
  const [pageData, setPageData] = useState<FormationPage | null>(null)

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Fetch formations
  const fetchFormations = useCallback(async () => {
    try {
      const response = await fetch('/api/formations')
      const result = await response.json()
      setFormations(result.formations || [])
    } catch (error) {
      console.error('Error fetching formations:', error)
      toast.error('Erreur lors du chargement des formations')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchFormations() }, [fetchFormations])

  // Fetch modules for a formation
  const fetchModules = useCallback(async (formationId: string) => {
    try {
      const [modRes, detailRes] = await Promise.all([
        fetch(`/api/formations/${formationId}/modules`),
        fetch(`/api/formations/${formationId}`),
      ])

      if (modRes.ok) {
        const modData = await modRes.json()
        setModules(modData.modules || [])
      }

      if (detailRes.ok) {
        const detailData = await detailRes.json()
        // Merge lessons from detail API
        setModules(detailData.modules || [])
      }
    } catch (error) {
      console.error('Error fetching modules:', error)
    }
  }, [])

  // Select a formation
  const selectFormation = useCallback((formation: Formation) => {
    setSelectedFormation(formation)
    fetchModules(formation.id)
    setExpandedModules(new Set())
  }, [fetchModules])

  // Create formation
  const handleCreateFormation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formationForm.title) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/formations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formationForm,
          price: Number(formationForm.price),
          thumbnail_url: thumbnailImage || null,
          status: 'draft',
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Formation créée !')
      setShowFormationDialog(false)
      setFormationForm({ title: '', description: '', long_description: '', price: '0', category: '', thumbnail_url: '' })
      setThumbnailImage(null)
      fetchFormations()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update formation
  const handleUpdateFormation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFormation || !formationForm.title) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/formations/${selectedFormation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formationForm,
          price: Number(formationForm.price),
          thumbnail_url: thumbnailImage || selectedFormation.thumbnail_url || null,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Formation mise à jour !')
      setShowFormationDialog(false)
      fetchFormations()
      selectFormation({ ...selectedFormation, ...formationForm, price: Number(formationForm.price), thumbnail_url: thumbnailImage || selectedFormation.thumbnail_url })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete formation
  const handleDeleteFormation = async (formationId: string) => {
    if (!confirm('Supprimer cette formation et tout son contenu ?')) return

    try {
      const response = await fetch(`/api/formations/${formationId}`, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Formation supprimée')
      if (selectedFormation?.id === formationId) {
        setSelectedFormation(null)
        setModules([])
      }
      fetchFormations()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  // Create module
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFormation || !moduleForm.title) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/formations/${selectedFormation.id}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleForm),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Module créé !')
      setShowModuleDialog(false)
      setModuleForm({ title: '', description: '', is_free: false })
      fetchModules(selectedFormation.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update module
  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFormation || !editingModule || !moduleForm.title) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/formations/${selectedFormation.id}/modules/${editingModule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleForm),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Module mis à jour !')
      setShowModuleDialog(false)
      setEditingModule(null)
      setModuleForm({ title: '', description: '', is_free: false })
      fetchModules(selectedFormation.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete module
  const handleDeleteModule = async (moduleId: string) => {
    if (!selectedFormation || !confirm('Supprimer ce module et ses leçons ?')) return

    try {
      const response = await fetch(`/api/formations/${selectedFormation.id}/modules/${moduleId}`, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Module supprimé')
      fetchModules(selectedFormation.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  // Create lesson
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFormation || !lessonForm.title) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/formations/${selectedFormation.id}/modules/${activeTargetModule}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lessonForm,
          duration_minutes: Number(lessonForm.duration_minutes),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Leçon créée !')
      setShowLessonDialog(false)
      setLessonForm({ title: '', description: '', content_type: 'text', video_url: '', content_html: '', duration_minutes: '0', is_free: false })
      fetchModules(selectedFormation.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsSubmitting(false)
    }
  }

  // DnD: Reorder modules
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    if (!selectedFormation) return
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = modules.findIndex(m => m.id === active.id)
    const newIndex = modules.findIndex(m => m.id === over.id)
    const newModules = arrayMove(modules, oldIndex, newIndex)
    setModules(newModules)

    try {
      const response = await fetch(`/api/formations/${selectedFormation.id}/modules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleIds: newModules.map(m => m.id) }),
      })
      if (!response.ok) throw new Error('Erreur')
    } catch {
      fetchModules(selectedFormation.id)
    }
  }, [selectedFormation, modules, fetchModules])

  // Toggle module expand
  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  // Open module dialog for editing
  const openEditModule = (mod: Module) => {
    setEditingModule(mod)
    setModuleForm({ title: mod.title, description: mod.description || '', is_free: !!mod.is_free })
    setShowModuleDialog(true)
  }

  // Open page editor
  const openPageEditor = async () => {
    if (!selectedFormation) return
    try {
      const response = await fetch(`/api/formations/${selectedFormation.id}/page`)
      const result = await response.json()
      setPageData(result.page || { html_content: '', css_content: '', components_json: '[]', style_json: '{}' })
      setShowEditor(true)
    } catch {
      toast.error('Erreur lors du chargement de la page')
    }
  }

  // Image upload handler
  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 Mo')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setThumbnailImage(e.target?.result as string)
      toast.success('Image chargée')
    }
    reader.readAsDataURL(file)
  }, [])

  // Open formation edit dialog
  const openEditFormation = () => {
    if (!selectedFormation) return
    setFormationForm({
      title: selectedFormation.title,
      description: selectedFormation.description || '',
      long_description: selectedFormation.long_description || '',
      price: String(selectedFormation.price || 0),
      category: selectedFormation.category || '',
      thumbnail_url: selectedFormation.thumbnail_url || '',
    })
    setThumbnailImage(selectedFormation.thumbnail_url || null)
    setShowFormationDialog(true)
  }

  // Select lesson for editing
  const handleSelectLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      content_type: lesson.content_type || 'text',
      video_url: lesson.video_url || '',
      content_html: lesson.content_html || '',
      duration_minutes: String(lesson.duration_minutes || 0),
      is_free: !!lesson.is_free,
    })
    setShowLessonDialog(true)
  }

  // Formation stats
  const stats = useMemo(() => ({
    total: formations.length,
    published: formations.filter(f => f.status === 'published').length,
    draft: formations.filter(f => f.status === 'draft').length,
    totalStudents: formations.reduce((sum, f) => sum + (f.student_count || 0), 0),
  }), [formations])

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

  // Show GrapesJS Editor (full screen)
  if (showEditor && selectedFormation) {
    return (
      <GrapesJSEditor
        formationId={selectedFormation.id}
        initialHtml={pageData?.html_content || ''}
        initialCss={pageData?.css_content || ''}
        initialComponents={pageData?.components_json || '[]'}
        initialStyles={pageData?.style_json || '{}'}
        onSave={(data) => setPageData(prev => prev ? { ...prev, ...data } : null)}
        onClose={() => setShowEditor(false)}
      />
    )
  }

  return (
    <div className="relative min-h-screen">
      <StarryBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-purple-500/10">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text-violet">NyXia</span>
          </Link>
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
            <GraduationCap className="w-3 h-3 mr-1" />Formations
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/formations">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <Eye className="w-4 h-4 mr-2" />Voir le catalogue
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={() => router.push('/logout')}>
            Déconnexion
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-purple-400" />
                Gestion des Formations
              </h1>
              <p className="text-zinc-400 text-sm mt-1">Créez et gérez vos formations</p>
            </div>
            <Button onClick={() => {
              setFormationForm({ title: '', description: '', long_description: '', price: '0', category: '', thumbnail_url: '' })
              setThumbnailImage(null)
              setShowFormationDialog(true)
            }} className="bg-[#7B5CFF] hover:bg-[#6a4ce8] text-white">
              <Plus className="w-4 h-4 mr-2" />Nouvelle Formation
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total', value: stats.total, icon: GraduationCap, color: 'text-purple-400' },
              { label: 'Publiées', value: stats.published, icon: Check, color: 'text-green-400' },
              { label: 'Brouillons', value: stats.draft, icon: FileText, color: 'text-amber-400' },
              { label: 'Étudiants', value: stats.totalStudents, icon: Users, color: 'text-cyan-400' },
            ].map(stat => (
              <Card key={stat.label} className="glass-card border-0">
                <CardContent className="p-4 text-center">
                  <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-zinc-500 text-xs">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Formation List */}
            <div className="lg:col-span-1">
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Layers className="w-5 h-5 text-purple-400" />
                    Mes Formations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[60vh] overflow-y-auto custom-scrollbar space-y-2">
                    {formations.length === 0 ? (
                      <div className="text-center py-8 text-zinc-500">
                        <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Aucune formation</p>
                        <p className="text-xs mt-1">Créez votre première formation</p>
                      </div>
                    ) : (
                      formations.map(formation => (
                        <button
                          key={formation.id}
                          onClick={() => selectFormation(formation)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedFormation?.id === formation.id
                              ? 'bg-purple-500/10 border-purple-500/30'
                              : 'bg-white/5 border-purple-500/10 hover:border-purple-500/20 hover:bg-white/[0.07]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm truncate">{formation.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={
                                  formation.status === 'published'
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20 text-[10px] px-1.5 py-0'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] px-1.5 py-0'
                                }>
                                  {formation.status === 'published' ? 'Publié' : 'Brouillon'}
                                </Badge>
                                <span className="text-zinc-500 text-[10px]">{formatCurrency(formation.price)}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 text-zinc-500 text-[10px]">
                                <span>{formation.module_count || 0} modules</span>
                                <span>{formation.lesson_count || 0} leçons</span>
                                <span>{formation.student_count || 0} élèves</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Formation Detail & Modules */}
            <div className="lg:col-span-2">
              {!selectedFormation ? (
                <Card className="glass-card border-0">
                  <CardContent className="p-12 text-center">
                    <GraduationCap className="w-16 h-16 mx-auto mb-4 text-purple-500/20" />
                    <h3 className="text-white text-lg font-medium mb-2">Sélectionnez une formation</h3>
                    <p className="text-zinc-500 text-sm">Choisissez une formation dans la liste ou créez-en une nouvelle</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Formation Info Card */}
                  <Card className="glass-card border-0">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-white text-lg truncate">{selectedFormation.title}</CardTitle>
                          <CardDescription className="text-zinc-400 mt-1 line-clamp-2">
                            {selectedFormation.description || 'Aucune description'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <Link href={`/formations/${selectedFormation.id}`}>
                            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={openEditFormation}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-red-400" onClick={() => handleDeleteFormation(selectedFormation.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Button onClick={openPageEditor} variant="outline" size="sm" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                          <Layout className="w-4 h-4 mr-2" />
                          Éditeur de Page
                        </Button>
                        <Link href={`/formations/${selectedFormation.id}/learn`}>
                          <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                            <Play className="w-4 h-4 mr-2" />
                            Mode Apprenant
                          </Button>
                        </Link>
                        <Badge className={
                          selectedFormation.status === 'published'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }>
                          {selectedFormation.status === 'published' ? 'Publié' : 'Brouillon'}
                        </Badge>
                        <span className="text-zinc-400 text-sm">{formatCurrency(selectedFormation.price)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Modules & Lessons */}
                  <Card className="glass-card border-0">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2 text-lg">
                          <BookOpen className="w-5 h-5 text-purple-400" />
                          Modules & Leçons
                        </CardTitle>
                        <Button size="sm" onClick={() => {
                          setModuleForm({ title: '', description: '', is_free: false })
                          setEditingModule(null)
                          setShowModuleDialog(true)
                        }} className="bg-[#7B5CFF] hover:bg-[#6a4ce8] text-white">
                          <Plus className="w-4 h-4 mr-2" />Module
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                            {modules.length === 0 ? (
                              <div className="text-center py-8 text-zinc-500">
                                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Aucun module</p>
                                <p className="text-xs mt-1">Commencez par créer un module</p>
                              </div>
                            ) : (
                              modules.map(mod => (
                                <SortableModule
                                  key={mod.id}
                                  module={mod}
                                  onEdit={() => openEditModule(mod)}
                                  onDelete={() => handleDeleteModule(mod.id)}
                                  onToggleLessons={() => toggleModuleExpand(mod.id)}
                                  expanded={expandedModules.has(mod.id)}
                                  onSelectLesson={handleSelectLesson}
                                />
                              ))
                            )}
                          </div>
                        </SortableContext>
                      </DndContext>

                      {/* Add lesson button (when a module is expanded) */}
                      {expandedModules.size > 0 && modules.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-purple-500/10">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 text-xs">Ajouter une leçon à :</span>
                            <div className="flex flex-wrap gap-1">
                              {modules.filter(m => expandedModules.has(m.id)).map(mod => (
                                <Button
                                  key={mod.id}
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                                  onClick={() => {
                                    setActiveTargetModule(mod.id)
                                    setLessonForm({ title: '', description: '', content_type: 'text', video_url: '', content_html: '', duration_minutes: '0', is_free: false })
                                    setEditingLesson(null)
                                    setShowLessonDialog(true)
                                  }}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  {mod.title}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ===== FORMATION DIALOG ===== */}
      <Dialog open={showFormationDialog} onOpenChange={setShowFormationDialog}>
        <DialogContent className="glass-card border-0 max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedFormation ? 'Modifier la Formation' : 'Nouvelle Formation'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {selectedFormation ? 'Modifiez les informations de votre formation' : 'Remplissez les informations de votre nouvelle formation'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={selectedFormation ? handleUpdateFormation : handleCreateFormation} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Titre *</Label>
              <Input
                type="text"
                placeholder="Ex: Formation Marketing Digital"
                value={formationForm.title}
                onChange={(e) => setFormationForm({ ...formationForm, title: e.target.value })}
                required
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Description courte</Label>
              <Textarea
                placeholder="Description en une phrase..."
                value={formationForm.description}
                onChange={(e) => setFormationForm({ ...formationForm, description: e.target.value })}
                rows={2}
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Description longue</Label>
              <Textarea
                placeholder="Description détaillée de la formation..."
                value={formationForm.long_description}
                onChange={(e) => setFormationForm({ ...formationForm, long_description: e.target.value })}
                rows={4}
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Prix (CAD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formationForm.price}
                  onChange={(e) => setFormationForm({ ...formationForm, price: e.target.value })}
                  className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Catégorie</Label>
                <Input
                  type="text"
                  placeholder="Ex: Marketing"
                  value={formationForm.category}
                  onChange={(e) => setFormationForm({ ...formationForm, category: e.target.value })}
                  className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                Image miniature
              </Label>
              {thumbnailImage ? (
                <div className="relative rounded-xl overflow-hidden border border-purple-500/20 bg-black/20">
                  <img src={thumbnailImage} alt="Aperçu" className="w-full h-32 object-cover" />
                  <button type="button" onClick={() => setThumbnailImage(null)} className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-purple-500/20 hover:border-purple-500/40 cursor-pointer transition-colors">
                  <Upload className="w-5 h-5 text-zinc-500" />
                  <span className="text-zinc-500 text-sm">Glisser ou cliquer pour charger</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }} />
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowFormationDialog(false)} className="text-zinc-400">
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#7B5CFF] hover:bg-[#6a4ce8] text-white flex-1">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {selectedFormation ? 'Mettre à jour' : 'Créer la Formation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== MODULE DIALOG ===== */}
      <Dialog open={showModuleDialog} onOpenChange={(open) => {
        setShowModuleDialog(open)
        if (!open) { setEditingModule(null); setModuleForm({ title: '', description: '', is_free: false }) }
      }}>
        <DialogContent className="glass-card border-0 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingModule ? 'Modifier le Module' : 'Nouveau Module'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editingModule ? handleUpdateModule : handleCreateModule} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Titre du module *</Label>
              <Input
                type="text"
                placeholder="Ex: Introduction"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                required
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Description</Label>
              <Textarea
                placeholder="Description du module..."
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                rows={3}
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="module-free"
                checked={moduleForm.is_free}
                onChange={(e) => setModuleForm({ ...moduleForm, is_free: e.target.checked })}
                className="w-4 h-4 rounded border-purple-500/30 accent-purple-500"
              />
              <Label htmlFor="module-free" className="text-zinc-300 cursor-pointer">Module gratuit (aperçu)</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowModuleDialog(false)} className="text-zinc-400">Annuler</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#7B5CFF] hover:bg-[#6a4ce8] text-white flex-1">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingModule ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== LESSON DIALOG ===== */}
      <Dialog open={showLessonDialog} onOpenChange={(open) => {
        setShowLessonDialog(open)
        if (!open) { setEditingLesson(null); setLessonForm({ title: '', description: '', content_type: 'text', video_url: '', content_html: '', duration_minutes: '0', is_free: false }) }
      }}>
        <DialogContent className="glass-card border-0 max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingLesson ? 'Modifier la Leçon' : 'Nouvelle Leçon'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLesson} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Titre de la leçon *</Label>
              <Input
                type="text"
                placeholder="Ex: Bienvenue dans le cours"
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                required
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Description</Label>
              <Textarea
                placeholder="Description de la leçon..."
                value={lessonForm.description}
                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                rows={2}
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Type de contenu</Label>
                <select
                  value={lessonForm.content_type}
                  onChange={(e) => setLessonForm({ ...lessonForm, content_type: e.target.value })}
                  className="w-full h-10 bg-white/5 border-purple-500/20 text-white rounded-md px-3 text-sm focus:outline-none focus:border-purple-500 appearance-none"
                >
                  <option value="text" className="bg-zinc-900">Texte</option>
                  <option value="video" className="bg-zinc-900">Vidéo</option>
                  <option value="audio" className="bg-zinc-900">Audio</option>
                  <option value="pdf" className="bg-zinc-900">PDF</option>
                  <option value="quiz" className="bg-zinc-900">Quiz</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Durée (minutes)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="30"
                  value={lessonForm.duration_minutes}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })}
                  className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>

            {lessonForm.content_type === 'video' && (
              <div className="space-y-2">
                <Label className="text-zinc-300">URL de la vidéo</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={lessonForm.video_url}
                  onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                  className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500"
                />
              </div>
            )}

            {lessonForm.content_type === 'text' && (
              <div className="space-y-2">
                <Label className="text-zinc-300">Contenu HTML</Label>
                <Textarea
                  placeholder="<h2>Titre</h2><p>Contenu...</p>"
                  value={lessonForm.content_html}
                  onChange={(e) => setLessonForm({ ...lessonForm, content_html: e.target.value })}
                  rows={6}
                  className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-500 resize-none font-mono text-xs"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lesson-free"
                checked={lessonForm.is_free}
                onChange={(e) => setLessonForm({ ...lessonForm, is_free: e.target.checked })}
                className="w-4 h-4 rounded border-purple-500/30 accent-purple-500"
              />
              <Label htmlFor="lesson-free" className="text-zinc-300 cursor-pointer">Leçon gratuite (aperçu)</Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowLessonDialog(false)} className="text-zinc-400">Annuler</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#7B5CFF] hover:bg-[#6a4ce8] text-white flex-1">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingLesson ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
