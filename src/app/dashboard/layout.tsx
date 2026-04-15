'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { StarryBackground } from '@/components/StarryBackground'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Diamond,
  LayoutDashboard,
  GraduationCap,
  Users,
  TrendingUp,
  Settings,
  Menu,
  Bell,
  LogOut,
  ChevronRight,
  Store,
  User,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Mes Formations', href: '/dashboard/formations', icon: GraduationCap },
  { label: 'Étudiants', href: '/dashboard/students', icon: Users },
  { label: 'Revenus', href: '/dashboard/revenue', icon: TrendingUp },
  { label: 'Paramètres', href: '/dashboard/settings', icon: Settings },
]

const pageTitles: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/dashboard/formations': 'Mes Formations',
  '/dashboard/students': 'Étudiants',
  '/dashboard/revenue': 'Revenus',
  '/dashboard/settings': 'Paramètres',
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
              isActive
                ? 'bg-purple-500/10 text-purple-400 border-l-2 border-purple-500'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-purple-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
            <span>{item.label}</span>
            {isActive && <ChevronRight className="w-4 h-4 ml-auto text-purple-500/50" />}
          </Link>
        )
      })}
    </nav>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, isLoggingOut } = useAuth()
  const [user, setUser] = useState<{ full_name: string | null; email: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setUser(data.user)
    } catch {
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const pageTitle = pageTitles[pathname] || 'Tableau de bord'

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

  const userInitials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <div className="relative min-h-screen flex">
      <StarryBackground />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] min-h-screen fixed left-0 top-0 z-40 bg-[#06101f]/80 backdrop-blur-xl border-r border-purple-500/10">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-purple-500/10 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center">
            <Diamond className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold gradient-text-violet text-lg">NyXia</span>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 overflow-y-auto">
          <SidebarNav />
        </div>

        {/* Bottom link */}
        <div className="px-3 pb-4 border-t border-purple-500/10 pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-all duration-200"
          >
            <Store className="w-5 h-5 text-zinc-500" />
            <span>Boutique</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[260px] bg-[#06101f]/95 backdrop-blur-xl border-r border-purple-500/10 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex items-center gap-2.5 px-5 h-16 border-b border-purple-500/10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7B5CFF] to-[#3b1f8e] flex items-center justify-center">
              <Diamond className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold gradient-text-violet text-lg">NyXia</span>
          </div>
          <div className="py-4">
            <SidebarNav onNavigate={() => setSidebarOpen(false)} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-4 border-t border-purple-500/10 pt-4">
            <Link
              href="/"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-all duration-200"
            >
              <Store className="w-5 h-5 text-zinc-500" />
              <span>Boutique</span>
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Area */}
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 glass-nav shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/[0.05] relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#7B5CFF] rounded-full" />
            </Button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/[0.05] transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-[#7B5CFF] to-[#6C4FE0] text-white text-xs font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm text-zinc-300 font-medium max-w-[120px] truncate">
                    {user?.full_name || 'Utilisateur'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-[#0c1a2e] border-purple-500/20 text-zinc-300"
              >
                <DropdownMenuItem className="text-zinc-400 text-xs" disabled>
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-purple-500/10" />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer focus:bg-white/[0.05]">
                    <User className="w-4 h-4" />
                    Mon profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-purple-500/10" />
                <DropdownMenuItem
                  onClick={() => logout()}
                  disabled={isLoggingOut}
                  className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                >
                  {isLoggingOut ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4 mr-2" />
                  )}
                  Deconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 relative z-10">
          {children}
        </main>
      </div>
    </div>
  )
}
