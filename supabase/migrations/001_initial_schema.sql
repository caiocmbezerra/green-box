-- =============================================
-- GREEN BOX - Beach Tennis Super 8 System
-- Initial Database Schema
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- PROFILES (extends auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'athlete' CHECK (role IN ('admin', 'operator', 'athlete')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ATHLETES
-- =============================================
CREATE TABLE public.athletes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  category TEXT NOT NULL DEFAULT 'intermediario'
    CHECK (category IN ('iniciante', 'intermediario', 'avancado', 'profissional')),
  gender TEXT CHECK (gender IN ('masculino', 'feminino', 'misto')),
  birth_date DATE,
  arena_origin TEXT,
  observations TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TOURNAMENTS
-- =============================================
CREATE TABLE public.tournaments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  date DATE NOT NULL,
  start_time TIME,
  location TEXT,
  num_courts INTEGER NOT NULL DEFAULT 2,
  num_players INTEGER NOT NULL DEFAULT 8
    CHECK (num_players IN (8, 12, 16)),
  format TEXT NOT NULL DEFAULT 'super8'
    CHECK (format IN ('super8', 'super8_12', 'super8_16')),
  match_format TEXT NOT NULL DEFAULT '6games'
    CHECK (match_format IN ('1game', '4games', '6games', 'fixed_time')),
  match_duration_minutes INTEGER DEFAULT 30,
  tiebreak_criteria JSONB DEFAULT '["wins","game_diff","games_pro","head_to_head","draw"]',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'setup', 'active', 'finished', 'cancelled')),
  current_round INTEGER DEFAULT 0,
  total_rounds INTEGER DEFAULT 7,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COURTS
-- =============================================
CREATE TABLE public.courts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'available'
    CHECK (status IN ('available', 'in_use', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TOURNAMENT ATHLETES (registration)
-- =============================================
CREATE TABLE public.tournament_athletes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  seed INTEGER,
  position INTEGER,
  status TEXT DEFAULT 'registered'
    CHECK (status IN ('registered', 'confirmed', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, athlete_id)
);

-- =============================================
-- ROUNDS
-- =============================================
CREATE TABLE public.rounds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'finished')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, number)
);

-- =============================================
-- MATCHES
-- =============================================
CREATE TABLE public.matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
  court_id UUID REFERENCES public.courts(id),
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  -- Team 1
  player1_id UUID REFERENCES public.athletes(id),
  player2_id UUID REFERENCES public.athletes(id),
  -- Team 2
  player3_id UUID REFERENCES public.athletes(id),
  player4_id UUID REFERENCES public.athletes(id),
  -- Results
  score_team1 INTEGER DEFAULT 0,
  score_team2 INTEGER DEFAULT 0,
  winner_team INTEGER CHECK (winner_team IN (1, 2)),
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'finished', 'cancelled')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RANKINGS (computed per tournament)
-- =============================================
CREATE TABLE public.tournament_rankings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  position INTEGER,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  games_pro INTEGER DEFAULT 0,
  games_against INTEGER DEFAULT 0,
  game_diff INTEGER GENERATED ALWAYS AS (games_pro - games_against) STORED,
  matches_played INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, athlete_id)
);

-- =============================================
-- AUDIT LOGS
-- =============================================
CREATE TABLE public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match_starting', 'round_start', 'ranking_update', 'tournament_end')),
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_tournament_athletes_tournament ON public.tournament_athletes(tournament_id);
CREATE INDEX idx_tournament_athletes_athlete ON public.tournament_athletes(athlete_id);
CREATE INDEX idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX idx_matches_round ON public.matches(round_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_rounds_tournament ON public.rounds(tournament_id);
CREATE INDEX idx_rankings_tournament ON public.tournament_rankings(tournament_id);
CREATE INDEX idx_rankings_athlete ON public.tournament_rankings(athlete_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: users see own, admins see all
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Athletes: public read, admin/operator write
CREATE POLICY "Anyone can view athletes" ON public.athletes
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins and operators can manage athletes" ON public.athletes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
  );

-- Tournaments: public read, admin write
CREATE POLICY "Anyone can view tournaments" ON public.tournaments
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage tournaments" ON public.tournaments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Courts, Rounds, Matches: public read, admin/operator write
CREATE POLICY "Anyone can view courts" ON public.courts FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage courts" ON public.courts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
);

