import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatTime(time: string): string {
  return time.substring(0, 5)
}

export function formatDateTime(date: string): string {
  const d = new Date(date)
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}

export function formatScore(score1: number, score2: number): string {
  return `${score1} x ${score2}`
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Rascunho',
    setup: 'Configurando',
    active: 'Em Andamento',
    finished: 'Finalizado',
    cancelled: 'Cancelado',
    pending: 'Aguardando',
    in_use: 'Em Uso',
    available: 'Disponível',
    maintenance: 'Manutenção',
  }
  return labels[status] ?? status
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    iniciante: 'Iniciante',
    intermediario: 'Intermediário',
    avancado: 'Avançado',
    profissional: 'Profissional',
  }
  return labels[category] ?? category
}

export function getFormatLabel(format: string): string {
  const labels: Record<string, string> = {
    super8: 'Super 8 (8 atletas)',
    super8_12: 'Super 8 (12 atletas)',
    super8_16: 'Super 8 (16 atletas)',
    '1game': '1 Game',
    '4games': '4 Games',
    '6games': '6 Games',
    fixed_time: 'Tempo Fixo',
  }
  return labels[format] ?? format
}

export function calculateWinRate(wins: number, total: number): number {
  if (total === 0) return 0
  return Math.round((wins / total) * 100)
}

export function getPositionEmoji(position: number): string {
  if (position === 1) return '🥇'
  if (position === 2) return '🥈'
  if (position === 3) return '🥉'
  return `${position}º`
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural}`
}
