/*
  # Implement Group Stage System

  1. New Tables
    - tournament_formats: Stores championship format configuration
    - tournament_groups: Stores group information (A, B, C, etc)
    - group_teams: Associates teams with groups and stores group standings
    - knockout_matches: For future knockout stage implementation

  2. Changes
    - Add format_type to matches table
    - Add group_id to matches table
    - Add policies for all new tables
*/

-- Create enum for match format type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE match_format_type AS ENUM ('groups', 'points');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create tournament formats table
CREATE TABLE IF NOT EXISTS tournament_formats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id uuid REFERENCES championships(id) ON DELETE CASCADE,
  format_type text CHECK (format_type IN ('points', 'groups')),
  number_of_groups integer CHECK (number_of_groups > 0),
  teams_per_group integer CHECK (teams_per_group > 1),
  teams_advancing integer CHECK (teams_advancing > 0),
  has_knockout_stage boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(championship_id)
);

-- Create tournament groups table
CREATE TABLE IF NOT EXISTS tournament_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id uuid REFERENCES championships(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(championship_id, name)
);

-- Create group teams table with standings
CREATE TABLE IF NOT EXISTS group_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES tournament_groups(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  position integer DEFAULT 0,
  points integer DEFAULT 0,
  matches_played integer DEFAULT 0,
  wins integer DEFAULT 0,
  draws integer DEFAULT 0,
  losses integer DEFAULT 0,
  goals_for integer DEFAULT 0,
  goals_against integer DEFAULT 0,
  goal_difference integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(group_id, team_id)
);

-- Create knockout matches table for future use
CREATE TABLE IF NOT EXISTS knockout_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id uuid REFERENCES championships(id) ON DELETE CASCADE,
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  round text CHECK (round IN ('round_of_16', 'quarter_finals', 'semi_finals', 'final')),
  match_number integer NOT NULL,
  next_match_number integer,
  winner_team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add format_type to matches if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'matches' 
    AND column_name = 'format_type'
  ) THEN
    ALTER TABLE matches ADD COLUMN format_type match_format_type;
  END IF;
END $$;

-- Add group_id to matches if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'matches' 
    AND column_name = 'group_id'
  ) THEN
    ALTER TABLE matches ADD COLUMN group_id uuid REFERENCES tournament_groups(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE tournament_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE knockout_matches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Tournament Formats policies
  DROP POLICY IF EXISTS "Users can view tournament formats" ON tournament_formats;
  DROP POLICY IF EXISTS "Organizers can manage tournament formats" ON tournament_formats;
  
  -- Tournament Groups policies
  DROP POLICY IF EXISTS "Users can view tournament groups" ON tournament_groups;
  DROP POLICY IF EXISTS "Organizers can manage tournament groups" ON tournament_groups;
  
  -- Group Teams policies
  DROP POLICY IF EXISTS "Users can view group teams" ON group_teams;
  DROP POLICY IF EXISTS "Organizers can manage group teams" ON group_teams;
  
  -- Knockout Matches policies
  DROP POLICY IF EXISTS "Users can view knockout matches" ON knockout_matches;
  DROP POLICY IF EXISTS "Organizers can manage knockout matches" ON knockout_matches;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Create policies for tournament_formats
CREATE POLICY "Users can view tournament formats"
  ON tournament_formats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM championships c
      WHERE c.id = championship_id
      AND (c.is_active = true OR c.organizer_id = auth.uid())
    )
  );

CREATE POLICY "Organizers can manage tournament formats"
  ON tournament_formats
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM championships c
      WHERE c.id = championship_id
      AND c.organizer_id = auth.uid()
    )
  );

-- Create policies for tournament_groups
CREATE POLICY "Users can view tournament groups"
  ON tournament_groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM championships c
      WHERE c.id = championship_id
      AND (c.is_active = true OR c.organizer_id = auth.uid())
    )
  );

