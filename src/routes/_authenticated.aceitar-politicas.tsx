import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileCheck2 } from "lucide-react";
import { toast } from "sonner";
import {
  PolicyAcceptanceList,
  recordAcceptances,
  type PolicyContext,
  type AcceptablePolicy,
} from "@/components/site/PolicyAcceptance";

export const Route = createFileRoute("/_authenticated/aceitar-politicas")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
  }),
  component: AcceptPoliciesPage,
});

function AcceptPoliciesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/_authenticated/aceitar-politicas" });
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});

  const { data: pending, isLoading, refetch } = useQuery({
    queryKey: ["pending-policies", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return { contexts: [] as PolicyContext[], byContext: {} as Record<PolicyContext, AcceptablePolicy[]> };

      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1);
      const hasBusiness = !!biz?.length;

      const contexts: PolicyContext[] = hasBusiness ? ["signup", "business"] : ["signup"];

      const { data: policies } = await supabase
        .from("policies")
        .select("id,slug,title,required_for,is_required,is_active")
        .eq("is_active", true)
        .eq("is_required", true);

      const { data: acc } = await supabase
        .from("policy_acceptances")
        .select("policy_slug, context")
        .eq("user_id", user.id);

      const acceptedSet = new Set((acc ?? []).map((a) => `${a.context}:${a.policy_slug}`));
      const byContext = {} as Record<PolicyContext, AcceptablePolicy[]>;
      for (const ctx of contexts) {
        byContext[ctx] = (policies ?? [])
          .filter((p: any) => Array.isArray(p.required_for) && p.required_for.includes(ctx))
          .filter((p: any) => !acceptedSet.has(`${ctx}:${p.slug}`))
          .map((p: any) => ({ id: p.id, slug: p.slug, title: p.title }));
      }
      return { contexts, byContext };
    },
  });

  useEffect(() => {
    if (!isLoading && pending) {
      const total = pending.contexts.reduce((n, c) => n + pending.byContext[c].length, 0);
      if (total === 0) navigate({ to: redirect || "/" });
    }
  }, [isLoading, pending, navigate, redirect]);

  const submit = async () => {
    if (!user || !pending) return;
    for (const ctx of pending.contexts) {
      for (const p of pending.byContext[ctx]) {
        if (!accepted[`${ctx}:${p.slug}`]) {
          toast.error("Aceite todas as políticas obrigatórias para continuar.");
          return;
        }
      }
    }
    setLoading(true);
    try {
      for (const ctx of pending.contexts) {
        if (pending.byContext[ctx].length) {
          await recordAcceptances({
            userId: user.id,
            policies: pending.byContext[ctx],
            context: ctx,
          });
        }
      }
      toast.success("Políticas aceitas. Obrigado!");
      await refetch();
      navigate({ to: redirect || "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao registrar aceite");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-muted-foreground flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" /> Carregando…
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2">
        <FileCheck2 className="size-6 text-primary" />
        <h1 className="font-display font-extrabold text-2xl text-brand">Atualização nos termos</h1>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        Para continuar usando o Garavelo Tem, precisamos do seu aceite nas políticas abaixo.
      </p>

      <Card className="p-5 mt-6 space-y-4">
        {pending?.contexts.map((ctx) =>
          pending.byContext[ctx].length ? (
            <div key={ctx} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {ctx === "signup" ? "Como usuário" : ctx === "business" ? "Como dono de empresa" : ctx}
              </p>
              <PolicyAcceptanceListInline
                policies={pending.byContext[ctx]}
                context={ctx}
                accepted={accepted}
                onToggle={(slug, v) =>
                  setAccepted((s) => ({ ...s, [`${ctx}:${slug}`]: v }))
                }
              />
            </div>
          ) : null,
        )}

        <Button
          onClick={submit}
          disabled={loading}
          className="w-full rounded-full bg-brand text-brand-foreground font-semibold"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Aceitar e continuar
        </Button>
      </Card>
    </div>
  );
}

// Inline list reusing the same look as PolicyAcceptanceList but with explicit policies
function PolicyAcceptanceListInline({
  policies,
  context,
  accepted,
  onToggle,
}: {
  policies: AcceptablePolicy[];
  context: PolicyContext;
  accepted: Record<string, boolean>;
  onToggle: (slug: string, checked: boolean) => void;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
      {policies.map((p) => (
        <label key={p.id} className="flex items-start gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!accepted[`${context}:${p.slug}`]}
            onChange={(e) => onToggle(p.slug, e.target.checked)}
            className="mt-1 size-4 accent-primary"
          />
          <span>
            Li e aceito a{" "}
            <a
              href={`/politicas/${p.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {p.title}
            </a>
            .
          </span>
        </label>
      ))}
    </div>
  );
}
