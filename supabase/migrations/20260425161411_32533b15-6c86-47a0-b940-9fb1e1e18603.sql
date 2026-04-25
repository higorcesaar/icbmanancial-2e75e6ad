-- Bloqueia self-elevation: usuários só podem atualizar campos não-sensíveis do próprio profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile (safe fields)"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  -- Impede que o usuário se torne ativo/aprovado por conta própria
  AND is_active = (SELECT is_active FROM public.profiles WHERE user_id = auth.uid())
  AND status = (SELECT status FROM public.profiles WHERE user_id = auth.uid())
);

-- user_roles: já tem policy "Admins can manage roles" — garantimos que SELECT é só admin/próprio
-- Nada a alterar (policies existentes estão corretas).