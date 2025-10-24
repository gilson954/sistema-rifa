/*
  # Update Max Tickets Per Purchase from 1,000 to 20,000

  1. Problem
    - Current default limit of 1,000 tickets per purchase is too restrictive
    - Market standard for online raffles is 20,000 tickets per purchase
    - Users cannot purchase 20,000 tickets even when available in automatic mode
    - Error: "O campo máximo de cotas permitidas por compra não pode conter um valor superior a 20000"

  2. Solution
    - Update DEFAULT value from 1,000 to 20,000 for new campaigns
    - Update ALL existing campaigns that have max_tickets_per_purchase = 1,000 to 20,000
    - This aligns with competitor standards and user expectations

  3. Changes
    - Alter campaigns table to change DEFAULT for max_tickets_per_purchase: 1000 → 20000
    - Update existing campaigns with max_tickets_per_purchase = 1000 to 20000
    - Maintains backward compatibility for campaigns with custom limits
*/

-- Update the default value for new campaigns
ALTER TABLE campaigns
ALTER COLUMN max_tickets_per_purchase SET DEFAULT 20000;

-- Update all existing campaigns that have the old default value of 1000
UPDATE campaigns
SET max_tickets_per_purchase = 20000
WHERE max_tickets_per_purchase = 1000;
