'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Tournament } from '@/types/database'
import { formatDate, getStatusLabel, getFormatLabel, cn } from '@/lib/utils'
import { Trophy, Plus, Search, Calendar, Users, MapPin, ChevronRight, Filter } from 'lucide-react'

const STATUS_FILTERS = ['all', 'active', 'setup', 'draft', 'finished', 'cancelled'] as const

export default function TournamentsPage() {
  const supabase = createClient()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [filtered, setFiltered] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    supabase.from('tournaments').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setTournaments(data ?? []); setFiltered(data ?? []); setLoading(false) })
  }, [supabase])

  useEffect(() => {
    let list = tournaments
    if (statusFilter !== 'all') list = list.filter(t => t.status === statusFilter)
    if (search) list = list.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    setFiltered(list)
  }, [tournaments, statusFilter, search])

  const statusColors: Record<string, string> = {
    active: 'bg-neon-green/15 text-neon-green border-neon-green/30',
    finished: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    draft: 'bg-surface-4 text-muted-foreground border-surface-4',
    setup: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  }

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Torneios</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{tournaments.length} torneio{tournaments.length !== 1 ? 's' : ''} cadastrado{tournaments.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/tournaments/new" className="btn-neon rounded-xl px-4 py-2 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo</span>
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar torneio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-2 border border-surface-4 focus:border-neon-green/40 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-colors"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
              statusFilter === s
                ? 'bg-neon-green/10 text-neon-green border border-neon-green/30'
                : 'bg-surface-2 text-muted-foreground border border-surface-4 hover:text-white'
            )}
          >
            {s === 'all' ? 'Todos' : getStatusLabel(s)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-surface p-4 animate-pulse h-20 bg-surface-3" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum torneio encontrado</p>
          <Link href="/tournaments/new" className="btn-neon rounded-lg px-4 py-2 text-sm mt-4 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Criar torneio
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <Link
              key={t.id}
              href={`/tournaments/${t.id}`}
              className="card-surface-hover p-4 flex items-center gap-4 group"
            >
              {/* Icon */}
              <div className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                t.status === 'active' ? 'bg-neon-green/10' : 'bg-surface-3'
              )}>
                <Trophy className={cn('w-5 h-5', t.status === 'active' ? 'text-neon-green' : 'text-muted-foreground')} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{t.name}</p>
                  {t.status === 'active' && (
                    <span className="live-indicator">
                      <span className="live-dot" /> AO VIVO
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatDate(t.date)}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> {t.num_players} atletas
                  </span>
                  {t.location && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {t.location}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium', statusColors[t.status] ?? statusColors.draft)}>
                  {getStatusLabel(t.status)}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
