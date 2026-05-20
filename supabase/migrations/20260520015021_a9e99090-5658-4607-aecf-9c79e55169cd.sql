-- Create notification type enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE public.notification_type AS ENUM (
            'new_comment',
            'new_like',
            'new_review',
            'new_follower',
            'comment_reply',
            'review_reply',
            'comment_liked'
        );
    END IF;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    type public.notification_type NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own notifications') THEN
        CREATE POLICY "Users can view their own notifications"
        ON public.notifications FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own notifications') THEN
        CREATE POLICY "Users can update their own notifications"
        ON public.notifications FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_business_id UUID,
    p_type public.notification_type,
    p_title TEXT,
    p_content TEXT,
    p_link TEXT
) RETURNS void AS $$
BEGIN
    INSERT INTO public.notifications (user_id, business_id, type, title, content, link)
    VALUES (p_user_id, p_business_id, p_type, p_title, p_content, p_link);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: New Comment
CREATE OR REPLACE FUNCTION public.on_new_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_owner_id UUID;
    v_biz_name TEXT;
    v_user_name TEXT;
BEGIN
    -- Get business info
    SELECT owner_id, name INTO v_owner_id, v_biz_name
    FROM public.businesses
    WHERE id = (SELECT business_id FROM public.business_posts WHERE id = NEW.post_id);

    -- Get commenter name
    SELECT full_name INTO v_user_name FROM public.profiles WHERE id = NEW.user_id;

    -- Notify business owner if it's not their own comment
    IF v_owner_id IS NOT NULL AND v_owner_id != NEW.user_id THEN
        PERFORM public.create_notification(
            v_owner_id,
            NULL,
            'new_comment',
            'Novo comentário',
            COALESCE(v_user_name, 'Alguém') || ' comentou no post da sua empresa ' || v_biz_name,
            '/empresa/' || (SELECT slug FROM public.businesses WHERE id = (SELECT business_id FROM public.business_posts WHERE id = NEW.post_id))
        );
    END IF;

    -- Notify parent comment owner if it's a reply
    IF NEW.parent_id IS NOT NULL THEN
        DECLARE
            v_parent_user_id UUID;
        BEGIN
            SELECT user_id INTO v_parent_user_id FROM public.post_comments WHERE id = NEW.parent_id;
            IF v_parent_user_id IS NOT NULL AND v_parent_user_id != NEW.user_id THEN
                PERFORM public.create_notification(
                    v_parent_user_id,
                    NULL,
                    'comment_reply',
                    'Resposta ao seu comentário',
                    COALESCE(v_user_name, 'Alguém') || ' respondeu ao seu comentário.',
                    NULL
                );
            END IF;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_new_comment ON public.post_comments;
CREATE TRIGGER tr_on_new_comment
AFTER INSERT ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.on_new_comment();

-- Trigger: New Post Like
CREATE OR REPLACE FUNCTION public.on_new_post_like()
RETURNS TRIGGER AS $$
DECLARE
    v_owner_id UUID;
    v_user_name TEXT;
BEGIN
    SELECT owner_id INTO v_owner_id
    FROM public.businesses
    WHERE id = (SELECT business_id FROM public.business_posts WHERE id = NEW.post_id);

    SELECT full_name INTO v_user_name FROM public.profiles WHERE id = NEW.user_id;

    IF v_owner_id IS NOT NULL AND v_owner_id != NEW.user_id THEN
        PERFORM public.create_notification(
            v_owner_id,
            NULL,
            'new_like',
            'Nova curtida',
            COALESCE(v_user_name, 'Alguém') || ' curtiu sua publicação.',
            NULL
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_new_post_like ON public.post_likes;
CREATE TRIGGER tr_on_new_post_like
AFTER INSERT ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.on_new_post_like();

-- Trigger: New Follower
CREATE OR REPLACE FUNCTION public.on_new_follower()
RETURNS TRIGGER AS $$
DECLARE
    v_owner_id UUID;
    v_user_name TEXT;
BEGIN
    SELECT owner_id INTO v_owner_id FROM public.businesses WHERE id = NEW.business_id;
    SELECT full_name INTO v_user_name FROM public.profiles WHERE id = NEW.user_id;

    IF v_owner_id IS NOT NULL AND v_owner_id != NEW.user_id THEN
        PERFORM public.create_notification(
            v_owner_id,
            NULL,
            'new_follower',
            'Novo seguidor',
            COALESCE(v_user_name, 'Alguém') || ' começou a seguir sua empresa.',
            NULL
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_new_follower ON public.business_followers;
CREATE TRIGGER tr_on_new_follower
AFTER INSERT ON public.business_followers
FOR EACH ROW EXECUTE FUNCTION public.on_new_follower();

-- Trigger: New Review
CREATE OR REPLACE FUNCTION public.on_new_review()
RETURNS TRIGGER AS $$
DECLARE
    v_owner_id UUID;
    v_user_name TEXT;
BEGIN
    SELECT owner_id INTO v_owner_id FROM public.businesses WHERE id = NEW.business_id;
    SELECT full_name INTO v_user_name FROM public.profiles WHERE id = NEW.user_id;

    IF v_owner_id IS NOT NULL AND v_owner_id != NEW.user_id THEN
        PERFORM public.create_notification(
            v_owner_id,
            NULL,
            'new_review',
            'Nova avaliação',
            COALESCE(v_user_name, 'Alguém') || ' avaliou sua empresa com ' || NEW.rating || ' estrelas.',
            NULL
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_new_review ON public.reviews;
CREATE TRIGGER tr_on_new_review
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.on_new_review();

-- Trigger: Comment Like
CREATE OR REPLACE FUNCTION public.on_comment_like()
RETURNS TRIGGER AS $$
DECLARE
    v_comment_user_id UUID;
    v_user_name TEXT;
BEGIN
    SELECT user_id INTO v_comment_user_id FROM public.post_comments WHERE id = NEW.comment_id;
    SELECT full_name INTO v_user_name FROM public.profiles WHERE id = NEW.user_id;

    IF v_comment_user_id IS NOT NULL AND v_comment_user_id != NEW.user_id THEN
        PERFORM public.create_notification(
            v_comment_user_id,
            NULL,
            'comment_liked',
            'Curtida no seu comentário',
            COALESCE(v_user_name, 'Alguém') || ' curtiu seu comentário.',
            NULL
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_comment_like ON public.comment_likes;
CREATE TRIGGER tr_on_comment_like
AFTER INSERT ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.on_comment_like();
