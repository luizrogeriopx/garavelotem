-- Migração para criar tabela de business_analytics e funções RPC associadas

CREATE TABLE IF NOT EXISTS public.business_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('view', 'whatsapp_click')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para melhor performance nas consultas de data e business_id
CREATE INDEX IF NOT EXISTS idx_business_analytics_business_id ON public.business_analytics(business_id);
CREATE INDEX IF NOT EXISTS idx_business_analytics_created_at ON public.business_analytics(created_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.business_analytics ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para business_analytics
DROP POLICY IF EXISTS "Public insert business_analytics" ON public.business_analytics;
CREATE POLICY "Public insert business_analytics"
ON public.business_analytics
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin select business_analytics" ON public.business_analytics;
CREATE POLICY "Admin select business_analytics"
ON public.business_analytics
FOR SELECT
USING (app_private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Owner select business_analytics" ON public.business_analytics;
CREATE POLICY "Owner select business_analytics"
ON public.business_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_analytics.business_id
    AND b.owner_id = auth.uid()
  )
);

-- Funções RPC com SECURITY DEFINER para incremento e registro de logs atômicos
CREATE OR REPLACE FUNCTION public.record_business_view(business_id_param UUID)
RETURNS void AS $$
BEGIN
  -- Incrementa a coluna views_count
  UPDATE public.businesses
  SET views_count = views_count + 1
  WHERE id = business_id_param;

  -- Insere na tabela de logs
  INSERT INTO public.business_analytics (business_id, action_type)
  VALUES (business_id_param, 'view');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.record_business_wpp_click(business_id_param UUID)
RETURNS void AS $$
BEGIN
  -- Incrementa a coluna whatsapp_clicks
  UPDATE public.businesses
  SET whatsapp_clicks = whatsapp_clicks + 1
  WHERE id = business_id_param;

  -- Insere na tabela de logs
  INSERT INTO public.business_analytics (business_id, action_type)
  VALUES (business_id_param, 'whatsapp_click');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder privilégio de execução para perfis anônimos e autenticados
GRANT EXECUTE ON FUNCTION public.record_business_view(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_business_wpp_click(UUID) TO anon, authenticated;
