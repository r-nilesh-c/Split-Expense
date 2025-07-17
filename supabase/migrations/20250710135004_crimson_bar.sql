/*
  # Fix infinite recursion in group_members policy

  1. Security
    - Create a security definer function in public schema to check group membership
    - Replace the problematic policy that causes infinite recursion
    - Maintain the same security model: users can only see group members for groups they belong to

  2. Changes
    - Drop existing recursive policy
    - Create helper function to check group membership
    - Create new policy using the helper function
*/

-- Create a security definer function to check group membership
-- This function bypasses RLS to avoid recursion
CREATE OR REPLACE FUNCTION public.user_is_group_member(group_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = group_uuid 
    AND user_id = auth.uid()
  );
$$;

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can view group members for groups they belong to" ON group_members;

-- Create new policy using the security definer function
CREATE POLICY "Users can view group members for groups they belong to"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (public.user_is_group_member(group_id));