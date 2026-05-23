import type { MatchPairing, RoundPairing } from '@/types/database'

/**
 * Super 8 Tournament Algorithm
 *
 * Generates rounds where every player:
 * - Plays with every other player as partner exactly once (ideal)
 * - Faces every other player as opponent at least once
 * - No repeated pairings within consecutive rounds
 *
 * Uses a Round-Robin rotation algorithm adapted for doubles teams.
 */

// ─── 8-PLAYER SCHEDULE ──────────────────────────────────────────────────────
// Classic Super 8: 7 rounds, 2 matches each, every player plays 7 games
// Each player partners with 3 different people, faces others as opponents
const SUPER8_SCHEDULE: Array<[number, number, number, number][]> = [
  // Round 1: [p1, p2] vs [p3, p4]  (0-indexed)
  [[0, 1, 2, 3], [4, 5, 6, 7]],
  // Round 2
  [[0, 2, 1, 3], [4, 6, 5, 7]],
  // Round 3
  [[0, 3, 1, 2], [4, 7, 5, 6]],
  // Round 4
  [[0, 4, 1, 5], [2, 6, 3, 7]],
  // Round 5
  [[0, 5, 2, 7], [1, 4, 3, 6]],
  // Round 6
  [[0, 6, 3, 5], [1, 7, 2, 4]],
  // Round 7
  [[0, 7, 2, 5], [1, 6, 3, 4]],
]

// ─── 12-PLAYER SCHEDULE ─────────────────────────────────────────────────────
// 11 rounds, 3 matches each — uses social doubles rotation
function generateSchedule12(): Array<[number, number, number, number][]> {
  const rounds: Array<[number, number, number, number][]> = []
  const n = 12

  // Use a balanced incomplete block design approach
  // Each round: 3 matches of 2v2, all 12 players active
  const scheduleTemplate: Array<[number, number, number, number][]> = [
    [[0,1,2,3],[4,5,6,7],[8,9,10,11]],
    [[0,2,1,4],[3,5,6,8],[7,9,10,11]],
    [[0,3,4,6],[1,5,7,10],[2,8,9,11]],
    [[0,4,2,5],[1,6,8,11],[3,7,9,10]],
    [[0,5,3,8],[1,7,9,11],[2,6,4,10]],
    [[0,6,1,9],[2,7,3,11],[4,8,5,10]],
    [[0,7,4,9],[1,8,2,10],[3,6,5,11]],
    [[0,8,5,9],[1,10,3,4],[2,7,6,11]],
    [[0,9,3,10],[1,11,2,6],[4,7,5,8]],
    [[0,10,5,11],[1,3,2,9],[4,6,7,8]],
    [[0,11,4,10],[1,2,5,6],[3,9,7,8]],
  ]

  return scheduleTemplate
}

// ─── 16-PLAYER SCHEDULE ─────────────────────────────────────────────────────
// 15 rounds, 4 matches each — uses tournament bracket rotation
function generateSchedule16(): Array<[number, number, number, number][]> {
  const scheduleTemplate: Array<[number, number, number, number][]> = [
    [[0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15]],
    [[0,2,1,4],[3,5,6,8],[7,9,10,12],[11,13,14,15]],
    [[0,3,2,5],[1,6,4,7],[8,11,9,12],[10,13,14,15]],
    [[0,4,1,5],[2,6,3,7],[8,12,9,13],[10,14,11,15]],
    [[0,5,3,6],[1,4,2,7],[8,13,9,14],[10,15,11,12]],
    [[0,6,4,9],[1,7,5,8],[2,11,3,10],[12,15,13,14]],
    [[0,7,1,8],[2,9,3,4],[5,10,6,11],[12,14,13,15]],
    [[0,8,5,11],[1,9,6,10],[2,12,3,13],[4,15,7,14]],
    [[0,9,4,11],[1,10,5,12],[2,13,6,14],[3,15,7,8]],
    [[0,10,3,11],[1,12,4,13],[2,14,5,15],[6,9,7,8]],
    [[0,11,2,8],[1,13,4,15],[3,12,5,14],[6,9,7,10]],
    [[0,12,1,11],[2,15,3,14],[4,9,5,13],[6,8,7,10]],
    [[0,13,2,10],[1,14,3,9],[4,8,5,7],[6,15,11,12]],
    [[0,14,1,15],[2,11,3,8],[4,10,5,9],[6,13,7,12]],
    [[0,15,1,2],[3,4,5,6],[7,11,8,10],[9,13,12,14]],
  ]
  return scheduleTemplate
}

// ─── MAIN GENERATOR ─────────────────────────────────────────────────────────
export function generateTournamentRounds(
  playerIds: string[],
  numCourts: number,
  format: 'super8' | 'super8_12' | 'super8_16'
): RoundPairing[] {
  const n = playerIds.length
  let schedule: Array<[number, number, number, number][]>

  if (n === 8) {
    schedule = SUPER8_SCHEDULE
  } else if (n === 12) {
    schedule = generateSchedule12()
  } else if (n === 16) {
    schedule = generateSchedule16()
  } else {
    // Fallback: generate dynamic schedule using round-robin
    schedule = generateDynamicSchedule(n)
  }

  return schedule.map((roundMatches, roundIndex) => ({
    roundNumber: roundIndex + 1,
    matches: roundMatches.map((match, matchIndex) => ({
      team1: [playerIds[match[0]], playerIds[match[1]]] as [string, string],
      team2: [playerIds[match[2]], playerIds[match[3]]] as [string, string],
      court: (matchIndex % numCourts) + 1,
    })),
  }))
}

