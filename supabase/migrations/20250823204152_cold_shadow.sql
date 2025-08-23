/*
  # Add show_draw_date column to campaigns table

  1. New Columns
    - `show_draw_date` (boolean, default false) - Controls whether the draw date is displayed publicly on the campaign page

  2. Changes
    - Added show_draw_date column to campaigns table with default value false
    - Column allows campaigns to control visibility of draw date information

  3. Security
    - No RLS changes needed as this inherits existing campaign table policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'show_draw_date'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN show_draw_date boolean DEFAULT false;
  END IF;
END $$;