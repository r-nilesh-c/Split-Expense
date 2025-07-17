/*
  # Complete Expense Splitting App Schema

  1. New Tables
    - `groups` - Main groups for expense splitting
    - `group_members` - Users belonging to groups
    - `expenses` - Individual expenses within groups
    - `expense_splits` - How expenses are split among users
    - `settlements` - Records of payments between users

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Ensure users can only access groups they belong to

  3. Features
    - UUID primary keys with automatic generation
    - Proper foreign key relationships
    - Timestamps with automatic defaults
    - Decimal precision for monetary amounts
*/

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  paid_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create expense_splits table
CREATE TABLE IF NOT EXISTS expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  UNIQUE(expense_id, user_id)
);

-- Create settlements table
CREATE TABLE IF NOT EXISTS settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  from_user uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  settled_at timestamptz DEFAULT now(),
  CHECK (from_user != to_user)
);

-- Enable Row Level Security
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Users can view groups they belong to"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

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

-- Group members policies
CREATE POLICY "Users can view group members for groups they belong to"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Expenses policies
CREATE POLICY "Users can view expenses for groups they belong to"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Expense creators can update their expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (paid_by = auth.uid())
  WITH CHECK (paid_by = auth.uid());

CREATE POLICY "Expense creators can delete their expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (paid_by = auth.uid());

-- Expense splits policies
CREATE POLICY "Users can view expense splits for groups they belong to"
  ON expense_splits
  FOR SELECT
  TO authenticated
  USING (
    expense_id IN (
      SELECT e.id FROM expenses e
      JOIN group_members gm ON e.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create expense splits"
  ON expense_splits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    expense_id IN (
      SELECT e.id FROM expenses e
      JOIN group_members gm ON e.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update expense splits they're involved in"
  ON expense_splits
  FOR UPDATE
  TO authenticated
  USING (
    expense_id IN (
      SELECT e.id FROM expenses e
      WHERE e.paid_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete expense splits they created"
  ON expense_splits
  FOR DELETE
  TO authenticated
  USING (
    expense_id IN (
      SELECT e.id FROM expenses e
      WHERE e.paid_by = auth.uid()
    )
  );

-- Settlements policies
CREATE POLICY "Users can view settlements for groups they belong to"
  ON settlements
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create settlements"
  ON settlements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
    AND (from_user = auth.uid() OR to_user = auth.uid())
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user_id ON expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_group_id ON settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_settlements_from_user ON settlements(from_user);
CREATE INDEX IF NOT EXISTS idx_settlements_to_user ON settlements(to_user);