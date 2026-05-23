'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Athlete, TournamentRanking, Tournament } from '@/types/database'
import { cn, getInitials, getCategoryLabel, formatDate } from '@/lib/utils'
import {
  ArrowLeft, Trophy, BarChart3, Users, Calendar,
  Phone, Mail, MapPin, TrendingUp, Medal,
} from 'lucide-react'

interface AthleteStats {
  totalTournaments: number
  totalMatches: number
  totalWins: number
  totalLosses: number
  totalGamesPro: number
  totalGamesAgainst: number
  titles: number
  podiums: number
  winRate: number
}

export default function AthleteProfilePage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [history, setHistory] = useState<Array<TournamentRanking & { tournament: Tournament }>>([])
  const [stats, setStats] = useState<AthleteStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [aRes, hRes] = await Promise.all([
        supabase.from('athletes').select('*').eq('id', id).single(),
        supabase.from('tournament_rankings')
          .select('*, tournament:tournament_id(id,name,date,status)')
          .eq('athlete_id', id)
          .order('updated_at', { ascending: false }),
      ])

      setAthlete(aRes.data)
      const h = hRes.data ?? []
      setHistory(h as any)

      if (h.length > 0) {
        const titles = h.filter((r: any) => r.position === 1).length
        const podiums = h.filter((r: any) => r.position <= 3).length
        const totalWins = h.reduce((s: number, r: any) => s + (r.wins ?? 0), 0)
        const totalLosses = h.reduce((s: number, r: any) => s + (r.losses ?? 0), 0)
        const totalMatches = totalWins + totalLosses
        setStats({
          totalTournaments: h.length,
          totalMatches,
          totalWins,
          totalLosses,
          totalGamesPro: h.reduce((s: number, r: any) => s + (r.games_pro ?? 0), 0),
          totalGamesAgainst: h.reduce((s: number, r: any) => s + (r.games_against ?? 0), 0),
          titles,
          podiums,
          winRate: totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0,
        })
      }
      setLoading(false)
    }
    load()
  }, [id, supabase])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!athlete) return <div className="text-center text-muted-foreground p-12">Atleta não encontrado</div>

  const categoryColor = {
    iniciante: 'text-green-400', intermediario: 'text-blue-400',
    avancado: 'text-purple-400', profissional: 'text-yellow-400',
  }[athlete.category]

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <Link href="/athletes" className="text-muted-foreground hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Perfil do Atleta</h1>
      </div>

      {/* Profile header */}
      <div className="card-surface p-5">
        <div className="flex items-center gap-4">
          {athlete.photo_url ? (
            <img src={athlete.photo_url} alt={athlete.name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-neon-green/10 flex items-center justify-center text-2xl font-bold text-neon-green">
              {getInitials(athlete.name)}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold">{athlete.name}</h2>
            <span className={cn('text-sm font-medium capitalize', categoryColor)}>
              {getCategoryLabel(athlete.category)}
            </span>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              {athlete.gender && <span className="capitalize">{athlete.gender}</span>}
              {athlete.arena_origin && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{athlete.arena_origin}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {athlete.phone && (
            <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {athlete.phone}</span>
          )}
          {athlete.email && (
            <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {athlete.email}</span>
          )}
        </div>

        {athlete.observations && (
          <p className="mt-3 text-sm text-muted-foreground bg-surface-3 rounded-lg px-3 py-2">{athlete.observations}</p>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Torneios', value: stats.totalTournaments, icon: Trophy, color: 'text-neon-green' },
              { label: 'Títulos', value: stats.titles, icon: Medal, color: 'text-yellow-400' },
              { label: 'Pódios', value: stats.podiums, icon: Medal, color: 'text-amber-400' },
              { label: 'Aproveit.', value: `${stats.winRate}%`, icon: TrendingUp, color: 'text-blue-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card-surface p-3 text-center">
                <Icon className={cn('w-4 h-4 mx-auto mb-1', color)} />
                <p className="text-lg font-bold">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Detailed stats */}
          <div className="card-surface p-5 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-neon-green" /> Estatísticas Globais
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <StatRow label="Partidas" value={stats.totalMatches} />
              <StatRow label="Vitórias" value={stats.totalWins} highlight />
              <StatRow label="Derrotas" value={stats.totalLosses} />
              <StatRow label="Games Pró" value={stats.totalGamesPro} />
              <StatRow label="Games Contra" value={stats.totalGamesAgainst} />
              <StatRow label="Saldo" value={`${stats.totalGamesPro - stats.totalGamesAgainst > 0 ? '+' : ''}${stats.totalGamesPro - stats.totalGamesAgainst}`} highlight={stats.totalGamesPro > stats.totalGamesAgainst} />
            </div>

            {/* Win rate bar */}
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Taxa de vitória</span>
                <span className="font-bold text-neon-green">{stats.winRate}%</span>
              </div>
              <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-neon-green rounded-full transition-all duration-700"
                  style={{ width: `${stats.winRate}%` }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tournament history */}
      <div className="card-surface overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-surface-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Histórico de Torneios</h3>
        </div>
        {history.length === 0 ? (
          <div className="p-8 text-center">
            <Trophy className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum torneio disputado</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-3">
            {history.map((h: any) => (
              <Link key={h.id} href={`/tournaments/${h.tournament?.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-3 transition-colors">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                  h.position === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                  h.position === 2 ? 'bg-slate-400/20 text-slate-300' :
                  h.position === 3 ? 'bg-amber-600/20 text-amber-500' :
                  'bg-surface-3 text-muted-foreground'
                )}>
                  {h.position ?? '—'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{h.tournament?.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(h.tournament?.date)} · {h.wins}V {h.losses}D</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-neon-green">{h.points}pts</p>
                  <p className="text-xs text-muted-foreground">{h.win_rate}%</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatRow({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-xs font-bold', highlight ? 'text-neon-green' : 'text-white')}>{value}</span>
    </div>
  )
}
