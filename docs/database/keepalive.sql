-- Manancial: aplicar SOMENTE no banco realmente utilizado pelo PWA publicado.
-- Executar via migração aprovada ou editor SQL do projeto correto, após backup.
-- Não altera, remove ou atualiza usuários, escalas ou arquivos.
BEGIN;

CREATE TABLE IF NOT EXISTS public.keepalive (
  id bigint PRIMARY KEY
);

ALTER TABLE public.keepalive ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.keepalive TO anon;

DROP POLICY IF EXISTS "manancial_keepalive_anon_read" ON public.keepalive;
CREATE POLICY "manancial_keepalive_anon_read"
  ON public.keepalive
  FOR SELECT
  TO anon
  USING (true);

INSERT INTO public.keepalive (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Verificação: SELECT id FROM public.keepalive LIMIT 1;
-- A chave publicável é suficiente para esta leitura específica.
