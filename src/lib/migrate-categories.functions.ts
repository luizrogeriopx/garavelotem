import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const runCategoryMigration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    console.log("Starting category migration...");

    // 1. Rename 'auto' to 'carros'
    const { error: renameError } = await supabaseAdmin
      .from('categories')
      .update({ name: 'Carros', slug: 'carros', icon: 'Car', color: '#3B82F6', sort_order: 20 })
      .eq('slug', 'auto');
    if (renameError) {
      console.error("Error renaming auto to carros:", renameError);
    } else {
      console.log("Renamed auto category to Carros.");
    }

    // 2. Create/update the 9 new main categories
    const newCategories = [
      { name: 'Celulares', slug: 'celulares', icon: 'Smartphone', color: '#0EA5E9', sort_order: 15 },
      { name: 'Pet', slug: 'pet', icon: 'Dog', color: '#10B981', sort_order: 16 },
      { name: 'Calçados', slug: 'calcados', icon: 'Footprints', color: '#A16207', sort_order: 17 },
      { name: 'Papelaria', slug: 'papelaria', icon: 'NotebookPen', color: '#EC4899', sort_order: 18 },
      { name: 'Bebês', slug: 'bebes', icon: 'Baby', color: '#A855F7', sort_order: 19 },
      { name: 'Brinquedos', slug: 'brinquedos', icon: 'Puzzle', color: '#F97316', sort_order: 21 },
      { name: 'Relógios', slug: 'relogios', icon: 'Watch', color: '#64748B', sort_order: 22 },
      { name: 'Livrarias', slug: 'livrarias', icon: 'BookOpen', color: '#8B5CF6', sort_order: 23 },
      { name: 'Festas', slug: 'festas', icon: 'PartyPopper', color: '#EAB308', sort_order: 24 }
    ];

    for (const cat of newCategories) {
      const { error } = await supabaseAdmin
        .from('categories')
        .upsert(cat, { onConflict: 'slug' });
      if (error) {
        console.error(`Error upserting category ${cat.name}:`, error);
      }
    }
    console.log("Main categories created/updated.");

    // Fetch the new category IDs map
    const { data: allCats } = await supabaseAdmin.from('categories').select('id, slug');
    const catMap = new Map((allCats ?? []).map(c => [c.slug, c.id]));

    // 3. Migrate existing subcategories to their new main category parents
    const migrations = [
      { oldParentSlug: 'tecnologia', subSlug: 'celulares', newParentSlug: 'celulares', newSubName: 'Smartphones', newSubSlug: 'smartphones' },
      { oldParentSlug: 'moda', subSlug: 'calcados', newParentSlug: 'calcados' },
      { oldParentSlug: 'moda', subSlug: 'relogios', newParentSlug: 'relogios' },
      { oldParentSlug: 'hobbie', subSlug: 'livrarias', newParentSlug: 'livrarias' },
      { oldParentSlug: 'hobbie', subSlug: 'brinquedos', newParentSlug: 'brinquedos' }
    ];

    for (const m of migrations) {
      const oldParentId = catMap.get(m.oldParentSlug);
      const newParentId = catMap.get(m.newParentSlug);
      if (!oldParentId || !newParentId) continue;

      // Find the subcategory
      const { data: sub } = await supabaseAdmin
        .from('subcategories')
        .select('id')
        .eq('category_id', oldParentId)
        .eq('slug', m.subSlug)
        .maybeSingle();

      if (sub) {
        // Update all businesses referencing this subcategory to the new category_id
        const { error: busError } = await supabaseAdmin
          .from('businesses')
          .update({ category_id: newParentId })
          .eq('subcategory_id', sub.id);
        if (busError) {
          console.error(`Error updating businesses for subcategory ${m.subSlug}:`, busError);
        }

        // Move/rename the subcategory
        const updatePayload: Record<string, any> = { category_id: newParentId };
        if (m.newSubName) updatePayload.name = m.newSubName;
        if (m.newSubSlug) updatePayload.slug = m.newSubSlug;

        const { error: subError } = await supabaseAdmin
          .from('subcategories')
          .update(updatePayload)
          .eq('id', sub.id);
        if (subError) {
          console.error(`Error moving subcategory ${m.subSlug}:`, subError);
        } else {
          console.log(`Moved subcategory ${m.subSlug} to main category ${m.newParentSlug}.`);
        }
      }
    }

    // 4. Insert new subcategories
    const subcategoriesMap: Record<string, Array<{ name: string, slug: string, sort_order: number }>> = {
      celulares: [
        { name: 'Smartphones', slug: 'smartphones', sort_order: 1 },
        { name: 'Acessórios e Capinhas', slug: 'acessorios-e-capinhas', sort_order: 2 },
        { name: 'Assistência Técnica', slug: 'assistencia-tecnica-celulares', sort_order: 3 },
        { name: 'Carregadores e Cabos', slug: 'carregadores-e-cabos', sort_order: 4 },
        { name: 'Venda de Celulares', slug: 'venda-de-celulares', sort_order: 5 }
      ],
      pet: [
        { name: 'Pet Shops', slug: 'pet-shops', sort_order: 1 },
        { name: 'Rações e Acessórios', slug: 'racoes-e-acessorios', sort_order: 2 },
        { name: 'Clínicas Veterinárias', slug: 'clinicas-veterinarias-pet', sort_order: 3 },
        { name: 'Banho e Tosa', slug: 'banho-e-tosa', sort_order: 4 },
        { name: 'Hospedagem e Creche', slug: 'hospedagem-e-creche-pet', sort_order: 5 }
      ],
      calcados: [
        { name: 'Calçados Femininos', slug: 'calcados-femininos', sort_order: 1 },
        { name: 'Calçados Masculinos', slug: 'calcados-masculinos', sort_order: 2 },
        { name: 'Calçados Infantis', slug: 'calcados-infantis', sort_order: 3 },
        { name: 'Tênis e Esportivos', slug: 'tenis-e-esportivos', sort_order: 4 },
        { name: 'Sandálias e Chinelos', slug: 'sandalias-e-chinelos', sort_order: 5 }
      ],
      papelaria: [
        { name: 'Material Escolar', slug: 'material-escolar', sort_order: 1 },
        { name: 'Artigos de Escritório', slug: 'artigos-de-escritorio', sort_order: 2 },
        { name: 'Papelaria Criativa e Fofa', slug: 'papelaria-criativa-fofa', sort_order: 3 },
        { name: 'Cópias e Impressões', slug: 'copias-e-impressoes', sort_order: 4 },
        { name: 'Presentes e Brindes', slug: 'presentes-e-brindes-papelaria', sort_order: 5 }
      ],
      bebes: [
        { name: 'Roupas de Bebê', slug: 'roupas-de-bebe', sort_order: 1 },
        { name: 'Fraldas e Higiene', slug: 'fraldas-e-higiene', sort_order: 2 },
        { name: 'Enxoval e Acessórios', slug: 'enxoval-e-acessorios', sort_order: 3 },
        { name: 'Carrinhos e Cadeirinhas', slug: 'carrinhos-e-cadeirinhas', sort_order: 4 },
        { name: 'Brinquedos para Bebês', slug: 'brinquedos-para-bebes', sort_order: 5 }
      ],
      carros: [
        { name: 'Concessionárias e Revendas', slug: 'concessionarias-e-revendas', sort_order: 18 },
        { name: 'Pneus e Rodas', slug: 'pneus-e-rodas', sort_order: 19 },
        { name: 'Estética Automotiva', slug: 'estetica-automotiva', sort_order: 20 }
      ],
      brinquedos: [
        { name: 'Bonecas e Bonecos', slug: 'bonecas-e-bonecos', sort_order: 2 },
        { name: 'Jogos de Tabuleiro', slug: 'jogos-de-tabuleiro', sort_order: 3 },
        { name: 'Blocos de Montar e Lego', slug: 'blocos-de-montar-e-lego', sort_order: 4 },
        { name: 'Brinquedos Educativos', slug: 'brinquedos-educativos', sort_order: 5 },
        { name: 'Miniaturas e Carrinhos', slug: 'miniaturas-e-carrinhos', sort_order: 6 }
      ],
      relogios: [
        { name: 'Relojoarias', slug: 'relojoarias', sort_order: 2 },
        { name: 'Relógios de Pulso', slug: 'relogios-de-pulso', sort_order: 3 },
        { name: 'Smartwatches', slug: 'smartwatches', sort_order: 4 },
        { name: 'Conserto de Relógios', slug: 'conserto-de-relogios', sort_order: 5 },
        { name: 'Acessórios e Pulseiras', slug: 'acessorios-e-pulseiras', sort_order: 6 }
      ],
      livrarias: [
        { name: 'Literatura Nacional e Estrangeira', slug: 'literatura-nacional-estrangeira', sort_order: 2 },
        { name: 'Livros Acadêmicos e Didáticos', slug: 'livros-academicos-didaticos', sort_order: 3 },
        { name: 'HQs, Mangás e Graphic Novels', slug: 'hqs-mangas-graphic-novels', sort_order: 4 },
        { name: 'Livros Infantis', slug: 'livros-infantis', sort_order: 5 },
        { name: 'Sebo e Livros Usados', slug: 'sebo-e-livros-usados', sort_order: 6 }
      ],
      festas: [
        { name: 'Artigos para Festas', slug: 'artigos-para-festas', sort_order: 1 },
        { name: 'Decoração de Festas', slug: 'decoracao-de-festas', sort_order: 2 },
        { name: 'Buffet e Doces', slug: 'buffet-e-doces', sort_order: 3 },
        { name: 'Salões de Festas', slug: 'saloes-de-festas', sort_order: 4 },
        { name: 'Lembrancinhas e Personalizados', slug: 'lembrancinhas-e-personalizados', sort_order: 5 }
      ]
    };

    for (const [parentSlug, subs] of Object.entries(subcategoriesMap)) {
      const parentId = catMap.get(parentSlug);
      if (!parentId) continue;

      for (const s of subs) {
        const { error } = await supabaseAdmin
          .from('subcategories')
          .upsert({ category_id: parentId, name: s.name, slug: s.slug, sort_order: s.sort_order }, { onConflict: 'category_id,slug' });
        if (error) {
          console.error(`Error upserting subcategory ${s.name} under ${parentSlug}:`, error);
        }
      }
    }

    console.log("Category migration completed successfully.");
    return { success: true };
  });

