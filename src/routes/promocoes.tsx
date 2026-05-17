import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PromotionCard, type PromotionCardData } from "@/components/site/PromotionCard";

export const Route = createFileRoute("/promocoes")({
  component: PromosPage,
  head: () => ({ meta: [{ title: "Promoções do dia — Garavelo Tem" }] }),
});

function PromosPage() {
  const { data } = useQuery({
    queryKey: ["all-promos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("id,title,description,image_url,original_price_cents,price_cents,discount_percent,businesses(name,whatsapp,slug)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PromotionCardData[];
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="font-display font-extrabold text-2xl text-brand mb-1">Promoções do dia</h1>
      <p className="text-muted-foreground text-sm mb-6">As melhores ofertas do Setor Garavelo, atualizadas todo dia.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(data ?? []).map((p) => <PromotionCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
