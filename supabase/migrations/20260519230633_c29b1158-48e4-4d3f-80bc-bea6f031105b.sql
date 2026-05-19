
CREATE OR REPLACE FUNCTION public.validate_business_username()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  reserved text[] := ARRAY[
    'empresa','empresas','buscar','favoritos','login','planos','categorias',
    'promocoes','divulgar','politicas','checkout','reset-password','conta',
    'admin','minha-empresa','reivindicar','aceitar-politicas',
    'completar-cadastro','api','assets','static','public','www','app',
    'sobre','contato','ajuda','blog','termos','privacidade'
  ];
  plan_slug text;
BEGIN
  IF NEW.username IS NULL OR NEW.username = '' THEN
    NEW.username := NULL;
    RETURN NEW;
  END IF;

  NEW.username := lower(NEW.username);

  IF NEW.username !~ '^[a-z0-9_]{3,30}$' THEN
    RAISE EXCEPTION 'Username inválido: use 3 a 30 caracteres, apenas letras minúsculas, números e _';
  END IF;

  IF NEW.username = ANY(reserved) THEN
    RAISE EXCEPTION 'Username reservado, escolha outro';
  END IF;

  SELECT slug INTO plan_slug FROM public.plans WHERE id = NEW.plan_id;
  IF plan_slug IS DISTINCT FROM 'pro' THEN
    RAISE EXCEPTION 'Username (URL curta) está disponível apenas para empresas no plano Pro';
  END IF;

  RETURN NEW;
END;
$$;
