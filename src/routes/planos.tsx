import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Check, Sparkles, Store } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const searchSchema = z.object({ businessId: z.string().uuid().optional() });

export const Route = createFileRoute("/planos")({
  component: PlansPage,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Planos — Garavelo Tem" }] }),
});

type EligibleBiz = { id: string; name: string; logo_url: string | null; plan_slug: string | null };

function PlansPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/planos" });
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [checkoutBusinessId, setCheckoutBusinessId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email });
    });
  }, []);

  const { data } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").order("price_cents");
      return data ?? [];
    },
  });

  const { data: eligible } = useQuery({
    queryKey: ["eligible-businesses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, logo_url, plans(slug)")
        .eq("owner_id", user!.id)
        .eq("status", "approved");
      if (error) throw error;
      return (data ?? []).map((b: any) => ({
        id: b.id, name: b.name, logo_url: b.logo_url,
        plan_slug: b.plans?.slug ?? null,
      })) as EligibleBiz[];
    },
  });

  const freeApproved = (eligible ?? []).filter((b) => b.plan_slug !== "pro");

  const handleProClick = () => {
    if (!user) {
      toast.error("Faça login para assinar o Plano Pro");
      navigate({ to: "/login" });
      return;
    }
    if (!eligible) return;
    if (eligible.length === 0) {
      toast.error("Você precisa de uma empresa aprovada antes de assinar o Pro.");
      navigate({ to: "/minha-empresa" });
      return;
    }
    if (freeApproved.length === 0) {
      toast.info("Todas as suas empresas aprovadas já estão no plano Pro.");
      return;
    }
    if (search.businessId && freeApproved.some((b) => b.id === search.businessId)) {
      setCheckoutBusinessId(search.businessId);
      return;
    }
    if (freeApproved.length === 1) {
      setCheckoutBusinessId(freeApproved[0].id);
      return;
    }
    setSelectorOpen(true);
  };

  // Auto-open checkout if URL has a valid businessId
  useEffect(() => {
    if (search.businessId && user && freeApproved.some((b) => b.id === search.businessId)) {
      setCheckoutBusinessId(search.businessId);
    }
  }, [search.businessId, user, freeApproved]);

  return (
    <>
      <PaymentTestModeBanner />
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
                {isPro ? (
                  <button
                    onClick={handleProClick}
                    className="mt-8 w-full text-center font-semibold py-3 rounded-xl bg-highlight text-highlight-foreground"
                  >
                    Assinar Pro
                  </button>
                ) : (
                  <Link
                    to="/divulgar"
                    className="mt-8 block text-center font-semibold py-3 rounded-xl bg-brand text-brand-foreground"
                  >
                    Começar grátis
                  </Link>
                )}
                {isPro && user && eligible && eligible.length > 0 && freeApproved.length === 0 && (
                  <p className="mt-3 text-xs opacity-80 text-center">
                    Todas as suas empresas já são Pro 🎉
                  </p>
                )}
                {isPro && user && eligible && eligible.length === 0 && (
                  <p className="mt-3 text-xs opacity-80 text-center">
                    Cadastre e aprove uma empresa antes de assinar o Pro.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Business selector */}
      <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Para qual empresa deseja assinar o Pro?</DialogTitle>
            <DialogDescription>
              Selecione abaixo a empresa aprovada que você quer migrar para o plano Pro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {freeApproved.map((b) => (
              <button
                key={b.id}
                onClick={() => { setSelectorOpen(false); setCheckoutBusinessId(b.id); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-accent transition"
              >
                <div className="size-10 rounded-lg bg-muted overflow-hidden grid place-items-center shrink-0">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.name} className="size-full object-cover" />
                  ) : (
                    <Store className="size-5 text-muted-foreground" />
                  )}
                </div>
                <span className="font-medium">{b.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Stripe checkout */}
      <Dialog open={!!checkoutBusinessId} onOpenChange={(o) => !o && setCheckoutBusinessId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assinar Plano Pro</DialogTitle>
            <DialogDescription>
              {freeApproved.find((b) => b.id === checkoutBusinessId)?.name}
            </DialogDescription>
          </DialogHeader>
          {checkoutBusinessId && user && (
            <StripeEmbeddedCheckout
              priceId="plano_pro_mensal"
              businessId={checkoutBusinessId}
              customerEmail={user.email}
              returnUrl={`${window.location.origin}/checkout/retorno?session_id={CHECKOUT_SESSION_ID}`}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
