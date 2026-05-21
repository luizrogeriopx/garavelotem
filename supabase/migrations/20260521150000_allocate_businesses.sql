-- Migration to allocate businesses to their appropriate subcategories based on profile analysis

-- Update for category 'beleza' -> subcategory 'manicure' (3 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'beleza'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'manicure' AND category_id = (SELECT id FROM public.categories WHERE slug = 'beleza'))
WHERE id IN ('b92c7265-1f06-4604-a7ca-4db269b1fc2e', '8b54703a-5e22-4193-9bc2-fd3d029add6b', 'b0b32ea9-2735-456a-b460-f54a4171683f');

-- Update for category 'servicos' -> subcategory 'ar-condicionado' (1 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'servicos'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'ar-condicionado' AND category_id = (SELECT id FROM public.categories WHERE slug = 'servicos'))
WHERE id IN ('53951f16-96f5-4649-8de1-a5a8124cb244');

-- Update for category 'servicos' -> subcategory 'graficas' (1 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'servicos'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'graficas' AND category_id = (SELECT id FROM public.categories WHERE slug = 'servicos'))
WHERE id IN ('93d71551-0cb5-4ff8-9d34-fbc5ea003539');

-- Update for category 'casa' -> subcategory 'jardinagem' (2 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'casa'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'jardinagem' AND category_id = (SELECT id FROM public.categories WHERE slug = 'casa'))
WHERE id IN ('bc2b2c71-e04e-44ea-8a5e-dc72bc29c77a', 'f52e5a45-0dba-4f69-acde-3a8c26ce1194');

-- Update for category 'servicos' -> subcategory 'comunicacao-visual' (1 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'servicos'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'comunicacao-visual' AND category_id = (SELECT id FROM public.categories WHERE slug = 'servicos'))
WHERE id IN ('ceaebe46-2008-49c7-97f6-fb2faaffc6fc');

