import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BusinessCard, type BusinessCardData } from "@/components/site/BusinessCard";
import { z } from "zod";

const searchSchema = z.object({ q: z.string().optional().default("") });

export const Route = createFileRoute("/buscar")({
  validateSearch: (s) => searchSchema.parse(s),
  component: SearchPage,
  head: () => ({ meta: [{ title: "Buscar — Garavelo Tem" }] }),
});

function SearchPage() {
  const { q } = Route.useSearch();
  const { data, isLoading } = useQuery({
    queryKey: ["search", q],
    enabled: q.trim().length > 0,
    queryFn: async () => {
      const term = `%${q.trim()}%`;
      const { data, error } = await supabase
        .from("businesses")
        .select("id,slug,name,short_description,logo_url,cover_url,whatsapp,neighborhood,is_verified")
        .eq("status", "approved")
        .or(`name.ilike.${term},short_description.ilike.${term},neighborhood.ilike.${term}`)
        .limit(50);
      if (error) throw error;
      return (data ?? []) as BusinessCardData[];
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="font-display font-extrabold text-2xl text-brand mb-6">
        {q ? `Resultados para "${q}"` : "Buscar"}
      </h1>
      {!q && <p className="text-muted-foreground text-sm">Digite no campo de busca acima.</p>}
      {q && isLoading && <p className="text-muted-foreground text-sm">Buscando…</p>}
      {q && !isLoading && (data?.length ?? 0) === 0 && (
        <p className="text-muted-foreground text-sm">Nenhuma empresa encontrada.</p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {(data ?? []).map((b) => <BusinessCard key={b.id} b={b} />)}
      </div>
    </div>
  );
}
