import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CategoryStrip } from "@/components/site/CategoryStrip";
import { BannerCarousel } from "@/components/site/BannerCarousel";
import { BusinessCard, type BusinessCardData } from "@/components/site/BusinessCard";
import { PromotionCard, type PromotionCardData } from "@/components/site/PromotionCard";
import { InstitutionCard, type InstitutionCardData } from "@/components/site/InstitutionCard";
import { ChevronRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Garavelo Tem — Comércio local do Setor Garavelo" },
      { name: "description", content: "Pizzarias, salões, oficinas, farmácias e mais no Setor Garavelo. Promoções diárias e WhatsApp direto." },
    ],
  }),
});

function SectionHeader({ title, accent, to }: { title: string; accent?: string; to?: string }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        {accent && <p className="text-[11px] font-bold uppercase tracking-widest text-highlight">{accent}</p>}
        <h2 className="font-display font-extrabold text-xl md:text-2xl text-brand">{title}</h2>
      </div>
      {to && (
        <Link to={to as "/promocoes"} className="text-sm font-semibold text-highlight flex items-center gap-1">
          Ver todas <ChevronRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const loadSeed = Math.random().toString(36).slice(2);

function Home() {

  const featured = useQuery({
    queryKey: ["featured-businesses-pro", loadSeed],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,slug,name,short_description,logo_url,cover_url,whatsapp,neighborhood,is_verified,is_featured")
        .eq("status", "approved")
        .eq("is_featured", true)
        .limit(60);
      if (error) throw error;
      return shuffle((data ?? []) as BusinessCardData[]).slice(0, 6);
    },
    staleTime: 0,
  });

  const classificados = useQuery({
    queryKey: ["classificados-free", loadSeed],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,slug,name,short_description,logo_url,cover_url,whatsapp,neighborhood,is_verified,is_featured")
        .eq("status", "approved")
        .eq("is_featured", false)
        .limit(120);
      if (error) throw error;
      return shuffle((data ?? []) as BusinessCardData[]).slice(0, 6);
    },
    staleTime: 0,
  });

  const promos = useQuery({
    queryKey: ["home-promos", loadSeed],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("id,title,description,image_url,original_price_cents,price_cents,discount_percent,businesses(name,whatsapp,slug)")
        .eq("is_active", true)
        .limit(60);
      if (error) throw error;
      return shuffle((data ?? []) as unknown as PromotionCardData[]).slice(0, 8);
    },
    staleTime: 0,
  });

  const institutions = useQuery({
    queryKey: ["home-institutions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_institutions")
        .select("id,name,kind,description,address,neighborhood,phone,whatsapp,image_url")
        .eq("is_active", true)
        .order("sort_order")
        .order("name")
        .limit(8);
      if (error) throw error;
      return (data ?? []) as InstitutionCardData[];
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-10">
      <CategoryStrip />
      <BannerCarousel />

      <section>
        <SectionHeader accent="Plano Pro" title="Empresas em destaque" to="/empresas" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(featured.data ?? []).map((b) => (
            <BusinessCard key={b.id} b={b} />
          ))}
          {!featured.data &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[5/6] rounded-2xl bg-muted animate-pulse" />
            ))}
        </div>
      </section>

      <section>
        <SectionHeader accent="Plano Free" title="Classificados" to="/empresas" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(classificados.data ?? []).map((b) => (
            <BusinessCard key={b.id} b={b} />
          ))}
          {!classificados.data &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[5/6] rounded-2xl bg-muted animate-pulse" />
            ))}
        </div>
      </section>



      <section>
        <SectionHeader accent="Ao vivo" title="Promoções do dia" to="/promocoes" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(promos.data ?? []).map((p) => (
            <PromotionCard key={p.id} p={p} />
          ))}
          {!promos.data &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
            ))}
        </div>
      </section>

      {(institutions.data?.length ?? 0) > 0 && (
        <section>
          <SectionHeader accent="Serviços" title="Utilidade pública" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {institutions.data!.map((i) => (
              <InstitutionCard key={i.id} i={i} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-gradient-to-br from-brand to-brand/80 text-brand-foreground p-6 md:p-10 overflow-hidden relative">
        <Sparkles className="absolute -right-6 -top-6 size-40 text-highlight/20" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-highlight">Para comerciantes</p>
        <h3 className="font-display font-extrabold text-2xl md:text-3xl mt-1 max-w-md">
          Seu negócio na vitrine do Garavelo
        </h3>
        <p className="opacity-80 mt-2 max-w-md text-sm md:text-base">
          Cadastre-se grátis e apareça para milhares de moradores. Conheça o plano Pro com selo verificado e destaque.
        </p>
        <div className="flex gap-3 mt-5">
          <Link to="/divulgar" className="bg-highlight text-highlight-foreground font-semibold text-sm px-5 py-2.5 rounded-full">
            Divulgar empresa
          </Link>
          <Link to="/planos" className="bg-white/10 hover:bg-white/20 font-semibold text-sm px-5 py-2.5 rounded-full">
            Ver planos
          </Link>
        </div>
      </section>
    </div>
  );
}
