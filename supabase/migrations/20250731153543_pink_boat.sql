/*
  # Add reservation timeout control to campaigns

  1. New Columns
    - `reservation_timeout_minutes` (integer) - Timeout in minutes for ticket reservations per campaign
  
  2. Changes
    - Add reservation_timeout_minutes column to campaigns table with default value of 15 minutes
    - Add check constraint to ensure valid timeout values
    - Add index for performance optimization
  
  3. Security
    - No RLS changes needed as this inherits existing campaign policies
*/

-- Add reservation timeout column to campaigns table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'reservation_timeout_minutes'
  ) THEN
    ALTER TABLE public.campaigns 
    ADD COLUMN reservation_timeout_minutes INTEGER DEFAULT 15;
  END IF;
END $$;

-- Add check constraint to ensure valid timeout values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'campaigns_reservation_timeout_check'
  ) THEN
    ALTER TABLE public.campaigns
    ADD CONSTRAINT campaigns_reservation_timeout_check 
    CHECK (reservation_timeout_minutes > 0 AND reservation_timeout_minutes <= 10080); -- Max 7 days
  END IF;
END $$;

-- Add index for performance when querying by reservation timeout
CREATE INDEX IF NOT EXISTS idx_campaigns_reservation_timeout 
ON public.campaigns (reservation_timeout_minutes) 
WHERE reservation_timeout_minutes IS NOT NULL;

-- Update existing campaigns to have the default timeout if they don't have one
UPDATE public.campaigns 
SET reservation_timeout_minutes = 15 
WHERE reservation_timeout_minutes IS NULL;