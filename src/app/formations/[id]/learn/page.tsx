'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarryBackground } from '@/components/StarryBackground'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Play,
  FileText,
  Video,
  Headphones,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Diamond,
  GraduationCap,
  Lock,
  Menu,
  X,
} from 'lucide-react'

interface Formation {
  id: string
  title: string
  description: string
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

interface Lesson {
  id: string
  module_id: string
  title: string
  content_type: string
  video_url: string
  content_html: string
  duration_minutes: number
  is_free: number
}

function formatDuration(minutes: number) {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }
  return `${minutes}min`
}

const contentTypeIcon = (type: string) => {
  switch (type) {
    case 'video': return <Video className="w-4 h-4" />
    case 'audio': return <Headphones className="w-4 h-4" />
    case 'pdf': return <FileText className="w-4 h-4" />
    case 'quiz': return <HelpCircle className="w-4 h-4" />
    default: return <FileText className="w-4 h-4" />
  }
}

export default function FormationLearnPage() {
  const params = useParams()
  const formationId = params.id as string

  const [formation, setFormation] = useState<Formation | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/formations/${formationId}`)
        const result = await response.json()

        if (!response.ok) throw new Error('Formation non trouvée')

        setFormation(result.formation)
        setModules(result.modules || [])

        // Auto-select first lesson
        const allLessons: Lesson[] = []
        result.modules?.forEach((mod: Module) => {
          allLessons.push(...mod.lessons)
        })
        if (allLessons.length > 0) {
          setCurrentLesson(allLessons[0])
          // Expand first module
          if (result.modules?.length > 0) {
            setExpandedModules(new Set([result.modules[0].id]))
          }
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [formationId])

  const selectLesson = useCallback((lesson: Lesson) => {
    setCurrentLesson(lesson)
    // Ensure the module containing this lesson is expanded
    setExpandedModules(prev => new Set([...prev, lesson.module_id]))
  }, [])

  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }, [])

  const markComplete = useCallback((lessonId: string) => {
    setCompletedLessons(prev => {
      const next = new Set(prev)
      if (next.has(lessonId)) next.delete(lessonId)
      else next.add(lessonId)
      return next
    })
  }, [])

  // Compute progress
  const allLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const progressPercent = allLessons > 0 ? Math.round((completedLessons.size / allLessons) * 100) : 0

  if (isLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <StarryBackground />
        <div className="relative z-10 text-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Chargement du cours...</p>
        </div>
      </div>
    )
  }

  if (!formation) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <StarryBackground />
        <div className="relative z-10 text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-purple-500/20" />
          <h2 className="text-white text-xl mb-4">Formation non trouvée</h2>
          <Link href="/formations">
            <Button className="btn-primary border-0"><ArrowLeft className="w-4 h-4 mr-2" />Formations</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <StarryBackground />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3 border-b border-purple-500/10 bg-[#06101f]/80 backdrop-blur-lg shrink-0">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-2 text-zinc-400 hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center">
              <Diamond className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold gradient-text-violet text-sm hidden sm:block">NyXia</span>
          </Link>
          <div className="hidden sm:block h-4 w-px bg-zinc-700" />
          <span className="text-zinc-400 text-sm truncate max-w-[200px]">{formation.title}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7B5CFF] to-[#F4C842] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-zinc-400 text-xs">{progressPercent}%</span>
          </div>
          <Link href={`/formations/${formationId}`}>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white text-xs">
              Retour
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex relative z-10">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } fixed lg:sticky top-0 lg:top-[56px] left-0 z-30 w-80 h-[calc(100vh-56px)] bg-[#0c1a2e]/95 backdrop-blur-xl border-r border-purple-500/10 overflow-y-auto custom-scrollbar transition-transform duration-300 shrink-0`}
        >
          <div className="p-4">
            <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Contenu du cours
            </h2>

            <div className="space-y-1">
              {modules.map((module) => (
                <div key={module.id}>
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-white/5 transition-colors"
                  >
                    <ChevronRight className={`w-3 h-3 text-zinc-500 shrink-0 transition-transform ${expandedModules.has(module.id) ? 'rotate-90' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{module.title}</p>
                      <p className="text-zinc-600 text-[10px]">{module.lessons.length} leçon(s)</p>
                    </div>
                  </button>

                  {/* Lessons */}
                  {expandedModules.has(module.id) && (
                    <div className="ml-4 space-y-0.5 mt-0.5">
                      {module.lessons.map((lesson) => {
                        const isCurrent = currentLesson?.id === lesson.id
                        const isCompleted = completedLessons.has(lesson.id)
                        const isLocked = !lesson.is_free && false // Future: check enrollment

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => selectLesson(lesson)}
                            disabled={isLocked}
                            className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-left transition-all ${
                              isCurrent
                                ? 'bg-purple-500/15 border border-purple-500/30'
                                : 'hover:bg-white/5 border border-transparent'
                            } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                            ) : isLocked ? (
                              <Lock className="w-4 h-4 text-zinc-600 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-zinc-600 shrink-0" />
                            )}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {contentTypeIcon(lesson.content_type)}
                              <span className={`text-sm truncate ${isCurrent ? 'text-white' : 'text-zinc-400'}`}>
                                {lesson.title}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Lesson Area */}
        <main className="flex-1 p-4 sm:p-8 lg:p-12 max-w-4xl">
          {currentLesson ? (
            <div className="space-y-6">
              {/* Lesson Header */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {contentTypeIcon(currentLesson.content_type)}
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">
                    {currentLesson.content_type === 'video' ? 'Vidéo' :
                     currentLesson.content_type === 'audio' ? 'Audio' :
                     currentLesson.content_type === 'quiz' ? 'Quiz' :
                     currentLesson.content_type === 'pdf' ? 'PDF' : 'Texte'}
                  </Badge>
                  {currentLesson.duration_minutes > 0 && (
                    <span className="text-zinc-500 text-xs">{formatDuration(currentLesson.duration_minutes)}</span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{currentLesson.title}</h1>
              </div>

              {/* Video Player */}
              {currentLesson.content_type === 'video' && currentLesson.video_url && (
                <div className="aspect-video rounded-2xl overflow-hidden bg-black/30 border border-purple-500/10">
                  <div className="w-full h-full flex items-center justify-center relative">
                    {/* Simple video embed (YouTube/Vimeo detection) */}
                    {currentLesson.video_url.includes('youtube.com') || currentLesson.video_url.includes('youtu.be') ? (
                      <iframe
                        src={currentLesson.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        title={currentLesson.title}
                      />
                    ) : (
                      <div className="text-center">
                        <Play className="w-16 h-16 text-purple-400 mx-auto mb-3" />
                        <a href={currentLesson.video_url} target="_blank" rel="noopener noreferrer">
                          <Button className="btn-primary border-0">
                            <Play className="w-4 h-4 mr-2" />
                            Ouvrir la vidéo
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lesson Content */}
              <div className="prose prose-invert max-w-none">
                {currentLesson.content_html ? (
                  <div
                    className="text-zinc-300 leading-relaxed text-base"
                    dangerouslySetInnerHTML={{ __html: currentLesson.content_html }}
                  />
                ) : (
                  <div className="text-center py-16">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                    <p className="text-zinc-500">Le contenu de cette leçon n&apos;est pas encore disponible.</p>
                  </div>
                )}
              </div>

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between pt-8 border-t border-purple-500/10">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-500/20 text-zinc-400 hover:text-white"
                  onClick={() => markComplete(currentLesson.id)}
                >
                  {completedLessons.has(currentLesson.id) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                      Complétée
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 mr-2" />
                      Marquer comme terminée
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">Sélectionnez une leçon pour commencer</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
