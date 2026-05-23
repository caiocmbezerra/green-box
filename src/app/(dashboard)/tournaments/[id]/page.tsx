'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Tournament, TournamentAthlete, TournamentRanking } from '@/types/database'
import { formatDate, formatTime, getStatusLabel, getFormatLabel, cn } from '@/lib/utils'
import {
  ArrowLeft, Trophy, Users, Play, BarChart3, Eye, Settings,
  Calendar, MapPin, Clock, Zap, ChevronRight, ExternalLink, UserPlus,
  Loader2, AlertCircle,
} from 'lucide-react'
import { generateTournamentRounds } from '@/lib/algorithms/super8'

type Tab = 'overview' | 'athletes' | 'results' | 'ranking'

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [athletes, setAthletes] = useState<TournamentAthlete[]>([])
  const [rankings, setRankings] = useState<TournamentRanking[]>([])
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    const [tRes, aRes, rRes] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('tournament_athletes').select('*, athlete:athletes(*)').eq('tournament_id', id),
      supabase.from('tournament_rankings').select('*, athlete:athletes(*)').eq('tournament_id', id).order('position'),
    ])
    setTournament(tRes.data)
    setAthletes(aRes.data ?? [])
    setRankings(rRes.data ?? [])
    setLoading(false)
  }

  async function startTournament() {
    if (!tournament) return
    if (athletes.length < tournament.num_players) {
      alert(`Adicione ${tournament.num_players - athletes.length} atleta(s) para iniciar.`)
      return
    }
    setStarting(true)

    try {
      const playerIds = athletes.map(a => a.athlete_id)
      const rounds = generateTournamentRounds(playerIds, tournament.num_courts, tournament.format)

      // Update tournament status
      await supabase.from('tournaments').update({ status: 'active', current_round: 1 }).eq('id', id)

      // Create rounds and matches
      for (const round of rounds) {
        const { data: roundData } = await supabase.from('rounds').insert({
          tournament_id: id,
          number: round.roundNumber,
          status: round.roundNumber === 1 ? 'active' : 'pending',
        }).select().single()

        if (!roundData) continue

        const matchInserts = round.matches.map((match, idx) => {
          const courtIndex = idx % tournament.num_courts
          return {
            tournament_id: id,
            round_id: roundData.id,
            round_number: round.roundNumber,
            match_number: idx + 1,
            player1_id: (match.team1 as unknown as string[])[0],
            player2_id: (match.team1 as unknown as string[])[1],
            player3_id: (match.team2 as unknown as string[])[0],
            player4_id: (match.team2 as unknown as string[])[1],
            status: round.roundNumber === 1 ? 'active' as const : 'pending' as const,
            started_at: round.roundNumber === 1 ? new Date().toISOString() : null,
          }
        })

        await supabase.from('matches').insert(matchInserts)
      }

      // Initialize rankings
      const rankInserts = playerIds.map(pid => ({
        tournament_id: id,
        athlete_id: pid,
        wins: 0, losses: 0, games_pro: 0, games_against: 0,
        matches_played: 0, win_rate: 0, points: 0,
      }))
      await supabase.from('tournament_rankings').insert(rankInserts)

      router.push(`/tournaments/${id}/live`)
    } catch (err) {
      console.error(err)
      alert('Erro ao iniciar torneio')
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!tournament) return <div className="text-center text-muted-foreground p-12">Torneio não encontrado</div>

  const canStart = tournament.status === 'draft' || tournament.status === 'setup'
  const isActive = tournament.status === 'active'
  const needsAthletes = athletes.length < tournament.num_players

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/tournaments" className="text-muted-foreground hover:text-white mt-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{tournament.name}</h1>
            {isActive && (
              <span className="live-indicator">
                <span className="live-dot" /> AO VIVO
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(tournament.date)}</span>
            {tournament.start_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(tournament.start_time)}</span>}
            {tournament.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {tournament.location}</span>}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        {isActive && (
          <>
            <Link href={`/tournaments/${id}/live`} className="btn-neon rounded-xl px-4 py-2 text-sm flex items-center gap-2 flex-1 justify-center">
              <Eye className="w-4 h-4" /> Painel Ao Vivo
            </Link>
            <Link href={`/tournaments/${id}/results`} className="bg-surface-3 border border-surface-4 hover:border-white/20 rounded-xl px-4 py-2 text-sm flex items-center gap-2 transition-all">
              <Zap className="w-4 h-4" /> Resultados
            </Link>
          </>
        )}
        {canStart && (
          <>
            <Link href={`/tournaments/${id}/setup`} className="bg-surface-3 border border-surface-4 hover:border-white/20 rounded-xl px-4 py-2 text-sm flex items-center gap-2 transition-all">
              <UserPlus className="w-4 h-4" /> Atletas
            </Link>
            <button
              onClick={startTournament}
              disabled={starting || needsAthletes}
              className="btn-neon rounded-xl px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50 flex-1 justify-center"
            >
              {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {needsAthletes ? `Adicionar ${tournament.num_players - athletes.length} atleta(s)` : 'Iniciar Torneio'}
            </button>
          </>
        )}
        {tournament.status === 'finished' && (
          <Link href={`/tournaments/${id}/ranking`} className="btn-neon rounded-xl px-4 py-2 text-sm flex items-center gap-2 flex-1 justify-center">
            <Trophy className="w-4 h-4" /> Ver Resultado Final
          </Link>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Atletas', value: `${athletes.length}/${tournament.num_players}`, icon: Users },
          { label: 'Rodadas', value: `${tournament.current_round}/${tournament.total_rounds}`, icon: Zap },
          { label: 'Quadras', value: tournament.num_courts, icon: MapPin },
          { label: 'Formato', value: tournament.match_format.replace('games', 'G'), icon: Trophy },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card-surface p-3 text-center">
            <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-2 p-1 rounded-xl">
        {(['overview', 'athletes', 'ranking'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize',
              tab === t ? 'bg-surface-4 text-white' : 'text-muted-foreground hover:text-white'
            )}
          >
            {t === 'overview' ? 'Visão Geral' : t === 'athletes' ? 'Atletas' : 'Ranking'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="card-surface p-5 space-y-3">
            <h3 className="text-sm font-semibold">Detalhes do Formato</h3>
            <div className="space-y-2">
              <Row label="Formato" value={getFormatLabel(tournament.format)} />
              <Row label="Partida" value={getFormatLabel(tournament.match_format)} />
              <Row label="Status" value={getStatusLabel(tournament.status)} highlight={isActive} />
              {tournament.description && <Row label="Descrição" value={tournament.description} />}
            </div>
          </div>

          {needsAthletes && canStart && (
            <div className="card-surface p-4 border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-400">Atletas insuficientes</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Adicione mais {tournament.num_players - athletes.length} atleta(s) para iniciar o torneio.
                  </p>
                  <Link href={`/tournaments/${id}/setup`} className="text-xs text-neon-green mt-2 inline-flex items-center gap-1">
                    Gerenciar atletas <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'athletes' && (
        <div className="card-surface overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-surface-3">
            <p className="text-sm font-semibold">{athletes.length} atletas inscritos</p>
            {canStart && (
              <Link href={`/tournaments/${id}/setup`} className="text-xs text-neon-green flex items-center gap-1">
                Gerenciar <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          {athletes.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum atleta inscrito</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-3">
              {athletes.map((ta, idx) => (
                <div key={ta.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-surface-3 flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {idx + 1}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-neon-green/10 flex items-center justify-center text-xs font-bold text-neon-green">
                    {ta.athlete?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ta.athlete?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{ta.athlete?.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'ranking' && (
        <div className="card-surface overflow-hidden">
          <div className="p-4 border-b border-surface-3">
            <p className="text-sm font-semibold">Ranking Parcial</p>
          </div>
          {rankings.length === 0 ? (
            <div className="p-8 text-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Ranking disponível após iniciar</p>
            </div>
          ) : (
            <RankingTable rankings={rankings} />
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-xs font-medium', highlight ? 'text-neon-green' : 'text-white')}>{value}</span>
    </div>
  )
}

function RankingTable({ rankings }: { rankings: TournamentRanking[] }) {
  return (
    <div className="divide-y divide-surface-3">
      {rankings.map((r, idx) => (
        <div key={r.id} className="flex items-center gap-3 px-4 py-3">
          <div className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
            idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
            idx === 1 ? 'bg-slate-400/20 text-slate-300' :
            idx === 2 ? 'bg-amber-600/20 text-amber-500' : 'bg-surface-3 text-muted-foreground'
          )}>
            {idx + 1}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{r.athlete?.name}</p>
            <p className="text-xs text-muted-foreground">{r.wins}V · {r.losses}D · Saldo {r.game_diff > 0 ? '+' : ''}{r.game_diff}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-neon-green">{r.points}pts</p>
            <p className="text-xs text-muted-foreground">{r.win_rate}%</p>
          </div>
        </div>
      ))}
    </div>
  )
}