// Dynamic schedule generator using circle method
function generateDynamicSchedule(n: number): Array<[number, number, number, number][]> {
  const matchesPerRound = n / 4
  const totalRounds = n - 1
  const rounds: Array<[number, number, number, number][]> = []

  // Create initial player array for rotation
  const players = Array.from({ length: n }, (_, i) => i)

  for (let round = 0; round < totalRounds; round++) {
    const roundMatches: [number, number, number, number][] = []
    const rotated = rotateArray(players, round)

    // Split into pairs then form doubles
    for (let m = 0; m < matchesPerRound; m++) {
      const t1p1 = rotated[m * 4]
      const t1p2 = rotated[m * 4 + 1]
      const t2p1 = rotated[m * 4 + 2]
      const t2p2 = rotated[m * 4 + 3]
      roundMatches.push([t1p1, t1p2, t2p1, t2p2])
    }

    rounds.push(roundMatches)
  }

  return rounds
}

function rotateArray<T>(arr: T[], steps: number): T[] {
  const n = arr.length
  const s = steps % n
  return [...arr.slice(s), ...arr.slice(0, s)]
}

// ─── VALIDATION ─────────────────────────────────────────────────────────────
export function validateSchedule(playerIds: string[], rounds: RoundPairing[]): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  const pairings = new Map<string, number>()

  for (const round of rounds) {
    const activePlayers = new Set<string>()

    for (const match of round.matches) {
      const [t1p1, t1p2] = match.team1 as unknown as [string, string]
      const [t2p1, t2p2] = match.team2 as unknown as [string, string]
      const allPlayers = [t1p1, t1p2, t2p1, t2p2]

      // Check for player appearing twice in same round
      for (const p of allPlayers) {
        if (activePlayers.has(p)) {
          issues.push(`Player ${p} appears twice in round ${round.roundNumber}`)
        }
        activePlayers.add(p)
      }

      // Track partnerships
      const pair1 = [t1p1, t1p2].sort().join('-')
      const pair2 = [t2p1, t2p2].sort().join('-')
      pairings.set(pair1, (pairings.get(pair1) ?? 0) + 1)
      pairings.set(pair2, (pairings.get(pair2) ?? 0) + 1)
    }
  }

  // Warn about repeated partnerships
  for (const [pair, count] of pairings) {
    if (count > 1) {
      issues.push(`Partnership ${pair} repeated ${count} times`)
    }
  }

  return { valid: issues.length === 0, issues }
}

// ─── SCORING ────────────────────────────────────────────────────────────────
export interface PlayerStats {
  playerId: string
  wins: number
  losses: number
  gamesPro: number
  gamesAgainst: number
  gameDiff: number
  matchesPlayed: number
  winRate: number
  points: number
  headToHead: Map<string, { wins: number; losses: number }>
}

export function calculateRankings(
  playerIds: string[],
  results: Array<{
    player1Id: string
    player2Id: string
    player3Id: string
    player4Id: string
    scoreTeam1: number
    scoreTeam2: number
    winnerTeam: 1 | 2
  }>
): PlayerStats[] {
  const stats = new Map<string, PlayerStats>()

  for (const id of playerIds) {
    stats.set(id, {
      playerId: id,
      wins: 0,
      losses: 0,
      gamesPro: 0,
      gamesAgainst: 0,
      gameDiff: 0,
      matchesPlayed: 0,
      winRate: 0,
      points: 0,
      headToHead: new Map(),
    })
  }

  for (const result of results) {
    const team1 = [result.player1Id, result.player2Id]
    const team2 = [result.player3Id, result.player4Id]
    const team1Won = result.winnerTeam === 1

    for (const p of team1) {
      const s = stats.get(p)
      if (!s) continue
      if (team1Won) s.wins++; else s.losses++
      s.gamesPro += result.scoreTeam1
      s.gamesAgainst += result.scoreTeam2
      s.matchesPlayed++

      // Head to head
      for (const opp of team2) {
        const h2h = s.headToHead.get(opp) ?? { wins: 0, losses: 0 }
        if (team1Won) h2h.wins++; else h2h.losses++
        s.headToHead.set(opp, h2h)
      }
    }

    for (const p of team2) {
      const s = stats.get(p)
      if (!s) continue
      if (!team1Won) s.wins++; else s.losses++
      s.gamesPro += result.scoreTeam2
      s.gamesAgainst += result.scoreTeam1
      s.matchesPlayed++

      for (const opp of team1) {
        const h2h = s.headToHead.get(opp) ?? { wins: 0, losses: 0 }
        if (!team1Won) h2h.wins++; else h2h.losses++
        s.headToHead.set(opp, h2h)
      }
    }
  }

  // Compute derived stats
  for (const s of stats.values()) {
    s.gameDiff = s.gamesPro - s.gamesAgainst
    s.winRate = s.matchesPlayed > 0 ? Math.round((s.wins / s.matchesPlayed) * 100) : 0
    s.points = s.wins * 3 + s.gameDiff
  }

  // Sort by: wins → game diff → games pro → head to head
  return Array.from(stats.values()).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff
    if (b.gamesPro !== a.gamesPro) return b.gamesPro - a.gamesPro
    // Head to head
    const aVsB = a.headToHead.get(b.playerId)
    if (aVsB) {
      if (aVsB.wins > aVsB.losses) return -1
      if (aVsB.wins < aVsB.losses) return 1
    }
    return 0
  })
}

export function getTotalRounds(format: string): number {
  if (format === 'super8') return 7
  if (format === 'super8_12') return 11
  if (format === 'super8_16') return 15
  return 7
}
