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
} from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { blockBusiness } from "@/lib/admin.functions";

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

  const { data, isLoading } = useQuery({
    queryKey: ["admin-businesses", tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, slug, status, logo_url, is_verified, is_featured, neighborhood, city, whatsapp, created_at, plan_id, owner_id, blocked_until")
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

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : !data?.length ? (
        <Card className="p-8 text-center text-muted-foreground">Nenhuma empresa nesta categoria.</Card>
      ) : (
        <div className="grid gap-3">
          {data.map((b) => (
            <Card key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0">
                  {b.logo_url && <img src={b.logo_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{b.name}</p>
                    {b.is_verified && <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" />Verificada</Badge>}
                    {b.blocked_until && new Date(b.blocked_until) > new Date() && (
                      <Badge variant="destructive" className="gap-1">
                        <Ban className="h-3 w-3" />Bloqueada até {new Date(b.blocked_until).toLocaleDateString("pt-BR")}
                      </Badge>
                    )}
                    {user && b.owner_id === user.id && <Badge variant="outline">Sem dono</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {b.neighborhood ? `${b.neighborhood} · ` : ""}{b.city} · {b.whatsapp ?? "sem WhatsApp"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
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
                  <Link to="/empresa/$slug" params={{ slug: b.slug }}>
                    <ExternalLink className="h-4 w-4 mr-1" />Ver
                  </Link>
                </Button>
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
    whatsapp: "",
    neighborhood: "Setor Garavelo",
    short_description: "",
  });

  const freePlan = useMemo(
    () => plans.find((p) => p.slug === "free") ?? plans[0],
    [plans]
  );

  const reset = () => setForm({ name: "", category_id: "", whatsapp: "", neighborhood: "Setor Garavelo", short_description: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("businesses").insert({
        name: form.name.trim(),
        slug: slugify(form.name) + "-" + Math.random().toString(36).slice(2, 6),
        category_id: form.category_id || null,
        whatsapp: form.whatsapp.replace(/\D/g, ""),
        neighborhood: form.neighborhood || null,
        short_description: form.short_description.trim() || null,
        owner_id: user.id,
        plan_id: freePlan?.id ?? null,
        status: "approved",
      });
      if (error) throw error;
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
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Escolha uma categoria" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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

  const transfer = useMutation({
    mutationFn: async (newOwnerId: string) => {
      if (!business) return;
      const { error } = await supabase.from("businesses").update({ owner_id: newOwnerId }).eq("id", business.id);
      if (error) throw error;
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
