-- 1. Grant admin write permissions to subcategories (create policy if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subcategories' AND policyname = 'admin manages subcategories'
    ) THEN
        CREATE POLICY "admin manages subcategories" 
        ON public.subcategories FOR ALL 
        USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- 2. Rename AUTO category to Carros
UPDATE public.categories
SET name = 'Carros', slug = 'carros', icon = 'Car', color = '#3B82F6', sort_order = 20
WHERE slug = 'auto';

-- 3. Insert other new main categories
INSERT INTO public.categories (name, slug, icon, color, sort_order) VALUES
('Celulares', 'celulares', 'Smartphone', '#0EA5E9', 15),
('Pet', 'pet', 'Dog', '#10B981', 16),
('Calçados', 'calcados', 'Footprints', '#A16207', 17),
('Papelaria', 'papelaria', 'NotebookPen', '#EC4899', 18),
('Bebês', 'bebes', 'Baby', '#A855F7', 19),
('Brinquedos', 'brinquedos', 'Puzzle', '#F97316', 21),
('Relógios', 'relogios', 'Watch', '#64748B', 22),
('Livrarias', 'livrarias', 'BookOpen', '#8B5CF6', 23),
('Festas', 'festas', 'PartyPopper', '#EAB308', 24)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

-- 4. Migrate existing businesses and their subcategories to the new main categories

-- Celulares:
UPDATE public.businesses
SET category_id = (SELECT id FROM public.categories WHERE slug = 'celulares')
WHERE subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'celulares' AND category_id = (SELECT id FROM public.categories WHERE slug = 'tecnologia'));

UPDATE public.subcategories
SET category_id = (SELECT id FROM public.categories WHERE slug = 'celulares'),
    name = 'Smartphones',
    slug = 'smartphones'
WHERE slug = 'celulares' AND category_id = (SELECT id FROM public.categories WHERE slug = 'tecnologia');

-- Calçados:
UPDATE public.businesses
SET category_id = (SELECT id FROM public.categories WHERE slug = 'calcados')
WHERE subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'calcados' AND category_id = (SELECT id FROM public.categories WHERE slug = 'moda'));

UPDATE public.subcategories
SET category_id = (SELECT id FROM public.categories WHERE slug = 'calcados')
WHERE slug = 'calcados' AND category_id = (SELECT id FROM public.categories WHERE slug = 'moda');

-- Relógios:
UPDATE public.businesses
SET category_id = (SELECT id FROM public.categories WHERE slug = 'relogios')
WHERE subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'relogios' AND category_id = (SELECT id FROM public.categories WHERE slug = 'moda'));

UPDATE public.subcategories
SET category_id = (SELECT id FROM public.categories WHERE slug = 'relogios')
WHERE slug = 'relogios' AND category_id = (SELECT id FROM public.categories WHERE slug = 'moda');

-- Livrarias:
UPDATE public.businesses
SET category_id = (SELECT id FROM public.categories WHERE slug = 'livrarias')
WHERE subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'livrarias' AND category_id = (SELECT id FROM public.categories WHERE slug = 'hobbie'));

UPDATE public.subcategories
SET category_id = (SELECT id FROM public.categories WHERE slug = 'livrarias')
WHERE slug = 'livrarias' AND category_id = (SELECT id FROM public.categories WHERE slug = 'hobbie');

-- Brinquedos:
UPDATE public.businesses
SET category_id = (SELECT id FROM public.categories WHERE slug = 'brinquedos')
WHERE subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'brinquedos' AND category_id = (SELECT id FROM public.categories WHERE slug = 'hobbie'));

UPDATE public.subcategories
SET category_id = (SELECT id FROM public.categories WHERE slug = 'brinquedos')
WHERE slug = 'brinquedos' AND category_id = (SELECT id FROM public.categories WHERE slug = 'hobbie');

-- 5. Insert new subcategories (use ON CONFLICT DO NOTHING or UPDATE to be idempotent)

