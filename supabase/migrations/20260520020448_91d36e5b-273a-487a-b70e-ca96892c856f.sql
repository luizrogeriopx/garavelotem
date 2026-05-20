-- Table to log admin notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'merchants', 'users')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    link TEXT,
    send_email BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can see and create admin notifications
CREATE POLICY "Admins can manage admin notifications" ON public.admin_notifications
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
);

-- RPC Function to send mass notifications
CREATE OR REPLACE FUNCTION public.send_mass_notification(
    p_target TEXT,
    p_title TEXT,
    p_content TEXT,
    p_link TEXT,
    p_send_email BOOLEAN
) RETURNS void AS $$
DECLARE
    v_user RECORD;
BEGIN
    -- Only allow admin execution
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Acesso negado';
    END IF;

    -- Log the action
    INSERT INTO public.admin_notifications (sender_id, target_audience, title, content, link, send_email)
    VALUES (auth.uid(), p_target, p_title, p_content, p_link, p_send_email);

    -- Loop through target audience
    FOR v_user IN 
        SELECT p.id 
        FROM public.profiles p
        WHERE 
            CASE 
                WHEN p_target = 'merchants' THEN EXISTS (SELECT 1 FROM public.businesses b WHERE b.owner_id = p.id)
                WHEN p_target = 'users' THEN NOT EXISTS (SELECT 1 FROM public.businesses b WHERE b.owner_id = p.id)
                ELSE TRUE -- 'all'
            END
    LOOP
        PERFORM public.create_notification(
            v_user.id,
            NULL,
            'new_comment', -- Using a generic type for admin alerts
            p_title,
            p_content,
            p_link
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
