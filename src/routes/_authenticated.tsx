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
    // Gate: força completar perfil antes de qualquer ação interna
    if (location.pathname !== "/completar-cadastro") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (!profile?.profile_completed) {
        throw redirect({ to: "/completar-cadastro" });
      }
    }
  },
  component: () => <Outlet />,
});
