import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

async function getProPlanId(): Promise<string | null> {
  const { data } = await (getSupabase().from("plans") as any)
    .select("id").eq("slug", "pro").maybeSingle();
  return data?.id ?? null;
}

async function getFreePlanId(): Promise<string | null> {
  const { data } = await (getSupabase().from("plans") as any)
    .select("id").eq("slug", "free").maybeSingle();
  return data?.id ?? null;
}

function isActiveStatus(status: string) {
  return status === "active" || status === "trialing" || status === "past_due";
}

async function upsertSubscriptionAndBusiness(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  const businessId = subscription.metadata?.businessId;
  if (!userId) return;

  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await (getSupabase().from("subscriptions") as any).upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  if (businessId && isActiveStatus(subscription.status)) {
    const proId = await getProPlanId();
    if (proId) {
      await (getSupabase().from("businesses") as any)
        .update({ plan_id: proId, is_featured: true, updated_at: new Date().toISOString() })
        .eq("id", businessId)
        .eq("owner_id", userId);
    }
  }
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await (getSupabase().from("subscriptions") as any)
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  const userId = subscription.metadata?.userId;
  const businessId = subscription.metadata?.businessId;
  if (userId && businessId) {
    const freeId = await getFreePlanId();
    if (freeId) {
      await (getSupabase().from("businesses") as any)
        .update({ plan_id: freeId, is_featured: false, updated_at: new Date().toISOString() })
        .eq("id", businessId)
        .eq("owner_id", userId);
    }
  }
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscriptionAndBusiness(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
