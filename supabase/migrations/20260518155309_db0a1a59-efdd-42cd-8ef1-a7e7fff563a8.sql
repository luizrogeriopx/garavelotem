
CREATE TABLE public.business_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_business_posts_business ON public.business_posts(business_id, created_at DESC);

ALTER TABLE public.business_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts public read" ON public.business_posts FOR SELECT USING (true);
CREATE POLICY "owner manages posts" ON public.business_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_posts.business_id AND (b.owner_id = auth.uid() OR app_private.has_role(auth.uid(), 'admin'::app_role))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_posts.business_id AND (b.owner_id = auth.uid() OR app_private.has_role(auth.uid(), 'admin'::app_role))));

CREATE TRIGGER trg_business_posts_updated
  BEFORE UPDATE ON public.business_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.business_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
CREATE INDEX idx_post_likes_post ON public.post_likes(post_id);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes public read" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "users like" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users unlike" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.business_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_post_comments_post ON public.post_comments(post_id, created_at);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments public read" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "users create comment" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own comment" ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users delete own comment" ON public.post_comments FOR DELETE
  USING (auth.uid() = user_id OR app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_post_comments_updated
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
