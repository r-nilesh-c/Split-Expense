/*
  # Fix Groups RLS Policy

  1. Policy Changes
    - Update groups policies to avoid circular dependencies
    - Simplify INSERT policy for groups to only check created_by
    - Update SELECT policy to use the helper function we created

  2. Security
    - Maintain proper access control
    - Ensure users can only see groups they belong to
    - Allow users to create groups they own
*/

-- Drop existing problematic policies for groups
DROP POLICY IF EXISTS "Users can view groups they belong to" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;

-- Create simplified policies for groups
CREATE POLICY "Users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view groups they belong to"
  ON groups
  FOR SELECT
  TO authenticated
  USING (public.user_is_group_member(id));

-- Also update other policies that might have similar issues
DROP POLICY IF EXISTS "Users can view expenses for groups they belong to" ON expenses;
DROP POLICY IF EXISTS "Group members can create expenses" ON expenses;

CREATE POLICY "Users can view expenses for groups they belong to"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (public.user_is_group_member(group_id));

CREATE POLICY "Group members can create expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_is_group_member(group_id));

-- Update settlements policies
DROP POLICY IF EXISTS "Users can view settlements for groups they belong to" ON settlements;
DROP POLICY IF EXISTS "Group members can create settlements" ON settlements;

CREATE POLICY "Users can view settlements for groups they belong to"
  ON settlements
  FOR SELECT
  TO authenticated
  USING (public.user_is_group_member(group_id));

CREATE POLICY "Group members can create settlements"
  ON settlements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_is_group_member(group_id)
    AND (from_user = auth.uid() OR to_user = auth.uid())
  );