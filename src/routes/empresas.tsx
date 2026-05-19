import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BusinessCard, type BusinessCardData } from "@/components/site/BusinessCard";

export const Route = createFileRoute("/empresas")({
  component: EmpresasPage,
  head: () => ({ meta: [{ title: "Empresas — Garavelo Tem" }] }),
});

function EmpresasPage() {
  const { data } = useQuery({
    queryKey: ["all-businesses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,slug,name,short_description,logo_url,cover_url,whatsapp,neighborhood,is_verified,is_featured")
        .eq("status", "approved")
        .eq("is_platform", false)
        .order("is_featured", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []) as BusinessCardData[];
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-end justify-between mb-6">
        <h1 className="font-display font-extrabold text-2xl text-brand">Empresas</h1>
        <Link to="/categorias" className="text-sm font-semibold text-highlight">Ver por categoria</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {(data ?? []).map((b) => <BusinessCard key={b.id} b={b} />)}
      </div>
      {data && data.length === 0 && (
        <p className="text-muted-foreground text-sm">Nenhuma empresa cadastrada ainda.</p>
      )}
    </div>
  );
}
