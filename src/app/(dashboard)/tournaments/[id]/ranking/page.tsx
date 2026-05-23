'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Tournament, TournamentRanking } from '@/types/database'
import { cn, formatDate } from '@/lib/utils'
import { ArrowLeft, Trophy, Download, Share2, Medal } from 'lucide-react'

export default function RankingPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [rankings, setRankings] = useState<TournamentRanking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('tournament_rankings')
        .select('*, athlete:athlete_id(id,name,category,photo_url)')
        .eq('tournament_id', id)
        .order('position'),
    ]).then(([tRes, rRes]) => {
      setTournament(tRes.data)
      setRankings(rRes.data ?? [])
      setLoading(false)
    })
  }, [id, supabase])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const podium = rankings.slice(0, 3)
  const rest = rankings.slice(3)

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <Link href={`/tournaments/${id}`} className="text-muted-foreground hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Classificação Final</h1>
          <p className="text-sm text-muted-foreground">{tournament?.name}</p>
        </div>
      </div>

      {/* Tournament info */}
      {tournament && (
        <div className="card-surface p-4 text-center">
          <Trophy className="w-8 h-8 text-neon-green mx-auto mb-2" />
          <p className="font-bold text-lg">{tournament.name}</p>
          <p className="text-sm text-muted-foreground">{formatDate(tournament.date)}</p>
          <span className={cn(
            'inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium',
            tournament.status === 'finished'
              ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
          )}>
            {tournament.status === 'finished' ? 'Encerrado' : 'Em Andamento'}
          </span>
        </div>
      )}

      {/* Podium */}
      {podium.length >= 3 && (
        <div className="flex items-end justify-center gap-3">
          {/* 2nd */}
          <PodiumBlock ranking={podium[1]} position={2} height="h-24" />
          {/* 1st */}
          <PodiumBlock ranking={podium[0]} position={1} height="h-32" />
          {/* 3rd */}
          {podium[2] && <PodiumBlock ranking={podium[2]} position={3} height="h-20" />}
        </div>
      )}

      {/* Full ranking table */}
      <div className="card-surface overflow-hidden">
        <div className="p-4 border-b border-surface-3">
          <div className="grid grid-cols-12 text-xs text-muted-foreground uppercase tracking-wide">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Atleta</div>
            <div className="col-span-1 text-center">V</div>
            <div className="col-span-1 text-center">D</div>
            <div className="col-span-2 text-center">Saldo</div>
            <div className="col-span-2 text-center">%</div>
            <div className="col-span-1 text-right">Pts</div>
          </div>
        </div>

        <div className="divide-y divide-surface-3">
          {rankings.map((r, idx) => (
            <div key={r.id} className={cn(
              'grid grid-cols-12 items-center px-4 py-3',
              idx === 0 ? 'bg-yellow-500/5' :
              idx === 1 ? 'bg-slate-400/5' :
              idx === 2 ? 'bg-amber-600/5' : ''
            )}>
              <div className="col-span-1">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                  idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                  idx === 2 ? 'bg-amber-600/20 text-amber-500' :
                  'text-muted-foreground text-xs'
                )}>
                  {idx < 3 ? <Medal className="w-3 h-3" /> : idx + 1}
                </div>
              </div>
              <div className="col-span-4">
                <p className="text-sm font-medium truncate">{(r as any).athlete?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{(r as any).athlete?.category}</p>
              </div>
              <div className="col-span-1 text-center text-sm font-semibold text-neon-green">{r.wins}</div>
              <div className="col-span-1 text-center text-sm text-muted-foreground">{r.losses}</div>
              <div className={cn('col-span-2 text-center text-sm font-mono font-semibold',
                r.game_diff > 0 ? 'text-neon-green' : r.game_diff < 0 ? 'text-red-400' : 'text-muted-foreground'
              )}>
                {r.game_diff > 0 ? '+' : ''}{r.game_diff}
              </div>
              <div className="col-span-2 text-center text-xs text-muted-foreground">{r.win_rate}%</div>
              <div className="col-span-1 text-right text-sm font-bold">{r.points}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats summary */}
      {rankings.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card-surface p-4 text-center">
            <p className="text-2xl font-bold text-neon-green">{rankings[0] ? (rankings[0] as any).athlete?.name?.split(' ')[0] : '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">🥇 Campeão</p>
          </div>
          <div className="card-surface p-4 text-center">
            <p className="text-2xl font-bold">{rankings.reduce((sum, r) => sum + r.matches_played, 0) / 2}</p>
            <p className="text-xs text-muted-foreground mt-1">Partidas disputadas</p>
          </div>
        </div>
      )}
    </div>
  )
}

function PodiumBlock({ ranking, position, height }: { ranking: TournamentRanking; position: number; height: string }) {
  const colors = {
    1: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400', emoji: '🥇' },
    2: { bg: 'bg-slate-400/20', border: 'border-slate-400/30', text: 'text-slate-300', emoji: '🥈' },
    3: { bg: 'bg-amber-600/20', border: 'border-amber-600/30', text: 'text-amber-500', emoji: '🥉' },
  }
  const style = colors[position as keyof typeof colors]

  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center text-lg font-bold">
        {(ranking as any).athlete?.name?.charAt(0) ?? '?'}
      </div>
      <p className="text-xs font-semibold text-center leading-tight max-w-20 truncate">
        {(ranking as any).athlete?.name?.split(' ')[0]}
      </p>
      <p className="text-xs text-muted-foreground">{ranking.wins}V · {ranking.points}pts</p>
      <div className={cn(`${height} w-full rounded-t-xl border flex flex-col items-center justify-end pb-3`, style.bg, style.border)}>
        <span className="text-2xl">{style.emoji}</span>
        <span className={cn('text-xs font-bold', style.text)}>{position}º</span>
      </div>
    </div>
  )
}
