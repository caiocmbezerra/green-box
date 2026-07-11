'use client'

// Public self-check-in page — athlete enters phone to confirm presence
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Tournament } from '@/types/database'
import { UserCheck, Phone, Loader2, CheckCircle, Trophy, AlertCircle } from 'lucide-react'

export default function PublicCheckinPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<'success' | 'not_found' | null>(null)
  const [athleteName, setAthleteName] = useState('')

  useEffect(() => {
    supabase.from('tournaments').select('*').eq('id', id).single()
      .then(({ data }) => setTournament(data))
  }, [id, supabase])

  async function handleCheckin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const cleaned = phone.replace(/\D/g, '')

    const { data: athlete } = await supabase
      .from('athletes')
      .select('id, name')
      .eq('phone', cleaned)
      .single()

    if (!athlete) {
      setResult('not_found')
      setLoading(false)
      return
    }

    const { data: entry } = await supabase
      .from('tournament_athletes')
      .select('id')
      .eq('tournament_id', id)
      .eq('athlete_id', athlete.id)
      .single()

    if (!entry) {
      setResult('not_found')
      setLoading(false)
      return
    }

    await supabase.from('tournament_athletes').update({
      checked_in: true,
      checked_in_at: new Date().toISOString(),
    }).eq('id', entry.id)

    setAthleteName(athlete.name)
    setResult('success')
    setLoading(false)
  }

  if (!tournament) return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <div className="bg-surface-1 border-b border-surface-3 px-4 py-3 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-neon-green" />
        <span className="text-sm font-bold">Langolandia</span>
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full px-4 py-10 space-y-6">
        {result === 'success' ? (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-neon-green/10 border-2 border-neon-green/40 flex items-center justify-center mx-auto">
              <UserCheck className="w-10 h-10 text-neon-green" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neon-green">Check-in feito!</h2>
              <p className="text-white font-medium mt-1">{athleteName}</p>
              <p className="text-muted-foreground text-sm mt-2">
                Sua presença em <strong className="text-white">{tournament.name}</strong> foi confirmada.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Aguarde o início das partidas. Boa sorte!</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-7 h-7 text-neon-green" />
              </div>
              <h1 className="text-xl font-bold">Check-in</h1>
              <p className="text-sm text-muted-foreground mt-1">{tournament.name}</p>
            </div>

            <form onSubmit={handleCheckin} className="space-y-4">
              <div>
                <label className="label-field">Seu número de WhatsApp</label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    required
                    className="input-field pl-10 w-full"
                  />
                </div>
              </div>

              {result === 'not_found' && (
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Número não encontrado. Verifique se usou o mesmo WhatsApp da inscrição.
                </div>
              )}

              <button type="submit" disabled={loading || !phone}
                className="w-full btn-neon rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirmar presença
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