-- Update for category 'alimentacao' -> subcategory 'docerias' (2 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'docerias' AND category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'))
WHERE id IN ('c122bd34-de2f-4aef-b64d-d222c0e920a2', '2bf68c53-5dc2-442d-baca-28379953bda9');

-- Update for category 'educacao' -> subcategory 'auto-escola' (1 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'educacao'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'auto-escola' AND category_id = (SELECT id FROM public.categories WHERE slug = 'educacao'))
WHERE id IN ('598d17bb-1cbd-46d4-a80a-2f6af1466526');

-- Update for category 'alimentacao' -> subcategory 'restaurantes' (9 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'restaurantes' AND category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'))
WHERE id IN ('bddc3538-bcc4-4f26-8e0e-fb94675b9be1', '393e5f2a-60fc-49e5-a4b8-d4f7e21fa83c', '868142b1-73c8-4de4-8150-c627c0f22631', 'a846a80f-b8f4-4380-93db-b2d72d48d1eb', '7b764d8c-0ca7-402b-8e74-2c23d893e6cf', 'a0d0aa85-d4e6-4bf5-abf9-f705b31c2fae', '55564b30-6295-4d45-878c-fb2e6ed307b8', '6b907388-86ba-43f9-9d73-8fd741c69f5e', '6262c01e-0f96-491d-abf0-9944095b543d');

-- Update for category 'alimentacao' -> subcategory 'bares' (5 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'bares' AND category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'))
WHERE id IN ('82a76d49-6f75-4aae-bfc8-ba5bf0ac9401', '0b975dbd-22ec-4e15-a964-4c10ae8ed817', 'f1405645-912f-4b17-887c-7572d5abb759', 'b77b971a-84d6-47fb-aa7d-c11d2622f7b0', '44a3ca34-6218-4b85-ad00-0d6db2e2af62');

-- Update for category 'alimentacao' -> subcategory 'pizzarias' (15 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'pizzarias' AND category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'))
WHERE id IN ('c5dd0c5b-d849-4900-b545-f3c304150d09', '093dafda-9830-47c9-b832-922d572b0e31', '61f22e0d-3b17-48ca-ab19-682f6777c1a9', 'f866f342-7229-4d23-8ba4-68fd73e18def', '36a21f5f-77c7-4293-94fd-0dcc06129d21', 'ba6dc641-4e75-4b59-87a2-12b741a8bf83', '92bd5e4c-68c0-4e03-acc1-2b9c0dda7e0a', '8639b74c-9b78-460b-9d4d-cda1034968bb', '6c6a4d3f-adff-4c81-9e1b-cc666165c318', 'e1d47da2-55ca-406b-a909-c2cf972efe54', 'e574b4f7-0f3c-4b40-90ce-babbd141ce0e', 'c7bc7f51-ef7c-476d-bee4-92e77430fd87', '7140ddac-8e84-450c-aadd-1802fbecadd7', '640a3e0e-b5fd-4c39-8952-6a8f20ae7bb3', '3aff1a36-fa8d-4d3d-839d-13ce823a6efe');

-- Update for category 'alimentacao' -> subcategory 'churrascarias' (1 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'churrascarias' AND category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'))
WHERE id IN ('224df4e6-d567-4bee-a339-60ded3119518');

-- Update for category 'beleza' -> subcategory 'saloes-de-beleza' (13 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'beleza'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'saloes-de-beleza' AND category_id = (SELECT id FROM public.categories WHERE slug = 'beleza'))
WHERE id IN ('b1f19d15-b3fe-44fd-876d-f1375e28cdc2', 'fd11d3c7-9a23-47d4-9f08-81c854b183d4', '22e45197-06ee-4fa0-81f2-d0318e008df7', '6f0d2551-4b2b-4377-b0b4-9c2a8551e786', '7994f0ff-0474-460b-b293-d97659cb8223', '6f211674-7db2-45a2-950c-650616f68bcb', 'd665f561-54b7-405f-97ec-60f264ddbed8', 'f72cc9cc-3c7c-491a-8155-01e5b1c28d1d', '5372e46e-4ada-4164-83cf-fe374d5b756e', '5a0c234f-dc54-419b-9a0f-c72126a86760', 'd3a700d2-9dbd-4073-8010-34b86e673ee3', 'c295e456-4bba-441f-8691-0faf7481ff6a', '650d9f17-d928-44d9-8837-7e14d52d7772');

-- Update for category 'beleza' -> subcategory 'estetica' (5 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'beleza'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'estetica' AND category_id = (SELECT id FROM public.categories WHERE slug = 'beleza'))
WHERE id IN ('a4b5a983-e96a-48ae-9515-ddf9d3651b2d', 'afbc039c-ac88-49a7-9dcd-44976caa1ed2', 'daab73c8-e42d-4301-9340-13cf03e83537', 'e42b5ed6-ee31-4cb2-aa55-079d6c50e0fc', 'a1337053-785f-4bf0-97cb-9752c24e5729');

-- Update for category 'saude' -> subcategory 'farmacias' (7 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'saude'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'farmacias' AND category_id = (SELECT id FROM public.categories WHERE slug = 'saude'))
WHERE id IN ('771d8c84-182b-4f05-8943-da33a38dbe46', '9ec0e62f-6285-40f7-a7ed-5f18b752ea44', '2a2c09f9-5a0b-4ecb-a83b-062d3d96ed92', 'c4426ab1-f8d3-4b97-b01a-ac9a75cd1220', '3d429780-2f42-4893-9b1c-88f89ece0dc7', '980c8fae-f9bb-4918-9b9b-8325f3a8589c', 'e3df79f7-8564-433e-88c0-efb7ff3843f9');

-- Update for category 'construcao' -> subcategory 'ferragistas' (8 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'construcao'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'ferragistas' AND category_id = (SELECT id FROM public.categories WHERE slug = 'construcao'))
WHERE id IN ('daccb33d-4a7c-4b4b-b28a-27960e957e0e', 'd5ebf9ce-0fcc-4dc6-947a-3f24bb93d525', '034a3495-38ec-4b2d-a092-e49f0827412d', '58d37406-7a90-44a9-b102-0f6a8d74b95b', '0b357708-989d-48bb-b018-d4ea2b5483bb', '73d378ed-5095-47f8-b755-4ada58517e22', 'fe6539ff-84bb-40fc-8ec7-3655adcace6a', 'f9f0a225-801b-484e-ae24-b710c2d033e0');

-- Update for category 'beleza' -> subcategory 'bronzeamento' (1 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'beleza'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'bronzeamento' AND category_id = (SELECT id FROM public.categories WHERE slug = 'beleza'))
WHERE id IN ('e67e4b9d-ab3d-407b-ab48-489aa6be0088');

-- Update for category 'esporte' -> subcategory 'bike' (6 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'esporte'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'bike' AND category_id = (SELECT id FROM public.categories WHERE slug = 'esporte'))
WHERE id IN ('98227034-48e7-4aee-abef-699054f77092', '19f610b8-26e1-4766-8845-d98f71331ddb', '7c5eaf33-1516-40aa-89eb-a0c71e4fa901', '82175dc1-0701-4f17-aa31-8ac7d3c87d74', 'a06cb111-6550-4087-b278-4e67b8b8915e', 'caa117be-3723-440e-9416-f0feeaef8652');

-- Update for category 'carros' -> subcategory 'auto-pecas' (18 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'carros'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'auto-pecas' AND category_id = (SELECT id FROM public.categories WHERE slug = 'carros'))
WHERE id IN ('3dd05d7b-ca87-408d-bdf2-271d694b1eca', '8b1a1882-28eb-46f6-8633-75502ed14fbd', 'f24c1978-e8c3-479a-8ac8-4881f95ddd06', '9eccf963-3021-4001-b986-63fd8a1ba5f5', '859ec63d-e379-4998-8681-a11336b3bb8d', 'cc60cfec-21c4-4184-ae61-e65c164d8fbe', 'e5b353d7-b91f-43ae-9929-716e2d943870', '662fcea6-6a99-4643-8d74-da92575df19f', 'dda98389-cc2f-44dc-b65b-d118019537b5', '7f0fa520-b4c8-406b-87d3-ddfa71bfe73f', '33f7de70-f103-4c62-843e-71ccc0981631', '5b805f27-7664-4eb6-814f-b4cf107cb265', 'c0ed9c2e-c4db-49a8-8ddb-73f89673afcd', '052e9f4c-65fe-4a60-bd5e-fd9aa7e68a18', 'fc232b6d-9014-4fb7-b0ef-287f9a29ec50', '4347bd62-9d06-47ef-82b2-f58b750ba6df', 'cc175514-eab0-4fb8-86ec-6d25792b9cb8', '6a5f439d-a430-4e33-9192-30b6573559e9');

-- Update for category 'supermercados' -> subcategory 'mercados' (7 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'supermercados'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'mercados' AND category_id = (SELECT id FROM public.categories WHERE slug = 'supermercados'))
WHERE id IN ('f4eedb91-9022-4b63-a03b-aaf7e17e3c9e', '9aef0101-d953-4c25-a7e0-3e7ef9702f08', 'de2d0708-d8a4-4502-b643-3eb942247111', 'b666a3ad-15d7-4da3-a9e3-096de2ba741d', '53af6a0e-36cf-47d1-81c2-656df4c4f416', '2661516e-8563-4b08-9d5a-99c71bac1429', 'f34a6e1f-7006-4efd-9afe-22d2f29e9721');

-- Update for category 'espaco-de-eventos' -> subcategory 'salao-de-festas' (11 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'espaco-de-eventos'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'salao-de-festas' AND category_id = (SELECT id FROM public.categories WHERE slug = 'espaco-de-eventos'))
WHERE id IN ('df096f32-fd80-4dda-8a31-4658d830a6a0', 'bfcebf5f-05ed-495f-b5fe-11f16b944130', 'f2084572-363c-4ec5-a6e2-4d821da0ca99', '3a28d04f-205c-476b-ae72-7cb35a8d014c', '0d01e0ce-59b0-4419-a18d-ced986d26b07', '1a4b33d0-56fa-40a6-8e90-d5f0729c122e', '6fb25c5e-b713-4693-999f-0186f8aa3bb8', '95322a6b-85da-42b1-834d-895f0676c6e9', '4ecd2a9a-2d85-4c6c-b47e-ecfa59182d42', '8f7c34ec-d027-45e0-9fcc-5c07e12d252e', '7ed60150-3541-4440-a473-45d4f07386e1');

-- Update for category 'beleza' -> subcategory 'barbearias' (6 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'beleza'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'barbearias' AND category_id = (SELECT id FROM public.categories WHERE slug = 'beleza'))
WHERE id IN ('039e9fc8-f632-4fcd-b393-1457f739d220', '26832aae-d2a3-40f5-a2a0-7e6a13012fa0', '504cd6bd-b967-4959-bdf4-9b17dfd1155f', 'f9e5a938-003a-4ae0-bf9f-ef9ed748efaa', '474a8b91-e1d4-430e-8535-c58150814d9a', '827ba97a-f720-490f-8e37-020c6d19bcb5');

-- Update for category 'saude' -> subcategory 'dentistas' (9 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'saude'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'dentistas' AND category_id = (SELECT id FROM public.categories WHERE slug = 'saude'))
WHERE id IN ('c9a5251c-f54f-4579-a003-e3d4af20ed70', '4c515d3b-92b1-4925-bc2f-0c44cced140b', 'bbfe041a-8597-4a5a-b802-b72361e0ced1', '1bd16c7d-fcc2-40ff-b684-23d9aa72cb3c', '4c1eaa0a-9d94-41aa-97e1-4f2c61ececaf', '3ae1bb64-f981-42d8-af90-3a22830f1c42', '2bd4e479-2f63-4df0-a915-4dcc2851d6b3', '0f947c57-e840-4088-8853-2ba770d9f0bc', '27c536d7-6140-42a9-82e4-11b7ea1e06f6');

-- Update for category 'beleza' -> subcategory 'perfumarias' (3 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'beleza'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'perfumarias' AND category_id = (SELECT id FROM public.categories WHERE slug = 'beleza'))
WHERE id IN ('fdc9483a-40b6-4cbe-b28e-213e2b62147b', 'c90fba52-9d13-479c-97e2-b0881a4c40cd', '2f0345f4-51ad-4e42-a740-020155d3cdf3');

-- Update for category 'celulares' -> subcategory 'smartphones' (3 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'celulares'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'smartphones' AND category_id = (SELECT id FROM public.categories WHERE slug = 'celulares'))
WHERE id IN ('5f369459-f211-4f1a-ac8e-3033b6ffca74', 'ca0830cb-23de-487b-8405-53d719f7f53e', '2f4e296c-c7e1-48c1-8ada-df651e9fede4');

-- Update for category 'celulares' -> subcategory 'assistencia-tecnica-celulares' (2 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'celulares'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'assistencia-tecnica-celulares' AND category_id = (SELECT id FROM public.categories WHERE slug = 'celulares'))
WHERE id IN ('0814ee8a-1486-4e38-b2ee-49b70a80ba9b', 'a8114cb6-0e9e-448d-a423-26e40d334c66');

-- Update for category 'saude' -> subcategory 'clinicas' (11 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'saude'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'clinicas' AND category_id = (SELECT id FROM public.categories WHERE slug = 'saude'))
WHERE id IN ('dbc67bef-2941-4f58-bddd-0708237e5698', '5afff8fe-7889-4749-8a6d-b5b5b038fd6c', '62da2b8b-142e-4111-a44a-9464b6ffb575', '761476d1-5c84-4836-926f-572fb2f2707f', 'b6916151-ce1b-49fd-9aad-60215f18c99d', 'f8237ca4-52b9-458b-9541-930e88e10fb3', '9e17f8a0-7a41-4cee-a64e-4dd4cd5a6839', '70245faa-b942-4da9-b4a9-6f7d220855a5', '1f0453de-f5c0-4409-bf78-1eb524cf11bd', 'e1576ecd-2a4c-462e-95f3-47a4ac09da94', '858c081c-248d-4529-ba5e-bd22569de244');

-- Update for category 'saude' -> subcategory 'laboratorios' (8 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'saude'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'laboratorios' AND category_id = (SELECT id FROM public.categories WHERE slug = 'saude'))
WHERE id IN ('0de72c92-5e30-4a8b-9b82-479392466f42', '084433d9-38c3-492a-85a1-0e6993351700', '4d290fd7-842b-441f-9fba-739a7dd7bd50', 'e40fab74-10b4-4b82-ac1c-53b8f05f63b7', '40d72e23-c7b4-4218-966b-4fd278c81d0a', '72000d4f-7693-40f7-a624-433ebf7519ab', 'af036f78-b373-40fa-9b78-cfa0176007c8', '01d1f8cc-5a4b-49b4-acdf-f1da43086135');

-- Update for category 'carros' -> subcategory 'concessionarias-e-revendas' (3 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'carros'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'concessionarias-e-revendas' AND category_id = (SELECT id FROM public.categories WHERE slug = 'carros'))
WHERE id IN ('7d8106a8-1b7a-4d38-a7dc-34956024b66a', '36eae800-130d-46a9-ad05-7e0dd0160cb1', '6456821f-a77c-4159-bb2d-7a0c3b82eef3');

-- Update for category 'esporte' -> subcategory 'academias' (11 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'esporte'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'academias' AND category_id = (SELECT id FROM public.categories WHERE slug = 'esporte'))
WHERE id IN ('5c10dd32-aef2-4893-b848-937a90ad2fe2', '77ca2ddf-048b-44de-a7d4-efc113a19299', '01dadf5a-9d55-41eb-a87d-9eee6fd67374', '2b12af9c-16c5-45d6-be39-b1badce75a2c', 'db1afd92-fa4d-4fdb-8b9f-fbc4ea5492ff', 'bcbbcc83-e5ef-48da-b9c5-545fbfdf60d0', '961941bd-0cfa-40ef-8596-cc00d9f6f426', '646b40bd-a67a-4fe7-b40f-88a0f6d4e8a4', 'b7260f4f-68d8-4cbe-979a-f7c30d4f8514', '5f0f4c54-26ce-4d6b-bf22-5357e4234978', '527851b2-6887-4a92-a6c6-5f2a8e216d9b');

-- Update for category 'carros' -> subcategory 'oficinas-mecanicas' (11 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'carros'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'oficinas-mecanicas' AND category_id = (SELECT id FROM public.categories WHERE slug = 'carros'))
WHERE id IN ('ac0c2400-7ce6-42da-9eb4-ec0a7049d086', '3bb79604-ee54-413e-a5c1-b9620a285558', 'cefcd1da-0937-4c2f-baf8-3b562717da75', 'eb40b139-57f8-4926-b01d-c0f4c05acbf9', '3a33a7bd-7369-4d7f-873e-9143f6b01acb', '1cdb8d15-6db1-44b0-91bf-2ce234307434', 'b5c14e41-5061-4614-b94d-e1d844b593f6', '3a273d36-d118-4ae0-a953-bee9d1f7633b', 'ae45f092-c297-41f3-98a0-a4d6b9d0725f', '5594a57c-1e0a-40f5-b863-8b8d597dacc2', '708ebcdf-86d5-4541-baa4-f2c41d1d25ec');

-- Update for category 'moda' -> subcategory 'bijuterias' (1 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'moda'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'bijuterias' AND category_id = (SELECT id FROM public.categories WHERE slug = 'moda'))
WHERE id IN ('c2418542-5c36-478d-b504-78f23a4fedda');

-- Update for category 'carros' -> subcategory 'auto-eletrica' (9 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'carros'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'auto-eletrica' AND category_id = (SELECT id FROM public.categories WHERE slug = 'carros'))
WHERE id IN ('bd79b606-726f-436c-8365-bd6001741f03', '92f1f0b8-9d83-4a20-81c1-dbf438496a75', 'b2b25cfe-f125-40f8-b1a6-2e4104966733', 'b771b69d-4aab-4868-a856-670b66a317d1', '38cf6394-bb25-47da-b04f-d2f4b887f3e5', '7829a823-5edd-495e-80ac-7b0935f9903d', '0b911707-4f6b-4d24-b7de-0fd490fb74f6', '97429601-154a-4766-8483-7cfa4f4b6abd', 'cc65423f-bbb7-4f52-a974-c8ba803b0a62');

-- Update for category 'supermercados' -> subcategory 'atacadistas' (2 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'supermercados'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'atacadistas' AND category_id = (SELECT id FROM public.categories WHERE slug = 'supermercados'))
WHERE id IN ('093759d2-290f-4580-9c0a-81ee8c681eda', '5c1f4a0b-7282-45f5-b7be-52e275742ad5');

-- Update for category 'carros' -> subcategory 'borracharias' (8 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'carros'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'borracharias' AND category_id = (SELECT id FROM public.categories WHERE slug = 'carros'))
WHERE id IN ('9835ba9b-91fd-4001-8e27-1836d4fe34da', '37657abd-cfeb-41c5-9f6e-6b54da9f9d84', '9e2fa8a7-9e8c-4cab-8c8e-751b2ea1a5f6', '793af93f-a32e-422b-b9ca-95d6c5981048', 'cb0453b4-66ca-44fe-aad4-ee68351c7d49', '056daad1-eac0-4070-9200-9b03e21776f6', 'faba5891-8423-4789-8da7-28d12d661bff', '56f1c3f1-ab1e-4566-92be-93bd00109798');

-- Update for category 'motos' -> subcategory 'oficina-de-motos' (3 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'motos'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'oficina-de-motos' AND category_id = (SELECT id FROM public.categories WHERE slug = 'motos'))
WHERE id IN ('46832926-b6b5-46a5-81c5-6c08af791ae6', '8b851c2b-3997-446a-aee4-ea9568bd89df', 'ef8d2c0b-8591-48ec-b88e-830ad04783f8');

-- Update for category 'motos' -> subcategory 'moto-pecas' (1 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'motos'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'moto-pecas' AND category_id = (SELECT id FROM public.categories WHERE slug = 'motos'))
WHERE id IN ('971c894f-95c7-48f7-ac45-4b9fd2909fec');

-- Update for category 'carros' -> subcategory 'lava-jato' (10 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'carros'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'lava-jato' AND category_id = (SELECT id FROM public.categories WHERE slug = 'carros'))
WHERE id IN ('137f67a8-15cb-4ff3-aaf6-3bb1822db330', 'c7fa6d1f-e496-486a-9c6a-ceded2263ff7', '94307f47-d9b2-42e0-900a-bb94852601d0', 'e9db4233-6596-455c-aabc-e84a7b3842f0', 'a09dda9a-92e4-4316-9516-b545bfd0c327', 'e49b86c7-d48d-45d5-a1e5-89fad110f984', 'e9553856-b1a3-44e6-bb8c-10fdf1dd2dc2', '118ef4d2-a2f3-411e-8bd5-92e3f6cb7d67', 'bf641f61-39ee-429f-a709-cecf75d818e6', 'c85a9c33-835b-492c-8ced-5f525183ab3a');

-- Update for category 'alimentacao' -> subcategory 'sorveterias' (7 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'sorveterias' AND category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'))
WHERE id IN ('03f1db0c-1a79-4369-a759-c9dd2d0f4895', '89fa2e3b-c093-4ba7-9d73-b94e44f80dcd', '12f77788-8758-4ef9-bd50-9c1499f8997d', '3a621ab1-87c0-4df9-ab5a-733ab7c17b79', 'd613a204-72d6-4a49-b475-1da2a646713d', '5551e50f-fa8f-4391-885b-c0d51d11f077', '2c21a3fb-f460-4723-8292-b78138c917a2');

-- Update for category 'alimentacao' -> subcategory 'acaiterias' (7 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'acaiterias' AND category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'))
WHERE id IN ('fd21880c-320c-43cf-94be-1c71e403ae8a', 'e1a63191-8313-4037-8f39-4f54dd49985b', '53e9110e-b75c-46e8-9d27-aa0967b5a9c6', '315b9284-75a2-450a-ad50-3cdf580a0323', 'c9c3c895-ea08-49e5-83cc-6f5c2453fb98', '9d905250-d917-49b3-8a20-b48fe1856edb', 'fd627769-452e-4e3e-bb66-cfe7b5be57f5');

-- Update for category 'servicos' -> subcategory 'advocacia' (1 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'servicos'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'advocacia' AND category_id = (SELECT id FROM public.categories WHERE slug = 'servicos'))
WHERE id IN ('fe016cf8-1cce-47bd-8bed-e31c34bd39b0');

-- Update for category 'alimentacao' -> subcategory 'lanchonetes' (9 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'lanchonetes' AND category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'))
WHERE id IN ('21cc7631-809c-4960-ac41-daf64fd8f296', '042a66cc-39ee-42ed-86cc-b9bd1487f43f', '2280d705-7d7e-4f71-912c-ec3efe6750b6', '42f7eddf-05d5-4fbc-8d32-0fc9f26100a1', '078f4915-f710-4f93-b76b-3e228bc22979', '4728ffe9-ad58-4fea-b47c-04d3bd931534', '3677f2d7-c4de-4b92-bf51-b10d20b3123e', '9ee92308-9b2d-40cb-8658-7a5a66a6a1ae', '5fdd144e-18a1-4666-bc1d-d4f9499ee25c');

-- Update for category 'alimentacao' -> subcategory 'hamburguerias' (4 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'hamburguerias' AND category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'))
WHERE id IN ('74ba8f0f-6852-4cff-9b49-26d53b016ca4', 'b2b4c6fd-f847-490d-917a-b794ea18396e', '606bb9df-234d-4290-965b-9ead9af855d8', '47dd0f98-2792-4f6c-a778-43b73ba5f293');

-- Update for category 'alimentacao' -> subcategory 'pastelarias' (6 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'pastelarias' AND category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'))
WHERE id IN ('10565bdd-27d0-472c-904f-22c6fb766806', 'b1b1174e-08b4-499c-89cd-fc6854f6a46d', '3086840c-f05a-4bb9-abc7-99ce10cf291a', '9743b38b-162f-48ef-b008-4cb07888ec78', 'b671c05f-e0c0-489d-8e7c-1844a157a8c5', 'cfe63ed3-cd36-4ea7-b3b0-d532fca5fa0c');

-- Update for category 'alimentacao' -> subcategory 'espetinhos' (7 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'espetinhos' AND category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'))
WHERE id IN ('7691ed13-3de4-43f1-a561-c6ccb3f80775', '02b581c7-3cb3-4c81-aae2-8ef8f58a1e19', '1a7ee0ab-d24d-4fe5-ab31-cf219da2a73e', '9df49c21-cee8-4618-9ea1-97ebe4cf5edd', 'bb2dc8a0-6917-4dc4-899b-f2ceaf81ea51', 'cf4502d1-a084-4000-8b2b-85ca228a8865', 'c4c93dd9-7ec9-4b8d-99b2-2a2bef3126b8');

-- Update for category 'esporte' -> subcategory 'futebol' (8 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'esporte'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'futebol' AND category_id = (SELECT id FROM public.categories WHERE slug = 'esporte'))
WHERE id IN ('c3a60a2b-e707-4783-97ce-5e92a9f87573', 'da3ea807-1596-410a-be6d-423da95fe298', '35e24912-1082-44fc-bec7-2b48509f4cb2', '9298e09a-896b-484a-a470-92eca1b38ad5', '3fc305ea-4264-4889-bfd4-e43a2b2a2069', 'ccd1137b-9575-433e-919f-86fd33befee2', '6a554baf-2141-414a-af44-6165ec424285', 'e86cefe8-96e8-4d9d-b91d-c355fe1531dc');

-- Update for category 'calcados' -> subcategory 'tenis-e-esportivos' (1 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'calcados'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'tenis-e-esportivos' AND category_id = (SELECT id FROM public.categories WHERE slug = 'calcados'))
WHERE id IN ('9d641135-2829-40b2-bb90-3162e00b1287');

-- Update for category 'hobbie' -> subcategory 'pesca' (2 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'hobbie'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'pesca' AND category_id = (SELECT id FROM public.categories WHERE slug = 'hobbie'))
WHERE id IN ('ca3b28f1-a646-4324-b0d6-4e80cd107338', 'bd3ffd8d-69ea-4be8-b780-deec6ad64d86');

-- Update for category 'educacao' -> subcategory 'escolas' (10 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'educacao'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'escolas' AND category_id = (SELECT id FROM public.categories WHERE slug = 'educacao'))
WHERE id IN ('77762b0c-cdad-439a-9ab1-c91ecde09621', 'f8376dc9-86c2-4559-8a63-2020a28aa02d', '5db776db-5dd0-4094-97db-dfa18f04bbeb', '7bc3ad70-0e4c-454e-b839-e8f5ecbd271e', 'e503a259-f9d3-468a-82c2-e1e5eeb7af20', 'e9492d84-b7b5-412c-b144-3ffdc68114eb', '9fa895ba-6860-4eb9-8ab1-897d1ad226d9', 'cd9e2203-f6f4-4464-bdf8-d3afce01d5d0', '9bab5eae-e0fb-4933-9883-43fed250558f', '809abbc7-860a-4255-a3cb-717afeb074ff');

-- Update for category 'educacao' -> subcategory 'creches' (1 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'educacao'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'creches' AND category_id = (SELECT id FROM public.categories WHERE slug = 'educacao'))
WHERE id IN ('db15a067-3254-46c5-bff7-a59b3f244dfe');

-- Update for category 'festas' -> subcategory 'artigos-para-festas' (3 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'festas'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'artigos-para-festas' AND category_id = (SELECT id FROM public.categories WHERE slug = 'festas'))
WHERE id IN ('2d5e2e71-fa93-45f4-b1cc-e68666e34f38', '38ec36d9-e339-43b8-acd8-313d669e489e', '407543fe-4e78-4fa0-b911-507b64e40616');

-- Update for category 'alimentacao' -> subcategory 'padarias' (13 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'padarias' AND category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'))
WHERE id IN ('36a4b8ee-8329-4fc1-a059-49e18aa9e4b5', 'ddc1980e-a65f-4f60-979f-3c282712c2ff', '78dd8bc1-bcd7-4df6-bdb0-606a22ca4fc7', '1527f5fe-8612-4ef8-bc9a-3fdd3949648f', '1e301cd5-f91b-4d34-aa01-c0c36f6bd757', 'ac7d5c44-7bf0-4318-8517-33a1fc1c168a', '34d550b1-241a-4a39-8f8a-f5dec1314c3d', '693721c5-af1a-46b8-b946-84d9177538ae', '3ada59b0-c460-4c3b-b46f-2c7eac0a42fd', '5eb64ad2-169f-40b5-8755-41000179811e', 'a2e90714-2980-494e-a33a-a96d1f5960ed', '88ff157c-b22f-49f9-a4c3-741e47752902', '94ff2553-bfe6-4bbf-b91c-91daa375aa14');

-- Update for category 'igrejas' -> subcategory 'igrejas-catolicas' (1 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'igrejas'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'igrejas-catolicas' AND category_id = (SELECT id FROM public.categories WHERE slug = 'igrejas'))
WHERE id IN ('88266dad-e5ed-422a-9e80-65431fcc9868');

-- Update for category 'igrejas' -> subcategory 'igrejas-evangelicas' (10 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'igrejas'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'igrejas-evangelicas' AND category_id = (SELECT id FROM public.categories WHERE slug = 'igrejas'))
WHERE id IN ('c7cd9c83-6339-4718-a292-db51b55e2820', 'bf501382-2eb0-44b9-ad2c-223a9a644ff7', '69ccc89e-988a-468c-8503-cf3c15ada2fe', '8b9f689e-f643-4b8c-b4bf-0008e071ce3f', '785b51f5-e7e2-410f-bffd-aafd4ebb51d2', '3aa2a1b6-dfee-4a17-a733-2e7dc9a50ab0', '05808e72-d5b0-42e1-9c8a-14277e5c25b1', '74b59a2c-6d93-4a87-9cbd-add3cb19419e', '393ad461-52db-4609-b4f8-23a60454c47a', '999f36c6-6830-4842-a2fe-d77fb40f62ee');

-- Update for category 'servicos' -> subcategory 'marketing-digital' (2 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'servicos'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'marketing-digital' AND category_id = (SELECT id FROM public.categories WHERE slug = 'servicos'))
WHERE id IN ('c8a2f778-54e7-47ae-99f9-a9af188891e7', '253e1d05-b02e-4b9f-8510-42664f4d23c2');

-- Update for category 'saude' -> subcategory 'oticas-saude' (17 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'saude'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'oticas-saude' AND category_id = (SELECT id FROM public.categories WHERE slug = 'saude'))
WHERE id IN ('fc347582-b6ca-4f87-9c7a-34c3de39ef87', '0e726bb1-03eb-4a47-af43-f67ffbbfa401', '350283e4-6a8f-42bd-bcb1-3f616edb8cbf', '159cd915-07b0-487a-815c-eb51cdee3904', 'af1d9d47-1e2c-43ec-aec4-1ffd4af5ccfe', 'c9ab1b4e-57e0-48d6-9195-c37c8739de39', '1cc7965e-f1be-4e30-bd50-68e711b2759a', '39078bff-365f-49ff-acbc-c058952a611f', '6d9b4f36-c8a2-4d7b-af32-e6c61e06ab5b', '62dddd1f-7efb-458a-bba8-306159cd97d3', '6b280a4d-4673-4ddb-b0d0-991779e67b98', '9b1e1f80-42ab-4220-8a57-33f98cb3d674', '605ac55e-60a2-40e6-8ba6-b72b6ba75892', '37223b82-cf20-4235-a3b0-96559ee15985', '12b4bccb-24c0-4d36-afe8-653a773ac516', 'b931cb9a-70fd-4c5e-8fc6-88f428199207', 'e35da80a-c6ec-4b32-aab6-481b029f3c0e');

-- Update for category 'moda' -> subcategory 'moda-feminina' (8 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'moda'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'moda-feminina' AND category_id = (SELECT id FROM public.categories WHERE slug = 'moda'))
WHERE id IN ('c9785f2e-bf96-4d0b-a215-e189e2758b72', 'bd6abcb1-1458-4fe9-bcda-a252b7f1b231', '15f2d824-7f5b-425d-9b18-74f1766e6d38', '636eac75-92e3-4430-85b9-31d34823ff76', '2df4d654-9b84-4238-8f41-3c6b0f6e878e', '6d460518-512e-4303-8b2d-46178cc51df8', '4c92ce4a-28e7-45ea-9335-2a86c800c564', '6b747a2d-fd37-499d-a9bf-7cbebef29ad1');

-- Update for category 'casa' -> subcategory 'utilidades-domesticas' (1 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'casa'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'utilidades-domesticas' AND category_id = (SELECT id FROM public.categories WHERE slug = 'casa'))
WHERE id IN ('b36cdc02-ad9c-46db-857b-a370dad3fa9e');

-- Update for category 'alimentacao' -> subcategory 'sushi-japonesa' (1 businesses)
UPDATE public.businesses
SET 
  category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'),
  subcategory_id = (SELECT id FROM public.subcategories WHERE slug = 'sushi-japonesa' AND category_id = (SELECT id FROM public.categories WHERE slug = 'alimentacao'))
WHERE id IN ('6d0b318f-e2e1-488f-9f77-dd0b942159b4');

