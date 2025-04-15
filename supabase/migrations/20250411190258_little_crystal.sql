/*
  # Fix Tournament Formats Migration

  1. Changes
    - Drop existing policies before creating new ones
    - Add safety checks for policy existence
    - Clean up existing tournament groups before creating new ones
*/

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

-- Function to clean up existing tournament groups
CREATE OR REPLACE FUNCTION clean_tournament_groups(p_championship_id uuid)
RETURNS void AS $$
BEGIN
  -- Delete existing groups and related data
  DELETE FROM tournament_groups WHERE championship_id = p_championship_id;
END;
$$ LANGUAGE plpgsql;

-- Modify generate_group_stage_matches to clean up before creating new groups
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
  -- Clean up existing groups first
  PERFORM clean_tournament_groups(p_championship_id);

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
      SELECT UNNEST(v_group_teams)
    LOOP
      FOR v_team2 IN
        SELECT UNNEST(v_group_teams)
        WHERE UNNEST != v_team1
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

-- Recreate policies
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