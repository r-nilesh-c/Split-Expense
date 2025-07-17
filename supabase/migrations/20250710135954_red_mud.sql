/*
  # Fix Groups RLS Policy

  1. Security Updates
    - Update the INSERT policy for groups table to use correct auth.uid() function
    - Ensure the policy allows authenticated users to create groups where they are the creator
    - Update other policies to use auth.uid() consistently

  2. Changes
    - Drop existing policies that may have incorrect uid() references
    - Recreate policies with proper auth.uid() function calls
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON groups;
DROP POLICY IF EXISTS "Group creators can delete their groups" ON groups;
DROP POLICY IF EXISTS "Users can view groups they belong to" ON groups;

-- Recreate policies with correct auth.uid() function
CREATE POLICY "Users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group creators can update their groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group creators can delete their groups"
  ON groups
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can view groups they belong to"
  ON groups
  FOR SELECT
  TO authenticated
  USING (user_is_group_member(id));