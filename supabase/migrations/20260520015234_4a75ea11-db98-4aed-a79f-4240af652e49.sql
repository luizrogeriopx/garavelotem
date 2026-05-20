-- Notification Trigger: Review Approved (for user)
CREATE OR REPLACE FUNCTION public.on_review_approved()
RETURNS TRIGGER AS $$
DECLARE
    v_biz_name TEXT;
BEGIN
    -- Check if status changed to approved
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
        SELECT name INTO v_biz_name FROM public.businesses WHERE id = NEW.business_id;
        
        PERFORM public.create_notification(
            NEW.user_id,
            NULL,
            'review_reply',
            'Sua avaliação foi aprovada!',
            'Sua avaliação para ' || v_biz_name || ' agora está visível para todos.',
            '/empresa/' || (SELECT slug FROM public.businesses WHERE id = NEW.business_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_on_review_approved ON public.reviews;
CREATE TRIGGER tr_on_review_approved
AFTER UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.on_review_approved();

-- Set search paths for existing functions for security
ALTER FUNCTION public.create_notification(UUID, UUID, public.notification_type, TEXT, TEXT, TEXT) SET search_path = public;
ALTER FUNCTION public.on_new_comment() SET search_path = public;
ALTER FUNCTION public.on_new_post_like() SET search_path = public;
ALTER FUNCTION public.on_new_follower() SET search_path = public;
ALTER FUNCTION public.on_new_review() SET search_path = public;
ALTER FUNCTION public.on_comment_like() SET search_path = public;
