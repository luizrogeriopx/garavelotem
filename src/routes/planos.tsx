import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, Sparkles } from "lucide-react";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/planos")({
  component: PlansPage,
  head: () => ({ meta: [{ title: "Planos — Garavelo Tem" }] }),
});

function PlansPage() {
  const { data } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").order("price_cents");
      return data ?? [];
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="text-center max-w-xl mx-auto">
        <p className="text-[11px] font-bold uppercase tracking-widest text-highlight">Planos</p>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-brand mt-1">
          Escolha o plano ideal para sua empresa
        </h1>
        <p className="text-muted-foreground mt-3">Comece grátis ou destaque-se com o Pro.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-10">
        {(data ?? []).map((p) => {
          const features = Array.isArray(p.features) ? (p.features as string[]) : [];
          const isPro = p.is_featured;
          return (
            <div
              key={p.id}
              className={`rounded-3xl p-8 shadow-card relative ${
                isPro ? "bg-brand text-brand-foreground ring-2 ring-highlight" : "bg-card"
              }`}
            >
              {isPro && (
                <span className="absolute -top-3 left-8 bg-highlight text-highlight-foreground text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="size-3" /> MAIS POPULAR
                </span>
              )}
              <h3 className="font-display font-extrabold text-2xl">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">
                  {p.price_cents === 0 ? "Grátis" : formatBRL(p.price_cents)}
                </span>
                {p.price_cents > 0 && <span className="text-sm opacity-70">/mês</span>}
              </div>
              <ul className="mt-6 space-y-3">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`size-4 mt-0.5 shrink-0 ${isPro ? "text-highlight" : "text-whatsapp"}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/divulgar"
                className={`mt-8 block text-center font-semibold py-3 rounded-xl ${
                  isPro
                    ? "bg-highlight text-highlight-foreground"
                    : "bg-brand text-brand-foreground"
                }`}
              >
                {isPro ? "Assinar Pro" : "Começar grátis"}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
