import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LogOut, Plus, Store, CheckCircle2, Clock, XCircle,
  Eye, MessageCircle, Tag, Pencil, ExternalLink, Shield, Sparkles, ArrowRightLeft, UserCog, Bell, Ticket, QrCode, TrendingUp, BarChart3, Loader2
} from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { MigrateToPjDialog } from "@/components/merchant/MigrateToPjDialog";
import { ChangeRequestDialog } from "@/components/ChangeRequestDialog";
import { QrReader } from "@/components/QrReader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useServerFn } from "@tanstack/react-start";
import { getMerchantAnalytics } from "@/lib/business-analytics.functions";
import { ChartContainer } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_authenticated/conta")({
  component: AccountPage,
});

type BizRow = {
  id: string;
  name: string;
  slug: string;
  username: string | null;
  status: string;
  logo_url: string | null;
  is_verified: boolean;
  views_count: number;
  whatsapp_clicks: number;
  plan_slug: string | null;
  plan_name: string | null;
  entity_type: "pf" | "pj";
  migration_status: string | null;
};

function AccountPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [migrateBiz, setMigrateBiz] = useState<{ id: string; name: string } | null>(null);
  const [statsBiz, setStatsBiz] = useState<{ id: string; name: string } | null>(null);
  const [profileChangeOpen, setProfileChangeOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id);
  const [activeTab, setActiveTab] = useState<"businesses" | "notifications" | "coupons">("businesses");
  const [qrOpen, setQrOpen] = useState(false);

  const { data: businesses, isLoading } = useQuery({
    queryKey: ["my-businesses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, slug, username, status, logo_url, is_verified, views_count, whatsapp_clicks, entity_type, migration_status, plans(slug, name)")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((b: any) => ({
        ...b,
        plan_slug: b.plans?.slug ?? null,
        plan_name: b.plans?.name ?? null,
      })) as BizRow[];
    },
  });

  const { data: promoStats } = useQuery({
    queryKey: ["my-promo-stats", user?.id, businesses?.map((b) => b.id).join(",")],
    enabled: !!businesses && businesses.length > 0,
    queryFn: async () => {
      const ids = businesses!.map((b) => b.id);
      const { data, error } = await supabase
        .from("promotions")
        .select("business_id, is_active")
        .in("business_id", ids);
      if (error) throw error;
      const map: Record<string, { active: number; total: number }> = {};
      ids.forEach((id) => (map[id] = { active: 0, total: 0 }));
      data.forEach((p) => {
        map[p.business_id].total += 1;
        if (p.is_active) map[p.business_id].active += 1;
      });
      return map;
    },
  });

  const totals = (businesses ?? []).reduce(
    (acc, b) => ({
      views: acc.views + (b.views_count || 0),
      clicks: acc.clicks + (b.whatsapp_clicks || 0),
    }),
    { views: 0, clicks: 0 },
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-highlight">Minha conta</p>
          <h1 className="font-display font-extrabold text-2xl text-brand">
            Olá, {user?.user_metadata?.full_name || user?.email}
          </h1>
        </div>
        <div className="flex gap-2">
          <AdminLinkButton />
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setProfileChangeOpen(true)}>
            <UserCog className="size-4" /> Alterar meus dados
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
        <StatCard icon={<Bell className="size-4" />} label="Notificações" value={unreadCount} onClick={() => setActiveTab("notifications")} highlight={unreadCount > 0} />
        <StatCard icon={<Ticket className="size-4" />} label="Cupons" value={0} onClick={() => setActiveTab("coupons")} />
        <StatCard icon={<Store className="size-4" />} label="Empresas" value={businesses?.length ?? 0} onClick={() => setActiveTab("businesses")} />
        <StatCard icon={<Eye className="size-4" />} label="Visualizações" value={totals.views} />
        <StatCard icon={<MessageCircle className="size-4" />} label="WhatsApp" value={totals.clicks} />
      </div>

      {activeTab === "notifications" ? (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">Notificações</h2>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAllAsRead.mutate()} className="text-xs">
                Marcar todas como lidas
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <Bell className="size-10 mx-auto opacity-20 mb-2" />
                <p>Nenhuma notificação por aqui.</p>
              </Card>
            ) : (
              notifications.map((n) => (
                <Card 
                  key={n.id} 
                  className={`p-4 transition-colors cursor-pointer ${!n.is_read ? 'bg-highlight/5 border-highlight/20' : ''}`}
                  onClick={() => !n.is_read && markAsRead.mutate(n.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1.5 size-2 rounded-full shrink-0 ${!n.is_read ? 'bg-highlight' : 'bg-transparent'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-semibold ${!n.is_read ? 'text-brand' : ''}`}>{n.title}</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNowStrict(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.content}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
          <Button variant="ghost" className="w-full mt-4 text-xs" onClick={() => setActiveTab("businesses")}>
            Voltar para minhas empresas
          </Button>
        </div>
      ) : activeTab === "coupons" ? (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">Cupons de Desconto</h2>
            <Button size="sm" className="bg-brand text-brand-foreground rounded-full" onClick={() => setQrOpen(true)}>
              <QrCode className="size-4 mr-1" /> Validar cupom de cliente
            </Button>
          </div>
          
          <Dialog open={qrOpen} onOpenChange={setQrOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Validar Cupom</DialogTitle>
                <DialogDescription>Leia o QR Code do cliente para validar o desconto.</DialogDescription>
              </DialogHeader>
              <QrReader onScan={(code) => { setQrOpen(false); alert("Validando: " + code); }} onClose={() => setQrOpen(false)} />
            </DialogContent>
          </Dialog>

          <Card className="p-8 text-center text-muted-foreground border-dashed">
            <Ticket className="size-10 mx-auto opacity-20 mb-2" />
            <p>Gerencie seus cupons Pro ou veja os cupons que você retirou.</p>
            <p className="text-xs mt-1">Funcionalidade sendo ativada para sua conta.</p>
          </Card>
          
          <Button variant="ghost" className="w-full mt-4 text-xs" onClick={() => setActiveTab("businesses")}>
            Voltar para minhas empresas
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-8 flex items-center justify-between">
            <h2 className="font-display font-bold text-lg">Minhas empresas</h2>
            <Button asChild size="sm" className="bg-highlight hover:bg-highlight/90 text-highlight-foreground rounded-full">
              <Link to="/minha-empresa">
                <Plus className="size-4" /> Cadastrar empresa
              </Link>
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
            {!isLoading && businesses?.length === 0 && (
              <Card className="p-8 text-center">
                <Store className="size-10 mx-auto text-muted-foreground" />
                <p className="font-semibold mt-3">Você ainda não cadastrou nenhuma empresa</p>
                <Button asChild className="mt-4 rounded-full bg-brand text-brand-foreground">
                  <Link to="/minha-empresa">Cadastrar minha empresa</Link>
                </Button>
              </Card>
            )}
            {businesses?.map((b) => (
              <Card key={b.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="size-14 rounded-xl bg-muted overflow-hidden shrink-0">
                    {b.logo_url ? <img src={b.logo_url} alt={b.name} className="size-full object-cover" /> : <Store className="size-6 m-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{b.name}</p>
                      <StatusBadge status={b.status} />
                      <PlanBadge slug={b.plan_slug} name={b.plan_name} />
                      {b.is_verified && <Badge className="bg-highlight text-highlight-foreground">Verificada</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <Link to="/empresa/$id/editar" params={{ id: b.id }}><Pencil className="size-4" /> Editar</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-brand text-brand-foreground rounded-full">
                    <Link to="/empresa/$id/promocoes" params={{ id: b.id }}><Tag className="size-4" /> Promoções</Link>
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full gap-1 text-xs" onClick={() => setStatsBiz({ id: b.id, name: b.name })}>
                    <TrendingUp className="size-3.5" /> Estatísticas
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {migrateBiz && (
        <MigrateToPjDialog
          open={!!migrateBiz}
          onOpenChange={(v) => !v && setMigrateBiz(null)}
          businessId={migrateBiz.id}
          businessName={migrateBiz.name}
        />
      )}
      <ChangeRequestDialog
        open={profileChangeOpen}
        onOpenChange={setProfileChangeOpen}
        targetType="profile"
        title="Alterar dados"
        description="Solicite a alteração de seus dados cadastrais."
        fields={[
          { key: "full_name", label: "Nome completo" },
          { key: "cpf", label: "CPF" },
        ]}
      />
      {statsBiz && (
        <MerchantStatsDialog
          open={!!statsBiz}
          onOpenChange={(v) => !v && setStatsBiz(null)}
          businessId={statsBiz.id}
          businessName={statsBiz.name}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, onClick, highlight }: { icon: React.ReactNode; label: string; value: number; onClick?: () => void; highlight?: boolean; }) {
  return (
    <Card className={`p-4 transition-all ${onClick ? 'cursor-pointer hover:border-brand/40' : ''} ${highlight ? 'bg-highlight/5 border-highlight/40' : ''}`} onClick={onClick}>
      <div className={`flex items-center gap-2 text-xs ${highlight ? 'text-highlight font-semibold' : 'text-muted-foreground'}`}>{icon} {label}</div>
      <p className={`font-display font-extrabold text-2xl mt-1 ${highlight ? 'text-highlight' : 'text-brand'}`}>{value}</p>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge className="bg-green-100 text-green-700">Aprovada</Badge>;
  if (status === "rejected") return <Badge className="bg-red-100 text-red-700">Recusada</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800">Em análise</Badge>;
}

function PlanBadge({ slug, name }: { slug: string | null; name: string | null }) {
  if (slug === "pro") return <Badge className="bg-brand text-brand-foreground">Pro</Badge>;
  return <Badge variant="outline">{name ?? "Free"}</Badge>;
}

function AdminLinkButton() {
  const { isAdmin } = useIsAdmin();
  if (!isAdmin) return null;
  return (
    <Button asChild size="sm" className="rounded-full">
      <Link to="/admin/empresas"><Shield className="size-4" /> Admin</Link>
    </Button>
  );
}

interface MerchantStatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessName: string;
}

function MerchantStatsDialog({ open, onOpenChange, businessId, businessName }: MerchantStatsDialogProps) {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");
  const fetchAnalytics = useServerFn(getMerchantAnalytics);

  const { data, isLoading } = useQuery({
    queryKey: ["merchant-analytics", businessId, range],
    queryFn: () => fetchAnalytics({ businessId, range }),
    enabled: open && !!businessId,
  });

  const chartConfig = {
    views: {
      label: "Visualizações",
      color: "hsl(var(--primary))",
    },
    clicks: {
      label: "Cliques no WhatsApp",
      color: "#10b981", // Emerald-500
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:p-6">
        <DialogHeader className="flex flex-col gap-1">
          <DialogTitle className="font-display font-bold text-xl flex items-center gap-2">
            <BarChart3 className="size-5 text-brand" /> Estatísticas de acesso
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Acompanhe o desempenho de <span className="font-semibold text-foreground">{businessName}</span> no portal.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center my-4 gap-2">
          <div className="flex gap-1.5 bg-muted p-1 rounded-lg">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  range === r
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r === "7d" ? "7 Dias" : r === "30d" ? "30 Dias" : "90 Dias"}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
              <Loader2 className="size-3 animate-spin" /> Atualizando...
            </div>
          )}
        </div>

        {isLoading && !data ? (
          <div className="h-[280px] w-full flex items-center justify-center border rounded-2xl bg-muted/10">
            <div className="text-center space-y-2">
              <Loader2 className="size-8 animate-spin text-brand mx-auto" />
              <p className="text-sm text-muted-foreground">Carregando dados estatísticos...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4 bg-muted/20 border-border/40">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Visualizações</p>
                <p className="text-2xl font-extrabold font-display text-brand mt-1">{data?.summary.totalViews ?? 0}</p>
              </Card>
              <Card className="p-4 bg-muted/20 border-border/40">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Cliques Zap</p>
                <p className="text-2xl font-extrabold font-display text-emerald-600 mt-1">{data?.summary.totalClicks ?? 0}</p>
              </Card>
              <Card className="p-4 bg-muted/20 border-border/40">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Conversão</p>
                <p className="text-2xl font-extrabold font-display text-highlight mt-1">{data?.summary.conversionRate ?? 0}%</p>
              </Card>
            </div>

            <Card className="p-4 border-border/40">
              <ChartContainer config={chartConfig} className="h-[240px] w-full">
                <AreaChart data={data?.history ?? []} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-clicks)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-clicks)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-[10px]"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    allowDecimals={false}
                    className="text-[10px]"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2.5 shadow-md text-xs space-y-1">
                            <p className="font-semibold text-muted-foreground">{payload[0].payload.dateStr}</p>
                            {payload.map((p: any) => (
                              <div key={p.name} className="flex items-center gap-2">
                                <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
                                <span className="font-medium">
                                  {p.name === "views" ? "Visualizações" : "Cliques Zap"}:
                                </span>
                                <span className="font-semibold">{p.value}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="var(--color-views)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorViews)"
                    name="views"
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="var(--color-clicks)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorClicks)"
                    name="clicks"
                  />
                </AreaChart>
              </ChartContainer>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
