import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";

export type PolicyContext = "signup" | "business" | "claim";

export type AcceptablePolicy = {
  id: string;
  slug: string;
  title: string;
};

export function usePoliciesForContext(context: PolicyContext) {
  return useQuery({
    queryKey: ["policies-for-context", context],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policies")
        .select("id,slug,title,required_for,is_required,is_active,sort_order")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).filter(
        (p: any) => p.is_required && Array.isArray(p.required_for) && p.required_for.includes(context),
      ) as AcceptablePolicy[];
    },
  });
}

import { recordPolicyAcceptances } from "@/lib/policies.functions";

export async function recordAcceptances(params: {
  userId: string;
  policies: AcceptablePolicy[];
  context: PolicyContext;
  businessId?: string | null;
  claimId?: string | null;
}) {
  if (!params.policies.length) return;
  await recordPolicyAcceptances({
    data: {
      policies: params.policies.map((p) => ({ id: p.id, slug: p.slug })),
      context: params.context,
      businessId: params.businessId ?? null,
      claimId: params.claimId ?? null,
    },
  });
}

export function PolicyAcceptanceList({
  context,
  accepted,
  onToggle,
}: {
  context: PolicyContext;
  accepted: Record<string, boolean>;
  onToggle: (slug: string, checked: boolean) => void;
}) {
  const { data: policies } = usePoliciesForContext(context);
  if (!policies || policies.length === 0) return null;
  return (
    <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Aceite obrigatório
      </p>
      {policies.map((p) => (
        <label
          key={p.id}
          className="flex items-start gap-2 text-sm cursor-pointer"
        >
          <Checkbox
            checked={!!accepted[p.slug]}
            onCheckedChange={(v) => onToggle(p.slug, !!v)}
            className="mt-0.5"
          />
          <span>
            Li e aceito a{" "}
            <Link
              to="/politicas/$slug"
              params={{ slug: p.slug }}
              target="_blank"
              className="text-primary underline underline-offset-2"
            >
              {p.title}
            </Link>
            .
          </span>
        </label>
      ))}
    </div>
  );
}

export function allAccepted(
  policies: AcceptablePolicy[] | undefined,
  accepted: Record<string, boolean>,
) {
  if (!policies) return true;
  return policies.every((p) => accepted[p.slug]);
}
