'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Tournament, Match, Round } from '@/types/database'
import { cn } from '@/lib/utils'
import { ArrowLeft, Zap, CheckCircle, Loader2, Trophy, ChevronRight, AlertCircle } from 'lucide-react'

interface MatchWithPlayers extends Match {
  player1: { id: string; name: string } | null
  player2: { id: string; name: string } | null
  player3: { id: string; name: string } | null
  player4: { id: string; name: string } | null
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [rounds, setRounds] = useState<Round[]>([])
  const [matches, setMatches] = useState<MatchWithPlayers[]>([])
  const [selectedRound, setSelectedRound] = useState<number>(1)
  const [saving, setSaving] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [advancingRound, setAdvancingRound] = useState(false)

  const load = useCallback(async () => {
    const [tRes, rRes, mRes] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('rounds').select('*').eq('tournament_id', id).order('number'),
      supabase.from('matches')
        .select('*, player1:player1_id(id,name), player2:player2_id(id,name), player3:player3_id(id,name), player4:player4_id(id,name)')
        .eq('tournament_id', id)
        .order('match_number'),
    ])
    setTournament(tRes.data)
    setRounds(rRes.data ?? [])
    setMatches(mRes.data ?? [])
    if (tRes.data) setSelectedRound(tRes.data.current_round)
    setLoading(false)
  }, [id, supabase])

  useEffect(() => { load() }, [load])

  const roundMatches = matches.filter(m => m.round_number === selectedRound)

  async function submitResult(match: MatchWithPlayers, winner: 1 | 2, score1: number, score2: number) {
    setSaving(match.id)
    try {
      await supabase.from('matches').update({
        winner_team: winner,
        score_team1: score1,
        score_team2: score2,
        status: 'finished',
        finished_at: new Date().toISOString(),
      }).eq('id', match.id)

      await supabase.rpc('recalculate_tournament_rankings', { p_tournament_id: id })
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(null)
    }
  }

  async function advanceRound() {
    if (!tournament) return
    setAdvancingRound(true)
    try {
      const nextRound = tournament.current_round + 1
      if (nextRound > tournament.total_rounds) {
        // Finish tournament
        await supabase.from('tournaments').update({ status: 'finished' }).eq('id', id)
        await supabase.from('rounds').update({ status: 'finished', finished_at: new Date().toISOString() }).eq('tournament_id', id).eq('number', tournament.current_round)
      } else {
        await supabase.from('rounds').update({ status: 'finished', finished_at: new Date().toISOString() }).eq('tournament_id', id).eq('number', tournament.current_round)
        await supabase.from('rounds').update({ status: 'active', started_at: new Date().toISOString() }).eq('tournament_id', id).eq('number', nextRound)
        await supabase.from('matches').update({ status: 'active', started_at: new Date().toISOString() }).eq('tournament_id', id).eq('round_number', nextRound)
        await supabase.from('tournaments').update({ current_round: nextRound }).eq('id', id)
      }
      await load()
    } finally {
      setAdvancingRound(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const allCurrentFinished = roundMatches.length > 0 && roundMatches.every(m => m.status === 'finished')
  const isLastRound = tournament && tournament.current_round >= tournament.total_rounds

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <Link href={`/tournaments/${id}/live`} className="text-muted-foreground hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Lançar Resultados</h1>
          <p className="text-sm text-muted-foreground">{tournament?.name}</p>
        </div>
      </div>

      {/* Round selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {rounds.map(round => (
          <button
            key={round.id}
            onClick={() => setSelectedRound(round.number)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all border',
              selectedRound === round.number
                ? 'bg-neon-green/10 text-neon-green border-neon-green/30'
                : round.status === 'finished'
                  ? 'bg-surface-2 text-muted-foreground border-surface-3 opacity-60'
                  : 'bg-surface-2 text-muted-foreground border-surface-4 hover:border-white/20'
            )}
          >
            {round.status === 'finished' && <CheckCircle className="w-3 h-3 inline mr-1" />}
            R{round.number}
          </button>
        ))}
      </div>

      {/* Matches for selected round */}
      <div className="space-y-3">
        {roundMatches.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma partida nesta rodada</p>
          </div>
        ) : (
          roundMatches.map(match => (
            <MatchResultCard
              key={match.id}
              match={match}
              onSubmit={submitResult}
              saving={saving === match.id}
            />
          ))
        )}
      </div>

      {/* Advance round */}
      {allCurrentFinished && tournament?.current_round === selectedRound && (
        <button
          onClick={advanceRound}
          disabled={advancingRound}
          className="w-full btn-neon rounded-xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {advancingRound ? <Loader2 className="w-4 h-4 animate-spin" /> : isLastRound ? <Trophy className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {isLastRound ? 'Encerrar Torneio' : `Avançar para Rodada ${(tournament?.current_round ?? 0) + 1}`}
        </button>
      )}
    </div>
  )
}

