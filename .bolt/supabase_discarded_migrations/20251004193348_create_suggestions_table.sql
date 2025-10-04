/*
  # Create Suggestions Table with File Attachment Support

  1. New Table: suggestions
    - `id` (uuid, primary key) - Unique identifier for each suggestion
    - `user_id` (uuid, nullable, foreign key) - Reference to auth.users, can be null for anonymous suggestions
    - `user_name` (text, required) - Name of the user submitting the suggestion
    - `user_email` (text, required) - Email of the user submitting the suggestion
    - `subject` (text, required) - Brief subject/title of the suggestion (min 5, max 200 chars)
    - `type` (text, required) - Type of suggestion: bug_report, feature_request, improvement, other
    - `priority` (text, required) - Priority level: low, medium, high
    - `message` (text, required) - Detailed message/description (min 10, max 5000 chars)
    - `status` (text, required) - Status: new, in_progress, resolved, rejected
    - `attachment_url` (text, nullable) - URL to the uploaded file in Supabase Storage
    - `attachment_name` (text, nullable) - Original name of the uploaded file
    - `attachment_size` (integer, nullable) - Size of the uploaded file in bytes
    - `created_at` (timestamptz) - Timestamp when suggestion was created
    - `updated_at` (timestamptz) - Timestamp when suggestion was last updated

  2. Security
    - Enable RLS on suggestions table
    - Policy: Users can create suggestions (authenticated or anonymous)
    - Policy: Users can view their own suggestions
    - Policy: Admins can view and manage all suggestions

  3. Indexes
    - Index on user_id for faster user-specific queries
    - Index on status for filtering by status
    - Index on type for filtering by type
    - Index on priority for filtering by priority
    - Index on created_at for sorting

  4. Constraints
    - Foreign key constraint on user_id with CASCADE delete
    - Check constraints for valid enum values
    - Check constraint for message length (max 5000 chars)
    - Check constraint for attachment size (max 10MB = 10485760 bytes)
    - Check constraint for valid email format
*/

-- Create suggestions table
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_email text NOT NULL,
  subject text NOT NULL,
  type text NOT NULL,
  priority text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  attachment_url text,
  attachment_name text,
  attachment_size integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints for valid enum values
ALTER TABLE suggestions ADD CONSTRAINT suggestions_type_check
CHECK (type IN ('bug_report', 'feature_request', 'improvement', 'other'));

ALTER TABLE suggestions ADD CONSTRAINT suggestions_priority_check
CHECK (priority IN ('low', 'medium', 'high'));

ALTER TABLE suggestions ADD CONSTRAINT suggestions_status_check
CHECK (status IN ('new', 'in_progress', 'resolved', 'rejected'));

-- Add constraint for message length
ALTER TABLE suggestions ADD CONSTRAINT suggestions_message_length_check
CHECK (char_length(message) >= 10 AND char_length(message) <= 5000);

-- Add constraint for subject length
ALTER TABLE suggestions ADD CONSTRAINT suggestions_subject_length_check
CHECK (char_length(subject) >= 5 AND char_length(subject) <= 200);

-- Add constraint for attachment size (max 10MB)
ALTER TABLE suggestions ADD CONSTRAINT suggestions_attachment_size_check
CHECK (attachment_size IS NULL OR (attachment_size > 0 AND attachment_size <= 10485760));

-- Add constraint for email format
ALTER TABLE suggestions ADD CONSTRAINT suggestions_email_format_check
CHECK (user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_type ON suggestions(type);
CREATE INDEX IF NOT EXISTS idx_suggestions_priority ON suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions(created_at DESC);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS suggestions_updated_at_trigger ON suggestions;
CREATE TRIGGER suggestions_updated_at_trigger
  BEFORE UPDATE ON suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_suggestions_updated_at();

-- Enable Row Level Security
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone (authenticated or not) can create suggestions
CREATE POLICY "Anyone can create suggestions"
  ON suggestions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Users can view their own suggestions (if they're authenticated and user_id matches)
CREATE POLICY "Users can view own suggestions"
  ON suggestions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins can view all suggestions
CREATE POLICY "Admins can view all suggestions"
  ON suggestions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policy: Admins can update any suggestion
CREATE POLICY "Admins can update suggestions"
  ON suggestions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policy: Admins can delete suggestions
CREATE POLICY "Admins can delete suggestions"
  ON suggestions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Add helpful comments
COMMENT ON TABLE suggestions IS 'User suggestions, bug reports, and feedback';
COMMENT ON COLUMN suggestions.id IS 'Unique identifier for the suggestion';
COMMENT ON COLUMN suggestions.user_id IS 'Reference to the user who created the suggestion (nullable for anonymous)';
COMMENT ON COLUMN suggestions.user_name IS 'Name of the user submitting the suggestion';
COMMENT ON COLUMN suggestions.user_email IS 'Email of the user submitting the suggestion';
COMMENT ON COLUMN suggestions.subject IS 'Brief subject/title of the suggestion';
COMMENT ON COLUMN suggestions.type IS 'Type: bug_report, feature_request, improvement, other';
COMMENT ON COLUMN suggestions.priority IS 'Priority level: low, medium, high';
COMMENT ON COLUMN suggestions.message IS 'Detailed description of the suggestion';
COMMENT ON COLUMN suggestions.status IS 'Status: new, in_progress, resolved, rejected';
COMMENT ON COLUMN suggestions.attachment_url IS 'URL to uploaded file in Supabase Storage';
COMMENT ON COLUMN suggestions.attachment_name IS 'Original filename of the attachment';
COMMENT ON COLUMN suggestions.attachment_size IS 'Size of the attachment in bytes';
COMMENT ON COLUMN suggestions.created_at IS 'Timestamp when suggestion was created';
COMMENT ON COLUMN suggestions.updated_at IS 'Timestamp when suggestion was last updated';
