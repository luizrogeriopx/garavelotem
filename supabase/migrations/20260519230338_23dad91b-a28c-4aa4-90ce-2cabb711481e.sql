
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS username text;

-- enforce format and reserved words
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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_business_username_trg ON public.businesses;
CREATE TRIGGER validate_business_username_trg
  BEFORE INSERT OR UPDATE OF username ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.validate_business_username();

CREATE UNIQUE INDEX IF NOT EXISTS businesses_username_unique
  ON public.businesses (username)
  WHERE username IS NOT NULL;
