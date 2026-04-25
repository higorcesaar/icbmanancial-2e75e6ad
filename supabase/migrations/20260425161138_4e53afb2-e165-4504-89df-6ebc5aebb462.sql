-- 1) Privatizar bucket access-requests (mantém URLs assinadas funcionando, evita listagem pública)
UPDATE storage.buckets SET public = false WHERE id = 'access-requests';

-- Limpar policies existentes dos buckets de storage para reescrever
DROP POLICY IF EXISTS "access-requests upload public" ON storage.objects;
DROP POLICY IF EXISTS "access-requests select public" ON storage.objects;
DROP POLICY IF EXISTS "access requests upload" ON storage.objects;
DROP POLICY IF EXISTS "access requests select" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload access requests" ON storage.objects;
DROP POLICY IF EXISTS "Public access requests" ON storage.objects;

DROP POLICY IF EXISTS "outfits insert" ON storage.objects;
DROP POLICY IF EXISTS "outfits update" ON storage.objects;
DROP POLICY IF EXISTS "outfits delete" ON storage.objects;
DROP POLICY IF EXISTS "outfits select" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload outfits" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update outfits" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete outfits" ON storage.objects;
DROP POLICY IF EXISTS "Public can read outfits" ON storage.objects;

DROP POLICY IF EXISTS "members insert" ON storage.objects;
DROP POLICY IF EXISTS "members update" ON storage.objects;
DROP POLICY IF EXISTS "members delete" ON storage.objects;
DROP POLICY IF EXISTS "members select" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload members" ON storage.objects;
DROP POLICY IF EXISTS "Public can read members" ON storage.objects;

DROP POLICY IF EXISTS "fardamentos insert" ON storage.objects;
DROP POLICY IF EXISTS "fardamentos update" ON storage.objects;
DROP POLICY IF EXISTS "fardamentos delete" ON storage.objects;
DROP POLICY IF EXISTS "fardamentos select" ON storage.objects;

-- 2) Bucket access-requests: usuário autenticado faz upload da própria foto; admin lê.
-- Solicitações vêm do fluxo de cadastro (signUp), portanto após autenticação inicial.
CREATE POLICY "access-requests authenticated insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'access-requests');

CREATE POLICY "access-requests admin read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'access-requests' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "access-requests admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'access-requests' AND has_role(auth.uid(), 'admin'::app_role));

-- 3) Bucket outfits: leitura pública (bucket é public=true), escrita só admin
CREATE POLICY "outfits public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'outfits');

CREATE POLICY "outfits admin insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'outfits' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "outfits admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'outfits' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "outfits admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'outfits' AND has_role(auth.uid(), 'admin'::app_role));

-- 4) Bucket members: leitura pública, escrita só admin
CREATE POLICY "members public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'members');

CREATE POLICY "members admin insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'members' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "members admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'members' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "members admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'members' AND has_role(auth.uid(), 'admin'::app_role));

-- 5) Bucket fardamentos: leitura pública, escrita só admin
CREATE POLICY "fardamentos public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'fardamentos');

CREATE POLICY "fardamentos admin insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'fardamentos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "fardamentos admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'fardamentos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "fardamentos admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'fardamentos' AND has_role(auth.uid(), 'admin'::app_role));