/*
  # Fix Championship Statistics

  1. Changes
    - Create function to update team statistics
    - Create function to update group standings
    - Create function to recalculate all statistics
    - Add trigger to update statistics after match ends
    - Fix standings calculation and sorting

  2. Details
    - Statistics are now calculated based on actual match results
    - Each match is counted only once
    - Proper tiebreaker rules are implemented
    - Group standings are handled separately
*/

-- Function to update team statistics in a group
CREATE OR REPLACE FUNCTION update_group_team_statistics(
  p_group_id UUID,
  p_team_id UUID
)
RETURNS void AS $$
DECLARE
  v_wins INTEGER := 0;
  v_draws INTEGER := 0;
  v_losses INTEGER := 0;
  v_goals_for INTEGER := 0;
  v_goals_against INTEGER := 0;
  v_matches_played INTEGER := 0;
BEGIN
  -- Calculate statistics from matches
  SELECT 
    COUNT(*) FILTER (WHERE 
      (home_team_id = p_team_id AND home_score > away_score) OR 
      (away_team_id = p_team_id AND away_score > home_score)
    ),
    COUNT(*) FILTER (WHERE home_score = away_score),
    COUNT(*) FILTER (WHERE 
      (home_team_id = p_team_id AND home_score < away_score) OR 
      (away_team_id = p_team_id AND away_score < home_score)
    ),
    SUM(CASE 
      WHEN home_team_id = p_team_id THEN home_score 
      ELSE away_score 
    END),
    SUM(CASE 
      WHEN home_team_id = p_team_id THEN away_score 
      ELSE home_score 
    END),
    COUNT(*)
  INTO 
    v_wins, v_draws, v_losses,
    v_goals_for, v_goals_against,
    v_matches_played
  FROM matches m
  WHERE 
    status = 'Encerrado' AND
    group_id = p_group_id AND
    (home_team_id = p_team_id OR away_team_id = p_team_id);

  -- Handle NULL values
  v_wins := COALESCE(v_wins, 0);
  v_draws := COALESCE(v_draws, 0);
  v_losses := COALESCE(v_losses, 0);
  v_goals_for := COALESCE(v_goals_for, 0);
  v_goals_against := COALESCE(v_goals_against, 0);
  v_matches_played := COALESCE(v_matches_played, 0);

  -- Update group_teams table
  UPDATE group_teams
  SET
    wins = v_wins,
    draws = v_draws,
    losses = v_losses,
    goals_for = v_goals_for,
    goals_against = v_goals_against,
    goal_difference = v_goals_for - v_goals_against,
    points = (v_wins * 3) + v_draws,
    matches_played = v_matches_played,
    updated_at = NOW()
  WHERE 
    group_id = p_group_id AND 
    team_id = p_team_id;

  -- Update positions within group
  WITH ranked_teams AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        ORDER BY 
          points DESC,                -- 1. Points
          goal_difference DESC,       -- 2. Goal difference
          goals_for DESC,            -- 3. Goals scored
          wins DESC,                 -- 4. Number of wins
          draws DESC,                -- 5. Number of draws
          goals_against ASC          -- 6. Goals against (fewer is better)
      ) as new_position
    FROM group_teams
    WHERE group_id = p_group_id
  )
  UPDATE group_teams gt
  SET position = rt.new_position
  FROM ranked_teams rt
  WHERE gt.id = rt.id;
END;
$$ LANGUAGE plpgsql;

-- Function to update championship standings
CREATE OR REPLACE FUNCTION update_championship_standings(
  p_championship_id UUID,
  p_team_id UUID
)
RETURNS void AS $$
DECLARE
  v_wins INTEGER := 0;
  v_draws INTEGER := 0;
  v_losses INTEGER := 0;
  v_goals_for INTEGER := 0;
  v_goals_against INTEGER := 0;
  v_matches_played INTEGER := 0;