CREATE POLICY "Organizers can manage tournament groups"
  ON tournament_groups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM championships c
      WHERE c.id = championship_id
      AND c.organizer_id = auth.uid()
    )
  );

-- Create policies for group_teams
CREATE POLICY "Users can view group teams"
  ON group_teams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournament_groups g
      JOIN championships c ON c.id = g.championship_id
      WHERE g.id = group_id
      AND (c.is_active = true OR c.organizer_id = auth.uid())
    )
  );

CREATE POLICY "Organizers can manage group teams"
  ON group_teams
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournament_groups g
      JOIN championships c ON c.id = g.championship_id
      WHERE g.id = group_id
      AND c.organizer_id = auth.uid()
    )
  );

-- Create policies for knockout_matches
CREATE POLICY "Users can view knockout matches"
  ON knockout_matches
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM championships c
      WHERE c.id = championship_id
      AND (c.is_active = true OR c.organizer_id = auth.uid())
    )
  );

CREATE POLICY "Organizers can manage knockout matches"
  ON knockout_matches
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM championships c
      WHERE c.id = championship_id
      AND c.organizer_id = auth.uid()
    )
  );

-- Create function to generate matches for group stage
CREATE OR REPLACE FUNCTION generate_group_stage_matches(
  p_championship_id uuid,
  p_number_of_groups integer,
  p_home_and_away boolean
)
RETURNS void AS $$
DECLARE
  v_group_name text;
  v_group_id uuid;
  v_teams uuid[];
  v_team_count integer;
  v_teams_per_group integer;
  v_team1 uuid;
  v_team2 uuid;
  v_group_teams uuid[];
  i integer;
  j integer;
BEGIN
  -- Get all teams for this championship
  SELECT array_agg(id) INTO v_teams
  FROM teams
  WHERE championship_id = p_championship_id;

  v_team_count := array_length(v_teams, 1);
  
  -- Calculate teams per group
  v_teams_per_group := v_team_count / p_number_of_groups;

  -- Create groups and assign teams
  FOR i IN 1..p_number_of_groups LOOP
    -- Create group
    v_group_name := chr(64 + i); -- A, B, C, etc.
    
    INSERT INTO tournament_groups (championship_id, name)
    VALUES (p_championship_id, v_group_name)
    RETURNING id INTO v_group_id;

    -- Get teams for this group
    v_group_teams := v_teams[(i-1)*v_teams_per_group + 1 : i*v_teams_per_group];

    -- Assign teams to group
    FOR j IN 1..array_length(v_group_teams, 1) LOOP
      INSERT INTO group_teams (group_id, team_id)
      VALUES (v_group_id, v_group_teams[j]);
    END LOOP;

    -- Generate matches within group
    FOR v_team1 IN 
      SELECT unnest(v_group_teams)
    LOOP
      FOR v_team2 IN
        SELECT unnest(v_group_teams)
        WHERE unnest != v_team1
      LOOP
        -- Insert home match
        INSERT INTO matches (
          championship_id,
          home_team_id,
          away_team_id,
          venue,
          match_date,
          phase,
          status,
          format_type,
          group_id
        )
        SELECT
          p_championship_id,
          v_team1,
          v_team2,
          (SELECT name || ' Stadium' FROM teams WHERE id = v_team1),
          now() + (random() * interval '30 days'),
          'Fase de Grupos',
          'Agendado',
          'groups',
          v_group_id;

        -- Insert away match if home_and_away is true
        IF p_home_and_away THEN
          INSERT INTO matches (
            championship_id,
            home_team_id,
            away_team_id,
            venue,
            match_date,
            phase,
            status,
            format_type,
            group_id
          )
          SELECT
            p_championship_id,
            v_team2,
            v_team1,
            (SELECT name || ' Stadium' FROM teams WHERE id = v_team2),
            now() + (random() * interval '30 days'),
            'Fase de Grupos',
            'Agendado',
            'groups',
            v_group_id;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;