/*
  # Add promotions column to campaigns table

  1. Schema Changes
    - Add `promotions` column to `campaigns` table
    - Column type: jsonb[] (array of JSONB objects)
    - Allows storing multiple promotion objects per campaign
    - Default value: empty array

  2. Data Structure
    Each promotion object will contain:
    - id: string (unique identifier)
    - ticketQuantity: number (quantity of tickets in promotion)
    - totalValue: number (promotional total value)
    - originalTotalValue: number (original total value without discount)
    - promotionalPricePerTicket: number (price per ticket in promotion)

  3. Security
    - Existing RLS policies will apply to the new column
    - No additional security changes needed
*/

-- Add promotions column to campaigns table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'promotions'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN promotions jsonb[] DEFAULT '{}';
  END IF;
END $$;

-- Add index for better query performance on promotions
CREATE INDEX IF NOT EXISTS idx_campaigns_promotions 
ON campaigns USING gin (promotions);

-- Add comment to document the column
COMMENT ON COLUMN campaigns.promotions IS 'Array of promotion objects containing ticket quantity, values, and discount information';