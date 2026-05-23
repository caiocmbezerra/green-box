'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Trophy, Save, Loader2, Info } from 'lucide-react'
import Link from 'next/link'
import { getTotalRounds } from '@/lib/algorithms/super8'

const TIEBREAK_OPTIONS = [
  { key: 'wins', label: '1. Vitórias' },
  { key: 'game_diff', label: '2. Saldo de Games' },
  { key: 'games_pro', label: '3. Games Pró' },
  { key: 'head_to_head', label: '4. Confronto Direto' },
  { key: 'draw', label: '5. Sorteio' },
]

export default function NewTournamentPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    date: '',
    start_time: '',
    location: '',
    num_courts: 2,
    num_players: 8,
    format: 'super8',
    match_format: '6games',
    match_duration_minutes: 30,
  })

  function update(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }))
  }

  const totalRounds = getTotalRounds(form.format)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: tournament, error: err } = await supabase
        .from('tournaments')
        .insert({
          ...form,
          num_players: Number(form.num_players),
          num_courts: Number(form.num_courts),
          match_duration_minutes: Number(form.match_duration_minutes),
          tiebreak_criteria: ['wins', 'game_diff', 'games_pro', 'head_to_head', 'draw'],
          status: 'draft',
          current_round: 0,
          total_rounds: totalRounds,
          created_by: user.id,
        })
        .select()
        .single()

      if (err) throw err

      // Create courts
      const courts = Array.from({ length: form.num_courts }, (_, i) => ({
        tournament_id: tournament.id,
        number: i + 1,
        name: `Quadra ${i + 1}`,
        status: 'available' as const,
      }))
      await supabase.from('courts').insert(courts)

      router.push(`/tournaments/${tournament.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar torneio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <Link href="/tournaments" className="text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Novo Torneio</h1>
          <p className="text-sm text-muted-foreground">Configure o Super 8</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="card-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Informações Básicas
          </h2>

          <div>
            <label className="label-field">Nome do Torneio *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Ex: Super 8 Copa Sementes #1"
              required
              className="input-field mt-1.5"
            />
          </div>

          <div>
            <label className="label-field">Descrição</label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Detalhes do torneio..."
              rows={2}
              className="input-field mt-1.5 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Data *</label>
              <input type="date" value={form.date} onChange={e => update('date', e.target.value)} required className="input-field mt-1.5" />
            </div>
            <div>
              <label className="label-field">Horário</label>
              <input type="time" value={form.start_time} onChange={e => update('start_time', e.target.value)} className="input-field mt-1.5" />
            </div>
          </div>

          <div>
            <label className="label-field">Local</label>
            <input
              type="text"
              value={form.location}
              onChange={e => update('location', e.target.value)}
              placeholder="Arena, Clube, Endereço..."
              className="input-field mt-1.5"
            />
          </div>
        </div>

        {/* Format */}
        <div className="card-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Formato
          </h2>

          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'super8', label: 'Super 8', sub: '8 atletas · 7 rodadas' },
              { value: 'super8_12', label: 'Super 8', sub: '12 atletas · 11 rodadas' },
              { value: 'super8_16', label: 'Super 8', sub: '16 atletas · 15 rodadas' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  update('format', opt.value)
                  update('num_players', opt.value === 'super8' ? 8 : opt.value === 'super8_12' ? 12 : 16)
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  form.format === opt.value
                    ? 'bg-neon-green/10 border-neon-green/40 text-white'
                    : 'bg-surface-3 border-surface-4 text-muted-foreground hover:border-white/20'
                }`}
              >
                <p className="text-sm font-semibold">{opt.label}</p>
                <p className="text-xs mt-0.5">{opt.sub}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Quadras</label>
              <select value={form.num_courts} onChange={e => update('num_courts', Number(e.target.value))} className="input-field mt-1.5">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n} quadra{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Atletas</label>
              <input type="number" value={form.num_players} readOnly className="input-field mt-1.5 opacity-60 cursor-not-allowed" />
            </div>
          </div>

          {/* Match format */}
          <div>
            <label className="label-field">Formato da Partida</label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {[
                { value: '1game', label: '1 Game' },
                { value: '4games', label: '4 Games' },
                { value: '6games', label: '6 Games' },
                { value: 'fixed_time', label: 'Tempo Fixo' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('match_format', opt.value)}
                  className={`py-2 rounded-lg border text-sm transition-all ${
                    form.match_format === opt.value
                      ? 'bg-neon-green/10 border-neon-green/40 text-neon-green'
                      : 'bg-surface-3 border-surface-4 text-muted-foreground hover:border-white/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {form.match_format === 'fixed_time' && (
            <div>
              <label className="label-field">Tempo por partida (minutos)</label>
              <input
                type="number"
                value={form.match_duration_minutes}
                onChange={e => update('match_duration_minutes', Number(e.target.value))}
                min={5} max={120} step={5}
                className="input-field mt-1.5"
              />
            </div>
          )}
        </div>

        {/* Tiebreak Info */}
        <div className="card-surface p-5">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Critérios de Desempate</p>
              <div className="mt-2 space-y-1">
                {TIEBREAK_OPTIONS.map(t => (
                  <p key={t.key} className="text-xs text-muted-foreground">{t.label}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="card-surface p-4 border-neon-green/20">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-neon-green" />
            <span className="text-sm font-medium">Resumo do Torneio</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-neon-green">{form.num_players}</p>
              <p className="text-xs text-muted-foreground">Atletas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{totalRounds}</p>
              <p className="text-xs text-muted-foreground">Rodadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{form.num_courts}</p>
              <p className="text-xs text-muted-foreground">Quadras</p>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !form.name || !form.date}
          className="w-full btn-neon rounded-xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Criar Torneio
        </button>
      </form>
    </div>
  )
}
