import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.pathname, mode: "signin" },
      });
    }
    const userId = data.session.user.id;

    // Gate: força completar perfil antes de qualquer ação interna
    if (
      location.pathname !== "/completar-cadastro" &&
      location.pathname !== "/aceitar-politicas"
    ) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", userId)
        .maybeSingle();
      if (!profile?.profile_completed) {
        throw redirect({ to: "/completar-cadastro" });
      }
    }

    // Gate: políticas obrigatórias pendentes (signup + business se tiver empresa)
    if (location.pathname !== "/aceitar-politicas") {
      const [{ data: biz }, { data: policies }, { data: acc }] = await Promise.all([
        supabase.from("businesses").select("id").eq("owner_id", userId).limit(1),
        supabase
          .from("policies")
          .select("slug, required_for")
          .eq("is_active", true)
          .eq("is_required", true),
        supabase.from("policy_acceptances").select("policy_slug, context").eq("user_id", userId),
      ]);

      const contexts: string[] = ["signup", ...(biz?.length ? ["business"] : [])];
      const acceptedSet = new Set((acc ?? []).map((a) => `${a.context}:${a.policy_slug}`));
      const hasPending = (policies ?? []).some((p: any) => {
        if (!Array.isArray(p.required_for)) return false;
        return contexts.some(
          (ctx) => p.required_for.includes(ctx) && !acceptedSet.has(`${ctx}:${p.slug}`),
        );
      });

      if (hasPending) {
        throw redirect({
          to: "/aceitar-politicas",
          search: { redirect: location.pathname },
        });
      }
    }
  },
  component: () => <Outlet />,
});
