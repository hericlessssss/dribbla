/*
  # Fix Group Stage Implementation

  1. Changes
    - Drop existing policies before creating new ones
    - Create match groups and team groups tables
    - Add RLS policies for group management
    - Add group_name column to standings
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view match groups" ON match_groups;
DROP POLICY IF EXISTS "Organizers can manage match groups" ON match_groups;
DROP POLICY IF EXISTS "Users can view team groups" ON team_groups;
DROP POLICY IF EXISTS "Organizers can manage team groups" ON team_groups;

-- Create match groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS match_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id uuid REFERENCES championships(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(championship_id, name)
);

-- Create team groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS team_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES match_groups(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, team_id)
);

-- Enable RLS
ALTER TABLE match_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_groups ENABLE ROW LEVEL SECURITY;

-- Create policies for match_groups
CREATE POLICY "Users can view match groups"
  ON match_groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM championships c
      WHERE c.id = championship_id
      AND (c.is_active = true OR c.organizer_id = auth.uid())
    )
  );

CREATE POLICY "Organizers can manage match groups"
  ON match_groups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM championships c
      WHERE c.id = championship_id
      AND c.organizer_id = auth.uid()
    )
  );

-- Create policies for team_groups
CREATE POLICY "Users can view team groups"
  ON team_groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM match_groups g
      JOIN championships c ON c.id = g.championship_id
      WHERE g.id = group_id
      AND (c.is_active = true OR c.organizer_id = auth.uid())
    )
  );

CREATE POLICY "Organizers can manage team groups"
  ON team_groups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM match_groups g
      JOIN championships c ON c.id = g.championship_id
      WHERE g.id = group_id
      AND c.organizer_id = auth.uid()
    )
  );

-- Add group_name column to championship_standings if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'championship_standings' 
    AND column_name = 'group_name'
  ) THEN
    ALTER TABLE championship_standings 
    ADD COLUMN group_name text;
  END IF;
END $$;