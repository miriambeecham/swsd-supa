/*
  # Convert price from cents to dollars

  1. Changes
    - Convert existing price_cents values to dollars (divide by 100)
    - Rename price_cents column to price_dollars
    - Update column type to decimal for proper dollar amounts

  2. Data Migration
    - Safely converts existing cent values to dollar values
    - Maintains data integrity during conversion
*/

-- First, add the new price_dollars column
ALTER TABLE classes ADD COLUMN price_dollars DECIMAL(10,2) DEFAULT 0.00;

-- Convert existing cent values to dollars
UPDATE classes SET price_dollars = COALESCE(price_cents, 0) / 100.0;

-- Drop the old cents column
ALTER TABLE classes DROP COLUMN price_cents;

-- Add a check constraint to ensure positive prices
ALTER TABLE classes ADD CONSTRAINT classes_price_dollars_check CHECK (price_dollars >= 0);