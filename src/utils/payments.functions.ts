import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId: string },
): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");
  const found = await stripe.customers.search({
    query: `metadata['userId']:'${options.userId}'`,
    limit: 1,
  });
  if (found.data.length) return found.data[0].id;
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    metadata: { userId: options.userId },
  });
  return created.id;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    priceId: string;
    businessId: string;
    customerEmail?: string;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
    if (!UUID_RE.test(data.businessId)) throw new Error("Invalid businessId");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Ensure the business is owned by the user, approved, and not already Pro.
    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id, status, owner_id, plan_id, plans(slug)")
      .eq("id", data.businessId)
      .maybeSingle();
    if (bizErr || !biz) throw new Error("Empresa não encontrada");
    if (biz.owner_id !== userId) throw new Error("Empresa não pertence a você");
    if (biz.status !== "approved") {
      throw new Error("Sua empresa precisa estar aprovada antes de assinar o Pro");
    }
    if ((biz as any).plans?.slug === "pro") {
      throw new Error("Esta empresa já está no plano Pro");
    }

    const stripe = createStripeClient(data.environment);

    const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
    if (!prices.data.length) throw new Error("Price not found");
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    const customerId = await resolveOrCreateCustomer(stripe, {
      email: data.customerEmail,
      userId,
    });

    const metadata = { userId, businessId: data.businessId };

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: data.returnUrl,
      customer: customerId,
      metadata,
      ...(isRecurring && { subscription_data: { metadata } }),
    });

    return session.client_secret;
  });
