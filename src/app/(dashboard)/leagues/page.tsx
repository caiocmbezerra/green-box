'use client'

// Liga / Temporada — multiple tournaments accumulating points

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDate, cn } from '@/lib/utils'
import { Trophy, Plus, Star, Calendar, Users, ChevronRight, Zap } from 'lucide-react'

interface League {
  id: string
  name: string
  description: string | null
  season_year: number
  status: 'active' | 'finished' | 'draft'
  tournament_count: number
  athlete_count: number
  created_at: string
}

export default function LeaguesPage() {
  const supabase = createClient()
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // For now load from a leagues table if it exists, else show empty state
    supabase.from('leagues' as any).select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setLeagues((data as any) ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [supabase])

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ligas & Temporadas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Múltiplos torneios acumulando pontos</p>
        </div>
        <Link href="/leagues/new" className="btn-neon rounded-xl px-4 py-2 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Liga</span>
        </Link>
      </div>

      {/* How it works */}
      <div className="card-surface p-5">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-semibold">Como funciona</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: Trophy, label: 'Crie torneios', sub: 'Associe à liga' },
            { icon: Zap, label: 'Pontos acumulam', sub: 'A cada torneio' },
            { icon: Star, label: 'Ranking da liga', sub: 'Campeão da temporada' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="space-y-1">
              <div className="w-9 h-9 rounded-xl bg-surface-3 flex items-center justify-center mx-auto">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs font-medium">{label}</p>
              <p className="text-[10px] text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="card-surface h-20 animate-pulse bg-surface-3" />)}
        </div>
      ) : leagues.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <Star className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="font-semibold">Nenhuma liga criada</p>
          <p className="text-sm text-muted-foreground mt-1">Crie uma liga para agrupar torneios e ter um ranking de temporada</p>
          <Link href="/leagues/new" className="btn-neon rounded-xl px-5 py-2.5 text-sm mt-4 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Criar primeira liga
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {leagues.map((league: any) => (
            <Link key={league.id} href={`/leagues/${league.id}`}
              className="card-surface-hover p-4 flex items-center gap-4 group">
              <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{league.name}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {league.season_year}</span>
                  <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> {league.tournament_count ?? 0} torneios</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
