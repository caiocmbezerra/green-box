'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Tournament, Athlete, TournamentAthlete } from '@/types/database'
import { cn, getInitials, getCategoryLabel } from '@/lib/utils'
import { ArrowLeft, Search, Plus, X, CheckCircle, Users, Loader2 } from 'lucide-react'

export default function TournamentSetupPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([])
  const [enrolled, setEnrolled] = useState<TournamentAthlete[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => { load() }, [id])

  async function load() {
    const [tRes, aRes, eRes] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('athletes').select('*').eq('is_active', true).order('name'),
      supabase.from('tournament_athletes').select('*').eq('tournament_id', id),
    ])
    setTournament(tRes.data)
    setAllAthletes(aRes.data ?? [])
    setEnrolled(eRes.data ?? [])
    setLoading(false)
  }

  const enrolledIds = new Set(enrolled.map(e => e.athlete_id))
  const filtered = allAthletes.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.phone?.includes(search)
  )

  async function toggleAthlete(athlete: Athlete) {
    setSaving(athlete.id)
    if (enrolledIds.has(athlete.id)) {
      const entry = enrolled.find(e => e.athlete_id === athlete.id)
      if (entry) {
        await supabase.from('tournament_athletes').delete().eq('id', entry.id)
        setEnrolled(prev => prev.filter(e => e.athlete_id !== athlete.id))
      }
    } else {
      if (tournament && enrolled.length >= tournament.num_players) {
        alert(`Máximo de ${tournament.num_players} atletas atingido.`)
        setSaving(null)
        return
      }
      const { data } = await supabase.from('tournament_athletes').insert({
        tournament_id: id,
        athlete_id: athlete.id,
        status: 'confirmed',
      }).select().single()
      if (data) setEnrolled(prev => [...prev, data])
    }
    setSaving(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <Link href={`/tournaments/${id}`} className="text-muted-foreground hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Inscrição de Atletas</h1>
          <p className="text-sm text-muted-foreground">{tournament?.name}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="card-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-neon-green" />
            <span className="text-sm font-medium">Atletas inscritos</span>
          </div>
          <span className={cn(
            'text-sm font-bold',
            enrolled.length === tournament?.num_players ? 'text-neon-green' : 'text-white'
          )}>
            {enrolled.length} / {tournament?.num_players}
          </span>
        </div>
        <div className="w-full bg-surface-3 rounded-full h-2">
          <div
            className="bg-neon-green h-2 rounded-full transition-all duration-500"
            style={{ width: `${((enrolled.length) / (tournament?.num_players ?? 8)) * 100}%` }}
          />
        </div>
        {enrolled.length === tournament?.num_players && (
          <p className="text-xs text-neon-green mt-2 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Pronto para iniciar o torneio
          </p>
        )}
      </div>

      {/* Enrolled list */}
      {enrolled.length > 0 && (
        <div className="card-surface overflow-hidden">
          <div className="p-4 border-b border-surface-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Inscritos
            </p>
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {enrolled.map(e => {
              const a = allAthletes.find(at => at.id === e.athlete_id)
              return a ? (
                <div key={e.id} className="flex items-center gap-2 bg-neon-green/10 border border-neon-green/20 rounded-full px-3 py-1.5">
                  <div className="w-5 h-5 rounded-full bg-neon-green/20 flex items-center justify-center text-[10px] font-bold text-neon-green">
                    {a.name.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-neon-green">{a.name.split(' ')[0]}</span>
                  <button onClick={() => toggleAthlete(a)} className="text-neon-green/60 hover:text-red-400 ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Search athletes */}
      <div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar atleta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-2 border border-surface-4 focus:border-neon-green/40 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-colors"
          />
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">{filtered.length} atletas</p>
          <Link href="/athletes/new" className="text-xs text-neon-green flex items-center gap-1">
            <Plus className="w-3 h-3" /> Novo atleta
          </Link>
        </div>

        <div className="space-y-2">
          {filtered.map(athlete => {
            const isEnrolled = enrolledIds.has(athlete.id)
            const isSaving = saving === athlete.id

            return (
              <button
                key={athlete.id}
                onClick={() => toggleAthlete(athlete)}
                disabled={isSaving}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                  isEnrolled
                    ? 'bg-neon-green/5 border-neon-green/30'
                    : 'bg-surface-2 border-surface-4 hover:border-white/20'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                  isEnrolled ? 'bg-neon-green/20 text-neon-green' : 'bg-surface-3 text-muted-foreground'
                )}>
                  {getInitials(athlete.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{athlete.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground capitalize">{getCategoryLabel(athlete.category)}</span>
                    {athlete.arena_origin && (
                      <span className="text-xs text-muted-foreground">· {athlete.arena_origin}</span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : isEnrolled ? (
                    <div className="w-6 h-6 rounded-full bg-neon-green flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-surface-0" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-surface-4 flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <Link
        href={`/tournaments/${id}`}
        className={cn(
          'w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all',
          enrolled.length === tournament?.num_players
            ? 'btn-neon'
            : 'bg-surface-3 border border-surface-4 text-muted-foreground'
        )}
      >
        <CheckCircle className="w-4 h-4" />
        {enrolled.length === tournament?.num_players ? 'Concluir inscrições' : `Aguardando ${(tournament?.num_players ?? 0) - enrolled.length} atletas`}
      </Link>
    </div>
  )
}
