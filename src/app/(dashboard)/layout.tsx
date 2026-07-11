'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import {
  LayoutDashboard, Trophy, Users, BarChart3, Settings,
  LogOut, Menu, X, ChevronRight, Bell, Zap,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tournaments', label: 'Torneios', icon: Trophy },
  { href: '/athletes', label: 'Atletas', icon: Users },
  { href: '/stats', label: 'Estatísticas', icon: BarChart3 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => setProfile(data))
    })
  }, [router, supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <div className="min-h-screen bg-surface-0 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-surface-1 border-r border-surface-3 flex flex-col transition-transform duration-300',
        'lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="p-5 border-b border-surface-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-neon-green" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Langolandia</p>
              <p className="text-xs text-muted-foreground">Beach Tennis</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive(href)
                  ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                  : 'text-muted-foreground hover:text-white hover:bg-surface-3'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {isActive(href) && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-surface-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-neon-green/20 flex items-center justify-center text-neon-green text-xs font-bold flex-shrink-0">
              {profile ? getInitials(profile.full_name ?? profile.email) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {profile?.full_name ?? 'Usuário'}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-surface-3 bg-surface-1">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-neon-green" />
            <span className="text-sm font-bold">Langolandia</span>
          </div>
          <button className="text-muted-foreground">
            <Bell className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