CREATE POLICY "Anyone can view tournament_athletes" ON public.tournament_athletes FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage tournament_athletes" ON public.tournament_athletes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
);

CREATE POLICY "Anyone can view rounds" ON public.rounds FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage rounds" ON public.rounds FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
);

CREATE POLICY "Anyone can view matches" ON public.matches FOR SELECT USING (TRUE);
CREATE POLICY "Admins and operators manage matches" ON public.matches FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
);

CREATE POLICY "Anyone can view rankings" ON public.tournament_rankings FOR SELECT USING (TRUE);
CREATE POLICY "System manages rankings" ON public.tournament_rankings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
);

CREATE POLICY "Anyone can view notifications" ON public.notifications FOR SELECT USING (TRUE);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Recalculate rankings after match result
CREATE OR REPLACE FUNCTION public.recalculate_tournament_rankings(p_tournament_id UUID)
RETURNS VOID AS $$
DECLARE
  r RECORD;
BEGIN
  -- Delete existing rankings for this tournament
  DELETE FROM public.tournament_rankings WHERE tournament_id = p_tournament_id;

  -- Recalculate from all finished matches
  FOR r IN
    SELECT
      athlete_id,
      SUM(wins) as total_wins,
      SUM(losses) as total_losses,
      SUM(games_pro) as total_games_pro,
      SUM(games_against) as total_games_against,
      COUNT(*) as matches_played
    FROM (
      -- Team 1 perspective
      SELECT player1_id as athlete_id,
        CASE WHEN winner_team = 1 THEN 1 ELSE 0 END as wins,
        CASE WHEN winner_team = 2 THEN 1 ELSE 0 END as losses,
        score_team1 as games_pro, score_team2 as games_against
      FROM public.matches
      WHERE tournament_id = p_tournament_id AND status = 'finished' AND player1_id IS NOT NULL
      UNION ALL
      SELECT player2_id as athlete_id,
        CASE WHEN winner_team = 1 THEN 1 ELSE 0 END as wins,
        CASE WHEN winner_team = 2 THEN 1 ELSE 0 END as losses,
        score_team1 as games_pro, score_team2 as games_against
      FROM public.matches
      WHERE tournament_id = p_tournament_id AND status = 'finished' AND player2_id IS NOT NULL
      UNION ALL
      -- Team 2 perspective
      SELECT player3_id as athlete_id,
        CASE WHEN winner_team = 2 THEN 1 ELSE 0 END as wins,
        CASE WHEN winner_team = 1 THEN 1 ELSE 0 END as losses,
        score_team2 as games_pro, score_team1 as games_against
      FROM public.matches
      WHERE tournament_id = p_tournament_id AND status = 'finished' AND player3_id IS NOT NULL
      UNION ALL
      SELECT player4_id as athlete_id,
        CASE WHEN winner_team = 2 THEN 1 ELSE 0 END as wins,
        CASE WHEN winner_team = 1 THEN 1 ELSE 0 END as losses,
        score_team2 as games_pro, score_team1 as games_against
      FROM public.matches
      WHERE tournament_id = p_tournament_id AND status = 'finished' AND player4_id IS NOT NULL
    ) subq
    GROUP BY athlete_id
  LOOP
    INSERT INTO public.tournament_rankings (
      tournament_id, athlete_id, wins, losses,
      games_pro, games_against, matches_played,
      win_rate, points
    ) VALUES (
      p_tournament_id,
      r.athlete_id,
      r.total_wins,
      r.total_losses,
      r.total_games_pro,
      r.total_games_against,
      r.matches_played,
      CASE WHEN r.matches_played > 0
        THEN ROUND((r.total_wins::DECIMAL / r.matches_played) * 100, 2)
        ELSE 0 END,
      r.total_wins * 3 + (r.total_games_pro - r.total_games_against)
    );
  END LOOP;

  -- Update positions
  UPDATE public.tournament_rankings tr
  SET position = ranked.pos
  FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        ORDER BY wins DESC, game_diff DESC, games_pro DESC
      ) as pos
    FROM public.tournament_rankings
    WHERE tournament_id = p_tournament_id
  ) ranked
  WHERE tr.id = ranked.id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
