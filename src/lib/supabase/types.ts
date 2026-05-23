// Auto-generated Supabase types - extend as needed
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          role: 'admin' | 'operator' | 'athlete'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      athletes: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          photo_url: string | null
          category: 'iniciante' | 'intermediario' | 'avancado' | 'profissional'
          gender: 'masculino' | 'feminino' | 'misto' | null
          birth_date: string | null
          arena_origin: string | null
          observations: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['athletes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['athletes']['Insert']>
      }
      tournaments: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          date: string
          start_time: string | null
          location: string | null
          num_courts: number
          num_players: number
          format: 'super8' | 'super8_12' | 'super8_16'
          match_format: '1game' | '4games' | '6games' | 'fixed_time'
          match_duration_minutes: number | null
          tiebreak_criteria: string[]
          status: 'draft' | 'setup' | 'active' | 'finished' | 'cancelled'
          current_round: number
          total_rounds: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tournaments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tournaments']['Insert']>
      }
      courts: {
        Row: {
          id: string
          tournament_id: string
          number: number
          name: string | null
          status: 'available' | 'in_use' | 'maintenance'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['courts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['courts']['Insert']>
      }
      tournament_athletes: {
        Row: {
          id: string
          tournament_id: string
          athlete_id: string
          seed: number | null
          position: number | null
          status: 'registered' | 'confirmed' | 'withdrawn'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tournament_athletes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['tournament_athletes']['Insert']>
      }
      rounds: {
        Row: {
          id: string
          tournament_id: string
          number: number
          status: 'pending' | 'active' | 'finished'
          started_at: string | null
          finished_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['rounds']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['rounds']['Insert']>
      }
      matches: {
        Row: {
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
          status: 'pending' | 'active' | 'finished' | 'cancelled'
          started_at: string | null
          finished_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['matches']['Insert']>
      }
      tournament_rankings: {
        Row: {
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
        }
        Insert: Omit<Database['public']['Tables']['tournament_rankings']['Row'], 'id' | 'game_diff' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tournament_rankings']['Insert']>
      }
    }
    Functions: {
      recalculate_tournament_rankings: {
        Args: { p_tournament_id: string }
        Returns: void
      }
    }
  }
}
