-- Adiciona coluna para cor do botão "Mais popular" do organizador
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cor_organizador text NULL;

