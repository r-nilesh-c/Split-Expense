/*
  # Add QR Code Support for UPI Payments

  1. Database Changes
    - Add `upi_qr_code_url` column to `profiles` table to store QR code image URLs
    - Add `status` column to `settlements` table to track payment status
    - Add `payment_method` column to `settlements` table to track how payment was made

  2. Security
    - Update RLS policies to allow users to manage their own QR codes
    - Ensure settlement status can only be updated by involved parties
*/

-- Add QR code URL column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'upi_qr_code_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN upi_qr_code_url text;
  END IF;
END $$;

-- Add status column to settlements table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settlements' AND column_name = 'status'
  ) THEN
    ALTER TABLE settlements ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled'));
  END IF;
END $$;

-- Add payment method column to settlements table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settlements' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE settlements ADD COLUMN payment_method text CHECK (payment_method IN ('manual', 'upi_qr', 'cash'));
  END IF;
END $$;

-- Update RLS policies for profiles to allow QR code management
CREATE POLICY "Users can update their own QR code"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Update RLS policies for settlements to allow status updates
CREATE POLICY "Settlement parties can update status"
  ON settlements
  FOR UPDATE
  TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid())
  WITH CHECK (from_user = auth.uid() OR to_user = auth.uid());