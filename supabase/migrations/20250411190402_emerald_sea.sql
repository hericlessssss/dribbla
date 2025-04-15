/*
  # Fix Group Cleanup Function

  1. Changes
    - Improve cleanup function to handle all related data
    - Add cascade cleanup for matches and group teams
    - Add safety checks for existing data
*/

-- Modify the cleanup function to handle all related data
CREATE OR REPLACE FUNCTION clean_tournament_groups(p_championship_id uuid)
RETURNS void AS $$
BEGIN
  -- First, update matches to remove group_id references
  UPDATE matches 
  SET group_id = NULL 
  WHERE championship_id = p_championship_id;

  -- Delete group teams entries
  DELETE FROM group_teams gt
  USING tournament_groups tg
  WHERE tg.championship_id = p_championship_id
  AND gt.group_id = tg.id;

  -- Delete tournament groups
  DELETE FROM tournament_groups 
  WHERE championship_id = p_championship_id;

  -- Reset format in matches
  UPDATE matches
  SET format_type = NULL
  WHERE championship_id = p_championship_id;

  -- Delete tournament format
  DELETE FROM tournament_formats
  WHERE championship_id = p_championship_id;
END;
$$ LANGUAGE plpgsql;

-- Modify generate_group_stage_matches to handle edge cases
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
  -- Validate input
  IF p_number_of_groups < 1 THEN
    RAISE EXCEPTION 'Number of groups must be at least 1';
  END IF;

  -- Clean up existing groups first
  PERFORM clean_tournament_groups(p_championship_id);

  -- Get all teams for this championship
  SELECT array_agg(id) INTO v_teams
  FROM teams
  WHERE championship_id = p_championship_id
  ORDER BY name;  -- Order teams to ensure consistent distribution

  v_team_count := array_length(v_teams, 1);
  
  IF v_team_count IS NULL OR v_team_count < p_number_of_groups * 2 THEN
    RAISE EXCEPTION 'Not enough teams for the specified number of groups';
  END IF;
  
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