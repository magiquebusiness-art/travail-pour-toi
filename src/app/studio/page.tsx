'use client'


import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { StarryBackground } from '@/components/StarryBackground'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Diamond,
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
  Layout,
  LayoutDashboard,
  Users,
  Play,
  Check,
  Sparkles,
  Settings,
  Menu,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Crown,
  Rocket,
  Paintbrush,
  Share2,
  Copy,
  Clock,
  Lock,
  CircleDot,
  Zap,
  Wand2,
  Bell,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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

// Dynamic import for Simple Lesson Editor (SSR disabled)
const SimpleLessonEditor = dynamic(
  () => import('@/components/formation/simple-lesson-editor'),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[500px]"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div> }
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

interface Enrollment {
  id: string
  user_id: string
  status: string
  progress_percent: number
  enrolled_at: string
  email?: string
  name?: string
}

/* ===== Helpers ===== */
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount)
}

function contentTypeIcon(type: string, size = 'w-3.5 h-3.5') {
  switch (type) {
    case 'video': return <Video className={size} />
    case 'audio': return <Headphones className={size} />
    case 'pdf': return <FileText className={size} />
    case 'quiz': return <HelpCircle className={size} />
    default: return <FileText className={size} />
  }
}

function contentTypeLabel(type: string) {
  switch (type) {
    case 'video': return 'Vidéo'
    case 'audio': return 'Audio'
    case 'pdf': return 'PDF'
    case 'quiz': return 'Quiz'
    default: return 'Texte'
  }
}

/* ===== Editor Loading ===== */
function EditorLoading() {
  return (
    <div className="fixed inset-0 z-[100] bg-[#06101f] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
        <p className="text-zinc-400 text-sm">Chargement de l&apos;éditeur...</p>
      </div>
    </div>
  )
}

