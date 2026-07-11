'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Tournament } from '@/types/database'
import { cn } from '@/lib/utils'
import { ArrowLeft, UserCheck, UserX, QrCode, Search, CheckCircle, Clock } from 'lucide-react'
import dynamic from 'next/dynamic'

const QRCodeDisplay = dynamic(() => import('@/components/shared/QRCodeDisplay'), { ssr: false })

interface AthleteEntry {
  id: string
  athlete_id: string
  checked_in: boolean
  checked_in_at: string | null
  athlete: { id: string; name: string; phone: string | null; category: string }
}

export default function CheckinPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [entries, setEntries] = useState<AthleteEntry[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)

  const checkinUrl = typeof window !== 'undefined' ? `${window.location.origin}/checkin/${id}` : ''

  const load = useCallback(async () => {
    const [tRes, eRes] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('tournament_athletes')
        .select('id, athlete_id, checked_in, checked_in_at, athlete:athletes(id,name,phone,category)')
        .eq('tournament_id', id)
        .order('checked_in', { ascending: false }),
    ])
    setTournament(tRes.data)
    setEntries((eRes.data ?? []) as AthleteEntry[])
    setLoading(false)
  }, [id, supabase])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const channel = supabase
      .channel(`checkin-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_athletes', filter: `tournament_id=eq.${id}` }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id, supabase, load])

  async function toggleCheckin(entry: AthleteEntry) {
    const newVal = !entry.checked_in
    await supabase.from('tournament_athletes').update({
      checked_in: newVal,
      checked_in_at: newVal ? new Date().toISOString() : null,
    }).eq('id', entry.id)
  }

  async function checkInAll() {
    const now = new Date().toISOString()
    await supabase.from('tournament_athletes')
      .update({ checked_in: true, checked_in_at: now })
      .eq('tournament_id', id)
    load()
  }

  const filtered = entries.filter(e =>
    e.athlete?.name?.toLowerCase().includes(search.toLowerCase())
  )
  const checkedCount = entries.filter(e => e.checked_in).length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/tournaments/${id}`} className="text-muted-foreground hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold">Check-in</h1>
            <p className="text-xs text-muted-foreground">{tournament?.name}</p>
          </div>
        </div>
        <button onClick={() => setShowQR(!showQR)}
          className={cn('p-2 rounded-lg border transition-colors',
            showQR ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-surface-2 border-surface-4 text-muted-foreground hover:text-white')}>
          <QrCode className="w-4 h-4" />
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-surface p-3 text-center">
          <p className="text-2xl font-bold text-neon-green">{checkedCount}</p>
          <p className="text-xs text-muted-foreground">Presentes</p>
        </div>
        <div className="card-surface p-3 text-center">
          <p className="text-2xl font-bold">{entries.length - checkedCount}</p>
          <p className="text-xs text-muted-foreground">Aguardando</p>
        </div>
        <div className="card-surface p-3 text-center">
          <p className="text-2xl font-bold">{entries.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>

      {/* Progress */}
      <div className="card-surface p-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-muted-foreground">Progresso do check-in</span>
          <span className="font-bold text-neon-green">{entries.length > 0 ? Math.round((checkedCount / entries.length) * 100) : 0}%</span>
        </div>
        <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
          <div className="h-full bg-neon-green rounded-full transition-all duration-500"
            style={{ width: `${entries.length > 0 ? (checkedCount / entries.length) * 100 : 0}%` }} />
        </div>
      </div>

      {/* QR Code for self check-in */}
      {showQR && (
        <div className="card-surface p-5 text-center space-y-3">
          <p className="text-sm font-semibold">QR Code — Check-in Próprio</p>
          <p className="text-xs text-muted-foreground">Atletas escaneiam para fazer seu próprio check-in</p>
          <div className="flex justify-center">
            <QRCodeDisplay url={checkinUrl} size={160} />
          </div>
          <p className="text-xs text-muted-foreground break-all">{checkinUrl}</p>
        </div>
      )}

      {/* Search and actions */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar atleta..."
            className="input-field pl-9 w-full"
          />
        </div>
        <button onClick={checkInAll}
          className="px-3 py-2 rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-semibold whitespace-nowrap hover:bg-neon-green/20">
          Marcar todos
        </button>
      </div>

      {/* Athlete list */}
      <div className="card-surface divide-y divide-surface-3 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhum atleta encontrado</p>
        ) : (
          filtered.map(entry => (
            <div key={entry.id}
              className={cn('flex items-center gap-3 px-4 py-3 transition-colors',
                entry.checked_in ? 'bg-neon-green/5' : '')}>
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                entry.checked_in ? 'bg-neon-green/20 text-neon-green' : 'bg-surface-3 text-muted-foreground')}>
                {entry.checked_in ? <UserCheck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', entry.checked_in ? 'text-white' : 'text-muted-foreground')}>
                  {entry.athlete?.name}
                </p>
                {entry.checked_in && entry.checked_in_at && (
                  <p className="text-xs text-neon-green/70">
                    {new Date(entry.checked_in_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              <button onClick={() => toggleCheckin(entry)}
                className={cn('p-2 rounded-lg border text-xs font-medium transition-all',
                  entry.checked_in
                    ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                    : 'bg-neon-green/10 border-neon-green/30 text-neon-green hover:bg-neon-green/20')}>
                {entry.checked_in ? <UserX className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
