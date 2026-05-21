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

async function assertOwnerOrAdmin(userId: string, businessId: string) {
  // Verifica se é admin primeiro
  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (roleData) return; // Se for admin, passa direto

  // Senão, verifica se é o proprietário
  const { data: bizData, error } = await supabaseAdmin
    .from("businesses")
    .select("owner_id")
    .eq("id", businessId)
    .maybeSingle();
  if (error || !bizData || bizData.owner_id !== userId) {
    throw new Error("Forbidden: You are not the owner of this business");
  }
}

// Auxiliar para gerar intervalo de dias
function getDaysArray(days: number) {
  const arr = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
    arr.push({
      dateStr,
      label: d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
      views: 0,
      clicks: 0,
    });
  }
  return arr;
}

// Auxiliar para gerar intervalo de meses (12 meses)
function getMonthsArray() {
  const arr = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1); // Evita problemas de estouro de dias no mês
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const dateStr = `${year}-${month}`; // YYYY-MM
    arr.push({
      dateStr,
      label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      views: 0,
      clicks: 0,
    });
  }
  return arr;
}

export const getMerchantAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { businessId: string; range: "7d" | "30d" | "90d" }) => d)
  .handler(async ({ input, context }) => {
    const { businessId, range } = input;
    await assertOwnerOrAdmin(context.userId, businessId);

    let daysCount = 7;
    if (range === "30d") daysCount = 30;
    if (range === "90d") daysCount = 90;

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysCount);
    const sinceIso = sinceDate.toISOString();

    const { data: logs, error } = await supabaseAdmin
      .from("business_analytics")
      .select("action_type, created_at")
      .eq("business_id", businessId)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const dataMap = getDaysArray(daysCount);

    // Contabilizar visualizações e cliques
    for (const log of logs ?? []) {
      const logDay = new Date(log.created_at).toISOString().split("T")[0];
      const match = dataMap.find((d) => d.dateStr === logDay);
      if (match) {
        if (log.action_type === "view") match.views += 1;
        else if (log.action_type === "whatsapp_click") match.clicks += 1;
      }
    }

    const totalViews = dataMap.reduce((acc, curr) => acc + curr.views, 0);
    const totalClicks = dataMap.reduce((acc, curr) => acc + curr.clicks, 0);
    const conversionRate = totalViews > 0 ? Number(((totalClicks / totalViews) * 100).toFixed(1)) : 0;

    return {
      history: dataMap,
      summary: {
        totalViews,
        totalClicks,
        conversionRate,
      },
    };
  });

export const getAdminGlobalAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { range: "7d" | "30d" | "90d" | "12m" }) => d)
  .handler(async ({ input, context }) => {
    await assertAdmin(context.userId);
    const { range } = input;

    let sinceDate = new Date();
    let isMonthly = false;

    if (range === "7d") {
      sinceDate.setDate(sinceDate.getDate() - 7);
    } else if (range === "30d") {
      sinceDate.setDate(sinceDate.getDate() - 30);
    } else if (range === "90d") {
      sinceDate.setDate(sinceDate.getDate() - 90);
    } else if (range === "12m") {
      sinceDate.setDate(1); // Evita transbordamento de datas
      sinceDate.setFullYear(sinceDate.getFullYear() - 1);
      isMonthly = true;
    }

    const sinceIso = sinceDate.toISOString();

    const { data: logs, error } = await supabaseAdmin
      .from("business_analytics")
      .select("action_type, created_at, business_id, businesses(name)")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: true });

    if (error) throw error;

    let dataMap: Array<{ dateStr: string; label: string; views: number; clicks: number }> = [];

    if (isMonthly) {
      dataMap = getMonthsArray();
      for (const log of logs ?? []) {
        const logDate = new Date(log.created_at);
        const year = logDate.getFullYear();
        const month = String(logDate.getMonth() + 1).padStart(2, "0");
        const logMonth = `${year}-${month}`;
        const match = dataMap.find((d) => d.dateStr === logMonth);
        if (match) {
          if (log.action_type === "view") match.views += 1;
          else if (log.action_type === "whatsapp_click") match.clicks += 1;
        }
      }
    } else {
      let daysCount = 7;
      if (range === "30d") daysCount = 30;
      if (range === "90d") daysCount = 90;
      dataMap = getDaysArray(daysCount);

      for (const log of logs ?? []) {
        const logDay = new Date(log.created_at).toISOString().split("T")[0];
        const match = dataMap.find((d) => d.dateStr === logDay);
        if (match) {
          if (log.action_type === "view") match.views += 1;
          else if (log.action_type === "whatsapp_click") match.clicks += 1;
        }
      }
    }

    // Calcular o ranking das 5 empresas mais visualizadas no período
    const rankMap = new Map<string, { name: string; views: number; clicks: number }>();
    for (const log of (logs ?? []) as any[]) {
      const bizId = log.business_id;
      const bizName = log.businesses?.name ?? "Empresa Excluída";
      if (!rankMap.has(bizId)) {
        rankMap.set(bizId, { name: bizName, views: 0, clicks: 0 });
      }
      const val = rankMap.get(bizId)!;
      if (log.action_type === "view") val.views += 1;
      else if (log.action_type === "whatsapp_click") val.clicks += 1;
    }

    const topBusinesses = Array.from(rankMap.entries())
      .map(([id, info]) => ({
        id,
        name: info.name,
        views: info.views,
        clicks: info.clicks,
        conversion: info.views > 0 ? Number(((info.clicks / info.views) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    const totalViews = dataMap.reduce((acc, curr) => acc + curr.views, 0);
    const totalClicks = dataMap.reduce((acc, curr) => acc + curr.clicks, 0);
    const conversionRate = totalViews > 0 ? Number(((totalClicks / totalViews) * 100).toFixed(1)) : 0;

    return {
      history: dataMap,
      summary: {
        totalViews,
        totalClicks,
        conversionRate,
      },
      topBusinesses,
    };
  });
