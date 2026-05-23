'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { BarChart3, Trophy, Users, Zap, TrendingUp, Clock } from 'lucide-react'

export default function StatsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    totalTournaments: 0,
    activeNow: 0,
    totalAthletes: 0,
    totalMatches: 0,
    categoryData: [] as { name: string; value: number }[],
    tournamentMonths: [] as { month: string; count: number }[],
    topAthletes: [] as { name: string; wins: number; tournaments: number }[],
  })

  useEffect(() => {
    async function load() {
      const [tourRes, athleteRes, matchRes, rankRes] = await Promise.all([
        supabase.from('tournaments').select('status, created_at'),
        supabase.from('athletes').select('category').eq('is_active', true),
        supabase.from('matches').select('id', { count: 'exact' }).eq('status', 'finished'),
        supabase.from('tournament_rankings')
          .select('wins, matches_played, athlete:athlete_id(name)')
          .order('wins', { ascending: false })
          .limit(10),
      ])

      const tournaments = tourRes.data ?? []
      const athletes = athleteRes.data ?? []

      // Category distribution
      const catCount: Record<string, number> = {}
      athletes.forEach(a => { catCount[a.category] = (catCount[a.category] ?? 0) + 1 })
      const categoryLabels: Record<string, string> = {
        iniciante: 'Iniciante', intermediario: 'Interm.', avancado: 'Avançado', profissional: 'Prof.'
      }
      const categoryData = Object.entries(catCount).map(([k, v]) => ({
        name: categoryLabels[k] ?? k, value: v
      }))

      // Tournament months
      const monthCount: Record<string, number> = {}
      tournaments.forEach(t => {
        const m = new Date(t.created_at).toLocaleDateString('pt-BR', { month: 'short' })
        monthCount[m] = (monthCount[m] ?? 0) + 1
      })
      const tournamentMonths = Object.entries(monthCount).map(([month, count]) => ({ month, count }))

      // Top athletes
      const athleteWins: Record<string, { wins: number; tournaments: number; name: string }> = {}
      ;(rankRes.data ?? []).forEach((r: any) => {
        const name = r.athlete?.name ?? 'Desconhecido'
        if (!athleteWins[name]) athleteWins[name] = { wins: 0, tournaments: 0, name }
        athleteWins[name].wins += r.wins ?? 0
        athleteWins[name].tournaments += 1
      })
      const topAthletes = Object.values(athleteWins).sort((a, b) => b.wins - a.wins).slice(0, 8)

      setData({
        totalTournaments: tournaments.length,
        activeNow: tournaments.filter(t => t.status === 'active').length,
        totalAthletes: athletes.length,
        totalMatches: matchRes.count ?? 0,
        categoryData,
        tournamentMonths,
        topAthletes,
      })
      setLoading(false)
    }
    load()
  }, [supabase])

  const NEON_COLORS = ['#00FF88', '#00CC6A', '#60a5fa', '#a78bfa', '#fbbf24']

  const STAT_CARDS = [
    { label: 'Torneios Realizados', value: data.totalTournaments, icon: Trophy, color: 'text-neon-green' },
    { label: 'Torneios Ativos', value: data.activeNow, icon: Zap, color: 'text-yellow-400' },
    { label: 'Atletas Ativos', value: data.totalAthletes, icon: Users, color: 'text-blue-400' },
    { label: 'Partidas Disputadas', value: data.totalMatches, icon: BarChart3, color: 'text-purple-400' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold">Estatísticas</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Visão geral da plataforma</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-surface p-4">
            <Icon className={`w-5 h-5 ${color} mb-3`} />
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top athletes */}
        <div className="card-surface p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-neon-green" /> Top Atletas (Vitórias)
          </h2>
          {data.topAthletes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sem dados disponíveis</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topAthletes} layout="vertical" margin={{ left: 0 }}>
                  <XAxis type="number" stroke="#444" tick={{ fill: '#888', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" stroke="#444" tick={{ fill: '#ccc', fontSize: 10 }} width={70} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }}
                    formatter={(v) => [`${v} vitórias`, 'Vitórias']}
                  />
                  <Bar dataKey="wins" fill="#00FF88" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category distribution */}
        <div className="card-surface p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> Atletas por Categoria
          </h2>
          {data.categoryData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sem dados disponíveis</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="h-36 w-36 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.categoryData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                      {data.categoryData.map((_, i) => (
                        <Cell key={i} fill={NEON_COLORS[i % NEON_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                {data.categoryData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: NEON_COLORS[i % NEON_COLORS.length] }} />
                      <span className="text-xs text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="text-xs font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tournament activity */}
      {data.tournamentMonths.length > 0 && (
        <div className="card-surface p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" /> Torneios por Mês
          </h2>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.tournamentMonths}>
                <XAxis dataKey="month" stroke="#444" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis stroke="#444" tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }}
                />
                <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
