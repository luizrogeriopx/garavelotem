import { createFileRoute, Link, Outlet, useRouterState, redirect } from "@tanstack/react-router";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Card } from "@/components/ui/card";
import { Shield, Store, Image, Tag, CreditCard, Percent, Users, Landmark, ArrowRightLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      throw redirect({ to: "/admin/empresas" });
    }
  },
  component: AdminLayout,
});

const tabs = [
  { to: "/admin/empresas", label: "Empresas", icon: Store },
  { to: "/admin/migracoes", label: "Migrações PF→PJ", icon: ArrowRightLeft },
  { to: "/admin/reivindicacoes", label: "Reivindicações", icon: ShieldCheck },
  { to: "/admin/instituicoes", label: "Utilidade pública", icon: Landmark },
  { to: "/admin/promocoes", label: "Promoções", icon: Percent },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/banners", label: "Banners", icon: Image },
  { to: "/admin/categorias", label: "Categorias", icon: Tag },
  { to: "/admin/planos", label: "Planos", icon: CreditCard },
];

function AdminLayout() {
  const { isAdmin, isLoading } = useIsAdmin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (isLoading) {
    return <div className="container py-10 text-muted-foreground">Carregando…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="container py-10">
        <Card className="p-8 text-center space-y-3">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-semibold">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">
            Esta área é exclusiva para administradores da plataforma.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Painel administrativo</h1>
      </div>
      <nav className="flex gap-2 overflow-x-auto border-b">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}
