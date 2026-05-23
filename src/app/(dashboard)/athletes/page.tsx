'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Athlete } from '@/types/database'
import { cn, getInitials, getCategoryLabel } from '@/lib/utils'
import { Users, Plus, Search, Phone, MapPin, ChevronRight, Filter } from 'lucide-react'

const CATEGORIES = ['all', 'iniciante', 'intermediario', 'avancado', 'profissional'] as const

export default function AthletesPage() {
  const supabase = createClient()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [filtered, setFiltered] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')

  useEffect(() => {
    supabase.from('athletes').select('*').eq('is_active', true).order('name')
      .then(({ data }) => { setAthletes(data ?? []); setFiltered(data ?? []); setLoading(false) })
  }, [supabase])

  useEffect(() => {
    let list = athletes
    if (category !== 'all') list = list.filter(a => a.category === category)
    if (search) list = list.filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.phone?.includes(search) ||
      a.arena_origin?.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(list)
  }, [athletes, search, category])

  const categoryColors: Record<string, string> = {
    iniciante: 'text-green-400 bg-green-400/10',
    intermediario: 'text-blue-400 bg-blue-400/10',
    avancado: 'text-purple-400 bg-purple-400/10',
    profissional: 'text-yellow-400 bg-yellow-400/10',
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Atletas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{athletes.length} cadastrado{athletes.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/athletes/new" className="btn-neon rounded-xl px-4 py-2 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo</span>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome, telefone, arena..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-surface-2 border border-surface-4 focus:border-neon-green/40 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-colors"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border',
              category === c
                ? 'bg-neon-green/10 text-neon-green border-neon-green/30'
                : 'bg-surface-2 text-muted-foreground border-surface-4 hover:text-white'
            )}
          >
            {c === 'all' ? 'Todos' : getCategoryLabel(c)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => <div key={i} className="card-surface h-16 animate-pulse bg-surface-3" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum atleta encontrado</p>
          <Link href="/athletes/new" className="btn-neon rounded-lg px-4 py-2 text-sm mt-4 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Cadastrar atleta
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(athlete => (
            <Link
              key={athlete.id}
              href={`/athletes/${athlete.id}`}
              className="card-surface-hover flex items-center gap-3 p-3.5 group"
            >
              {athlete.photo_url ? (
                <img src={athlete.photo_url} alt={athlete.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center text-sm font-bold text-neon-green flex-shrink-0">
                  {getInitials(athlete.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{athlete.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', categoryColors[athlete.category])}>
                    {getCategoryLabel(athlete.category)}
                  </span>
                  {athlete.phone && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {athlete.phone}
                    </span>
                  )}
                  {athlete.arena_origin && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {athlete.arena_origin}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
