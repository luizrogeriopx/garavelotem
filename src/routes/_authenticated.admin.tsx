import { createFileRoute, Link, Outlet, useRouterState, redirect } from "@tanstack/react-router";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Card } from "@/components/ui/card";
import {
  Shield,
  Store,
  Image,
  Tag,
  CreditCard,
  Percent,
  Users,
  Landmark,
  ArrowRightLeft,
  ShieldCheck,
  FileText,
  Download,
  Edit3,
  Settings,
  Star,
  LayoutDashboard,
  ChevronLeft,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      throw redirect({ to: "/admin/dashboard" });
    }
  },
  component: AdminLayout,
});

const navGroups = [
  {
    label: "Visão geral",
    items: [
      { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operação",
    items: [
      { to: "/admin/empresas", label: "Empresas", icon: Store },
      { to: "/admin/reivindicacoes", label: "Reivindicações", icon: ShieldCheck },
      { to: "/admin/alteracoes", label: "Alterações", icon: Edit3 },
      { to: "/admin/avaliacoes", label: "Avaliações", icon: Star },
      { to: "/admin/migracoes", label: "Migrações PF→PJ", icon: ArrowRightLeft },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { to: "/admin/importar", label: "Importar do Google", icon: Download },
      { to: "/admin/instituicoes", label: "Utilidade pública", icon: Landmark },
      { to: "/admin/promocoes", label: "Promoções", icon: Percent },
      { to: "/admin/banners", label: "Banners", icon: Image },
      { to: "/admin/categorias", label: "Categorias", icon: Tag },
    ],
  },
  {
    label: "Plataforma",
    items: [
      { to: "/admin/usuarios", label: "Usuários", icon: Users },
      { to: "/admin/planos", label: "Planos", icon: CreditCard },
      { to: "/admin/politicas", label: "Políticas", icon: FileText },
      { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

function AdminLayout() {
  const { isAdmin, isLoading } = useIsAdmin();

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
    <SidebarProvider>
      <div className="flex min-h-[calc(100vh-4rem)] w-full bg-muted/20">
        <AdminSidebar />
        <SidebarInset className="bg-transparent">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur px-4 md:px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-brand" />
              <span className="text-sm font-semibold">Painel admin</span>
            </div>
            <div className="ml-auto">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
              >
                <ChevronLeft className="size-3.5" />
                Voltar ao site
              </Link>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <div className={cn("flex items-center gap-2 px-2 py-2", collapsed && "justify-center")}>
          <div className="size-8 rounded-lg bg-gradient-to-br from-brand to-brand/70 text-brand-foreground flex items-center justify-center font-bold shadow-sm">
            G
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold">Garavelo Tem</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Admin
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-wider">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = pathname.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className={cn(
                          "transition",
                          active && "bg-brand/10 text-brand hover:bg-brand/15 hover:text-brand font-semibold"
                        )}
                      >
                        <Link
                          to={item.to}
                          onClick={() => {
                            if (isMobile) {
                              setOpenMobile(false);
                            }
                          }}
                        >
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        {!collapsed ? (
          <div className="px-2 py-2 text-[10px] text-muted-foreground">
            v1.0 · Pressione <kbd className="px-1 py-0.5 rounded bg-muted font-mono">B</kbd> para alternar
          </div>
        ) : (
          <div className="flex justify-center py-2 text-[10px] text-muted-foreground font-mono">
            v1
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
