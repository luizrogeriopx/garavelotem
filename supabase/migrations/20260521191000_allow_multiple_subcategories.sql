-- Criar a tabela business_subcategories para associar empresas com múltiplas subcategorias
CREATE TABLE public.business_subcategories (
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    subcategory_id UUID NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (business_id, subcategory_id)
);

-- Habilitar RLS
ALTER TABLE public.business_subcategories ENABLE ROW LEVEL SECURITY;

-- Criar índices de desempenho
CREATE INDEX idx_business_subcategories_business_id ON public.business_subcategories(business_id);
CREATE INDEX idx_business_subcategories_subcategory_id ON public.business_subcategories(subcategory_id);

-- Criar políticas de RLS
CREATE POLICY "business_subcategories_select_policy" 
ON public.business_subcategories FOR SELECT 
USING (true);

CREATE POLICY "business_subcategories_write_policy" 
ON public.business_subcategories FOR ALL 
TO authenticated, service_role
USING (
    app_private.has_role(auth.uid(), 'admin') OR 
    EXISTS (
        SELECT 1 FROM public.businesses 
        WHERE id = business_subcategories.business_id AND owner_id = auth.uid()
    )
);

-- Migrar os dados existentes (cada subcategory_id da tabela businesses) para a tabela associativa
INSERT INTO public.business_subcategories (business_id, subcategory_id)
SELECT id, subcategory_id 
FROM public.businesses 
WHERE subcategory_id IS NOT NULL
ON CONFLICT DO NOTHING;
