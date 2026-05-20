-- Allow public read access to PWA-related settings only
CREATE POLICY "public reads pwa settings"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (key LIKE 'pwa_%');

-- Seed default PWA settings
INSERT INTO public.app_settings (key, value) VALUES
  ('pwa_name', 'Garavelo Tem'),
  ('pwa_short_name', 'Garavelo Tem'),
  ('pwa_description', 'O guia comercial completo do Setor Garavelo. Pizzarias, salões, oficinas e muito mais.'),
  ('pwa_theme_color', '#0B2545'),
  ('pwa_background_color', '#0B2545'),
  ('pwa_icon_url', 'https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/680fa4cf-cb95-416c-8f69-2ed500c45153/id-preview-1d3445ca--51a9a3b4-67ba-4af7-a2dc-904b06772fac.lovable.app-1779062112250.png')
ON CONFLICT (key) DO NOTHING;