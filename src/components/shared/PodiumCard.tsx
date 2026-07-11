'use client'

// Shareable podium card — renders a 9:16 story-ready layout
// Use html2canvas or browser Print to Screenshot to save as image

import { useRef } from 'react'
import { Trophy, Printer } from 'lucide-react'

interface PodiumEntry {
  position: number
  name: string
  points: number
  wins: number
  losses: number
}

interface PodiumCardProps {
  tournamentName: string
  date: string
  top3: PodiumEntry[]
}

export default function PodiumCard({ tournamentName, date, top3 }: PodiumCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  function downloadImage() {
    // Use browser screenshot shortcut or print dialog
    window.print()
  }

  const medals = ['🥇', '🥈', '🥉']
  const colors = [
    { bg: 'from-yellow-500/20 to-yellow-600/5', border: 'border-yellow-500/40', text: 'text-yellow-400' },
    { bg: 'from-slate-400/20 to-slate-500/5', border: 'border-slate-400/30', text: 'text-slate-300' },
    { bg: 'from-amber-600/20 to-amber-700/5', border: 'border-amber-600/30', text: 'text-amber-500' },
  ]

  return (
    <div className="space-y-3">
      <button onClick={downloadImage}
        className="w-full flex items-center justify-center gap-2 bg-surface-3 hover:bg-surface-4 border border-surface-4 rounded-xl py-2.5 text-sm text-muted-foreground hover:text-white transition-colors">
        <Printer className="w-4 h-4" /> Imprimir / Salvar como imagem
      </button>

      {/* Story card */}
      <div ref={cardRef}
        className="relative w-full rounded-2xl overflow-hidden bg-[#0A0A0A] border border-surface-3"
        style={{ aspectRatio: '9/16', maxHeight: 540 }}>

        {/* Background grid */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(#00FF88 1px, transparent 1px), linear-gradient(90deg, #00FF88 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Neon glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: '#00FF88' }} />

        <div className="relative flex flex-col h-full px-6 py-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-neon-green" />
              <span className="text-neon-green font-bold text-sm uppercase tracking-widest">Pódio Final</span>
              <Trophy className="w-5 h-5 text-neon-green" />
            </div>
            <h2 className="text-white font-black text-xl leading-tight">{tournamentName}</h2>
            <p className="text-muted-foreground text-xs mt-1">{date}</p>
          </div>

          {/* Podium entries */}
          <div className="flex-1 flex flex-col justify-center gap-3">
            {top3.map((entry, idx) => (
              <div key={entry.position}
                className={`bg-gradient-to-r ${colors[idx].bg} border ${colors[idx].border} rounded-2xl p-4 flex items-center gap-4`}>
                <div className="text-4xl leading-none">{medals[idx]}</div>
                <div className="flex-1">
                  <p className={`font-black text-lg leading-tight ${colors[idx].text}`}>{entry.name}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{entry.wins}V · {entry.losses}D · {entry.points}pts</p>
                </div>
                <div className={`text-3xl font-black ${colors[idx].text}`}>#{entry.position}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="h-px flex-1 bg-surface-3" />
            <span className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Langolandia</span>
            <div className="h-px flex-1 bg-surface-3" />
          </div>
          <p className="text-center text-[10px] text-muted-foreground/50 mt-1">Beach Tennis Super 8</p>
        </div>
      </div>
    </div>
  )
}