/* ===== Sortable Module Item ===== */
function SortableModuleItem({ module, onEdit, onDelete, onToggleLessons, expanded, onSelectLesson, onAddLesson }: {
  module: Module
  onEdit: () => void
  onDelete: () => void
  onToggleLessons: () => void
  expanded: boolean
  onSelectLesson: (lesson: Lesson) => void
  onAddLesson: () => void
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

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.04] border border-purple-500/10 hover:border-purple-500/25 transition-all group">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-purple-400 p-1 transition-colors">
          <GripVertical className="w-4 h-4" />
        </button>
        <button onClick={onToggleLessons} className="text-zinc-500 hover:text-purple-400 p-1 transition-colors">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-white font-medium text-sm truncate">{module.title}</span>
            {module.is_free ? (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0">Gratuit</Badge>
            ) : null}
          </div>
          <p className="text-zinc-500 text-xs mt-0.5">{module.lesson_count || module.lessons?.length || 0} leçon(s)</p>
        </div>
        <button onClick={onAddLesson} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100" title="Ajouter une leçon">
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {expanded && module.lessons && module.lessons.length > 0 && (
        <div className="ml-14 mt-1 space-y-1 animate-fade-in">
          {module.lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => onSelectLesson(lesson)}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-purple-500/5 hover:border-purple-500/20 hover:bg-white/[0.05] transition-all text-left group/lesson"
            >
              {contentTypeIcon(lesson.content_type)}
              <span className="text-zinc-300 text-sm truncate flex-1">{lesson.title}</span>
              {lesson.is_free ? (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0 shrink-0">Gratuit</Badge>
              ) : null}
              {lesson.duration_minutes > 0 && (
                <span className="text-zinc-600 text-xs shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {lesson.duration_minutes}min
                </span>
              )}
              <Play className="w-3 h-3 text-zinc-600 group-hover/lesson:text-purple-400 shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ===== Content Type Selector ===== */
function ContentTypeSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const types = [
    { key: 'video', emoji: '📹', label: 'Vidéo', color: 'from-rose-500 to-pink-600' },
    { key: 'text', emoji: '📝', label: 'Texte', color: 'from-blue-500 to-cyan-600' },
    { key: 'audio', emoji: '🎵', label: 'Audio', color: 'from-amber-500 to-orange-600' },
    { key: 'pdf', emoji: '📄', label: 'PDF', color: 'from-emerald-500 to-green-600' },
    { key: 'quiz', emoji: '❓', label: 'Quiz', color: 'from-violet-500 to-purple-600' },
  ]

  return (
    <div className="grid grid-cols-5 gap-2">
      {types.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
            value === t.key
              ? 'bg-purple-500/15 border-purple-500/40 shadow-lg shadow-purple-500/10'
              : 'bg-white/[0.03] border-purple-500/10 hover:border-purple-500/25 hover:bg-white/[0.06]'
          }`}
        >
          <span className="text-2xl">{t.emoji}</span>
          <span className={`text-xs font-medium ${value === t.key ? 'text-purple-300' : 'text-zinc-400'}`}>{t.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ===== MAIN COMPONENT ===== */
export default function StudioPage() {
  const router = useRouter()
  const { logout } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auth & loading state
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Data state
  const [formations, setFormations] = useState<Formation[]>([])
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])

  // Dialogs
  const [showFormationDialog, setShowFormationDialog] = useState(false)
  const [showModuleDialog, setShowModuleDialog] = useState(false)
  const [showLessonDialog, setShowLessonDialog] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [showLessonEditor, setShowLessonEditor] = useState(false)
  const [activeLessonForEditor, setActiveLessonForEditor] = useState<{ moduleId: string; lesson: Lesson } | null>(null)
  const [lessonEditorHtml, setLessonEditorHtml] = useState('')
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [activeTargetModule, setActiveTargetModule] = useState<string>('')

  // Form state
  const [formationForm, setFormationForm] = useState({ title: '', description: '', long_description: '', price: '0', category: '', thumbnail_url: '' })
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', is_free: false })
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', content_type: 'text', video_url: '', content_html: '', duration_minutes: '0', is_free: false })

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({ title: '', description: '', long_description: '', price: '0', category: '', thumbnail_url: '', status: 'draft' })
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null)

  // Page editor state
  const [pageData, setPageData] = useState<FormationPage | null>(null)

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('contenu')

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // ===== Auth Check =====
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/formations')
        if (res.ok) {
          const data = await res.json()
          setFormations(data.formations || [])
          setIsAuthenticated(true)
        } else if (res.status === 401) {
          router.push('/login')
          return
        } else {
          // API error but might be auth'd — show empty
          setIsAuthenticated(true)
        }
      } catch {
        setIsAuthenticated(true)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [router])

  // ===== Fetch helpers =====
  const fetchFormations = useCallback(async () => {
    try {
      const response = await fetch('/api/formations')
      const result = await response.json()
      setFormations(result.formations || [])
    } catch {
      toast.error('Erreur lors du chargement des formations')
    }
  }, [])

  const fetchModules = useCallback(async (formationId: string) => {
    try {
      const detailRes = await fetch(`/api/formations/${formationId}`)
      if (detailRes.ok) {
        const detailData = await detailRes.json()
        setModules(detailData.modules || [])
      }
    } catch {
      // silent
    }
  }, [])

  const fetchEnrollments = useCallback(async (formationId: string) => {
    try {
      const detailRes = await fetch(`/api/formations/${formationId}`)
      if (detailRes.ok) {
        const detailData = await detailRes.json()
        setEnrollments(detailData.enrollments || [])
      }
    } catch {
      // silent
    }
  }, [])

  // ===== Select formation =====
  const selectFormation = useCallback((formation: Formation) => {
    setSelectedFormation(formation)
    setModules([])
    setExpandedModules(new Set())
    setEnrollments([])
    setActiveTab('contenu')
    fetchModules(formation.id)
    // Pre-fill settings
    setSettingsForm({
      title: formation.title,
      description: formation.description || '',
      long_description: formation.long_description || '',
      price: String(formation.price || 0),
      category: formation.category || '',
      thumbnail_url: formation.thumbnail_url || '',
      status: formation.status || 'draft',
    })
    setThumbnailImage(formation.thumbnail_url || null)
    setMobileSidebarOpen(false)
  }, [fetchModules])

  const deselectFormation = useCallback(() => {
    setSelectedFormation(null)
    setModules([])
    setExpandedModules(new Set())
    setEnrollments([])
    setPageData(null)
    setActiveTab('contenu')
  }, [])

  // ===== Create Formation =====
  const handleCreateFormation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formationForm.title) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/formations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formationForm.title,
          description: formationForm.description,
          long_description: '',
          price: Number(formationForm.price),
          category: '',
          thumbnail_url: null,
          status: 'draft',
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Formation créée avec succès !')
      setShowFormationDialog(false)
      setFormationForm({ title: '', description: '', long_description: '', price: '0', category: '', thumbnail_url: '' })

      // Refetch and select the new formation
      await fetchFormations()
      // The new formation should appear first (most recent)
      const res2 = await fetch('/api/formations')
      const data2 = await res2.json()
      const newFormation = (data2.formations || []).find((f: Formation) => f.id === result.formationId)
      if (newFormation) {
        selectFormation(newFormation)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ===== Update Formation (Settings) =====
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFormation || !settingsForm.title) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/formations/${selectedFormation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: settingsForm.title,
          description: settingsForm.description,
          long_description: settingsForm.long_description,
          price: Number(settingsForm.price),
          category: settingsForm.category,
          thumbnail_url: thumbnailImage || selectedFormation.thumbnail_url || null,
          status: settingsForm.status,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Formation mise à jour !')
      fetchFormations()
      selectFormation({ ...selectedFormation, ...settingsForm, price: Number(settingsForm.price), thumbnail_url: thumbnailImage || selectedFormation.thumbnail_url, status: settingsForm.status })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ===== Delete Formation =====
  const handleDeleteFormation = async (formationId: string) => {
    if (!confirm('Supprimer cette formation et tout son contenu ?')) return

    try {
      const response = await fetch(`/api/formations/${formationId}`, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success('Formation supprimée')
      if (selectedFormation?.id === formationId) {
        deselectFormation()
      }
      fetchFormations()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  // ===== Create Module =====
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

  // ===== Update Module =====
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

  // ===== Delete Module =====
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

  // ===== Create/Update Lesson =====
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFormation || !lessonForm.title || !activeTargetModule) return

    setIsSubmitting(true)
    try {
      const isEditing = !!editingLesson
      const url = isEditing
        ? `/api/formations/${selectedFormation.id}/modules/${editingLesson.module_id}/lessons/${editingLesson.id}`
        : `/api/formations/${selectedFormation.id}/modules/${activeTargetModule}/lessons`

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lessonForm,
          duration_minutes: Number(lessonForm.duration_minutes),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast.success(isEditing ? 'Leçon mise à jour !' : 'Leçon créée !')
      setShowLessonDialog(false)
      setLessonForm({ title: '', description: '', content_type: 'text', video_url: '', content_html: '', duration_minutes: '0', is_free: false })
      setEditingLesson(null)
      fetchModules(selectedFormation.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ===== Delete Lesson =====
  const handleDeleteLesson = async () => {
    if (!selectedFormation || !editingLesson) return
    if (!confirm('Supprimer cette leçon ?')) return

    try {
      const response = await fetch(`/api/formations/${selectedFormation.id}/modules/${editingLesson.module_id}/lessons/${editingLesson.id}`, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      toast.success('Leçon supprimée')
      setShowLessonDialog(false)
      setEditingLesson(null)
      fetchModules(selectedFormation.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  // ===== DnD: Reorder modules =====
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    if (!selectedFormation) return
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = modules.findIndex(m => m.id === active.id)
    const newIndex = modules.findIndex(m => m.id === over.id)
    const newModules = arrayMove(modules, oldIndex, newIndex)
    setModules(newModules)

    try {
      await fetch(`/api/formations/${selectedFormation.id}/modules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleIds: newModules.map(m => m.id) }),
      })
    } catch {
      fetchModules(selectedFormation.id)
    }
  }, [selectedFormation, modules, fetchModules])

  // ===== Toggle module expand =====
  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  // ===== Open edit module =====
  const openEditModule = (mod: Module) => {
    setEditingModule(mod)
    setModuleForm({ title: mod.title, description: mod.description || '', is_free: !!mod.is_free })
    setShowModuleDialog(true)
  }

  // ===== Open edit lesson =====
  const handleSelectLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setActiveTargetModule(lesson.module_id)
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

  // ===== Open add lesson to module =====
  const openAddLesson = (moduleId: string) => {
    setActiveTargetModule(moduleId)
    setLessonForm({ title: '', description: '', content_type: 'text', video_url: '', content_html: '', duration_minutes: '0', is_free: false })
    setEditingLesson(null)
    setShowLessonDialog(true)
  }

  // ===== Open page editor =====
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

  // ===== Image upload handler =====
  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setThumbnailImage(e.target?.result as string)
      toast.success('Image chargée')
    }
    reader.readAsDataURL(file)
  }, [])

  // ===== Stats =====
  const stats = useMemo(() => ({
    total: formations.length,
    published: formations.filter(f => f.status === 'published').length,
    totalStudents: formations.reduce((sum, f) => sum + (f.student_count || 0), 0),
    totalLessons: formations.reduce((sum, f) => sum + (f.lesson_count || 0), 0),
  }), [formations])

  // ===== Loading state =====
  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <StarryBackground />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center pulse-glow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Chargement du Studio...</p>
        </div>
      </div>
    )
  }

  // ===== GrapesJS Editor (full screen) =====
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

  // ===== Onboarding steps data =====
  const onboardingSteps = [
    {
      icon: <Rocket className="w-8 h-8" />,
      title: 'Crée ta formation',
      desc: 'Donne un titre, ajoute une description, choisis un prix.',
      color: 'from-[#7B5CFF] to-[#6366f1]',
    },
    {
      icon: <Paintbrush className="w-8 h-8" />,
      title: 'Construis ton contenu',
      desc: 'Ajoute des modules et leçons avec notre éditeur intuitif.',
      color: 'from-[#F4C842] to-[#c9a23a]',
    },
    {
      icon: <Crown className="w-8 h-8" />,
      title: 'Publie et vends',
      desc: 'Ta formation est visible dans le catalogue, les élèves s\'inscrivent.',
      color: 'from-emerald-500 to-green-600',
    },
  ]

  return (
    <div className="relative min-h-screen flex">
      <StarryBackground />

      {/* Decorative orbs */}
      <div className="fixed inset-0 pointer-events-none -z-5 overflow-hidden">
        <div className="orb orb-violet" style={{ width: 500, height: 500, top: '-5%', right: '-5%' }} />
        <div className="orb orb-gold" style={{ width: 300, height: 300, bottom: '10%', left: '20%' }} />
      </div>

      {/* ===== MOBILE SIDEBAR OVERLAY ===== */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ===== LEFT SIDEBAR ===== */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-10
        h-screen w-72 flex-shrink-0
        bg-[var(--bg1)]/95 backdrop-blur-xl border-r border-purple-500/10
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center shadow-lg shadow-[#7B5CFF]/20 group-hover:shadow-[#7B5CFF]/40 transition-shadow">
              <Diamond className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text-violet text-lg tracking-wide">NyXia</span>
          </Link>
          <button
            onClick={() => { setSidebarOpen(!sidebarOpen); setMobileSidebarOpen(false) }}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-zinc-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* User section */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-purple-500/10">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7B5CFF] to-[#6366f1] flex items-center justify-center text-white font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">Créateur</p>
              <p className="text-zinc-500 text-xs">Studio Pro</p>
            </div>
          </div>

          {/* Formations list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Mes Formations</h3>
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] px-1.5 py-0">
                {formations.length}
              </Badge>
            </div>
            <div className="space-y-1.5 max-h-[calc(100vh-320px)] overflow-y-auto">
              {formations.length === 0 ? (
                <div className="text-center py-6">
                  <GraduationCap className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                  <p className="text-zinc-500 text-xs">Aucune formation</p>
                </div>
              ) : (
                formations.map(formation => (
                  <button
                    key={formation.id}
                    onClick={() => selectFormation(formation)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all group ${
                      selectedFormation?.id === formation.id
                        ? 'bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/5'
                        : 'bg-transparent border-transparent hover:bg-white/[0.04] hover:border-purple-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {formation.thumbnail_url ? (
                          <img src={formation.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <GraduationCap className="w-4 h-4 text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate group-hover:text-purple-300 transition-colors">{formation.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge className={
                            formation.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-1 py-0'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] px-1 py-0'
                          }>
                            {formation.status === 'published' ? 'Publié' : 'Brouillon'}
                          </Badge>
                          <span className="text-zinc-600 text-[10px]">{formation.module_count || 0}M · {formation.lesson_count || 0}L</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar footer: New Formation + Logout */}
        <div className="p-4 border-t border-purple-500/10 space-y-2">
          <Button
            onClick={() => {
              setFormationForm({ title: '', description: '', long_description: '', price: '0', category: '', thumbnail_url: '' })
              setShowFormationDialog(true)
            }}
            className="w-full bg-gradient-to-r from-[#7B5CFF] to-[#6366f1] hover:from-[#6a4ce8] hover:to-[#5558e6] text-white shadow-lg shadow-purple-500/20 border-0 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Formation
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            className="w-full text-zinc-500 hover:text-red-400 hover:bg-red-500/10 text-xs"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 min-w-0 relative z-10">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 glass-nav border-b border-purple-500/10">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Desktop sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            {selectedFormation ? (
              <>
                <button
                  onClick={deselectFormation}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Studio</span>
                </button>
                <div className="hidden sm:block w-px h-5 bg-purple-500/20" />
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="text-white font-semibold text-sm truncate max-w-[200px] lg:max-w-[400px]">
                    {selectedFormation.title}
                  </h1>
                  <Badge className={
                    selectedFormation.status === 'published'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0 shrink-0'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] px-1.5 py-0 shrink-0'
                  }>
                    {selectedFormation.status === 'published' ? 'Publié' : 'Brouillon'}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h1 className="text-white font-semibold text-sm">Studio de Création</h1>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedFormation && (
              <>
                <Button
                  onClick={openPageEditor}
                  variant="outline"
                  size="sm"
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs"
                >
                  <Layout className="w-3.5 h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Éditeur de Page</span>
                </Button>
                <Link href={`/formations/${selectedFormation.id}`}>
                  <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs">
                    <Eye className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Voir la page</span>
                  </Button>
                </Link>
              </>
            )}
            <Link href="/formations">
              <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white text-xs">
                <GraduationCap className="w-3.5 h-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Catalogue</span>
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white text-xs">
                <Settings className="w-3.5 h-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>

            {/* Notification bell */}
            <button className="relative p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F4C842]" />
            </button>

            {/* User avatar menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-gradient-to-br from-[#7B5CFF] to-[#6366f1] text-white text-[10px] font-semibold">
                      <Sparkles className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#0c1a2e] border-purple-500/20 text-zinc-300">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer focus:bg-white/[0.05]">
                    <Settings className="w-4 h-4" />
                    Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer focus:bg-white/[0.05]">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-purple-500/10" />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8">
          {selectedFormation ? (
            /* ===== MODE B: FORMATION EDITOR ===== */
            <div className="max-w-5xl mx-auto animate-fade-in">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white/[0.03] border border-purple-500/10 rounded-xl p-1 h-auto w-full sm:w-auto">
                  <TabsTrigger
                    value="contenu"
                    className="rounded-lg text-xs data-[state=active]:bg-purple-500/15 data-[state=active]:text-purple-300 data-[state=active]:shadow-sm px-3 py-2"
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                    Contenu
                  </TabsTrigger>
                  <TabsTrigger
                    value="editeur"
                    className="rounded-lg text-xs data-[state=active]:bg-purple-500/15 data-[state=active]:text-purple-300 data-[state=active]:shadow-sm px-3 py-2"
                  >
                    <Layout className="w-3.5 h-3.5 mr-1.5" />
                    Éditeur de Page
                  </TabsTrigger>
                  <TabsTrigger
                    value="parametres"
                    className="rounded-lg text-xs data-[state=active]:bg-purple-500/15 data-[state=active]:text-purple-300 data-[state=active]:shadow-sm px-3 py-2"
                  >
                    <Settings className="w-3.5 h-3.5 mr-1.5" />
                    Paramètres
                  </TabsTrigger>
                  <TabsTrigger
                    value="apprenants"
                    className="rounded-lg text-xs data-[state=active]:bg-purple-500/15 data-[state=active]:text-purple-300 data-[state=active]:shadow-sm px-3 py-2"
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Apprenants
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: CONTENU */}
                <TabsContent value="contenu" className="mt-6 animate-fade-in">
                  {/* Quick stats bar */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="glass-card border-0 p-3 text-center">
                      <p className="text-xl font-bold text-white">{modules.length}</p>
                      <p className="text-zinc-500 text-xs">Modules</p>
                    </div>
                    <div className="glass-card border-0 p-3 text-center">
                      <p className="text-xl font-bold text-white">{modules.reduce((s, m) => s + (m.lessons?.length || 0), 0)}</p>
                      <p className="text-zinc-500 text-xs">Leçons</p>
                    </div>
                    <div className="glass-card border-0 p-3 text-center">
                      <p className="text-xl font-bold text-white">{selectedFormation.student_count || 0}</p>
                      <p className="text-zinc-500 text-xs">Apprenants</p>
                    </div>
                  </div>

                  {/* Modules section */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-purple-400" />
                      Modules & Leçons
                    </h2>
                    <Button
                      size="sm"
                      onClick={() => {
                        setModuleForm({ title: '', description: '', is_free: false })
                        setEditingModule(null)
                        setShowModuleDialog(true)
                      }}
                      className="bg-gradient-to-r from-[#7B5CFF] to-[#6366f1] hover:from-[#6a4ce8] hover:to-[#5558e6] text-white border-0 rounded-xl shadow-lg shadow-purple-500/15"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Ajouter un module
                    </Button>
                  </div>

                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
                        {modules.length === 0 ? (
                          <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/10 flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-purple-500/30" />
                            </div>
                            <p className="text-zinc-400 text-sm font-medium mb-1">Aucun module pour le moment</p>
                            <p className="text-zinc-600 text-xs mb-4">Commence par créer ton premier module</p>
                            <Button
                              size="sm"
                              onClick={() => {
                                setModuleForm({ title: '', description: '', is_free: false })
                                setEditingModule(null)
                                setShowModuleDialog(true)
                              }}
                              className="bg-gradient-to-r from-[#7B5CFF] to-[#6366f1] text-white border-0 rounded-xl"
                            >
                              <Plus className="w-4 h-4 mr-1.5" />
                              Créer un module
                            </Button>
                          </div>
                        ) : (
                          modules.map(mod => (
                            <SortableModuleItem
                              key={mod.id}
                              module={mod}
                              onEdit={() => openEditModule(mod)}
                              onDelete={() => handleDeleteModule(mod.id)}
                              onToggleLessons={() => toggleModuleExpand(mod.id)}
                              expanded={expandedModules.has(mod.id)}
                              onSelectLesson={handleSelectLesson}
                              onAddLesson={() => openAddLesson(mod.id)}
                            />
                          ))
                        )}
                      </div>
                    </SortableContext>
                  </DndContext>
                </TabsContent>

                {/* TAB 2: ÉDITEUR DE PAGE */}
                <TabsContent value="editeur" className="mt-6 animate-fade-in">
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center shadow-xl shadow-purple-500/20 animate-float">
                      <Layout className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-white text-xl font-semibold mb-2">Éditeur de Page de Vente</h2>
                    <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8">
                      Crée une page de vente magnifique avec notre éditeur drag &amp; drop.
                      Personnalise chaque détail pour convertir tes visiteurs en élèves.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button
                        onClick={openPageEditor}
                        className="bg-gradient-to-r from-[#7B5CFF] to-[#6366f1] hover:from-[#6a4ce8] hover:to-[#5558e6] text-white border-0 rounded-xl shadow-lg shadow-purple-500/20 px-6"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Ouvrir l&apos;éditeur
                      </Button>
                      <Link href={`/formations/${selectedFormation.id}`}>
                        <Button variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 rounded-xl">
                          <Eye className="w-4 h-4 mr-2" />
                          Voir la page actuelle
                        </Button>
                      </Link>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 3: PARAMÈTRES */}
                <TabsContent value="parametres" className="mt-6 animate-fade-in">
                  <div className="glass-card border-0 p-6 max-w-2xl">
                    <h2 className="text-white font-semibold flex items-center gap-2 mb-6">
                      <Settings className="w-5 h-5 text-purple-400" />
                      Paramètres de la formation
                    </h2>
                    <form onSubmit={handleUpdateSettings} className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-zinc-300 text-sm">Titre</Label>
                        <Input
                          type="text"
                          value={settingsForm.title}
                          onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                          required
                          className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-300 text-sm">Description courte</Label>
                        <Textarea
                          value={settingsForm.description}
                          onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                          rows={2}
                          className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600 resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-300 text-sm">Description longue</Label>
                        <Textarea
                          value={settingsForm.long_description}
                          onChange={(e) => setSettingsForm({ ...settingsForm, long_description: e.target.value })}
                          rows={5}
                          className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-zinc-300 text-sm">Prix (CAD)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={settingsForm.price}
                            onChange={(e) => setSettingsForm({ ...settingsForm, price: e.target.value })}
                            className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-zinc-300 text-sm">Catégorie</Label>
                          <Input
                            type="text"
                            value={settingsForm.category}
                            onChange={(e) => setSettingsForm({ ...settingsForm, category: e.target.value })}
                            className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600"
                            placeholder="Ex: Marketing Digital"
                          />
                        </div>
                      </div>

                      {/* Thumbnail */}
                      <div className="space-y-2">
                        <Label className="text-zinc-300 text-sm flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-purple-400" />
                          Image miniature
                        </Label>
                        {thumbnailImage ? (
                          <div className="relative rounded-xl overflow-hidden border border-purple-500/20 bg-black/20 max-w-sm">
                            <img src={thumbnailImage} alt="Aperçu" className="w-full h-40 object-cover" />
                            <button
                              type="button"
                              onClick={() => setThumbnailImage(null)}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-purple-500/20 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500/40 hover:bg-purple-500/5 transition-all"
                          >
                            <Upload className="w-8 h-8 mx-auto mb-2 text-zinc-500" />
                            <p className="text-zinc-400 text-sm">Glisse une image ou clique pour parcourir</p>
                            <p className="text-zinc-600 text-xs mt-1">PNG, JPG — Max 5 Mo</p>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(file)
                          }}
                        />
                      </div>

                      {/* Status toggle */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-purple-500/10">
                        <div>
                          <p className="text-white text-sm font-medium">Statut de la formation</p>
                          <p className="text-zinc-500 text-xs mt-0.5">
                            {settingsForm.status === 'published'
                              ? 'Visible dans le catalogue public'
                              : 'Seulement visible dans ton studio'
                            }
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-medium ${settingsForm.status === 'published' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {settingsForm.status === 'published' ? 'Publiée' : 'Brouillon'}
                          </span>
                          <Switch
                            checked={settingsForm.status === 'published'}
                            onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, status: checked ? 'published' : 'draft' })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-gradient-to-r from-[#7B5CFF] to-[#6366f1] hover:from-[#6a4ce8] hover:to-[#5558e6] text-white border-0 rounded-xl"
                        >
                          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                          Sauvegarder
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl"
                          onClick={() => handleDeleteFormation(selectedFormation.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </form>
                  </div>
                </TabsContent>

                {/* TAB 4: APPRENANTS */}
                <TabsContent value="apprenants" className="mt-6 animate-fade-in">
                  <div className="max-w-2xl">
                    <h2 className="text-white font-semibold flex items-center gap-2 mb-6">
                      <Users className="w-5 h-5 text-purple-400" />
                      Apprenants inscrits
                      <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs px-2 py-0.5 ml-1">
                        {selectedFormation.student_count || 0}
                      </Badge>
                    </h2>

                    {(selectedFormation.student_count || 0) === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/10 flex items-center justify-center">
                          <Users className="w-8 h-8 text-purple-500/30" />
                        </div>
                        <p className="text-zinc-400 text-sm font-medium mb-1">Aucun apprenant pour le moment</p>
                        <p className="text-zinc-600 text-xs mb-6 max-w-sm mx-auto">
                          Partage ta formation avec le monde ! Une fois publiée, les élèves pourront s&apos;inscrire et commencer à apprendre.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                          <Button
                            variant="outline"
                            className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 rounded-xl"
                            onClick={() => {
                              const url = `${window.location.origin}/formations/${selectedFormation.id}`
                              navigator.clipboard.writeText(url)
                              toast.success('Lien copié !')
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copier le lien
                          </Button>
                          <Button
                            variant="outline"
                            className="border-[#F4C842]/30 text-[#F4C842] hover:bg-[#F4C842]/10 rounded-xl"
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({
                                  title: selectedFormation.title,
                                  url: `${window.location.origin}/formations/${selectedFormation.id}`,
                                })
                              }
                            }}
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Partager
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {enrollments.map((enrollment) => (
                          <div key={enrollment.id} className="glass-card border-0 p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/10 flex items-center justify-center text-purple-400 font-semibold text-sm shrink-0">
                              {(enrollment.name || enrollment.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">
                                {enrollment.name || enrollment.email || 'Apprenant'}
                              </p>
                              <p className="text-zinc-500 text-xs">
                                Inscrit le {new Date(enrollment.enrolled_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-white text-sm font-semibold">{enrollment.progress_percent}%</p>
                              <Progress value={enrollment.progress_percent} className="w-20 h-1.5 mt-1" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            /* ===== MODE A: DASHBOARD ===== */
            <div className="max-w-5xl mx-auto">
              {formations.length === 0 ? (
                /* Onboarding view */
                <div className="animate-slide-up">
                  {/* Welcome hero */}
                  <div className="text-center mb-12 pt-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
                      <Sparkles className="h-4 w-4 text-[#F4C842]" />
                      <span className="text-sm font-medium text-zinc-400">Bienvenue dans ton Studio</span>
                    </div>
                    <h1 className="font-[var(--font-heading)] text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                      Crée tes{' '}
                      <span className="gradient-text-violet">formations</span>
                      <br />
                      en toute{' '}
                      <span className="gradient-text-gold">liberté</span>
                    </h1>
                    <p className="text-zinc-400 max-w-lg mx-auto text-base leading-relaxed">
                      Transforme ton savoir en expérience premium. NyXia Studio te donne tous les outils pour créer,
                      publier et vendre tes formations.
                    </p>
                  </div>

                  {/* Onboarding steps */}
                  <div className="grid sm:grid-cols-3 gap-4 mb-12">
                    {onboardingSteps.map((step, i) => (
                      <div
                        key={i}
                        className="glass-card border-0 p-6 text-center group relative overflow-hidden"
                      >
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-purple-400">{i + 1}</span>
                        </div>
                        <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          {step.icon}
                        </div>
                        <h3 className="text-white font-semibold text-sm mb-1.5">{step.title}</h3>
                        <p className="text-zinc-500 text-xs leading-relaxed">{step.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="text-center pb-8">
                    <Button
                      onClick={() => {
                        setFormationForm({ title: '', description: '', long_description: '', price: '0', category: '', thumbnail_url: '' })
                        setShowFormationDialog(true)
                      }}
                      className="btn-gold text-base px-8 py-4 border-0"
                    >
                      <Rocket className="w-5 h-5 mr-2" />
                      Créer ma première formation
                    </Button>
                  </div>
                </div>
              ) : (
                /* Dashboard with formations */
                <div className="animate-slide-up">
                  {/* Welcome */}
                  <div className="mb-8 pt-4">
                    <h1 className="font-[var(--font-heading)] text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                      Bienvenue dans ton{' '}
                      <span className="gradient-text-violet">Studio</span>
                    </h1>
                    <p className="text-zinc-400 text-sm">
                      Gère tes formations, crée du contenu et suis tes résultats.
                    </p>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    {[
                      { label: 'Formations', value: stats.total, icon: GraduationCap, color: 'text-purple-400' },
                      { label: 'Publiées', value: stats.published, icon: Check, color: 'text-emerald-400' },
                      { label: 'Apprenants', value: stats.totalStudents, icon: Users, color: 'text-[#F4C842]' },
                      { label: 'Leçons', value: stats.totalLessons, icon: BookOpen, color: 'text-cyan-400' },
                    ].map(stat => (
                      <Card key={stat.label} className="glass-card border-0 p-4">
                        <CardContent className="p-0 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-purple-500/10 flex items-center justify-center">
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                          </div>
                          <div>
                            <p className="text-xl font-bold text-white">{stat.value}</p>
                            <p className="text-zinc-500 text-xs">{stat.label}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Recent formations */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-white font-semibold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        Mes Formations
                      </h2>
                      <Button
                        size="sm"
                        onClick={() => {
                          setFormationForm({ title: '', description: '', long_description: '', price: '0', category: '', thumbnail_url: '' })
                          setShowFormationDialog(true)
                        }}
                        className="bg-gradient-to-r from-[#7B5CFF] to-[#6366f1] hover:from-[#6a4ce8] hover:to-[#5558e6] text-white border-0 rounded-xl shadow-lg shadow-purple-500/15"
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Nouvelle
                      </Button>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {formations.map(formation => (
                        <button
                          key={formation.id}
                          onClick={() => selectFormation(formation)}
                          className="gradient-border group text-left"
                        >
                          <div className="relative p-5">
                            {/* Thumbnail area */}
                            <div className="w-full h-32 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/10 flex items-center justify-center mb-4 overflow-hidden">
                              {formation.thumbnail_url ? (
                                <img src={formation.thumbnail_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <GraduationCap className="w-10 h-10 text-purple-500/20 group-hover:text-purple-500/40 transition-colors" />
                              )}
                            </div>
                            {/* Title + status */}
                            <h3 className="text-white font-semibold text-sm mb-1.5 group-hover:text-purple-300 transition-colors truncate">
                              {formation.title}
                            </h3>
                            <p className="text-zinc-500 text-xs line-clamp-2 mb-3">
                              {formation.description || 'Aucune description'}
                            </p>
                            {/* Meta */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={
                                  formation.status === 'published'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] px-1.5 py-0'
                                }>
                                  {formation.status === 'published' ? 'Publié' : 'Brouillon'}
                                </Badge>
                                <span className="text-zinc-500 text-[10px]">
                                  {formation.module_count || 0}M · {formation.lesson_count || 0}L
                                </span>
                              </div>
                              <span className="text-[#F4C842] text-sm font-semibold">
                                {formation.price > 0 ? formatCurrency(formation.price) : 'Gratuit'}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ===== CREATE FORMATION DIALOG ===== */}
      <Dialog open={showFormationDialog} onOpenChange={setShowFormationDialog}>
        <DialogContent className="glass-card border-0 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Nouvelle Formation
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Donne vie à ta nouvelle formation en quelques étapes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateFormation} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Titre *</Label>
              <Input
                type="text"
                placeholder="Ex: Ma Formation Premium"
                value={formationForm.title}
                onChange={(e) => setFormationForm({ ...formationForm, title: e.target.value })}
                required
                autoFocus
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Description courte</Label>
              <Textarea
                placeholder="Décris ta formation en une phrase..."
                value={formationForm.description}
                onChange={(e) => setFormationForm({ ...formationForm, description: e.target.value })}
                rows={2}
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600 resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-[#F4C842]" />
                Prix (CAD)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formationForm.price}
                onChange={(e) => setFormationForm({ ...formationForm, price: e.target.value })}
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600"
              />
              <p className="text-zinc-600 text-[10px]">Laisse à 0 pour une formation gratuite</p>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#7B5CFF] to-[#6366f1] hover:from-[#6a4ce8] hover:to-[#5558e6] text-white border-0 rounded-xl shadow-lg shadow-purple-500/20"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
              Créer la formation
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== CREATE/EDIT MODULE DIALOG ===== */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="glass-card border-0 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              {editingModule ? 'Modifier le module' : 'Nouveau module'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {editingModule ? 'Modifie les informations du module.' : 'Organise ton contenu en modules thématiques.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editingModule ? handleUpdateModule : handleCreateModule} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Titre du module *</Label>
              <Input
                type="text"
                placeholder="Ex: Introduction & Fondamentaux"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                required
                autoFocus
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Description</Label>
              <Textarea
                placeholder="Décris le contenu de ce module..."
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                rows={2}
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600 resize-none"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-purple-500/10">
              <div>
                <p className="text-white text-sm font-medium">Leçon gratuite</p>
                <p className="text-zinc-500 text-xs">Rendre ce module accessible sans inscription</p>
              </div>
              <Switch
                checked={moduleForm.is_free}
                onCheckedChange={(checked) => setModuleForm({ ...moduleForm, is_free: checked })}
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#7B5CFF] to-[#6366f1] hover:from-[#6a4ce8] hover:to-[#5558e6] text-white border-0 rounded-xl"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              {editingModule ? 'Mettre à jour' : 'Créer le module'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== CREATE/EDIT LESSON DIALOG ===== */}
      <Dialog open={showLessonDialog} onOpenChange={(open) => {
        if (!open) {
          setEditingLesson(null)
          setLessonForm({ title: '', description: '', content_type: 'text', video_url: '', content_html: '', duration_minutes: '0', is_free: false })
        }
        setShowLessonDialog(open)
      }}>
        <DialogContent className="glass-card border-0 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-purple-400" />
              {editingLesson ? 'Modifier la leçon' : 'Nouvelle leçon'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {editingLesson ? 'Modifie le contenu de ta leçon.' : 'Ajoute du contenu riche à ton module.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveLesson} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Titre *</Label>
              <Input
                type="text"
                placeholder="Ex: Bienvenue dans cette leçon"
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                required
                autoFocus
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Description</Label>
              <Textarea
                placeholder="Résumé de la leçon..."
                value={lessonForm.description}
                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                rows={2}
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600 resize-none"
              />
            </div>

            {/* Content type selector */}
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Type de contenu</Label>
              <ContentTypeSelector
                value={lessonForm.content_type}
                onChange={(v) => setLessonForm({ ...lessonForm, content_type: v })}
              />
            </div>

            {/* Conditional fields */}
            {lessonForm.content_type === 'video' && (
              <div className="space-y-2 animate-fade-in">
                <Label className="text-zinc-300 text-sm flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-rose-400" />
                  URL de la vidéo (YouTube)
                </Label>
                <Input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={lessonForm.video_url}
                  onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                  className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600"
                />
                {lessonForm.video_url && (
                  <div className="rounded-xl overflow-hidden border border-purple-500/10 bg-black/30">
                    <iframe
                      src={`https://www.youtube.com/embed/${new URL(lessonForm.video_url).searchParams.get('v') || ''}`}
                      className="w-full aspect-video"
                      allowFullScreen
                      title="Aperçu vidéo"
                    />
                  </div>
                )}
              </div>
            )}

            {lessonForm.content_type === 'audio' && (
              <div className="space-y-2 animate-fade-in">
                <Label className="text-zinc-300 text-sm flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-amber-400" />
                  URL de l'audio (MP3, WAV, M4A...)
                </Label>
                <Input
                  type="url"
                  placeholder="https://exemple.com/mon-audio.mp3"
                  value={lessonForm.video_url}
                  onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                  className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600"
                />
                {lessonForm.video_url && (
                  <div className="rounded-xl overflow-hidden border border-purple-500/10 bg-black/30 p-3">
                    <audio controls className="w-full" src={lessonForm.video_url}>
                      Votre navigateur ne supporte pas l'audio.
                    </audio>
                  </div>
                )}
                <p className="text-zinc-600 text-xs">Colle le lien direct vers ton fichier audio. Tu peux aussi utiliser l'éditeur de contenu pour ajouter un audio n'importe où dans ta leçon.</p>
              </div>
            )}

            {lessonForm.content_type === 'text' && (
              <div className="space-y-2 animate-fade-in">
                <Label className="text-zinc-300 text-sm flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  Contenu de la leçon
                </Label>
                <div className="flex gap-2 items-start">
                  <Textarea
                    placeholder="Résumé rapide de la leçon (optionnel)..."
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    rows={3}
                    className="flex-1 bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600 resize-y text-sm"
                  />
                </div>
                <Button
                  type="button"
                  className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 rounded-xl py-3"
                  onClick={() => {
                    setActiveLessonForEditor({ moduleId: activeTargetModule, lesson: editingLesson || { id: '', module_id: activeTargetModule, formation_id: selectedFormation.id, title: lessonForm.title, description: '', content_type: 'text', video_url: '', content_html: lessonForm.content_html || '', duration_minutes: 0, sort_order: 0, is_free: 0, created_at: '' } })
                    setLessonEditorHtml(lessonForm.content_html || '')
                    setShowLessonEditor(true)
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Ouvrir l'éditeur de contenu
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  Durée (minutes)
                </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={lessonForm.duration_minutes}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })}
                  className="bg-white/5 border-purple-500/20 text-white placeholder:text-zinc-600"
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-purple-500/10 w-full">
                  <div>
                    <p className="text-white text-sm font-medium">Gratuite</p>
                    <p className="text-zinc-500 text-[10px]">Accessible sans inscription</p>
                  </div>
                  <Switch
                    checked={lessonForm.is_free}
                    onCheckedChange={(checked) => setLessonForm({ ...lessonForm, is_free: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-[#7B5CFF] to-[#6366f1] hover:from-[#6a4ce8] hover:to-[#5558e6] text-white border-0 rounded-xl"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                {editingLesson ? 'Mettre à jour' : 'Créer la leçon'}
              </Button>
              {editingLesson && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl"
                  onClick={handleDeleteLesson}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== LESSON VISUAL EDITOR DIALOG ===== */}
      <Dialog open={showLessonEditor} onOpenChange={setShowLessonEditor}>
        <DialogContent className="max-w-6xl w-[96vw] h-[88vh] p-0 overflow-hidden glass-card border-0">
          {activeLessonForEditor && (
            <SimpleLessonEditor
              initialHtml={lessonEditorHtml || activeLessonForEditor.lesson?.content_html || ''}
              onSave={(data) => {
                setLessonForm(prev => ({ ...prev, content_html: data.html_content }))
                setShowLessonEditor(false)
                toast.success('Contenu de la leçon mis à jour !')
              }}
              onClose={() => setShowLessonEditor(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
