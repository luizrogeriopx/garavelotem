import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestIP } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AcceptanceInput = {
  policies: Array<{ id: string; slug: string }>;
  context: "signup" | "business" | "claim";
  businessId?: string | null;
  claimId?: string | null;
};

export const recordPolicyAcceptances = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AcceptanceInput) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.policies?.length) return { ok: true, count: 0 };

    let ip: string | null = null;
    let userAgent: string | null = null;
    try {
      const req = getRequest();
      userAgent = req.headers.get("user-agent");
      const fwd = req.headers.get("x-forwarded-for");
      if (fwd) ip = fwd.split(",")[0].trim();
      else {
        ip =
          req.headers.get("cf-connecting-ip") ||
          req.headers.get("x-real-ip") ||
          getRequestIP({ xForwardedFor: true }) ||
          null;
      }
    } catch {
      // best-effort
    }

    const rows = data.policies.map((p) => ({
      user_id: userId,
      policy_id: p.id,
      policy_slug: p.slug,
      context: data.context,
      business_id: data.businessId ?? null,
      claim_id: data.claimId ?? null,
      ip_address: ip,
      user_agent: userAgent,
    }));
    const { error } = await supabase.from("policy_acceptances").insert(rows);
    if (error) throw new Error(error.message);
    return { ok: true, count: rows.length };
  });
