ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quota_selector_buttons jsonb;

CREATE OR REPLACE VIEW public_profiles_view AS
SELECT
  id,
  name,
  avatar_url,
  primary_color,
  theme,
  logo_url,
  social_media_links,
  payment_integrations_config,
  color_mode,
  gradient_classes,
  custom_gradient_colors,
  quota_selector_buttons
FROM profiles;

GRANT SELECT ON public_profiles_view TO anon, authenticated;
