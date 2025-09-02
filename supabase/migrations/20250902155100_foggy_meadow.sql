```sql
-- Fix the RLS policy for INSERT to correctly extract the full UUID from the filename
ALTER POLICY "Allow authenticated users to upload their own logos"
ON storage.objects
USING (
  bucket_id = 'logos' AND
  auth.uid()::text = substring(name from 1 for 36) AND -- Correctly extract the full 36-char UUID
  (
    (lower(substring(name from '.*\.([a-zA-Z0-9]+)$')) = 'jpg') OR
    (lower(substring(name from '.*\.([a-zA-Z0-9]+)$')) = 'jpeg') OR
    (lower(substring(name from '.*\.([a-zA-Z0-9]+)$')) = 'png') OR
    (lower(substring(name from '.*\.([a-zA-Z0-9]+)$')) = 'webp')
  ) AND
  (bytea_length(decode(encode(object_name(name), 'base64'), 'base64')) <= 5 * 1024 * 1024) -- 5MB limit
);

-- Fix the RLS policy for UPDATE to correctly extract the full UUID from the filename
ALTER POLICY "Allow authenticated users to update their own logos"
ON storage.objects
USING (
  bucket_id = 'logos' AND
  auth.uid()::text = substring(name from 1 for 36) -- Correctly extract the full 36-char UUID
);

-- Fix the RLS policy for DELETE to correctly extract the full UUID from the filename
ALTER POLICY "Allow authenticated users to delete their own logos"
ON storage.objects
USING (
  bucket_id = 'logos' AND
  auth.uid()::text = substring(name from 1 for 36) -- Correctly extract the full 36-char UUID
);
```