import { businessAllocationData } from "./business-allocation-data";

export const runBusinessAllocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    console.log("Starting business allocation...");

    const { data: allCats } = await supabaseAdmin.from('categories').select('id, slug');
    const { data: allSubs } = await supabaseAdmin.from('subcategories').select('id, slug, category_id');

    if (!allCats || !allSubs) {
      throw new Error("Failed to fetch categories or subcategories for allocation mapping.");
    }

    const catMap = new Map((allCats ?? []).map(c => [c.slug, c.id]));
    const subMap = new Map();
    for (const sub of allSubs) {
      subMap.set(`${sub.category_id}|${sub.slug}`, sub.id);
    }

    let successCount = 0;
    let errorCount = 0;

    for (const group of businessAllocationData) {
      const catId = catMap.get(group.categorySlug);
      if (!catId) {
        console.warn(`Category slug not found: ${group.categorySlug}`);
        errorCount += group.ids.length;
        continue;
      }

      const subId = subMap.get(`${catId}|${group.subcategorySlug}`);
      if (!subId) {
        console.warn(`Subcategory slug not found: ${group.subcategorySlug} under category ${group.categorySlug}`);
        errorCount += group.ids.length;
        continue;
      }

      const { error } = await supabaseAdmin
        .from('businesses')
        .update({ category_id: catId, subcategory_id: subId })
        .in('id', group.ids);

      if (error) {
        console.error(`Error allocating businesses to ${group.categorySlug} -> ${group.subcategorySlug}:`, error);
        errorCount += group.ids.length;
      } else {
        successCount += group.ids.length;
      }
    }

    console.log(`Business allocation completed. Success: ${successCount}, Errors/Skipped: ${errorCount}`);
    return { success: true, successCount, errorCount };
  });

