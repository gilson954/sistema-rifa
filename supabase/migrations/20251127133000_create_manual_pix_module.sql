-- Tabelas para PIX manual
CREATE TABLE IF NOT EXISTS public.manual_pix_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  key_type text NOT NULL CHECK (key_type IN ('telefone','cpf','cnpj','email','aleatoria')),
  key_value text NOT NULL,
  holder_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manual_pix_keys_user ON public.manual_pix_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_pix_keys_type ON public.manual_pix_keys(key_type);

ALTER TABLE public.manual_pix_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can select own pix keys"
  ON public.manual_pix_keys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert pix keys"
  ON public.manual_pix_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update pix keys"
  ON public.manual_pix_keys
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can delete pix keys"
  ON public.manual_pix_keys
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comprovantes de pagamento manual
CREATE TABLE IF NOT EXISTS public.manual_payment_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_phone text,
  customer_name text,
  image_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manual_payment_proofs_campaign ON public.manual_payment_proofs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_manual_payment_proofs_order ON public.manual_payment_proofs(order_id);
CREATE INDEX IF NOT EXISTS idx_manual_payment_proofs_status ON public.manual_payment_proofs(status);

ALTER TABLE public.manual_payment_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizer can view campaign proofs"
  ON public.manual_payment_proofs
  FOR SELECT
  TO authenticated
  USING (organizer_id = auth.uid());

CREATE POLICY "Organizer can update campaign proofs"
  ON public.manual_payment_proofs
  FOR UPDATE
  TO authenticated
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Authenticated can insert proofs"
  ON public.manual_payment_proofs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Bucket para comprovantes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'manual-payment-proofs',
  'manual-payment-proofs',
  false,
  10485760,
  ARRAY['image/png','image/jpeg','image/jpg']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can upload manual proofs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'manual-payment-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authenticated can view own manual proofs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'manual-payment-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can view all manual proofs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'manual-payment-proofs' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Função para aprovar pagamento manual
CREATE OR REPLACE FUNCTION public.approve_manual_payment(p_order_id text, p_campaign_id uuid)
RETURNS TABLE(quota_number int, updated boolean) AS $$
DECLARE
BEGIN
  RETURN QUERY
  UPDATE public.tickets t
  SET status = 'comprado', bought_at = now(), updated_at = now()
  WHERE t.campaign_id = p_campaign_id AND t.status = 'reservado' AND t.order_id = p_order_id
  RETURNING t.quota_number, true;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION public.approve_manual_payment(text, uuid) TO authenticated;

-- Função para rejeitar pagamento manual
CREATE OR REPLACE FUNCTION public.reject_manual_payment(p_proof_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.manual_payment_proofs
  SET status = 'rejected', updated_at = now()
  WHERE id = p_proof_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION public.reject_manual_payment(uuid) TO authenticated;
