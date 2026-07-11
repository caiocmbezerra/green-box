'use client'

// PUBLIC tournament page — no login required
// Athletes access this via shared link or QR code

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Tournament, Match, TournamentRanking } from '@/types/database'
import { cn, formatDate } from '@/lib/utils'
import {
  Trophy, Clock, Activity, QrCode, Share2,
  MapPin, Calendar, Users, Zap,
} from 'lucide-react'
import QRCodeDisplay from '@/components/shared/QRCodeDisplay'

type Tab = 'live' | 'ranking' | 'schedule'

export default function PublicTournamentPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [activeMatches, setActiveMatches] = useState<Match[]>([])
  const [pendingMatches, setPendingMatches] = useState<Match[]>([])
  const [rankings, setRankings] = useState<TournamentRanking[]>([])
  const [tab, setTab] = useState<Tab>('live')
  const [now, setNow] = useState(new Date())
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const load = useCallback(async () => {
    const [tRes, activeRes, pendingRes, rankRes] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('matches')
        .select('*, player1:player1_id(id,name), player2:player2_id(id,name), player3:player3_id(id,name), player4:player4_id(id,name), court:court_id(*)')
        .eq('tournament_id', id).eq('status', 'active'),
      supabase.from('matches')
        .select('*, player1:player1_id(id,name), player2:player2_id(id,name), player3:player3_id(id,name), player4:player4_id(id,name)')
        .eq('tournament_id', id).eq('status', 'pending').order('round_number').limit(8),
      supabase.from('tournament_rankings')
        .select('*, athlete:athlete_id(id,name)')
        .eq('tournament_id', id).order('position'),
    ])
    setTournament(tRes.data)
    setActiveMatches(activeRes.data ?? [])
    setPendingMatches(pendingRes.data ?? [])
    setRankings(rankRes.data ?? [])
  }, [id, supabase])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const ch = supabase.channel(`public-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_rankings', filter: `tournament_id=eq.${id}` }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [id, supabase, load])

  function elapsed(startedAt: string | null) {
    if (!startedAt) return '00:00'
    const s = Math.floor((now.getTime() - new Date(startedAt).getTime()) / 1000)
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  function share() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: tournament?.name ?? 'Torneio', url })
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const pName = (m: Match, f: string) => (m as any)[f]?.name?.split(' ')[0] ?? '?'
  const isActive = tournament?.status === 'active'
  const isFinished = tournament?.status === 'finished'

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-1/95 backdrop-blur border-b border-surface-3 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-neon-green" />
            <span className="text-sm font-bold">Langolandia</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowQR(!showQR)} className="p-2 rounded-lg bg-surface-3 text-muted-foreground hover:text-white">
              <QrCode className="w-4 h-4" />
            </button>
            <button onClick={share} className="p-2 rounded-lg bg-surface-3 text-muted-foreground hover:text-white">
              <Share2 className="w-4 h-4" />
              {copied && <span className="absolute text-xs text-neon-green ml-1">Copiado!</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* QR Code overlay */}
        {showQR && (
          <div className="card-surface p-6 text-center space-y-3">
            <p className="text-sm font-semibold">Compartilhe este torneio</p>
            <QRCodeDisplay url={typeof window !== 'undefined' ? window.location.href : ''} size={160} />
            <p className="text-xs text-muted-foreground">Escaneie para acompanhar ao vivo</p>
          </div>
        )}

        {/* Tournament info */}
        <div className="card-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold leading-tight">{tournament?.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                {tournament?.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(tournament.date)}</span>}
                {tournament?.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{tournament.location}</span>}
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{tournament?.num_players} atletas</span>
              </div>
            </div>
            {isActive && (
              <span className="live-indicator flex-shrink-0">
                <span className="live-dot" /> AO VIVO
              </span>
            )}
            {isFinished && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 flex-shrink-0">
                Encerrado
              </span>
            )}
          </div>

          {tournament && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Rodada {tournament.current_round}/{tournament.total_rounds}</span>
                <span>{Math.round((tournament.current_round / tournament.total_rounds) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <div className="h-full bg-neon-green rounded-full transition-all" style={{ width: `${(tournament.current_round / tournament.total_rounds) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-2 p-1 rounded-xl">
          {[
            { key: 'live', label: isFinished ? 'Resultado' : 'Ao Vivo' },
            { key: 'ranking', label: 'Ranking' },
            { key: 'schedule', label: 'Próximos' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as Tab)}
              className={cn('flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                tab === t.key ? 'bg-surface-4 text-white' : 'text-muted-foreground hover:text-white')}>
              {t.label}
            </button>
          ))}
        </div>

        {/* LIVE tab */}
        {tab === 'live' && (
          <div className="space-y-3">
            {activeMatches.length === 0 && !isFinished ? (
              <div className="card-surface p-8 text-center">
                <Clock className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Aguardando próxima partida</p>
              </div>
            ) : isFinished ? (
              <div className="space-y-3">
                <PodiumDisplay rankings={rankings} />
              </div>
            ) : (
              activeMatches.map(m => (
                <div key={m.id} className="card-surface p-4 border-neon-green/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">Quadra {(m as any).court?.number ?? '?'}</span>
                    <span className="text-xs font-mono text-neon-green">{elapsed(m.started_at)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-right">
                      <p className="text-sm font-bold">{pName(m, 'player1')}</p>
                      <p className="text-sm text-muted-foreground">{pName(m, 'player2')}</p>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <p className="text-3xl font-mono font-black">{m.score_team1}<span className="text-muted-foreground mx-1">×</span>{m.score_team2}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{pName(m, 'player3')}</p>
                      <p className="text-sm text-muted-foreground">{pName(m, 'player4')}</p>
                    </div>
                  </div>
                  <div className="flex justify-center mt-2">
                    <span className="live-indicator text-[10px]"><span className="live-dot w-1 h-1" /> EM JOGO</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* RANKING tab */}
        {tab === 'ranking' && (
          <div className="card-surface overflow-hidden">
            {rankings.length === 0 ? (
              <div className="p-8 text-center">
                <Trophy className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Ranking disponível após iniciar</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-3">
                {rankings.map((r, idx) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                      idx === 2 ? 'bg-amber-600/20 text-amber-500' : 'bg-surface-3 text-muted-foreground')}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{(r as any).athlete?.name}</p>
                      <p className="text-xs text-muted-foreground">{r.wins}V · {r.losses}D · {r.game_diff > 0 ? '+' : ''}{r.game_diff} saldo</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-neon-green">{r.points}pts</p>
                      <p className="text-xs text-muted-foreground">{r.win_rate}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SCHEDULE tab */}
        {tab === 'schedule' && (
          <div className="card-surface overflow-hidden">
            {pendingMatches.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Sem partidas pendentes</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-3">
                {pendingMatches.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="text-xs text-muted-foreground w-12 flex-shrink-0">R{m.round_number}·J{m.match_number}</div>
                    <div className="flex-1 text-xs">
                      <span className="font-medium">{pName(m, 'player1')}/{pName(m, 'player2')}</span>
                      <span className="text-muted-foreground mx-1.5">vs</span>
                      <span className="font-medium">{pName(m, 'player3')}/{pName(m, 'player4')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground/40 pb-4">
          Langolandia · Copa Sementes Beach Tennis
        </p>
      </div>
    </div>
  )
}

function PodiumDisplay({ rankings }: { rankings: TournamentRanking[] }) {
  if (rankings.length < 3) return null
  return (
    <div className="card-surface p-5 text-center space-y-4">
      <div className="flex items-center justify-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <span className="font-bold">Resultado Final</span>
      </div>
      <div className="flex items-end justify-center gap-3">
        {[1, 0, 2].map(idx => {
          const r = rankings[idx]
          if (!r) return null
          const pos = idx + 1
          const cfg = [
            { emoji: '🥇', h: 'h-24', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
            { emoji: '🥈', h: 'h-20', color: 'text-slate-300', bg: 'bg-slate-400/10 border-slate-400/20' },
            { emoji: '🥉', h: 'h-16', color: 'text-amber-500', bg: 'bg-amber-600/10 border-amber-600/20' },
          ][idx]
          return (
            <div key={r.id} className="flex flex-col items-center gap-1 flex-1">
              <p className="text-xs font-semibold truncate w-full text-center">{(r as any).athlete?.name?.split(' ')[0]}</p>
              <p className="text-xs text-muted-foreground">{r.wins}V · {r.points}pts</p>
              <div className={cn(`${cfg.h} w-full rounded-t-xl border flex items-end justify-center pb-2`, cfg.bg)}>
                <span className="text-xl">{cfg.emoji}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
