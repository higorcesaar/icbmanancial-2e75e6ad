-- Privatizar buckets para impedir listagem pública (mantém leitura via URL para autenticados)
UPDATE storage.buckets SET public = false WHERE id IN ('members', 'outfits', 'fardamentos');

-- Substituir leitura pública por leitura autenticada (qualquer usuário logado pode ver imagens individuais)
DROP POLICY IF EXISTS "outfits public read" ON storage.objects;
DROP POLICY IF EXISTS "members public read" ON storage.objects;
DROP POLICY IF EXISTS "fardamentos public read" ON storage.objects;

CREATE POLICY "outfits authenticated read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'outfits');

CREATE POLICY "members authenticated read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'members');

CREATE POLICY "fardamentos authenticated read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'fardamentos');