/*
  # Atualizar public_profiles_view com campos de personalização

  1. Modificações
    - Recriar a view public_profiles_view incluindo os novos campos:
      - color_mode (modo de cor: solid ou gradient)
      - gradient_classes (classes CSS do gradiente)
      - custom_gradient_colors (array JSON de cores customizadas)

  2. Segurança
    - Mantém exposição apenas de campos públicos/seguros
    - Não expõe dados sensíveis como email ou CPF
    - Permite acesso anônimo para customização de campanhas públicas

  3. Observações
    - View é usada pela API PublicProfiles para carregar customização
    - Campos são expostos para permitir preview de campanhas com branding do organizador
*/

-- Recriar a view public_profiles_view com os novos campos
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
  custom_gradient_colors
FROM profiles;

-- Garantir que a view é acessível publicamente para campanhas
GRANT SELECT ON public_profiles_view TO anon, authenticated;

-- Adicionar comentário descritivo na view
COMMENT ON VIEW public_profiles_view IS 'View pública de perfis expondo apenas campos seguros para customização visual de campanhas';