export const saveSubcategoryServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string(),
      slug: z.string(),
      category_id: z.string().uuid(),
      sort_order: z.number().nullable(),
    }),
  )
  .handler(async ({ data: s, context }) => {
    await assertAdmin(context.userId);

    const payload = {
      name: s.name,
      slug: s.slug,
      category_id: s.category_id,
      sort_order: s.sort_order,
    };

    if (s.id) {
      const { error } = await supabaseAdmin.from("subcategories").update(payload).eq("id", s.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("subcategories").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { success: true };
  });

export const deleteSubcategoryServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.string().uuid())
  .handler(async ({ data: id, context }) => {
    await assertAdmin(context.userId);

    const { error } = await supabaseAdmin.from("subcategories").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const mergeSubcategoriesServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      sourceId: z.string().uuid(),
      targetId: z.string().uuid(),
      targetCategoryId: z.string().uuid(),
    }),
  )
  .handler(async ({ data: { sourceId, targetId, targetCategoryId }, context }) => {
    await assertAdmin(context.userId);

    // 1. Atualizar todas as empresas na subcategoria antiga para a nova subcategoria na tabela businesses (fallback de compatibilidade)
    const { error: updateError } = await supabaseAdmin
      .from("businesses")
      .update({
        subcategory_id: targetId,
        category_id: targetCategoryId
      })
      .eq("subcategory_id", sourceId);
    
    if (updateError) throw new Error(updateError.message);

    // 2. Buscar todas as empresas associadas à subcategoria de origem na tabela associativa
    const { data: assocBusinesses, error: fetchAssocError } = await supabaseAdmin
      .from("business_subcategories")
      .select("business_id")
      .eq("subcategory_id", sourceId);

    if (fetchAssocError) throw new Error(fetchAssocError.message);

    if (assocBusinesses && assocBusinesses.length > 0) {
      // Inserir as novas relações com targetId
      const newRelations = assocBusinesses.map((b) => ({
        business_id: b.business_id,
        subcategory_id: targetId,
      }));

      // Usar upsert para evitar erros de chave primária duplicada se alguma empresa já possuir ambas subcategorias
      const { error: insertAssocError } = await supabaseAdmin
        .from("business_subcategories")
        .upsert(newRelations, { onConflict: "business_id,subcategory_id" });

      if (insertAssocError) throw new Error(insertAssocError.message);

      // Deletar as associações antigas com a subcategoria de origem
      const { error: deleteOldAssocError } = await supabaseAdmin
        .from("business_subcategories")
        .delete()
        .eq("subcategory_id", sourceId);

      if (deleteOldAssocError) throw new Error(deleteOldAssocError.message);
    }

    // 3. Excluir a subcategoria de origem
    const { error: deleteError } = await supabaseAdmin
      .from("subcategories")
      .delete()
      .eq("id", sourceId);

    if (deleteError) throw new Error(deleteError.message);

    return { success: true };
  });

