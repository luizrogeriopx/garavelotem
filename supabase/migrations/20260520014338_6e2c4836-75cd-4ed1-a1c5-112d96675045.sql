-- Create subcategories table
CREATE TABLE public.subcategories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(category_id, slug)
);

-- Enable RLS
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Subcategories are viewable by everyone" 
ON public.subcategories FOR SELECT 
USING (true);

-- Add subcategory_id to businesses
ALTER TABLE public.businesses ADD COLUMN subcategory_id UUID REFERENCES public.subcategories(id);

-- Create index for performance
CREATE INDEX idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX idx_businesses_subcategory_id ON public.businesses(subcategory_id);
