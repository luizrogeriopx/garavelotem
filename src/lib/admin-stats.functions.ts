import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

async function countTable(table: string, filter?: (q: any) => any): Promise<number> {
  let q = ((supabaseAdmin as any).from(table) as any).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
}

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      businessesTotal,
      businessesApproved,
      businessesPending,
      businessesNew30d,
      promotionsTotal,
      promotionsActive,
      couponsTotal,
      couponsActive,
      couponsRedeemed,
      usersTotal,
      usersNew30d,
      reviewsTotal,
      reviewsPending,
      claimsPending,
      changesPending,
      followersTotal,
      postsTotal,
      newSignups7d,
    ] = await Promise.all([
      countTable("businesses"),
      countTable("businesses", (q) => q.eq("status", "approved")),
      countTable("businesses", (q) => q.eq("status", "pending")),
      countTable("businesses", (q) => q.gte("created_at", since30)),
      countTable("promotions"),
      countTable("promotions", (q) => q.eq("is_active", true)),
      countTable("coupons"),
      countTable("coupons", (q) => q.eq("is_active", true)),
      countTable("user_coupons", (q) => q.eq("status", "used")),
      countTable("profiles"),
      countTable("profiles", (q) => q.gte("created_at", since30)),
      countTable("reviews"),
      countTable("reviews", (q) => q.eq("status", "pending")),
      countTable("business_claims", (q) => q.eq("status", "pending")),
      countTable("change_requests", (q) => q.eq("status", "pending")),
      countTable("business_followers"),
      countTable("business_posts"),
      countTable("profiles", (q) => q.gte("created_at", since7)),
    ]);

    // Top categories by business count
    const { data: cats } = await (supabaseAdmin.from("businesses") as any)
      .select("category_id, categories(name)")
      .eq("status", "approved")
      .limit(2000);

    const catCounts = new Map<string, { name: string; count: number }>();
    for (const row of (cats ?? []) as any[]) {
      const id = row.category_id ?? "sem";
      const name = row.categories?.name ?? "Sem categoria";
      const prev = catCounts.get(id);
      catCounts.set(id, { name, count: (prev?.count ?? 0) + 1 });
    }
    const topCategories = Array.from(catCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      businesses: {
        total: businessesTotal,
        approved: businessesApproved,
        pending: businessesPending,
        new30d: businessesNew30d,
      },
      promotions: { total: promotionsTotal, active: promotionsActive },
      coupons: { total: couponsTotal, active: couponsActive, redeemed: couponsRedeemed },
      users: { total: usersTotal, new30d: usersNew30d, new7d: newSignups7d },
      reviews: { total: reviewsTotal, pending: reviewsPending },
      pending: {
        claims: claimsPending,
        changes: changesPending,
        reviews: reviewsPending,
        businesses: businessesPending,
      },
      engagement: { followers: followersTotal, posts: postsTotal },
      topCategories,
    };
  });
