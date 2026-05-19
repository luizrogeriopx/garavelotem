import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BusinessCard, type BusinessCardData } from "@/components/site/BusinessCard";

export const Route = createFileRoute("/categorias/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const cat = await supabase.from("categories").select("id,name").eq("slug", slug).maybeSingle();
      if (!cat.data) return { name: slug, items: [] as BusinessCardData[] };
      const list = await supabase
        .from("businesses")
        .select("id,slug,name,short_description,logo_url,cover_url,whatsapp,neighborhood,is_verified")
        .eq("status", "approved")
        .eq("is_platform", false)
        .eq("category_id", cat.data.id)
        .order("is_featured", { ascending: false });
      return { name: cat.data.name, items: (list.data ?? []) as BusinessCardData[] };
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="font-display font-extrabold text-2xl text-brand mb-6">{data?.name ?? "Carregando..."}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {(data?.items ?? []).map((b) => <BusinessCard key={b.id} b={b} />)}
      </div>
      {data && data.items.length === 0 && (
        <p className="text-muted-foreground text-sm">Nenhuma empresa nesta categoria ainda.</p>
      )}
    </div>
  );
}
