-- Create has_role function
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, _role text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  has_role_result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = has_role.user_id AND role = has_role._role
  ) INTO has_role_result;
  
  RETURN has_role_result;
END;
$$;