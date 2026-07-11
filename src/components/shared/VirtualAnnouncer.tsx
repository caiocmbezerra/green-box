'use client'

// Locutor Virtual — Text-to-speech announcements for courts
// Calls players to their court using Web Speech API

import { useState, useCallback } from 'react'
import { Volume2, VolumeX, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnnouncerProps {
  matches: Array<{
    id: string
    courtNumber: number | string
    player1: string
    player2: string
    player3: string
    player4: string
  }>
}

export default function VirtualAnnouncer({ matches }: AnnouncerProps) {
  const [announcing, setAnnouncing] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(true)

  const speak = useCallback((text: string, matchId: string) => {
    if (!enabled || !window.speechSynthesis) return

    window.speechSynthesis.cancel()
    setAnnouncing(matchId)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.85
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Try to use a Portuguese voice
    const voices = window.speechSynthesis.getVoices()
    const ptVoice = voices.find(v => v.lang.startsWith('pt')) ?? voices[0]
    if (ptVoice) utterance.voice = ptVoice

    utterance.onend = () => setAnnouncing(null)
    utterance.onerror = () => setAnnouncing(null)

    window.speechSynthesis.speak(utterance)
  }, [enabled])

  function announceMatch(match: AnnouncerProps['matches'][0]) {
    const text = `Atenção! ${match.player1} e ${match.player2} contra ${match.player3} e ${match.player4}. Quadra ${match.courtNumber}. Por favor, se dirijam à quadra ${match.courtNumber}.`
    speak(text, match.id)
  }

  function announceAll() {
    if (matches.length === 0) return
    const texts = matches.map(m =>
      `Quadra ${m.courtNumber}: ${m.player1} e ${m.player2} contra ${m.player3} e ${m.player4}.`
    )
    const full = `Atenção atletas! ${texts.join(' ')} Por favor, se dirijam às suas quadras.`
    speak(full, 'all')
  }

  if (!('speechSynthesis' in window) && typeof window !== 'undefined') {
    return null
  }

  return (
    <div className="card-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-neon-green" />
          <span className="text-sm font-semibold">Locutor Virtual</span>
        </div>
        <button
          onClick={() => { setEnabled(!enabled); window.speechSynthesis?.cancel() }}
          className={cn('p-1.5 rounded-lg transition-colors', enabled ? 'text-neon-green' : 'text-muted-foreground')}
        >
          {enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {matches.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma partida ativa para anunciar</p>
      ) : (
        <div className="space-y-2">
          <button
            onClick={announceAll}
            disabled={!enabled || announcing !== null}
            className="w-full bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/30 text-neon-green text-xs font-semibold py-2.5 rounded-lg transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {announcing === 'all' ? (
              <><span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" /> Anunciando...</>
            ) : (
              <><Volume2 className="w-3.5 h-3.5" /> Anunciar todas as quadras</>
            )}
          </button>

          <div className="space-y-1.5">
            {matches.map(m => (
              <button
                key={m.id}
                onClick={() => announceMatch(m)}
                disabled={!enabled || announcing !== null}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg border text-xs transition-all disabled:opacity-40',
                  announcing === m.id
                    ? 'bg-neon-green/15 border-neon-green/40 text-neon-green'
                    : 'bg-surface-3 border-surface-4 text-muted-foreground hover:text-white hover:border-white/20'
                )}
              >
                <div className="flex items-center justify-between">
                  <span>
                    <span className="text-white font-medium">Quadra {m.courtNumber}</span>
                    {' · '}{m.player1}/{m.player2} vs {m.player3}/{m.player4}
                  </span>
                  {announcing === m.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
