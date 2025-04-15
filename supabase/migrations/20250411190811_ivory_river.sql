CREATE OR REPLACE FUNCTION generate_group_stage_matches(
  p_championship_id UUID,
  p_number_of_groups INTEGER,
  p_home_and_away BOOLEAN
)
RETURNS void AS $$
DECLARE
  v_team_count INTEGER;
  v_teams_per_group INTEGER;
  v_current_group TEXT;
  v_group_id UUID;
BEGIN
  -- Validate input parameters
  IF p_number_of_groups IS NULL OR p_number_of_groups < 2 THEN
    RAISE EXCEPTION 'Number of groups must be at least 2';
  END IF;

  -- Get total number of teams
  SELECT COUNT(*) INTO v_team_count
  FROM teams
  WHERE championship_id = p_championship_id;

  IF v_team_count < p_number_of_groups * 2 THEN
    RAISE EXCEPTION 'Not enough teams for the specified number of groups. Minimum 2 teams per group required.';
  END IF;

  -- Calculate teams per group
  v_teams_per_group := v_team_count / p_number_of_groups;

  -- Delete existing groups and matches
  DELETE FROM matches WHERE championship_id = p_championship_id;
  DELETE FROM tournament_groups WHERE championship_id = p_championship_id;

  -- Create groups and assign teams
  FOR i IN 1..p_number_of_groups LOOP
    v_current_group := 'Grupo ' || CHR(64 + i); -- A, B, C, etc.
    
    -- Create group
    INSERT INTO tournament_groups (championship_id, name)
    VALUES (p_championship_id, v_current_group)
    RETURNING id INTO v_group_id;

    -- Assign teams to group randomly
    WITH available_teams AS (
      SELECT t.id
      FROM teams t
      WHERE t.championship_id = p_championship_id
      AND NOT EXISTS (
        SELECT 1 
        FROM group_teams gt 
        WHERE gt.team_id = t.id
      )
      ORDER BY RANDOM()
      LIMIT v_teams_per_group
    )
    INSERT INTO group_teams (group_id, team_id)
    SELECT v_group_id, id
    FROM available_teams;

    -- Generate matches within the group
    INSERT INTO matches (
      championship_id,
      home_team_id,
      away_team_id,
      venue,
      match_date,
      phase,
      format_type,
      group_id
    )
    WITH group_teams_list AS (
      SELECT team_id
      FROM group_teams
      WHERE group_id = v_group_id
    ),
    team_pairs AS (
      SELECT 
        t1.team_id as home_team_id,
        t2.team_id as away_team_id,
        (SELECT name || ' Stadium' FROM teams WHERE id = t1.team_id) as home_venue
      FROM group_teams_list t1
      CROSS JOIN group_teams_list t2
      WHERE t1.team_id < t2.team_id
    )
    SELECT 
      p_championship_id,
      tp.home_team_id,
      tp.away_team_id,
      tp.home_venue,
      NOW() + (row_number() OVER ())::integer * interval '7 days',
      'Fase de Grupos'::match_phase,
      'groups'::match_format_type,
      v_group_id
    FROM team_pairs tp
    UNION ALL
    SELECT 
      p_championship_id,
      tp.away_team_id,
      tp.home_team_id,
      (SELECT name || ' Stadium' FROM teams WHERE id = tp.away_team_id),
      NOW() + (row_number() OVER ())::integer * interval '7 days' + interval '3 days',
      'Fase de Grupos'::match_phase,
      'groups'::match_format_type,
      v_group_id
    FROM team_pairs tp
    WHERE p_home_and_away = true;
  END LOOP;
END;
$$ LANGUAGE plpgsql;