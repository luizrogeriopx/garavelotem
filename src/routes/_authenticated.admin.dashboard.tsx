import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminStats } from "@/lib/admin-stats.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import {
  Store,
  Users,
  Percent,
  Ticket,
  Star,
  ShieldCheck,
  Edit3,
  Heart,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  component: AdminDashboardPage,
});

type StatTone = "brand" | "emerald" | "amber" | "violet" | "rose" | "sky";

const toneMap: Record<StatTone, { bg: string; ring: string; icon: string; text: string }> = {
  brand: { bg: "bg-brand/10", ring: "ring-brand/20", icon: "text-brand", text: "text-brand" },
  emerald: { bg: "bg-emerald-500/10", ring: "ring-emerald-500/20", icon: "text-emerald-600", text: "text-emerald-600" },
  amber: { bg: "bg-amber-500/10", ring: "ring-amber-500/20", icon: "text-amber-600", text: "text-amber-600" },
  violet: { bg: "bg-violet-500/10", ring: "ring-violet-500/20", icon: "text-violet-600", text: "text-violet-600" },
  rose: { bg: "bg-rose-500/10", ring: "ring-rose-500/20", icon: "text-rose-600", text: "text-rose-600" },
  sky: { bg: "bg-sky-500/10", ring: "ring-sky-500/20", icon: "text-sky-600", text: "text-sky-600" },
};

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  to,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: any;
  tone?: StatTone;
  to?: string;
}) {
  const t = toneMap[tone];
  const content = (
    <Card
      className={cn(
        "p-5 hover:shadow-lg transition-all duration-200 group relative overflow-hidden border-border/60",
        to && "cursor-pointer hover:-translate-y-0.5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold font-display tracking-tight">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("size-11 rounded-xl flex items-center justify-center ring-1", t.bg, t.ring)}>
          <Icon className={cn("size-5", t.icon)} />
        </div>
      </div>
      {to && (
        <ArrowUpRight className="absolute bottom-3 right-3 size-4 text-muted-foreground/40 group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      )}
    </Card>
  );
  if (to) return <Link to={to}>{content}</Link>;
  return content;
}

function AdminDashboardPage() {
  const fetchStats = useServerFn(getAdminStats);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats(),
    staleTime: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin mr-2" /> Carregando estatísticas...
      </div>
    );
  }

  const pendingTotal =
    data.pending.claims + data.pending.changes + data.pending.reviews + data.pending.businesses;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-brand to-brand/80 p-6 md:p-8 text-brand-foreground">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 size-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/70 mb-2">
              <Sparkles className="size-4" /> Visão geral
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-extrabold">Painel administrativo</h1>
            <p className="text-sm text-white/80 mt-1 max-w-lg">
              Acompanhe o crescimento do Garavelo Tem em tempo real.
            </p>
          </div>
          {pendingTotal > 0 && (
            <Link
              to="/admin/empresas"
              className="inline-flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur px-4 py-2 text-sm font-semibold transition"
            >
              <ShieldCheck className="size-4" />
              {pendingTotal} {pendingTotal === 1 ? "ação pendente" : "ações pendentes"}
              <ArrowUpRight className="size-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Primary KPIs */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Resumo
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Empresas"
            value={data.businesses.total}
            hint={`${data.businesses.new30d} novas em 30 dias`}
            icon={Store}
            tone="brand"
            to="/admin/empresas"
          />
          <StatCard
            label="Usuários"
            value={data.users.total}
            hint={`+${data.users.new7d} esta semana`}
            icon={Users}
            tone="violet"
            to="/admin/usuarios"
          />
          <StatCard
            label="Promoções ativas"
            value={data.promotions.active}
            hint={`${data.promotions.total} no total`}
            icon={Percent}
            tone="amber"
            to="/admin/promocoes"
          />
          <StatCard
            label="Cupons resgatados"
            value={data.coupons.redeemed}
            hint={`${data.coupons.active} ativos`}
            icon={Ticket}
            tone="emerald"
          />
        </div>
      </section>

      {/* Engagement */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Engajamento
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Avaliações" value={data.reviews.total} icon={Star} tone="amber" to="/admin/avaliacoes" />
          <StatCard label="Seguidores" value={data.engagement.followers} icon={Heart} tone="rose" />
          <StatCard label="Publicações" value={data.engagement.posts} icon={MessageSquare} tone="sky" />
          <StatCard
            label="Empresas aprovadas"
            value={data.businesses.approved}
            hint={`${Math.round((data.businesses.approved / Math.max(1, data.businesses.total)) * 100)}% do total`}
            icon={TrendingUp}
            tone="emerald"
          />
        </div>
      </section>

      {/* Pending actions */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Ações pendentes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PendingRow
            icon={ShieldCheck}
            tone="amber"
            label="Reivindicações de empresa"
            value={data.pending.claims}
            to="/admin/reivindicacoes"
          />
          <PendingRow
            icon={Edit3}
            tone="violet"
            label="Solicitações de alteração"
            value={data.pending.changes}
            to="/admin/alteracoes"
          />
          <PendingRow
            icon={Star}
            tone="amber"
            label="Avaliações para moderar"
            value={data.pending.reviews}
            to="/admin/avaliacoes"
          />
          <PendingRow
            icon={Store}
            tone="brand"
            label="Empresas aguardando aprovação"
            value={data.pending.businesses}
            to="/admin/empresas"
          />
        </div>
      </section>

      {/* Top categories */}
      {data.topCategories.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Categorias mais ativas
          </h2>
          <Card className="p-5">
            <div className="space-y-4">
              {data.topCategories.map((cat, idx) => {
                const max = data.topCategories[0].count || 1;
                const pct = Math.round((cat.count / max) * 100);
                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="size-6 rounded-md bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <Badge variant="secondary" className="font-mono">{cat.count}</Badge>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand to-brand/60 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}

function PendingRow({
  icon: Icon,
  tone,
  label,
  value,
  to,
}: {
  icon: any;
  tone: StatTone;
  label: string;
  value: number;
  to: string;
}) {
  const t = toneMap[tone];
  const isEmpty = value === 0;
  return (
    <Link to={to}>
      <Card className="p-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
        <div className={cn("size-11 rounded-xl flex items-center justify-center ring-1", t.bg, t.ring)}>
          <Icon className={cn("size-5", t.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {isEmpty ? "Nenhuma pendência" : `${value} ${value === 1 ? "item" : "itens"} esperando você`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEmpty && (
            <Badge className={cn("font-mono", t.bg, t.text, "border-transparent hover:bg-opacity-80")}>
              {value}
            </Badge>
          )}
          <ArrowUpRight className="size-4 text-muted-foreground/40 group-hover:text-brand transition" />
        </div>
      </Card>
    </Link>
  );
}
