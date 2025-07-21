/*
  # Add expiration and image support to campaigns

  1. New Columns
    - `expires_at` (timestamp) - Campaign expiration date (2 days from creation)
    - `prize_image_urls` (text array) - URLs of uploaded prize images

  2. Changes
    - Add expires_at column for automatic campaign expiration
    - Add prize_image_urls column for multiple prize images
    - Update existing campaigns to have null values for new columns

  3. Notes
    - expires_at will be set to created_at + 2 days for draft campaigns
    - prize_image_urls will store array of Supabase Storage URLs
*/

-- Add expires_at column for campaign expiration
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- Add prize_image_urls column for multiple prize images
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS prize_image_urls text[];

-- Update existing draft campaigns to have expires_at set to 2 days from creation
UPDATE public.campaigns 
SET expires_at = created_at + INTERVAL '2 days'
WHERE status = 'draft' AND expires_at IS NULL;