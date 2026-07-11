'use client'

// Public self-registration page — athletes sign themselves up
// No admin needed. Share the link or QR code.

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Tournament } from '@/types/database'
import { formatDate, formatTime } from '@/lib/utils'
import {
  Trophy, Calendar, MapPin, Clock, Users, CheckCircle,
  Loader2, Phone, User, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 'info' | 'form' | 'success'

export default function JoinTournamentPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [enrolledCount, setEnrolledCount] = useState(0)
  const [step, setStep] = useState<Step>('info')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    phone: '',
    category: 'intermediario',
    gender: '',
  })

  useEffect(() => {
    Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('tournament_athletes').select('id', { count: 'exact' }).eq('tournament_id', id),
    ]).then(([tRes, cRes]) => {
      setTournament(tRes.data)
      setEnrolledCount(cRes.count ?? 0)
    })
  }, [id, supabase])

  const spotsLeft = (tournament?.num_players ?? 0) - enrolledCount
  const isFull = spotsLeft <= 0
  const isOpen = tournament?.status === 'draft' || tournament?.status === 'setup'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Find or create athlete by phone
      let athleteId: string

      const { data: existing } = await supabase
        .from('athletes')
        .select('id')
        .eq('phone', form.phone)
        .single()

      if (existing) {
        athleteId = existing.id
      } else {
        const { data: newAthlete, error: createErr } = await supabase
          .from('athletes')
          .insert({
            name: form.name,
            phone: form.phone || null,
            category: form.category as any,
            gender: form.gender as any || null,
            is_active: true,
          })
          .select('id')
          .single()

        if (createErr || !newAthlete) throw createErr ?? new Error('Erro ao criar atleta')
        athleteId = newAthlete.id
      }

      // Check if already enrolled
      const { data: alreadyIn } = await supabase
        .from('tournament_athletes')
        .select('id')
        .eq('tournament_id', id)
        .eq('athlete_id', athleteId)
        .single()

      if (alreadyIn) {
        setStep('success')
        return
      }

      // Enroll
      const { error: enrollErr } = await supabase
        .from('tournament_athletes')
        .insert({ tournament_id: id, athlete_id: athleteId, status: 'confirmed' })

      if (enrollErr) throw enrollErr

      setEnrolledCount(c => c + 1)
      setStep('success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao realizar inscrição')
    } finally {
      setLoading(false)
    }
  }

  if (!tournament) return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      {/* Header */}
      <div className="bg-surface-1 border-b border-surface-3 px-4 py-3 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-neon-green" />
        <span className="text-sm font-bold">Langolandia</span>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full px-4 py-6 space-y-5">

        {step === 'success' ? (
          <div className="flex flex-col items-center justify-center min-h-64 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-neon-green/10 border-2 border-neon-green/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-neon-green" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Inscrição Confirmada!</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Você está inscrito em <span className="text-white font-medium">{tournament.name}</span>
              </p>
            </div>
            <div className="card-surface p-4 w-full text-left space-y-2 text-sm">
              <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-neon-green" /> {formatDate(tournament.date)}</p>
              {tournament.start_time && <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-neon-green" /> {formatTime(tournament.start_time)}</p>}
              {tournament.location && <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-neon-green" /> {tournament.location}</p>}
            </div>
            <a href={`/t/${id}`} className="w-full btn-neon rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2">
              Acompanhar ao vivo <ChevronRight className="w-4 h-4" />
            </a>
          </div>

        ) : step === 'info' ? (
          <>
            {/* Tournament card */}
            <div className="card-surface p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 text-neon-green" />
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-tight">{tournament.name}</h1>
                  {tournament.description && <p className="text-sm text-muted-foreground mt-0.5">{tournament.description}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" /> {formatDate(tournament.date)}
                </div>
                {tournament.start_time && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" /> {formatTime(tournament.start_time)}
                  </div>
                )}
                {tournament.location && (
                  <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                    <MapPin className="w-3.5 h-3.5" /> {tournament.location}
                  </div>
                )}
              </div>

              {/* Spots progress */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Vagas</span>
                  <span className={cn('font-bold', isFull ? 'text-red-400' : 'text-neon-green')}>
                    {enrolledCount}/{tournament.num_players} {isFull ? '— LOTADO' : `— ${spotsLeft} restante${spotsLeft !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', isFull ? 'bg-red-500' : 'bg-neon-green')}
                    style={{ width: `${(enrolledCount / tournament.num_players) * 100}%` }} />
                </div>
              </div>
            </div>

            {!isOpen ? (
              <div className="card-surface p-4 text-center">
                <p className="text-muted-foreground text-sm">Inscrições {tournament.status === 'active' ? 'encerradas — torneio em andamento' : 'não disponíveis'}</p>
                <a href={`/t/${id}`} className="text-neon-green text-sm mt-2 inline-flex items-center gap-1">
                  Acompanhar ao vivo <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            ) : isFull ? (
              <div className="card-surface p-4 text-center border-red-500/20">
                <p className="text-red-400 font-medium text-sm">Torneio lotado</p>
                <p className="text-muted-foreground text-xs mt-1">Todas as vagas foram preenchidas</p>
              </div>
            ) : (
              <button
                onClick={() => setStep('form')}
                className="w-full btn-neon rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                Fazer Inscrição <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </>

        ) : (
          /* FORM step */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="text-lg font-bold">Seus dados</h2>
              <p className="text-sm text-muted-foreground">Inscrição em {tournament.name}</p>
            </div>

            <div className="card-surface p-5 space-y-4">
              <div>
                <label className="label-field">Nome completo *</label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Seu nome" required className="input-field pl-10" />
                </div>
              </div>

              <div>
                <label className="label-field">WhatsApp *</label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(00) 00000-0000" required className="input-field pl-10" />
                </div>
              </div>

              <div>
                <label className="label-field">Nível</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {[['iniciante','Iniciante'],['intermediario','Intermediário'],['avancado','Avançado'],['profissional','Profissional']].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setForm(f => ({ ...f, category: v }))}
                      className={cn('py-2 rounded-lg border text-xs font-medium transition-all',
                        form.category === v ? 'bg-neon-green/10 border-neon-green/40 text-neon-green' : 'bg-surface-3 border-surface-4 text-muted-foreground hover:border-white/20')}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-field">Sexo</label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {[['masculino','Masc.'],['feminino','Fem.'],['misto','Misto']].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setForm(f => ({ ...f, gender: v }))}
                      className={cn('py-2 rounded-lg border text-xs font-medium transition-all',
                        form.gender === v ? 'bg-neon-green/10 border-neon-green/40 text-neon-green' : 'bg-surface-3 border-surface-4 text-muted-foreground hover:border-white/20')}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading || !form.name || !form.phone}
              className="w-full btn-neon rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Confirmar Inscrição
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
