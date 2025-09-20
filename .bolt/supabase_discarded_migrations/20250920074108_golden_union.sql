/*
  # Create RLS policy for public profiles view

  1. Security
    - Enable RLS on public_profiles_view
    - Add policy for anonymous users to read public profile data
    - This allows public access to customization data (theme, colors, logo, etc.)
*/

-- Enable RLS on the view
ALTER VIEW public.public_profiles_view SET (security_invoker = true);

-- Create policy to allow anonymous users to read from the view
CREATE POLICY "Allow anon read on public profiles view"
  ON public.public_profiles_view
  FOR SELECT
  TO anon
  USING (true);

-- Also allow authenticated users to read from the view
CREATE POLICY "Allow authenticated read on public profiles view"
  ON public.public_profiles_view
  FOR SELECT
  TO authenticated
  USING (true);