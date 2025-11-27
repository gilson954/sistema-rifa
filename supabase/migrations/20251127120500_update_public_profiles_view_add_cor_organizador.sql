-- Atualiza a view public_profiles_view para incluir coluna cor_organizador
-- Mantém retrocompatibilidade e adiciona colunas já usadas pela aplicação

CREATE OR REPLACE VIEW public_profiles_view AS
SELECT 
  p.id,
  p.name,
  p.avatar_url,
  p.primary_color,
  p.theme,
  p.logo_url,
  p.social_media_links,
  p.payment_integrations_config,
  p.color_mode,
  p.gradient_classes,
  p.custom_gradient_colors,
  p.quota_selector_buttons,
  p.quota_selector_popular_index,
  p.cor_organizador
FROM public.profiles p;

GRANT SELECT ON public_profiles_view TO anon;
GRANT SELECT ON public_profiles_view TO authenticated;
