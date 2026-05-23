'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Tournament, Match, TournamentRanking } from '@/types/database'
import { cn } from '@/lib/utils'
import { Trophy, Clock, Zap, Activity } from 'lucide-react'

export default function TVLivePage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [activeMatches, setActiveMatches] = useState<Match[]>([])
  const [rankings, setRankings] = useState<TournamentRanking[]>([])
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const load = useCallback(async () => {
    const [tRes, mRes, rRes] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('matches')
        .select('*, player1:player1_id(id,name), player2:player2_id(id,name), player3:player3_id(id,name), player4:player4_id(id,name), court:court_id(*)')
        .eq('tournament_id', id).eq('status', 'active'),
      supabase.from('tournament_rankings')
        .select('*, athlete:athlete_id(id,name)')
        .eq('tournament_id', id).order('position').limit(8),
    ])
    setTournament(tRes.data)
    setActiveMatches(mRes.data ?? [])
    setRankings(rRes.data ?? [])
  }, [id, supabase])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const ch = supabase.channel(`tv-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_rankings', filter: `tournament_id=eq.${id}` }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [id, supabase, load])

  function elapsed(startedAt: string | null): string {
    if (!startedAt) return '00:00'
    const diff = Math.floor((now.getTime() - new Date(startedAt).getTime()) / 1000)
    return `${String(Math.floor(diff / 60)).padStart(2, '0')}:${String(diff % 60).padStart(2, '0')}`
  }

  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/80">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-neon-green" />
          <span className="font-bold text-sm">{tournament?.name ?? 'Super 8'}</span>
          <span className="live-indicator">
            <span className="live-dot" /> AO VIVO
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Rodada <span className="text-white font-bold">{tournament?.current_round}</span>/{tournament?.total_rounds}
          </span>
          <span className="font-mono text-neon-green">{timeStr}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-0 h-[calc(100vh-52px)]">
        {/* Matches - left 2/3 */}
        <div className="col-span-2 p-6 space-y-4 overflow-auto">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-neon-green" />
            <span className="text-sm font-semibold uppercase tracking-wide">Em Quadra</span>
          </div>

          {activeMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Clock className="w-16 h-16 text-white/10" />
              <p className="text-white/40 text-xl">Aguardando próxima partida</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {activeMatches.map(match => (
                <TVMatchCard key={match.id} match={match} elapsed={elapsed(match.started_at)} />
              ))}
            </div>
          )}
        </div>

        {/* Rankings - right 1/3 */}
        <div className="border-l border-white/10 p-6 overflow-auto bg-black/40">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold uppercase tracking-wide">Ranking</span>
          </div>

          <div className="space-y-2">
            {rankings.map((r, idx) => (
              <div key={r.id} className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                idx === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' :
                idx === 1 ? 'bg-slate-400/10 border border-slate-400/20' :
                idx === 2 ? 'bg-amber-600/10 border border-amber-600/20' :
                'bg-white/5'
              )}>
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                  idx === 0 ? 'bg-yellow-500/30 text-yellow-400' :
                  idx === 1 ? 'bg-slate-400/30 text-slate-300' :
                  idx === 2 ? 'bg-amber-600/30 text-amber-500' :
                  'bg-white/10 text-white/60'
                )}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{(r as any).athlete?.name}</p>
                  <p className="text-xs text-white/40">{r.wins}V · {r.losses}D · {r.game_diff > 0 ? '+' : ''}{r.game_diff}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-neon-green">{r.points}pts</p>
                </div>
              </div>
            ))}
          </div>

          {/* Copa Sementes branding */}
          <div className="mt-8 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-6 h-6 text-neon-green/60" />
            </div>
            <p className="text-xs text-white/20 uppercase tracking-widest">Copa Sementes</p>
            <p className="text-[10px] text-white/10 mt-0.5">Plantando Amizade, Colhendo União</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TVMatchCard({ match, elapsed }: { match: Match; elapsed: string }) {
  const p = (f: string) => (match as any)[f]?.name?.split(' ')[0] ?? '?'
  const courtNum = (match as any).court?.number ?? '?'

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-neon-green/20 transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-white/40 uppercase tracking-wide">Quadra {courtNum}</span>
        <div className="flex items-center gap-1.5 text-neon-green text-xs font-mono">
          <Clock className="w-3 h-3" />
          {elapsed}
        </div>
      </div>

      {/* Teams vs score */}
      <div className="flex items-center gap-4">
        {/* Team 1 */}
        <div className="flex-1 text-right">
          <p className="text-lg font-bold leading-tight">{p('player1')}</p>
          <p className="text-base text-white/60 leading-tight">{p('player2')}</p>
        </div>

        {/* Score */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-4xl font-mono font-black text-white">{match.score_team1}</span>
          <span className="text-white/20 text-2xl">×</span>
          <span className="text-4xl font-mono font-black text-white">{match.score_team2}</span>
        </div>

        {/* Team 2 */}
        <div className="flex-1">
          <p className="text-lg font-bold leading-tight">{p('player3')}</p>
          <p className="text-base text-white/60 leading-tight">{p('player4')}</p>
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <span className="live-indicator text-[11px]">
          <span className="live-dot w-1.5 h-1.5" /> EM JOGO
        </span>
      </div>
    </div>
  )
}
