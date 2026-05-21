import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BusinessCard, type BusinessCardData } from "@/components/site/BusinessCard";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CategoryStrip } from "@/components/site/CategoryStrip";

export const Route = createFileRoute("/categorias/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

  const { data: categoryData } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data: cat } = await supabase.from("categories").select("id,name").eq("slug", slug).maybeSingle();
      if (!cat) return null;
      
      const { data: subs } = await supabase
        .from("subcategories")
        .select("id,name,slug")
        .eq("category_id", cat.id)
        .order("sort_order", { ascending: true });
        
      return { ...cat, subcategories: subs ?? [] };
    },
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["category-items", categoryData?.id, selectedSubcategoryId],
    enabled: !!categoryData?.id,
    queryFn: async () => {
      let query = supabase
        .from("businesses")
        .select("id,slug,name,short_description,logo_url,cover_url,whatsapp,neighborhood,is_verified")
        .eq("status", "approved")
        .eq("is_platform", false)
        .eq("category_id", categoryData!.id);
      
      if (selectedSubcategoryId) {
        query = query.eq("subcategory_id", selectedSubcategoryId);
      }

      const { data } = await query.order("is_featured", { ascending: false });
      return (data ?? []) as BusinessCardData[];
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <CategoryStrip activeSlug={slug} />
      
      <div className="pt-2">
        <h1 className="font-display font-extrabold text-2xl text-brand mb-2">{categoryData?.name ?? "Carregando..."}</h1>
        
        {categoryData?.subcategories && categoryData.subcategories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => setSelectedSubcategoryId(null)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                !selectedSubcategoryId 
                  ? "bg-brand text-brand-foreground border-brand" 
                  : "bg-background text-muted-foreground border-border hover:border-brand/30"
              )}
            >
              Todos
            </button>
            {categoryData.subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubcategoryId(sub.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                  selectedSubcategoryId === sub.id 
                    ? "bg-brand text-brand-foreground border-brand" 
                    : "bg-background text-muted-foreground border-border hover:border-brand/30"
                )}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {!itemsLoading && items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma empresa encontrada{selectedSubcategoryId ? " nesta subcategoria" : ""}.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((b) => <BusinessCard key={b.id} b={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}

