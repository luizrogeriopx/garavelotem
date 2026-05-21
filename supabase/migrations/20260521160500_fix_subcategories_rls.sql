-- Corrige a política de RLS da tabela subcategories para usar app_private.has_role em vez de public.has_role
DROP POLICY IF EXISTS "admin manages subcategories" ON public.subcategories;

CREATE POLICY "admin manages subcategories" 
ON public.subcategories FOR ALL 
USING (app_private.has_role(auth.uid(), 'admin'));
