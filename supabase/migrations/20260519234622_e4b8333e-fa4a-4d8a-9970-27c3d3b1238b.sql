
-- ============================================================
-- 1) Perfil oficial @garavelotem + reservar username
-- ============================================================
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_platform boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_businesses_is_platform ON public.businesses(is_platform);

-- Atualiza função de validação para reservar 'garavelotem' e permitir uso pela plataforma
CREATE OR REPLACE FUNCTION public.validate_business_username()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  reserved text[] := ARRAY[
    'empresa','empresas','buscar','favoritos','login','planos','categorias',
    'promocoes','divulgar','politicas','checkout','reset-password','conta',
    'admin','minha-empresa','reivindicar','aceitar-politicas',
    'completar-cadastro','api','assets','static','public','www','app',
    'sobre','contato','ajuda','blog','termos','privacidade','garavelotem'
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

  -- Permite apenas a empresa oficial da plataforma usar o username 'garavelotem'
  IF NEW.username = 'garavelotem' AND NEW.is_platform IS NOT TRUE THEN
    RAISE EXCEPTION 'Username reservado, escolha outro';
  END IF;

  -- Os demais reservados são bloqueados sempre
  IF NEW.username = ANY(reserved) AND NEW.username <> 'garavelotem' THEN
    RAISE EXCEPTION 'Username reservado, escolha outro';
  END IF;

  -- Plataforma pode usar qualquer plano
  IF NEW.is_platform IS NOT TRUE THEN
    SELECT slug INTO plan_slug FROM public.plans WHERE id = NEW.plan_id;
    IF plan_slug IS DISTINCT FROM 'pro' THEN
      RAISE EXCEPTION 'Username (URL curta) está disponível apenas para empresas no plano Pro';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Garante o trigger associado
DROP TRIGGER IF EXISTS trg_validate_business_username ON public.businesses;
CREATE TRIGGER trg_validate_business_username
BEFORE INSERT OR UPDATE OF username, plan_id, is_platform ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.validate_business_username();

-- Cria empresa oficial da plataforma (se ainda não existir)
INSERT INTO public.businesses (
  owner_id, name, slug, username, short_description, description,
  status, is_verified, is_platform, is_featured, entity_type, plan_id, city, state
)
SELECT
  '8c400485-6aa7-457e-8080-b971eac5b33c'::uuid,
  'Garavelo Tem',
  'garavelotem-oficial',
  'garavelotem',
  'Perfil oficial da plataforma Garavelo Tem.',
  'Este é o perfil oficial da plataforma Garavelo Tem. Use-o para acompanhar novidades, dicas e destaques do nosso bairro.',
  'approved'::business_status,
  true,
  true,
  false,
  'pj'::entity_type,
  (SELECT id FROM public.plans WHERE slug = 'pro' LIMIT 1),
  'Aparecida de Goiânia',
  'GO'
WHERE NOT EXISTS (SELECT 1 FROM public.businesses WHERE username = 'garavelotem');

-- ============================================================
-- 2) Sistema de avaliações com aprovação
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.review_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS status public.review_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS as_business_id uuid;

-- Avaliações já existentes são consideradas aprovadas
UPDATE public.reviews SET status = 'approved' WHERE status = 'pending' AND created_at < now() - interval '1 second';

-- Garante 1 avaliação por usuário por empresa
CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_business_uniq
  ON public.reviews(business_id, user_id);

-- Atualiza RLS: somente admin atualiza/deleta; público lê apenas aprovadas
DROP POLICY IF EXISTS "reviews public read" ON public.reviews;
DROP POLICY IF EXISTS "users delete own review" ON public.reviews;
DROP POLICY IF EXISTS "users update own review" ON public.reviews;
DROP POLICY IF EXISTS "users create own review" ON public.reviews;

CREATE POLICY "approved reviews public read" ON public.reviews
  FOR SELECT USING (
    status = 'approved'
    OR auth.uid() = user_id
    OR app_private.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "users create own review" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND status = 'pending'
  );

CREATE POLICY "admin updates review" ON public.reviews
  FOR UPDATE USING (app_private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin deletes review" ON public.reviews
  FOR DELETE USING (app_private.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 3) Sistema de seguidores
-- ============================================================
CREATE TABLE IF NOT EXISTS public.business_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  follower_user_id uuid,
  follower_business_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT follower_xor CHECK (
    (follower_user_id IS NOT NULL AND follower_business_id IS NULL)
    OR (follower_user_id IS NULL AND follower_business_id IS NOT NULL)
  ),
  CONSTRAINT business_not_self CHECK (
    follower_business_id IS NULL OR follower_business_id <> business_id
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS business_followers_user_uniq
  ON public.business_followers(business_id, follower_user_id)
  WHERE follower_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS business_followers_business_uniq
  ON public.business_followers(business_id, follower_business_id)
  WHERE follower_business_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_business_followers_business ON public.business_followers(business_id);
CREATE INDEX IF NOT EXISTS idx_business_followers_user ON public.business_followers(follower_user_id);
CREATE INDEX IF NOT EXISTS idx_business_followers_followerbiz ON public.business_followers(follower_business_id);

ALTER TABLE public.business_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "followers public read" ON public.business_followers
  FOR SELECT USING (true);

CREATE POLICY "user follows" ON public.business_followers
  FOR INSERT WITH CHECK (
    -- segue como usuário
    (follower_user_id = auth.uid() AND follower_business_id IS NULL)
    OR
    -- segue como empresa (precisa ser dono da empresa seguidora)
    (
      follower_business_id IS NOT NULL
      AND follower_user_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = follower_business_id AND b.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "user unfollows" ON public.business_followers
  FOR DELETE USING (
    follower_user_id = auth.uid()
    OR (
      follower_business_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = follower_business_id AND b.owner_id = auth.uid()
      )
    )
    OR app_private.has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================================
-- 4) as_business_id em interações (para identidade de empresa)
-- ============================================================
ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS as_business_id uuid;
ALTER TABLE public.post_likes
  ADD COLUMN IF NOT EXISTS as_business_id uuid;

-- Quando preenchido, o usuário precisa ser dono daquela empresa
CREATE OR REPLACE FUNCTION public.validate_as_business_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.as_business_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = NEW.as_business_id AND b.owner_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Você não pode publicar como uma empresa que não é sua';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comments_validate_asbiz ON public.post_comments;
CREATE TRIGGER trg_comments_validate_asbiz
BEFORE INSERT OR UPDATE OF as_business_id ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.validate_as_business_id();

DROP TRIGGER IF EXISTS trg_likes_validate_asbiz ON public.post_likes;
CREATE TRIGGER trg_likes_validate_asbiz
BEFORE INSERT OR UPDATE OF as_business_id ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.validate_as_business_id();

DROP TRIGGER IF EXISTS trg_reviews_validate_asbiz ON public.reviews;
CREATE TRIGGER trg_reviews_validate_asbiz
BEFORE INSERT OR UPDATE OF as_business_id ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_as_business_id();
