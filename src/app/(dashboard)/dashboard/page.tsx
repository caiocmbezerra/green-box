'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Tournament, TournamentRanking, Athlete } from '@/types/database'
import { formatDate, getStatusLabel, cn } from '@/lib/utils'
import {
  Trophy, Users, Zap, TrendingUp, Plus, ChevronRight,
  Activity, Calendar, MapPin, ArrowRight,
} from 'lucide-react'

interface Stats {
  totalTournaments: number
  totalAthletes: number
  activeTournaments: number
  totalMatches: number
}

export default function DashboardPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<Stats>({ totalTournaments: 0, totalAthletes: 0, activeTournaments: 0, totalMatches: 0 })
  const [recentTournaments, setRecentTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [tourRes, athleteRes, matchRes] = await Promise.all([
        supabase.from('tournaments').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('athletes').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('matches').select('id', { count: 'exact' }).eq('status', 'finished'),
      ])

      const tournaments = tourRes.data ?? []
      setRecentTournaments(tournaments)
      setStats({
        totalTournaments: tournaments.length,
        totalAthletes: athleteRes.count ?? 0,
        activeTournaments: tournaments.filter(t => t.status === 'active').length,
        totalMatches: matchRes.count ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [supabase])

  const STAT_CARDS = [
    { label: 'Torneios', value: stats.totalTournaments, icon: Trophy, color: 'text-neon-green', bg: 'bg-neon-green/10' },
    { label: 'Atletas Ativos', value: stats.totalAthletes, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Em Andamento', value: stats.activeTournaments, icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Partidas', value: stats.totalMatches, icon: Zap, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ]

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Copa Sementes · Beach Tennis</p>
        </div>
        <Link
          href="/tournaments/new"
          className="btn-neon rounded-xl px-4 py-2 text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Torneio</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card-surface p-4 space-y-3">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', bg)}>
              <Icon className={cn('w-4 h-4', color)} />
            </div>
            <div>
              <p className="text-2xl font-bold">{loading ? '—' : value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card-surface p-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/tournaments/new', label: 'Criar Torneio', icon: Trophy, color: 'neon-green' },
            { href: '/athletes/new', label: 'Novo Atleta', icon: Users, color: 'blue-400' },
            { href: '/tournaments', label: 'Ver Torneios', icon: Calendar, color: 'purple-400' },
            { href: '/stats', label: 'Estatísticas', icon: TrendingUp, color: 'yellow-400' },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-3 hover:bg-surface-4 border border-surface-4 hover:border-white/10 transition-all duration-200 group"
            >
              <Icon className={`w-5 h-5 text-${color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-medium text-center">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Tournaments */}
      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-surface-3">
          <h2 className="text-sm font-semibold">Torneios Recentes</h2>
          <Link href="/tournaments" className="text-xs text-neon-green hover:text-neon-green-dim flex items-center gap-1">
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentTournaments.length === 0 ? (
          <div className="p-8 text-center">
            <Trophy className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum torneio ainda</p>
            <Link href="/tournaments/new" className="btn-neon rounded-lg px-4 py-2 text-sm mt-4 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Criar primeiro torneio
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-surface-3">
            {recentTournaments.map(t => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-3 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-neon-green/10 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-neon-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(t.date)}
                    </span>
                    {t.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {t.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-neon-green/15 text-neon-green border-neon-green/30',
    finished: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    draft: 'bg-surface-4 text-muted-foreground border-surface-4',
    setup: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', colors[status] ?? colors.draft)}>
      {getStatusLabel(status)}
    </span>
  )
}