-- Celulares subcategories (Smartphones already migrated and renamed, inserting others)
INSERT INTO public.subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'celulares'), 'Smartphones', 'smartphones', 1), -- fallback in case it wasn't migrated
((SELECT id FROM public.categories WHERE slug = 'celulares'), 'Acessórios e Capinhas', 'acessorios-e-capinhas', 2),
((SELECT id FROM public.categories WHERE slug = 'celulares'), 'Assistência Técnica', 'assistencia-tecnica-celulares', 3),
((SELECT id FROM public.categories WHERE slug = 'celulares'), 'Carregadores e Cabos', 'carregadores-e-cabos', 4),
((SELECT id FROM public.categories WHERE slug = 'celulares'), 'Venda de Celulares', 'venda-de-celulares', 5)
ON CONFLICT (category_id, slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Pet subcategories
INSERT INTO public.subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'pet'), 'Pet Shops', 'pet-shops', 1),
((SELECT id FROM public.categories WHERE slug = 'pet'), 'Rações e Acessórios', 'racoes-e-acessorios', 2),
((SELECT id FROM public.categories WHERE slug = 'pet'), 'Clínicas Veterinárias', 'clinicas-veterinarias-pet', 3),
((SELECT id FROM public.categories WHERE slug = 'pet'), 'Banho e Tosa', 'banho-e-tosa', 4),
((SELECT id FROM public.categories WHERE slug = 'pet'), 'Hospedagem e Creche', 'hospedagem-e-creche-pet', 5)
ON CONFLICT (category_id, slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Calçados subcategories
INSERT INTO public.subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'calcados'), 'Calçados Femininos', 'calcados-femininos', 1),
((SELECT id FROM public.categories WHERE slug = 'calcados'), 'Calçados Masculinos', 'calcados-masculinos', 2),
((SELECT id FROM public.categories WHERE slug = 'calcados'), 'Calçados Infantis', 'calcados-infantis', 3),
((SELECT id FROM public.categories WHERE slug = 'calcados'), 'Tênis e Esportivos', 'tenis-e-esportivos', 4),
((SELECT id FROM public.categories WHERE slug = 'calcados'), 'Sandálias e Chinelos', 'sandalias-e-chinelos', 5)
ON CONFLICT (category_id, slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Papelaria subcategories
INSERT INTO public.subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'papelaria'), 'Material Escolar', 'material-escolar', 1),
((SELECT id FROM public.categories WHERE slug = 'papelaria'), 'Artigos de Escritório', 'artigos-de-escritorio', 2),
((SELECT id FROM public.categories WHERE slug = 'papelaria'), 'Papelaria Criativa e Fofa', 'papelaria-criativa-fofa', 3),
((SELECT id FROM public.categories WHERE slug = 'papelaria'), 'Cópias e Impressões', 'copias-e-impressoes', 4),
((SELECT id FROM public.categories WHERE slug = 'papelaria'), 'Presentes e Brindes', 'presentes-e-brindes-papelaria', 5)
ON CONFLICT (category_id, slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Bebês subcategories
INSERT INTO public.subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'bebes'), 'Roupas de Bebê', 'roupas-de-bebe', 1),
((SELECT id FROM public.categories WHERE slug = 'bebes'), 'Fraldas e Higiene', 'fraldas-e-higiene', 2),
((SELECT id FROM public.categories WHERE slug = 'bebes'), 'Enxoval e Acessórios', 'enxoval-e-acessorios', 3),
((SELECT id FROM public.categories WHERE slug = 'bebes'), 'Carrinhos e Cadeirinhas', 'carrinhos-e-cadeirinhas', 4),
((SELECT id FROM public.categories WHERE slug = 'bebes'), 'Brinquedos para Bebês', 'brinquedos-para-bebes', 5)
ON CONFLICT (category_id, slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Carros subcategories (insert new ones, existing ones remain mapped)
INSERT INTO public.subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'carros'), 'Concessionárias e Revendas', 'concessionarias-e-revendas', 18),
((SELECT id FROM public.categories WHERE slug = 'carros'), 'Pneus e Rodas', 'pneus-e-rodas', 19),
((SELECT id FROM public.categories WHERE slug = 'carros'), 'Estética Automotiva', 'estetica-automotiva', 20)
ON CONFLICT (category_id, slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Brinquedos subcategories
INSERT INTO public.subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'brinquedos'), 'Bonecas e Bonecos', 'bonecas-e-bonecos', 2),
((SELECT id FROM public.categories WHERE slug = 'brinquedos'), 'Jogos de Tabuleiro', 'jogos-de-tabuleiro', 3),
((SELECT id FROM public.categories WHERE slug = 'brinquedos'), 'Blocos de Montar e Lego', 'blocos-de-montar-e-lego', 4),
((SELECT id FROM public.categories WHERE slug = 'brinquedos'), 'Brinquedos Educativos', 'brinquedos-educativos', 5),
((SELECT id FROM public.categories WHERE slug = 'brinquedos'), 'Miniaturas e Carrinhos', 'miniaturas-e-carrinhos', 6)
ON CONFLICT (category_id, slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Relógios subcategories
INSERT INTO public.subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'relogios'), 'Relojoarias', 'relojoarias', 2),
((SELECT id FROM public.categories WHERE slug = 'relogios'), 'Relógios de Pulso', 'relogios-de-pulso', 3),
((SELECT id FROM public.categories WHERE slug = 'relogios'), 'Smartwatches', 'smartwatches', 4),
((SELECT id FROM public.categories WHERE slug = 'relogios'), 'Conserto de Relógios', 'conserto-de-relogios', 5),
((SELECT id FROM public.categories WHERE slug = 'relogios'), 'Acessórios e Pulseiras', 'acessorios-e-pulseiras', 6)
ON CONFLICT (category_id, slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Livrarias subcategories
INSERT INTO public.subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'livrarias'), 'Literatura Nacional e Estrangeira', 'literatura-nacional-estrangeira', 2),
((SELECT id FROM public.categories WHERE slug = 'livrarias'), 'Livros Acadêmicos e Didáticos', 'livros-academicos-didaticos', 3),
((SELECT id FROM public.categories WHERE slug = 'livrarias'), 'HQs, Mangás e Graphic Novels', 'hqs-mangas-graphic-novels', 4),
((SELECT id FROM public.categories WHERE slug = 'livrarias'), 'Livros Infantis', 'livros-infantis', 5),
((SELECT id FROM public.categories WHERE slug = 'livrarias'), 'Sebo e Livros Usados', 'sebo-e-livros-usados', 6)
ON CONFLICT (category_id, slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Festas subcategories
INSERT INTO public.subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'festas'), 'Artigos para Festas', 'artigos-para-festas', 1),
((SELECT id FROM public.categories WHERE slug = 'festas'), 'Decoração de Festas', 'decoracao-de-festas', 2),
((SELECT id FROM public.categories WHERE slug = 'festas'), 'Buffet e Doces', 'buffet-e-doces', 3),
((SELECT id FROM public.categories WHERE slug = 'festas'), 'Salões de Festas', 'saloes-de-festas', 4),
((SELECT id FROM public.categories WHERE slug = 'festas'), 'Lembrancinhas e Personalizados', 'lembrancinhas-e-personalizados', 5)
ON CONFLICT (category_id, slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