const COMMON_SCORES = [
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4],
  [4, 0], [4, 1], [4, 2], [4, 3],
  [1, 0],
]

function MatchResultCard({
  match, onSubmit, saving,
}: {
  match: MatchWithPlayers
  onSubmit: (m: MatchWithPlayers, w: 1 | 2, s1: number, s2: number) => void
  saving: boolean
}) {
  const [score1, setScore1] = useState(match.score_team1)
  const [score2, setScore2] = useState(match.score_team2)
  const [expanded, setExpanded] = useState(match.status !== 'finished')

  const isFinished = match.status === 'finished'

  function quickScore(s1: number, s2: number, winner: 1 | 2) {
    setScore1(s1)
    setScore2(s2)
    onSubmit(match, winner, s1, s2)
  }

  return (
    <div className={cn(
      'card-surface overflow-hidden',
      isFinished ? 'opacity-75' : 'border-neon-green/10'
    )}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{match.player1?.name.split(' ')[0]} / {match.player2?.name.split(' ')[0]}</span>
            <span className="text-muted-foreground">vs</span>
            <span className="font-medium">{match.player3?.name.split(' ')[0]} / {match.player4?.name.split(' ')[0]}</span>
          </div>
          {isFinished && (
            <p className={cn(
              'text-xs mt-0.5 font-mono font-semibold',
              match.winner_team === 1 ? 'text-neon-green' : 'text-blue-400'
            )}>
              {match.score_team1} × {match.score_team2} · {match.winner_team === 1 ? 'Dupla 1 venceu' : 'Dupla 2 venceu'}
            </p>
          )}
        </div>
        {isFinished ? (
          <CheckCircle className="w-4 h-4 text-neon-green flex-shrink-0" />
        ) : (
          <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
        )}
      </button>

      {expanded && !isFinished && (
        <div className="px-4 pb-4 space-y-4 border-t border-surface-3 pt-3">
          {/* Quick select scores */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Placar rápido — Dupla 1 venceu:</p>
            <div className="grid grid-cols-5 gap-1.5">
              {COMMON_SCORES.map(([s1, s2]) => (
                <button
                  key={`${s1}-${s2}-1`}
                  onClick={() => quickScore(s1, s2, 1)}
                  disabled={saving}
                  className="bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/20 text-neon-green text-xs py-1.5 rounded-lg font-mono transition-all disabled:opacity-50"
                >
                  {s1}×{s2}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Dupla 2 venceu:</p>
            <div className="grid grid-cols-5 gap-1.5">
              {COMMON_SCORES.map(([s1, s2]) => (
                <button
                  key={`${s1}-${s2}-2`}
                  onClick={() => quickScore(s2, s1, 2)}
                  disabled={saving}
                  className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs py-1.5 rounded-lg font-mono transition-all disabled:opacity-50"
                >
                  {s2}×{s1}
                </button>
              ))}
            </div>
          </div>

          {/* Manual score */}
          <div className="border-t border-surface-3 pt-3">
            <p className="text-xs text-muted-foreground mb-2">Placar personalizado:</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <button onClick={() => setScore1(Math.max(0, score1 - 1))} className="w-8 h-8 rounded-lg bg-surface-3 text-white text-lg">-</button>
                <span className="text-xl font-mono font-bold w-8 text-center">{score1}</span>
                <button onClick={() => setScore1(score1 + 1)} className="w-8 h-8 rounded-lg bg-surface-3 text-white text-lg">+</button>
              </div>
              <span className="text-muted-foreground">×</span>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <button onClick={() => setScore2(Math.max(0, score2 - 1))} className="w-8 h-8 rounded-lg bg-surface-3 text-white text-lg">-</button>
                <span className="text-xl font-mono font-bold w-8 text-center">{score2}</span>
                <button onClick={() => setScore2(score2 + 1)} className="w-8 h-8 rounded-lg bg-surface-3 text-white text-lg">+</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={() => onSubmit(match, 1, score1, score2)}
                disabled={saving || score1 === score2}
                className="py-2 rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-medium disabled:opacity-40 hover:bg-neon-green/20 transition-all"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Dupla 1 Venceu'}
              </button>
              <button
                onClick={() => onSubmit(match, 2, score1, score2)}
                disabled={saving || score1 === score2}
                className="py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium disabled:opacity-40 hover:bg-blue-500/20 transition-all"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Dupla 2 Venceu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