BEGIN
  -- Calculate statistics from matches
  SELECT 
    COUNT(*) FILTER (WHERE 
      (home_team_id = p_team_id AND home_score > away_score) OR 
      (away_team_id = p_team_id AND away_score > home_score)
    ),
    COUNT(*) FILTER (WHERE home_score = away_score),
    COUNT(*) FILTER (WHERE 
      (home_team_id = p_team_id AND home_score < away_score) OR 
      (away_team_id = p_team_id AND away_score < home_score)
    ),
    SUM(CASE 
      WHEN home_team_id = p_team_id THEN home_score 
      ELSE away_score 
    END),
    SUM(CASE 
      WHEN home_team_id = p_team_id THEN away_score 
      ELSE home_score 
    END),
    COUNT(*)
  INTO 
    v_wins, v_draws, v_losses,
    v_goals_for, v_goals_against,
    v_matches_played
  FROM matches m
  WHERE 
    status = 'Encerrado' AND
    championship_id = p_championship_id AND
    (home_team_id = p_team_id OR away_team_id = p_team_id);

  -- Handle NULL values
  v_wins := COALESCE(v_wins, 0);
  v_draws := COALESCE(v_draws, 0);
  v_losses := COALESCE(v_losses, 0);
  v_goals_for := COALESCE(v_goals_for, 0);
  v_goals_against := COALESCE(v_goals_against, 0);
  v_matches_played := COALESCE(v_matches_played, 0);

  -- Update championship_standings table
  UPDATE championship_standings
  SET
    wins = v_wins,
    draws = v_draws,
    losses = v_losses,
    goals_for = v_goals_for,
    goals_against = v_goals_against,
    goal_difference = v_goals_for - v_goals_against,
    points = (v_wins * 3) + v_draws,
    matches_played = v_matches_played,
    updated_at = NOW()
  WHERE 
    championship_id = p_championship_id AND 
    team_id = p_team_id;

  -- Update positions
  WITH ranked_teams AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        ORDER BY 
          points DESC,                -- 1. Points
          goal_difference DESC,       -- 2. Goal difference
          goals_for DESC,            -- 3. Goals scored
          wins DESC,                 -- 4. Number of wins
          draws DESC,                -- 5. Number of draws
          goals_against ASC          -- 6. Goals against (fewer is better)
      ) as new_position
    FROM championship_standings
    WHERE championship_id = p_championship_id
  )
  UPDATE championship_standings cs
  SET position = rt.new_position
  FROM ranked_teams rt
  WHERE cs.id = rt.id;
END;
$$ LANGUAGE plpgsql;

-- Function to update match statistics
CREATE OR REPLACE FUNCTION update_match_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the match is marked as finished
  IF NEW.status = 'Encerrado' AND OLD.status != 'Encerrado' THEN
    -- If it's a group stage match
    IF NEW.format_type = 'groups' THEN
      -- Update group statistics for both teams
      PERFORM update_group_team_statistics(NEW.group_id, NEW.home_team_id);
      PERFORM update_group_team_statistics(NEW.group_id, NEW.away_team_id);
    ELSE
      -- Update championship standings for both teams
      PERFORM update_championship_standings(NEW.championship_id, NEW.home_team_id);
      PERFORM update_championship_standings(NEW.championship_id, NEW.away_team_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_match_statistics_trigger ON matches;

-- Create new trigger
CREATE TRIGGER update_match_statistics_trigger
  AFTER UPDATE OF status ON matches
  FOR EACH ROW
  WHEN (NEW.status = 'Encerrado' AND OLD.status != 'Encerrado')
  EXECUTE FUNCTION update_match_statistics();

-- Function to recalculate all statistics for a championship
CREATE OR REPLACE FUNCTION recalculate_championship_statistics(
  p_championship_id UUID
)
RETURNS void AS $$
DECLARE
  v_team_record RECORD;
  v_format_type TEXT;
BEGIN
  -- Get format type
  SELECT format_type INTO v_format_type
  FROM tournament_formats
  WHERE championship_id = p_championship_id;

  IF v_format_type = 'groups' THEN
    -- Reset group statistics
    UPDATE group_teams gt
    SET
      wins = 0,
      draws = 0,
      losses = 0,
      goals_for = 0,
      goals_against = 0,
      goal_difference = 0,
      points = 0,
      matches_played = 0,
      position = 0
    FROM tournament_groups tg
    WHERE tg.championship_id = p_championship_id
    AND gt.group_id = tg.id;

    -- Recalculate for each team in each group
    FOR v_team_record IN
      SELECT DISTINCT gt.group_id, gt.team_id
      FROM group_teams gt
      JOIN tournament_groups tg ON tg.id = gt.group_id
      WHERE tg.championship_id = p_championship_id
    LOOP
      PERFORM update_group_team_statistics(
        v_team_record.group_id,
        v_team_record.team_id
      );
    END LOOP;
  ELSE
    -- Reset championship standings
    UPDATE championship_standings
    SET
      wins = 0,
      draws = 0,
      losses = 0,
      goals_for = 0,
      goals_against = 0,
      goal_difference = 0,
      points = 0,
      matches_played = 0,
      position = 0
    WHERE championship_id = p_championship_id;

    -- Recalculate for each team
    FOR v_team_record IN
      SELECT team_id
      FROM championship_standings
      WHERE championship_id = p_championship_id
    LOOP
      PERFORM update_championship_standings(
        p_championship_id,
        v_team_record.team_id
      );
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Recalculate statistics for all active championships
DO $$
DECLARE
  v_championship_record RECORD;
BEGIN
  FOR v_championship_record IN
    SELECT id FROM championships WHERE is_active = true
  LOOP
    PERFORM recalculate_championship_statistics(v_championship_record.id);
  END LOOP;
END $$;