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
  Eye, MessageCircle, Tag, Pencil, ExternalLink, Shield, Sparkles, ArrowRightLeft,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { MigrateToPjDialog } from "@/components/merchant/MigrateToPjDialog";

export const Route = createFileRoute("/_authenticated/conta")({
  component: AccountPage,
});

type BizRow = {
  id: string;
  name: string;
  slug: string;
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


  const { data: businesses, isLoading } = useQuery({
    queryKey: ["my-businesses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, slug, status, logo_url, is_verified, views_count, whatsapp_clicks, entity_type, migration_status, plans(slug, name)")
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
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
          >
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-6">
        <StatCard icon={<Store className="size-4" />} label="Empresas" value={businesses?.length ?? 0} />
        <StatCard icon={<Eye className="size-4" />} label="Visualizações" value={totals.views} />
        <StatCard icon={<MessageCircle className="size-4" />} label="WhatsApp" value={totals.clicks} />
      </div>

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
            <p className="text-sm text-muted-foreground mt-1">Comece agora e apareça para milhares de moradores do Garavelo.</p>
            <Button asChild className="mt-4 rounded-full bg-brand text-brand-foreground">
              <Link to="/minha-empresa">Cadastrar minha empresa</Link>
            </Button>
          </Card>
        )}
        {businesses?.map((b) => {
          const promo = promoStats?.[b.id];
          return (
            <Card key={b.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="size-14 rounded-xl bg-muted overflow-hidden grid place-items-center shrink-0">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.name} className="size-full object-cover" />
                  ) : (
                    <Store className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{b.name}</p>
                    <StatusBadge status={b.status} />
                    <PlanBadge slug={b.plan_slug} name={b.plan_name} />
                    <Badge variant="outline" className="uppercase text-[10px]">{b.entity_type === "pj" ? "PJ" : "PF"}</Badge>
                    {b.migration_status === "pending" && (
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Migração em análise</Badge>
                    )}
                    {b.is_verified && (
                      <Badge className="bg-highlight text-highlight-foreground hover:bg-highlight">Verificada</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Eye className="size-3" /> {b.views_count}</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle className="size-3" /> {b.whatsapp_clicks}</span>
                    <span className="inline-flex items-center gap-1"><Tag className="size-3" /> {promo?.active ?? 0} ativas / {promo?.total ?? 0}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link to="/empresa/$id/editar" params={{ id: b.id }}>
                    <Pencil className="size-4" /> Editar
                  </Link>
                </Button>
                <Button asChild size="sm" className="bg-brand text-brand-foreground rounded-full">
                  <Link to="/empresa/$id/promocoes" params={{ id: b.id }}>
                    <Tag className="size-4" /> Promoções ({promo?.total ?? 0})
                  </Link>
                </Button>
                {b.plan_slug === "pro" && (
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <Link to="/empresa/$id/posts" params={{ id: b.id }}>
                      <MessageCircle className="size-4" /> Posts
                    </Link>
                  </Button>
                )}
                {b.status === "approved" && (
                  <Button asChild size="sm" variant="ghost" className="rounded-full">
                    <Link to="/empresa/$slug" params={{ slug: b.slug }}>
                      <ExternalLink className="size-4" /> Ver página
                    </Link>
                  </Button>
                )}
                {b.entity_type === "pf" && b.migration_status !== "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setMigrateBiz({ id: b.id, name: b.name })}
                  >
                    <ArrowRightLeft className="size-4" /> Migrar para PJ
                  </Button>
                )}
                {b.status === "approved" && b.plan_slug !== "pro" && (
                  <Button
                    asChild
                    size="sm"
                    className="rounded-full bg-highlight text-highlight-foreground hover:bg-highlight/90 ml-auto"
                  >
                    <Link to="/planos" search={{ businessId: b.id }}>
                      <Sparkles className="size-4" /> Migrar para Pro
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {migrateBiz && (
        <MigrateToPjDialog
          open={!!migrateBiz}
          onOpenChange={(v) => !v && setMigrateBiz(null)}
          businessId={migrateBiz.id}
          businessName={migrateBiz.name}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon} {label}</div>
      <p className="font-display font-extrabold text-2xl text-brand mt-1">{value}</p>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1"><CheckCircle2 className="size-3" /> Aprovada</Badge>;
  if (status === "rejected")
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 gap-1"><XCircle className="size-3" /> Recusada</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 gap-1"><Clock className="size-3" /> Em análise</Badge>;
}

function PlanBadge({ slug, name }: { slug: string | null; name: string | null }) {
  if (slug === "pro")
    return <Badge className="bg-brand text-brand-foreground hover:bg-brand gap-1"><Sparkles className="size-3" /> Pro</Badge>;
  return <Badge variant="outline" className="gap-1">{name ?? "Free"}</Badge>;
}

function AdminLinkButton() {
  const { isAdmin } = useIsAdmin();
  if (!isAdmin) return null;
  return (
    <Button asChild variant="default" size="sm" className="rounded-full">
      <Link to="/admin/empresas"><Shield className="size-4" /> Admin</Link>
    </Button>
  );
}
