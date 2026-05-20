-- Create coupon type enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_type') THEN
        CREATE TYPE public.discount_type AS ENUM ('fixed', 'percentage');
    END IF;
END $$;

-- Table for coupon settings
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    description TEXT,
    discount_type public.discount_type NOT NULL,
    discount_value NUMERIC NOT NULL,
    max_discount_value NUMERIC, -- Only for percentage
    usage_limit INTEGER NOT NULL, -- Total available coupons
    usage_count INTEGER DEFAULT 0, -- How many have been claimed
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(business_id, code)
);

-- Table for individual user claims
CREATE TABLE IF NOT EXISTS public.user_coupons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'claimed' CHECK (status IN ('claimed', 'used', 'expired')),
    claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    used_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(coupon_id, user_id) -- Ensures 1 coupon per user
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

-- Policies for Coupons
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coupons are viewable by everyone') THEN
        CREATE POLICY "Coupons are viewable by everyone" ON public.coupons FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Pro owners can manage coupons') THEN
        CREATE POLICY "Pro owners can manage coupons" ON public.coupons 
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.businesses b 
                JOIN public.plans p ON b.plan_id = p.id
                WHERE b.id = coupons.business_id 
                AND b.owner_id = auth.uid() 
                AND p.slug = 'pro'
            )
        );
    END IF;
END $$;

-- Policies for User Coupons
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own claims') THEN
        CREATE POLICY "Users can view their own claims" ON public.user_coupons FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Business owners can view and validate coupons') THEN
        CREATE POLICY "Business owners can view and validate coupons" ON public.user_coupons FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.coupons c
                JOIN public.businesses b ON c.business_id = b.id
                WHERE c.id = user_coupons.coupon_id 
                AND b.owner_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can claim coupons') THEN
        CREATE POLICY "Users can claim coupons" ON public.user_coupons FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Business owners can update usage status') THEN
        CREATE POLICY "Business owners can update usage status" ON public.user_coupons FOR UPDATE 
        USING (
            EXISTS (
                SELECT 1 FROM public.coupons c
                JOIN public.businesses b ON c.business_id = b.id
                WHERE c.id = user_coupons.coupon_id 
                AND b.owner_id = auth.uid()
            )
        );
    END IF;
END $$;

-- Function to validate and claim a coupon
CREATE OR REPLACE FUNCTION public.claim_coupon(p_coupon_id UUID)
RETURNS void AS $$
DECLARE
    v_usage_limit INTEGER;
    v_usage_count INTEGER;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT usage_limit, usage_count, expires_at INTO v_usage_limit, v_usage_count, v_expires_at
    FROM public.coupons WHERE id = p_coupon_id AND is_active = true;

    IF v_usage_count >= v_usage_limit THEN
        RAISE EXCEPTION 'Limite de cupons atingido';
    END IF;

    IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
        RAISE EXCEPTION 'Cupom expirado';
    END IF;

    INSERT INTO public.user_coupons (coupon_id, user_id) VALUES (p_coupon_id, auth.uid());
    
    UPDATE public.coupons SET usage_count = usage_count + 1 WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to use (validate) a coupon by the owner
CREATE OR REPLACE FUNCTION public.validate_user_coupon(p_user_coupon_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.user_coupons 
    SET status = 'used', used_at = now()
    WHERE id = p_user_coupon_id AND status = 'claimed'
    AND EXISTS (
        SELECT 1 FROM public.coupons c
        JOIN public.businesses b ON c.business_id = b.id
        WHERE c.id = user_coupons.coupon_id AND b.owner_id = auth.uid()
    );
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cupom inválido ou já utilizado';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add policies to policies table using array syntax for required_for
INSERT INTO public.policies (title, slug, content, required_for, is_required)
VALUES 
('Política de Uso de Cupons - Comerciante', 'coupon-policy-merchant', 'Empresas Pro podem oferecer cupons limitados. O cupom deve ser validado no ato da compra via painel administrativo. Não é permitido cobrar taxas extras pela retirada do cupom.', ARRAY['business'], true),
('Política de Uso de Cupons - Usuário', 'coupon-policy-user', 'Cada cupom é individual, intransferível e vinculado ao seu CPF. É proibida a venda ou doação de cupons. O descumprimento pode levar ao bloqueio da conta.', ARRAY['signup'], true)
ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content, title = EXCLUDED.title, required_for = EXCLUDED.required_for;
