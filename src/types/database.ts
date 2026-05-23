export type UserRole = 'admin' | 'operator' | 'athlete'
export type TournamentStatus = 'draft' | 'setup' | 'active' | 'finished' | 'cancelled'
export type TournamentFormat = 'super8' | 'super8_12' | 'super8_16'
export type MatchFormat = '1game' | '4games' | '6games' | 'fixed_time'
export type MatchStatus = 'pending' | 'active' | 'finished' | 'cancelled'
export type RoundStatus = 'pending' | 'active' | 'finished'
export type AthleteCategory = 'iniciante' | 'intermediario' | 'avancado' | 'profissional'
export type CourtStatus = 'available' | 'in_use' | 'maintenance'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Athlete {
  id: string
  name: string
  email: string | null
  phone: string | null
  photo_url: string | null
  category: AthleteCategory
  gender: 'masculino' | 'feminino' | 'misto' | null
  birth_date: string | null
  arena_origin: string | null
  observations: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Tournament {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  date: string
  start_time: string | null
  location: string | null
  num_courts: number
  num_players: number
  format: TournamentFormat
  match_format: MatchFormat
  match_duration_minutes: number | null
  tiebreak_criteria: string[]
  status: TournamentStatus
  current_round: number
  total_rounds: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Court {
  id: string
  tournament_id: string
  number: number
  name: string | null
  status: CourtStatus
  created_at: string
}

export interface TournamentAthlete {
  id: string
  tournament_id: string
  athlete_id: string
  seed: number | null
  position: number | null
  status: 'registered' | 'confirmed' | 'withdrawn'
  created_at: string
  athlete?: Athlete
}

export interface Round {
  id: string
  tournament_id: string
  number: number
  status: RoundStatus
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export interface Match {
  id: string
  tournament_id: string
  round_id: string
  court_id: string | null
  round_number: number
  match_number: number
  player1_id: string | null
  player2_id: string | null
  player3_id: string | null
  player4_id: string | null
  score_team1: number
  score_team2: number
  winner_team: 1 | 2 | null
  status: MatchStatus
  started_at: string | null
  finished_at: string | null
  created_at: string
  updated_at: string
  // Joined data
  player1?: Athlete
  player2?: Athlete
  player3?: Athlete
  player4?: Athlete
  court?: Court
  round?: Round
}

export interface TournamentRanking {
  id: string
  tournament_id: string
  athlete_id: string
  position: number | null
  wins: number
  losses: number
  games_pro: number
  games_against: number
  game_diff: number
  matches_played: number
  win_rate: number
  points: number
  updated_at: string
  athlete?: Athlete
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export interface Notification {
  id: string
  tournament_id: string
  athlete_id: string
  type: 'match_starting' | 'round_start' | 'ranking_update' | 'tournament_end'
  message: string
  sent_at: string
  read: boolean
}

// Super 8 algorithm types
export interface MatchPairing {
  team1: [number, number] // player indices (0-based)
  team2: [number, number]
  court: number
}

export interface RoundPairing {
  roundNumber: number
  matches: MatchPairing[]
}

export interface TournamentStats {
  total_tournaments: number
  total_athletes: number
  total_matches: number
  avg_participants: number
  active_tournaments: number
}
