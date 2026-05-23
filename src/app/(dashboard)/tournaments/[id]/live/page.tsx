'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Tournament, Match, Round, TournamentRanking } from '@/types/database'
import { cn, formatDate } from '@/lib/utils'
import {
  ArrowLeft, Trophy, Zap, Clock, MapPin, Activity,
  ChevronUp, ChevronDown, Tv2, RefreshCw,
} from 'lucide-react'

export default function LivePage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [activeMatches, setActiveMatches] = useState<Match[]>([])
  const [pendingMatches, setPendingMatches] = useState<Match[]>([])
  const [rankings, setRankings] = useState<TournamentRanking[]>([])
  const [currentRound, setCurrentRound] = useState<Round | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const load = useCallback(async () => {
    const [tRes, mActiveRes, mPendingRes, rRes, roundRes] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('matches').select('*, player1:player1_id(id,name), player2:player2_id(id,name), player3:player3_id(id,name), player4:player4_id(id,name), court:court_id(*)').eq('tournament_id', id).eq('status', 'active'),
      supabase.from('matches').select('*, player1:player1_id(id,name), player2:player2_id(id,name), player3:player3_id(id,name), player4:player4_id(id,name)').eq('tournament_id', id).eq('status', 'pending').order('round_number').limit(6),
      supabase.from('tournament_rankings').select('*, athlete:athlete_id(id,name)').eq('tournament_id', id).order('position').limit(8),
      supabase.from('rounds').select('*').eq('tournament_id', id).eq('status', 'active').single(),
    ])
    setTournament(tRes.data)
    setActiveMatches(mActiveRes.data ?? [])
    setPendingMatches(mPendingRes.data ?? [])
    setRankings(rRes.data ?? [])
    setCurrentRound(roundRes.data)
    setLoading(false)
  }, [id, supabase])

  useEffect(() => { load() }, [load])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`tournament-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_rankings', filter: `tournament_id=eq.${id}` }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id, supabase, load])

  function getElapsed(startedAt: string | null): string {
    if (!startedAt) return '00:00'
    const diff = Math.floor((now.getTime() - new Date(startedAt).getTime()) / 1000)
    const m = Math.floor(diff / 60)
    const s = diff % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/tournaments/${id}`} className="text-muted-foreground hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">{tournament?.name}</h1>
              <span className="live-indicator">
                <span className="live-dot" /> AO VIVO
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Rodada {tournament?.current_round} de {tournament?.total_rounds}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg bg-surface-2 border border-surface-4 text-muted-foreground hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link href={`/tournaments/${id}/results`} className="btn-neon rounded-lg px-3 py-2 text-xs flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Resultados
          </Link>
        </div>
      </div>

      {/* Round progress */}
      {tournament && (
        <div className="card-surface p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Progresso do Torneio</span>
            <span className="text-xs font-bold text-neon-green">
              {tournament.current_round}/{tournament.total_rounds} rodadas
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: tournament.total_rounds }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'flex-1 h-1.5 rounded-full transition-all',
                  i < tournament.current_round ? 'bg-neon-green' :
                  i === tournament.current_round - 1 ? 'bg-neon-green animate-pulse' :
                  'bg-surface-3'
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active matches */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-neon-green" />
          <h2 className="text-sm font-semibold">Em Quadra</h2>
          <span className="text-xs text-muted-foreground">({activeMatches.length})</span>
        </div>

        {activeMatches.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <Activity className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma partida em andamento</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeMatches.map(match => (
              <MatchCard key={match.id} match={match} elapsed={getElapsed(match.started_at)} />
            ))}
          </div>
        )}
      </div>

      {/* Pending matches */}
      {pendingMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Próximas Partidas</h2>
          </div>
          <div className="card-surface divide-y divide-surface-3 overflow-hidden">
            {pendingMatches.slice(0, 4).map(match => (
              <div key={match.id} className="flex items-center gap-3 px-4 py-3">
                <div className="text-xs text-muted-foreground w-16">R{match.round_number}·J{match.match_number}</div>
                <div className="flex-1 text-xs">
                  <span className="text-white">{getPlayerName(match, 'player1')} / {getPlayerName(match, 'player2')}</span>
                  <span className="text-muted-foreground mx-2">vs</span>
                  <span className="text-white">{getPlayerName(match, 'player3')} / {getPlayerName(match, 'player4')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live rankings */}
      {rankings.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-neon-green" />
            <h2 className="text-sm font-semibold">Ranking ao Vivo</h2>
          </div>
          <div className="card-surface overflow-hidden">
            <div className="divide-y divide-surface-3">
              {rankings.slice(0, 8).map((r, idx) => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                    idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                    idx === 2 ? 'bg-amber-600/20 text-amber-500' :
                    'bg-surface-3 text-muted-foreground'
                  )}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{(r as any).athlete?.name ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">{r.wins}V {r.losses}D</span>
                    <span className={cn('font-bold', r.game_diff > 0 ? 'text-neon-green' : r.game_diff < 0 ? 'text-red-400' : 'text-muted-foreground')}>
                      {r.game_diff > 0 ? '+' : ''}{r.game_diff}
                    </span>
                    <span className="font-bold text-white w-10 text-right">{r.points}pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MatchCard({ match, elapsed }: { match: Match; elapsed: string }) {
  return (
    <div className="card-surface p-4 border-neon-green/20 bg-neon-green/3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Quadra {(match as any).court?.number ?? '?'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-neon-green text-xs font-mono">
          <Clock className="w-3 h-3" />
          {elapsed}
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center gap-3">
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold leading-tight">{getPlayerName(match, 'player1')}</p>
          <p className="text-sm font-semibold leading-tight text-muted-foreground">{getPlayerName(match, 'player2')}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl font-mono font-bold">{match.score_team1}</span>
          <span className="text-muted-foreground text-sm">×</span>
          <span className="text-2xl font-mono font-bold">{match.score_team2}</span>
        </div>
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold leading-tight">{getPlayerName(match, 'player3')}</p>
          <p className="text-sm font-semibold leading-tight text-muted-foreground">{getPlayerName(match, 'player4')}</p>
        </div>
      </div>

      <div className="flex justify-center mt-3">
        <span className="live-indicator text-[10px]">
          <span className="live-dot w-1 h-1" /> EM JOGO
        </span>
      </div>
    </div>
  )
}

function getPlayerName(match: Match, field: 'player1' | 'player2' | 'player3' | 'player4'): string {
  const player = (match as any)[field]
  if (!player) return '?'
  return player.name?.split(' ')[0] ?? '?'
}
