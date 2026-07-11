'use client'

// Match timer with alarm — shows elapsed time per match
// Plays audio alert when time limit is reached

import { useState, useEffect, useRef } from 'react'
import { Clock, Bell, BellOff, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MatchTimerProps {
  matchId: string
  durationMinutes?: number
  startedAt?: string | null
  compact?: boolean
}

export default function MatchTimer({ matchId, durationMinutes = 30, startedAt, compact = false }: MatchTimerProps) {
  const [elapsed, setElapsed] = useState(0)
  const [alarmEnabled, setAlarmEnabled] = useState(true)
  const [alarmFired, setAlarmFired] = useState(false)
  const [manualStart, setManualStart] = useState<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const startMs = startedAt
    ? new Date(startedAt).getTime()
    : manualStart

  useEffect(() => {
    if (!startMs) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMs) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startMs])

  const limitSeconds = durationMinutes * 60
  const over = elapsed >= limitSeconds
  const pct = Math.min((elapsed / limitSeconds) * 100, 100)

  // Play alarm when time is up
  useEffect(() => {
    if (over && alarmEnabled && !alarmFired && startMs) {
      setAlarmFired(true)
      playBeep()
    }
  }, [over, alarmEnabled, alarmFired, startMs])

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioCtxRef.current = ctx
      ;[0, 0.3, 0.6].forEach(delay => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.5, ctx.currentTime + delay)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25)
        osc.start(ctx.currentTime + delay)
        osc.stop(ctx.currentTime + delay + 0.25)
      })
    } catch {}
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  if (compact) {
    return (
      <span className={cn('font-mono text-sm font-bold', over ? 'text-red-400 animate-pulse' : 'text-neon-green')}>
        {startMs ? formatTime(elapsed) : '--:--'}
      </span>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={cn('w-4 h-4', over ? 'text-red-400' : 'text-neon-green')} />
          <span className={cn('font-mono text-2xl font-black tabular-nums', over ? 'text-red-400' : 'text-white')}>
            {startMs ? formatTime(elapsed) : '--:--'}
          </span>
          {over && <span className="text-xs text-red-400 font-bold animate-pulse">TEMPO!</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setAlarmEnabled(!alarmEnabled)}
            className={cn('p-1.5 rounded-lg', alarmEnabled ? 'text-neon-green' : 'text-muted-foreground')}>
            {alarmEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
          {!startedAt && (
            <button onClick={() => { setManualStart(Date.now()); setAlarmFired(false) }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-white">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-1000', over ? 'bg-red-500' : 'bg-neon-green')}
          style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">Limite: {durationMinutes} min</p>
    </div>
  )
}
