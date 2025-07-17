/*
  # Fix Groups RLS Chicken-and-Egg Problem

  1. Policy Changes
    - Update SELECT policy to allow group creators to see their own groups
    - Keep existing INSERT policy for group creation
    - Ensure group creators can see groups they created even before becoming members

  2. Security
    - Maintain RLS protection
    - Allow creators to see their groups
    - Allow members to see groups they belong to
*/

-- Drop existing SELECT policy for groups
DROP POLICY IF EXISTS "Users can view groups they belong to" ON groups;

-- Create new SELECT policy that allows both group creators and members to view groups
CREATE POLICY "Users can view groups they belong to or created"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR user_is_group_member(id)
  );