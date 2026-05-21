import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  ShieldOff,
  Pencil,
  Trash2,
  Plus,
  UserCog,
  Loader2,
  User,
  FileCheck,
  Ban,
  MessageCircle,
  Search,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { blockBusiness, transferBusiness } from "@/lib/admin.functions";
import { buildClaimInviteLink } from "@/lib/whatsapp-claim";

export const Route = createFileRoute("/_authenticated/admin/empresas")({
  component: AdminBusinessesPage,
});

type Status = "pending" | "approved" | "rejected";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function AdminBusinessesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Status>("pending");
  const [createOpen, setCreateOpen] = useState(false);
  const [transferFor, setTransferFor] = useState<{ id: string; name: string } | null>(null);
  const [acceptsFor, setAcceptsFor] = useState<{ id: string; name: string; owner_id: string | null } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const qc = useQueryClient();

  const { data: plans } = useQuery({
    queryKey: ["plans-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("id, slug, name").order("price_cents");
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: claimTemplate } = useQuery({
    queryKey: ["app_settings", "claim_invite_template"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "claim_invite_template")
        .maybeSingle();
      if (error) throw error;
      return data?.value ?? null;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-businesses", tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, slug, username, status, logo_url, is_verified, is_featured, neighborhood, city, whatsapp, created_at, plan_id, category_id, owner_id, blocked_until")
        .eq("status", tab)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("businesses").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(
        vars.status === "approved" ? "Empresa aprovada" : vars.status === "rejected" ? "Empresa recusada" : "Status atualizado"
      );
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleVerified = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("businesses").update({ is_verified: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Verificação atualizada");
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
    },
  });

  const changePlan = useMutation({
    mutationFn: async ({ id, plan_id, slug }: { id: string; plan_id: string; slug: string }) => {
      const { error } = await supabase
        .from("businesses")
        .update({ plan_id, is_featured: slug === "pro" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano atualizado");
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeBusiness = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("promotions").delete().eq("business_id", id);
      const { error } = await supabase.from("businesses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Empresa excluída");
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const blockBizFn = useServerFn(blockBusiness);
  const blockBiz = useMutation({
    mutationFn: async ({ id, until }: { id: string; until: string | null }) =>
      blockBizFn({ data: { businessId: id, until } }),
    onSuccess: (_d, vars) => {
      toast.success(vars.until ? "Empresa bloqueada" : "Bloqueio removido");
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const promptBlock = (b: { id: string; name: string; blocked_until: string | null }) => {
    if (b.blocked_until && new Date(b.blocked_until) > new Date()) {
      if (confirm(`Remover bloqueio de "${b.name}"?`)) blockBiz.mutate({ id: b.id, until: null });
      return;
    }
    const days = prompt(`Bloquear "${b.name}" por quantos dias? (deixe vazio para 7)`, "7");
    if (days === null) return;
    const n = Number(days || 7);
    if (!Number.isFinite(n) || n <= 0) return toast.error("Número inválido");
    const until = new Date(Date.now() + n * 86_400_000).toISOString();
    blockBiz.mutate({ id: b.id, until });
  };

  // Apply filters
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((b) => {
      if (planFilter !== "all" && b.plan_id !== planFilter) return false;
      if (categoryFilter !== "all" && b.category_id !== categoryFilter) return false;
      if (q) {
        const hay = `${b.name} ${b.slug} ${b.username ?? ""} ${b.neighborhood ?? ""} ${b.city ?? ""} ${b.whatsapp ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, query, planFilter, categoryFilter]);

  // Reset selection when tab or list changes
  const allIds = useMemo(() => filtered.map((b) => b.id), [filtered]);
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected((prev) => (prev.size === allIds.length ? new Set() : new Set(allIds)));
  const clearSelection = () => setSelected(new Set());

  const bulkUpdate = useMutation({
    mutationFn: async (patch: Partial<{ status: Status; is_verified: boolean; plan_id: string; is_featured: boolean; category_id: string }>) => {
      const ids = Array.from(selected);
      if (!ids.length) return;
      const { error } = await supabase.from("businesses").update(patch).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Empresas atualizadas");
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      clearSelection();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkDelete = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selected);
      if (!ids.length) return;
      await supabase.from("promotions").delete().in("business_id", ids);
      const { error } = await supabase.from("businesses").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Empresas excluídas");
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      clearSelection();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkChangePlan = (plan_id: string) => {
    const p = plans?.find((x) => x.id === plan_id);
    if (!p) return;
    bulkUpdate.mutate({ plan_id, is_featured: p.slug === "pro" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
          <TabsList>
            <TabsTrigger value="pending"><Clock className="h-4 w-4 mr-1" />Pendentes</TabsTrigger>
            <TabsTrigger value="approved"><CheckCircle2 className="h-4 w-4 mr-1" />Aprovadas</TabsTrigger>
            <TabsTrigger value="rejected"><XCircle className="h-4 w-4 mr-1" />Recusadas</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nova empresa
        </Button>
      </div>

      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, bairro, WhatsApp…"
            className="pl-8 h-9"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Plano" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os planos</SelectItem>
            {(plans ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(query || planFilter !== "all" || categoryFilter !== "all") && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setQuery(""); setPlanFilter("all"); setCategoryFilter("all"); }}
          >
            <X className="h-4 w-4 mr-1" />Limpar filtros
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} de {data?.length ?? 0}
        </span>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : !filtered.length ? (
        <Card className="p-8 text-center text-muted-foreground">
          {data?.length ? "Nenhuma empresa encontrada com esses filtros." : "Nenhuma empresa nesta categoria."}
        </Card>
      ) : (
        <>
          <Card className="p-3 flex flex-wrap items-center gap-2 sticky top-0 z-10 bg-card/95 backdrop-blur">
            <div className="flex items-center gap-2 mr-2">
              <Checkbox
                checked={selected.size > 0 && selected.size === allIds.length}
                onCheckedChange={toggleAll}
                aria-label="Selecionar todas"
              />
              <span className="text-sm text-muted-foreground">
                {selected.size > 0 ? `${selected.size} selecionada(s)` : "Selecionar todas"}
              </span>
            </div>
            {selected.size > 0 && (
              <>
                {plans && (
                  <Select onValueChange={(v) => bulkChangePlan(v)}>
                    <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="Alterar plano" /></SelectTrigger>
                    <SelectContent>
                      {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {categories && (
                  <Select onValueChange={(v) => bulkUpdate.mutate({ category_id: v })}>
                    <SelectTrigger className="h-8 w-[160px]"><SelectValue placeholder="Alterar categoria" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Button size="sm" variant="outline" onClick={() => bulkUpdate.mutate({ is_verified: true })}>
                  <ShieldCheck className="h-4 w-4 mr-1" />Verificar
                </Button>
                <Button size="sm" variant="outline" onClick={() => bulkUpdate.mutate({ is_verified: false })}>
                  <ShieldOff className="h-4 w-4 mr-1" />Remover selo
                </Button>
                <Button size="sm" onClick={() => bulkUpdate.mutate({ status: "approved" })}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />Aprovar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => bulkUpdate.mutate({ status: "rejected" })}>
                  <XCircle className="h-4 w-4 mr-1" />Recusar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm(`Excluir ${selected.size} empresa(s) definitivamente?`)) bulkDelete.mutate();
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />Excluir
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>Limpar</Button>
              </>
            )}
          </Card>
          <div className="grid gap-3">
            {filtered.map((b) => (
              <Card key={b.id} className="p-4 space-y-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Checkbox
                    checked={selected.has(b.id)}
                    onCheckedChange={() => toggleOne(b.id)}
                    aria-label={`Selecionar ${b.name}`}
                    className="mt-3 shrink-0"
                  />
                  <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0">
                    {b.logo_url && <img src={b.logo_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="font-semibold leading-snug break-words">{b.name}</p>
                    <div className="flex items-center gap-1.5 flex-wrap min-h-5">
                      {b.is_verified && (
                        <Badge variant="secondary" className="gap-1 whitespace-nowrap text-[10px] py-0 h-5 shrink-0">
                          <ShieldCheck className="h-3 w-3" />Verificada
                        </Badge>
                      )}
                      {b.blocked_until && new Date(b.blocked_until) > new Date() && (
                        <Badge variant="destructive" className="gap-1 whitespace-nowrap text-[10px] py-0 h-5 shrink-0">
                          <Ban className="h-3 w-3" />Bloqueada
                        </Badge>
                      )}
                      {user && b.owner_id === user.id && (
                        <Badge variant="outline" className="whitespace-nowrap text-[10px] py-0 h-5 shrink-0">Sem dono</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground break-words">
                      {b.neighborhood ? `${b.neighborhood} · ` : ""}{b.city} · {b.whatsapp ?? "sem WhatsApp"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center border-t pt-3">
                {plans && (
                  <Select
                    value={b.plan_id ?? undefined}
                    onValueChange={(v) => {
                      const p = plans.find((x) => x.id === v);
                      if (p) changePlan.mutate({ id: b.id, plan_id: v, slug: p.slug });
                    }}
                  >
                    <SelectTrigger className="h-8 w-[110px]"><SelectValue placeholder="Plano" /></SelectTrigger>
                    <SelectContent>
                      {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Button asChild variant="outline" size="sm">
                  {b.username ? (
                    <Link to="/$username" params={{ username: b.username }}>
                      <ExternalLink className="h-4 w-4 mr-1" />Ver
                    </Link>
                  ) : (
                    <Link to="/empresa/$slug" params={{ slug: b.slug }}>
                      <ExternalLink className="h-4 w-4 mr-1" />Ver
                    </Link>
                  )}
                </Button>
                {b.whatsapp && (
                  <Button asChild variant="outline" size="sm" className="text-green-700 hover:text-green-700">
                    <a
                      href={buildClaimInviteLink({ whatsapp: b.whatsapp, slug: b.slug, username: b.username, template: claimTemplate })}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />Convite WhatsApp
                    </a>
                  </Button>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link to="/empresa/$id/editar" params={{ id: b.id }}>
                    <Pencil className="h-4 w-4 mr-1" />Editar
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTransferFor({ id: b.id, name: b.name })}>
                  <UserCog className="h-4 w-4 mr-1" />Transferir
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAcceptsFor({ id: b.id, name: b.name, owner_id: b.owner_id })}>
                  <FileCheck className="h-4 w-4 mr-1" />Aceites
                </Button>
                {tab !== "approved" && (
                  <Button size="sm" onClick={() => updateStatus.mutate({ id: b.id, status: "approved" })}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />Aprovar
                  </Button>
                )}
                {tab !== "rejected" && (
                  <Button size="sm" variant="destructive" onClick={() => updateStatus.mutate({ id: b.id, status: "rejected" })}>
                    <XCircle className="h-4 w-4 mr-1" />Recusar
                  </Button>
                )}
                {tab === "approved" && (
                  <Button size="sm" variant="outline" onClick={() => toggleVerified.mutate({ id: b.id, value: !b.is_verified })}>
                    {b.is_verified ? <><ShieldOff className="h-4 w-4 mr-1" />Remover selo</> : <><ShieldCheck className="h-4 w-4 mr-1" />Verificar</>}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => promptBlock({ id: b.id, name: b.name, blocked_until: b.blocked_until })}
                >
                  <Ban className="h-4 w-4 mr-1" />
                  {b.blocked_until && new Date(b.blocked_until) > new Date() ? "Desbloquear" : "Bloquear"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => { if (confirm(`Excluir definitivamente "${b.name}"? Esta ação não pode ser desfeita.`)) removeBusiness.mutate(b.id); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          </div>
        </>
      )}

      <CreateBusinessDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories ?? []}
        plans={plans ?? []}
      />
      <TransferOwnerDialog
        business={transferFor}
        onClose={() => setTransferFor(null)}
      />
      <AcceptancesDialog
        business={acceptsFor}
        onClose={() => setAcceptsFor(null)}
      />
    </div>
  );
}

function AcceptancesDialog({
  business,
  onClose,
}: {
  business: { id: string; name: string; owner_id: string | null } | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["business-acceptances", business?.id, business?.owner_id],
    enabled: !!business,
    queryFn: async () => {
      const { data: byBiz } = await supabase
        .from("policy_acceptances")
        .select("id,policy_slug,context,accepted_at,user_id,claim_id,ip_address,user_agent")
        .eq("business_id", business!.id)
        .order("accepted_at", { ascending: false });
      let byOwner: any[] = [];
      if (business!.owner_id) {
        const { data: own } = await supabase
          .from("policy_acceptances")
          .select("id,policy_slug,context,accepted_at,user_id,ip_address,user_agent")
          .eq("user_id", business!.owner_id)
          .eq("context", "signup")
          .order("accepted_at", { ascending: false });
        byOwner = own ?? [];
      }
      const allRows = [...(byBiz ?? []), ...byOwner];
      const slugs = Array.from(new Set(allRows.map((r) => r.policy_slug)));
      const titleMap = new Map<string, string>();
      if (slugs.length) {
        const { data: pols } = await supabase
          .from("policies")
          .select("slug,title")
          .in("slug", slugs);
        (pols ?? []).forEach((p: any) => titleMap.set(p.slug, p.title));
      }
      return { byBiz: byBiz ?? [], byOwner, titleMap };
    },
  });

  const renderRow = (r: any) => (
    <li key={r.id} className="py-2 text-sm border-b last:border-0 space-y-1">
      <div className="flex justify-between gap-2 flex-wrap">
        <p className="font-medium">{data?.titleMap.get(r.policy_slug) ?? r.policy_slug}</p>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(r.accepted_at).toLocaleString("pt-BR")}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Contexto: {r.context}
        {r.claim_id ? " · via reivindicação" : ""}
        {" · IP: "}<span className="font-mono">{r.ip_address ?? "—"}</span>
      </p>
      {r.user_agent && (
        <p className="text-xs text-muted-foreground break-words">
          <span className="font-mono">{r.user_agent}</span>
        </p>
      )}
    </li>
  );

  return (
    <Dialog open={!!business} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aceites de políticas — {business?.name}</DialogTitle>
          <DialogDescription>Histórico de aceites registrados.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground py-4">Carregando…</p>
        ) : !data || (data.byBiz.length === 0 && data.byOwner.length === 0) ? (
          <p className="text-muted-foreground py-4">Nenhum aceite registrado para esta empresa.</p>
        ) : (
          <div className="space-y-4">
            {data.byBiz.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">
                  Vinculados à empresa
                </h4>
                <ul>{data.byBiz.map(renderRow)}</ul>
              </div>
            )}
            {data.byOwner.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">
                  Cadastro do proprietário
                </h4>
                <ul>{data.byOwner.map(renderRow)}</ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateBusinessDialog({
  open,
  onOpenChange,
  categories,
  plans,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categories: { id: string; name: string }[];
  plans: { id: string; slug: string; name: string }[];
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category_id: "",
    subcategory_ids: [] as string[],
    whatsapp: "",
    neighborhood: "Setor Garavelo",
    short_description: "",
  });

  const freePlan = useMemo(
    () => plans.find((p) => p.slug === "free") ?? plans[0],
    [plans]
  );

  const { data: subcategories } = useQuery({
    queryKey: ["admin-subcategories", form.category_id],
    enabled: !!form.category_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("id, name")
        .eq("category_id", form.category_id)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const reset = () => setForm({ name: "", category_id: "", subcategory_ids: [], whatsapp: "", neighborhood: "Setor Garavelo", short_description: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { data: inserted, error } = await supabase.from("businesses").insert({
        name: form.name.trim(),
        slug: slugify(form.name) + "-" + Math.random().toString(36).slice(2, 6),
        category_id: form.category_id || null,
        subcategory_id: form.subcategory_ids[0] || null,
        whatsapp: form.whatsapp.replace(/\D/g, ""),
        neighborhood: form.neighborhood || null,
        short_description: form.short_description.trim() || null,
        owner_id: user.id,
        plan_id: freePlan?.id ?? null,
        status: "approved",
      }).select("id").single();
      if (error) throw error;

      if (inserted && form.subcategory_ids.length > 0) {
        const relations = form.subcategory_ids.map((subId) => ({
          business_id: inserted.id,
          subcategory_id: subId,
        }));
        const { error: relError } = await supabase.from("business_subcategories").insert(relations);
        if (relError) throw relError;
      }

      toast.success("Empresa criada. Edite os detalhes ou transfira para um usuário.");
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova empresa</DialogTitle>
          <DialogDescription>
            Cria uma empresa no plano Free e aprovada. Você pode transferir o dono depois.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="b-name">Nome *</Label>
            <Input id="b-name" required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select 
              value={form.category_id} 
              onValueChange={(v) => setForm({ ...form, category_id: v, subcategory_ids: [] })}
            >
              <SelectTrigger><SelectValue placeholder="Escolha uma categoria" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.category_id && subcategories && subcategories.length > 0 && (
            <div className="space-y-2">
              <Label className="font-semibold text-sm">Subcategorias</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-xl p-3 bg-muted/10 max-h-40 overflow-y-auto">
                {subcategories.map((s) => {
                  const checked = form.subcategory_ids.includes(s.id);
                  return (
                    <div key={s.id} className="flex items-center space-x-2 py-0.5">
                      <Checkbox 
                        id={`admin-sub-${s.id}`} 
                        checked={checked} 
                        onCheckedChange={(isChecked) => {
                          const updated = isChecked
                            ? [...form.subcategory_ids, s.id]
                            : form.subcategory_ids.filter((id) => id !== s.id);
                          setForm({ ...form, subcategory_ids: updated });
                        }}
                      />
                      <Label 
                        htmlFor={`admin-sub-${s.id}`} 
                        className="text-sm font-normal cursor-pointer select-none leading-none"
                      >
                        {s.name}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="b-wpp">WhatsApp *</Label>
            <Input id="b-wpp" required placeholder="62999999999" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="b-bairro">Bairro</Label>
            <Input id="b-bairro" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="b-short">Frase curta</Label>
            <Input id="b-short" maxLength={80} value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin mr-1" />}
              Criar empresa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TransferOwnerDialog({
  business,
  onClose,
}: {
  business: { id: string; name: string } | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["transfer-profiles"],
    enabled: !!business,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, avatar_url")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!profiles) return [];
    const term = q.trim().toLowerCase();
    if (!term) return profiles.slice(0, 30);
    return profiles
      .filter((p) => (p.full_name ?? "").toLowerCase().includes(term) || (p.phone ?? "").includes(term))
      .slice(0, 30);
  }, [profiles, q]);

  const transferFn = useServerFn(transferBusiness);
  const transfer = useMutation({
    mutationFn: async (newOwnerId: string) => {
      if (!business) return;
      await transferFn({ data: { businessId: business.id, newOwnerId } });
    },
    onSuccess: () => {
      toast.success("Empresa transferida");
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!business} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir empresa</DialogTitle>
          <DialogDescription>
            Escolha o usuário que passará a ser dono de <span className="font-medium">{business?.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <Input placeholder="Buscar por nome ou telefone…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="max-h-80 overflow-y-auto grid gap-1 mt-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground p-2">Carregando…</p>
          ) : !filtered.length ? (
            <p className="text-sm text-muted-foreground p-2">Nenhum usuário encontrado.</p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted text-left"
                onClick={() => transfer.mutate(p.id)}
                disabled={transfer.isPending}
              >
                <div className="size-9 rounded-full bg-muted grid place-items-center overflow-hidden shrink-0">
                  {p.avatar_url ? <img src={p.avatar_url} alt="" className="size-full object-cover" /> : <User className="size-4 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{p.full_name ?? "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.phone ?? p.id.slice(0, 8)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
