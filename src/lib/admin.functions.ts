import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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

export const blockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      // ISO date string; null/undefined to unblock
      until: z.string().datetime().nullable().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    // Update profile flag (for UI display)
    const { error: pErr } = await supabaseAdmin
      .from("profiles")
      .update({ blocked_until: data.until ?? null })
      .eq("id", data.userId);
    if (pErr) throw new Error(pErr.message);

    // Ban / unban in auth
    if (data.until) {
      const ms = new Date(data.until).getTime() - Date.now();
      const hours = Math.max(1, Math.ceil(ms / 3_600_000));
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        ban_duration: `${hours}h`,
      });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        ban_duration: "none",
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("Você não pode excluir a si mesmo.");

    // Cascade-clean app data first
    const uid = data.userId;
    await supabaseAdmin.from("favorites").delete().eq("user_id", uid);
    await supabaseAdmin.from("post_likes").delete().eq("user_id", uid);
    await supabaseAdmin.from("post_comments").delete().eq("user_id", uid);
    await supabaseAdmin.from("reviews").delete().eq("user_id", uid);
    await supabaseAdmin.from("policy_acceptances").delete().eq("user_id", uid);
    await supabaseAdmin.from("business_claims").delete().eq("user_id", uid);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);

    // Detach businesses (set owner_id to null) — admin can later reassign or delete
    await supabaseAdmin.from("businesses").update({ owner_id: null }).eq("owner_id", uid);

    await supabaseAdmin.from("profiles").delete().eq("id", uid);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const blockBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      businessId: z.string().uuid(),
      until: z.string().datetime().nullable().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("businesses")
      .update({ blocked_until: data.until ?? null })
      .eq("id", data.businessId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
