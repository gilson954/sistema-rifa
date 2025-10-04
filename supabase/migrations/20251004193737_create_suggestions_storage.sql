-- Create storage bucket for suggestion attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'suggestion-attachments',
  'suggestion-attachments',
  false,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users can upload files to their own folder
CREATE POLICY "Users can upload suggestion attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'suggestion-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can view their own uploaded files
CREATE POLICY "Users can view own attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'suggestion-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Admins can view all suggestion attachments
CREATE POLICY "Admins can view all attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'suggestion-attachments' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policy: Users can delete their own attachments
CREATE POLICY "Users can delete own attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'suggestion-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Admins can delete any attachment
CREATE POLICY "Admins can delete any attachment"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'suggestion-attachments' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );