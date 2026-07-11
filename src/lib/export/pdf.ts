import type { TournamentRanking, Tournament, Match } from '@/types/database'
import { formatDate, getCategoryLabel } from '@/lib/utils'

// Dynamic import to avoid SSR issues
async function getJsPDF() {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  return { jsPDF, autoTable }
}

export async function exportRankingPDF(
  tournament: Tournament,
  rankings: Array<TournamentRanking & { athlete: { name: string; category: string } | null }>
) {
  const { jsPDF } = await getJsPDF()
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Header background
  doc.setFillColor(10, 10, 10)
  doc.rect(0, 0, 210, 297, 'F')

  // Accent line
  doc.setFillColor(0, 255, 136)
  doc.rect(0, 0, 210, 2, 'F')

  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(tournament.name, 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.setFont('helvetica', 'normal')
  doc.text(`Data: ${formatDate(tournament.date)} · ${rankings.length} atletas · ${tournament.total_rounds} rodadas`, 14, 28)
  doc.text('Copa Sementes · Vôlei e Beach Tennis', 14, 34)

  // Ranking table
  autoTable(doc, {
    startY: 42,
    head: [['#', 'Atleta', 'Cat.', 'V', 'D', 'Games+', 'Games-', 'Saldo', '%', 'Pts']],
    body: rankings.map((r, idx) => [
      idx + 1,
      r.athlete?.name ?? '—',
      getCategoryLabel(r.athlete?.category ?? ''),
      r.wins,
      r.losses,
      r.games_pro,
      r.games_against,
      r.game_diff > 0 ? `+${r.game_diff}` : r.game_diff,
      `${r.win_rate}%`,
      r.points,
    ]),
    theme: 'grid',
    styles: {
      fillColor: [26, 26, 26],
      textColor: [240, 240, 240],
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [0, 80, 40],
      textColor: [0, 255, 136],
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: [20, 20, 20] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50 },
      9: { textColor: [0, 255, 136], fontStyle: 'bold' },
    },
  })

  // Podium highlight
  const podiumY = (doc as any).lastAutoTable.finalY + 10
  if (rankings.length >= 3) {
    doc.setFontSize(12)
    doc.setTextColor(255, 215, 0)
    doc.setFont('helvetica', 'bold')
    doc.text('🥇 Campeão', 14, podiumY)
    doc.setTextColor(255, 255, 255)
    doc.text(rankings[0]?.athlete?.name ?? '—', 45, podiumY)

    doc.setTextColor(192, 192, 192)
    doc.text('🥈 Vice', 14, podiumY + 7)
    doc.setTextColor(255, 255, 255)
    doc.text(rankings[1]?.athlete?.name ?? '—', 45, podiumY + 7)

    doc.setTextColor(205, 127, 50)
    doc.text('🥉 3º Lugar', 14, podiumY + 14)
    doc.setTextColor(255, 255, 255)
    doc.text(rankings[2]?.athlete?.name ?? '—', 45, podiumY + 14)
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} · Langolandia Beach Tennis`, 14, 285)

  doc.save(`ranking-${tournament.name.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}

export async function exportMatchesPDF(
  tournament: Tournament,
  matches: Array<Match & {
    player1: { name: string } | null
    player2: { name: string } | null
    player3: { name: string } | null
    player4: { name: string } | null
  }>
) {
  const { jsPDF } = await getJsPDF()
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()

  doc.setFillColor(10, 10, 10)
  doc.rect(0, 0, 210, 297, 'F')
  doc.setFillColor(0, 255, 136)
  doc.rect(0, 0, 210, 2, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(`${tournament.name} — Partidas`, 14, 18)

  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.text(`${formatDate(tournament.date)} · Copa Sementes`, 14, 25)

  const finished = matches.filter(m => m.status === 'finished')

  autoTable(doc, {
    startY: 32,
    head: [['R', 'J', 'Dupla 1', 'Placar', 'Dupla 2', 'Status']],
    body: finished.map(m => [
      m.round_number,
      m.match_number,
      `${m.player1?.name?.split(' ')[0] ?? '?'} / ${m.player2?.name?.split(' ')[0] ?? '?'}`,
      `${m.score_team1} × ${m.score_team2}`,
      `${m.player3?.name?.split(' ')[0] ?? '?'} / ${m.player4?.name?.split(' ')[0] ?? '?'}`,
      m.winner_team === 1 ? '← Venceu' : 'Venceu →',
    ]),
    theme: 'grid',
    styles: { fillColor: [26, 26, 26], textColor: [240, 240, 240], fontSize: 8 },
    headStyles: { fillColor: [0, 80, 40], textColor: [0, 255, 136], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [20, 20, 20] },
  })

  doc.save(`partidas-${tournament.name.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}
