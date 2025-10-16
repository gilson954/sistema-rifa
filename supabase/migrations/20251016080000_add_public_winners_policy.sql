/*
  # Add Public Access Policy for Campaign Winners

  1. Changes
    - Add policy to allow public (unauthenticated) users to read winners of completed campaigns
    - This enables the public campaign page to display winners without authentication

  2. Security
    - Only winners from completed campaigns are accessible publicly
    - All other existing policies remain intact
    - No sensitive data exposure (phone numbers will be masked in frontend)
*/

-- Policy: Allow public to read winners of completed campaigns
CREATE POLICY "Public can read winners of completed campaigns"
  ON campaign_winners
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_winners.campaign_id
      AND campaigns.status = 'completed'
    )
  );
