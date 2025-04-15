/*
  # Add Match Predictions Feature

  1. New Tables
    - match_predictions: Stores user predictions for matches
    - prediction_stats: Stores aggregated prediction statistics

  2. Security
    - Enable RLS
    - Add policies for public access
    - Add rate limiting via IP

  3. Functions
    - get_prediction_stats: Calculate prediction percentages
    - update_prediction_stats: Update aggregated stats
*/

-- Create match predictions table
CREATE TABLE IF NOT EXISTS match_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  prediction text CHECK (prediction IN ('home', 'draw', 'away')),
  ip_address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create prediction stats table
CREATE TABLE IF NOT EXISTS prediction_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  home_votes integer DEFAULT 0,
  draw_votes integer DEFAULT 0,
  away_votes integer DEFAULT 0,
  total_votes integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(match_id)
);

-- Enable RLS
ALTER TABLE match_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public to create predictions"
  ON match_predictions
  FOR INSERT
  TO public
  WITH CHECK (
    -- Check if match exists and is not finished
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
      AND m.status != 'Encerrado'
    ) AND
    -- Rate limit: one vote per IP per match
    NOT EXISTS (
      SELECT 1 FROM match_predictions mp
      WHERE mp.match_id = match_id
      AND mp.ip_address = ip_address
    )
  );

CREATE POLICY "Allow public to view prediction stats"
  ON prediction_stats
  FOR SELECT
  TO public
  USING (true);

-- Function to get prediction stats
CREATE OR REPLACE FUNCTION get_prediction_stats(p_match_id uuid)
RETURNS json AS $$
DECLARE
  v_stats prediction_stats;
BEGIN
  SELECT * INTO v_stats
  FROM prediction_stats
  WHERE match_id = p_match_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'home_percentage', 0,
      'draw_percentage', 0,
      'away_percentage', 0,
      'total_votes', 0
    );
  END IF;

  RETURN json_build_object(
    'home_percentage', ROUND((v_stats.home_votes::float / NULLIF(v_stats.total_votes, 0) * 100)::numeric, 1),
    'draw_percentage', ROUND((v_stats.draw_votes::float / NULLIF(v_stats.total_votes, 0) * 100)::numeric, 1),
    'away_percentage', ROUND((v_stats.away_votes::float / NULLIF(v_stats.total_votes, 0) * 100)::numeric, 1),
    'total_votes', v_stats.total_votes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update prediction stats
CREATE OR REPLACE FUNCTION update_prediction_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO prediction_stats (
    match_id,
    home_votes,
    draw_votes,
    away_votes,
    total_votes
  )
  VALUES (
    NEW.match_id,
    CASE WHEN NEW.prediction = 'home' THEN 1 ELSE 0 END,
    CASE WHEN NEW.prediction = 'draw' THEN 1 ELSE 0 END,
    CASE WHEN NEW.prediction = 'away' THEN 1 ELSE 0 END,
    1
  )
  ON CONFLICT (match_id) DO UPDATE
  SET
    home_votes = prediction_stats.home_votes + 
      CASE WHEN NEW.prediction = 'home' THEN 1 ELSE 0 END,
    draw_votes = prediction_stats.draw_votes + 
      CASE WHEN NEW.prediction = 'draw' THEN 1 ELSE 0 END,
    away_votes = prediction_stats.away_votes + 
      CASE WHEN NEW.prediction = 'away' THEN 1 ELSE 0 END,
    total_votes = prediction_stats.total_votes + 1,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating stats
CREATE TRIGGER update_prediction_stats_trigger
  AFTER INSERT ON match_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_prediction_stats();