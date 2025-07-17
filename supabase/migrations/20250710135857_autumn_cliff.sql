/*
  # Fix Groups RLS Policy

  1. Security Updates
    - Update the INSERT policy for groups table to use correct auth.uid() function
    - Ensure users can create groups where they are the creator

  2. Changes
    - Drop existing INSERT policy that may be using incorrect uid() reference
    - Create new INSERT policy with proper auth.uid() reference
*/

-- Drop the existing INSERT policy for groups
DROP POLICY IF EXISTS "Users can create groups" ON groups;

-- Create a new INSERT policy with correct auth.uid() reference
CREATE POLICY "Users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());