-- Voltar buckets de imagens para público (permite leitura por URL direta)
UPDATE storage.buckets SET public = true WHERE id IN ('members', 'outfits', 'fardamentos');

-- Remover as policies de SELECT que exigiam autenticação (não funcionam com getPublicUrl)
DROP POLICY IF EXISTS "outfits authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "members authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "fardamentos authenticated read" ON storage.objects;

-- access-requests permanece privado; admin lê via signed URL se necessário