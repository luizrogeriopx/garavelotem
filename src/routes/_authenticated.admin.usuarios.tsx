import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ShieldCheck, ShieldOff, User, Pencil, Loader2, FileCheck, Ban, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { blockUser, deleteUser } from "@/lib/admin.functions";
import { formatCPF, formatPhoneBR } from "@/lib/br-validation";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  component: AdminUsersPage,
});

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  cpf: string | null;
  rg: string | null;
  birth_date: string | null;
  email: string | null;
  selfie_url: string | null;
  profile_completed: boolean;
  created_at: string;
  blocked_until: string | null;
  roles: string[];
  businesses: { id: string; name: string; slug: string }[];
};

function AdminUsersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [acceptancesFor, setAcceptancesFor] = useState<ProfileRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles, error: pe }, { data: roles, error: re }, { data: bizs, error: be }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, phone, avatar_url, cpf, rg, birth_date, email, selfie_url, profile_completed, created_at, blocked_until")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("businesses").select("id, name, slug, owner_id").not("owner_id", "is", null),
      ]);
      if (pe) throw pe;
      if (re) throw re;
      if (be) throw be;
      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = roleMap.get(r.user_id) ?? [];
        arr.push(r.role);
        roleMap.set(r.user_id, arr);
      });
      const bizMap = new Map<string, { id: string; name: string; slug: string }[]>();
      (bizs ?? []).forEach((b: any) => {
        const arr = bizMap.get(b.owner_id) ?? [];
        arr.push({ id: b.id, name: b.name, slug: b.slug });
        bizMap.set(b.owner_id, arr);
      });
      return (profiles ?? []).map((p: any) => ({
        ...p,
        roles: roleMap.get(p.id) ?? [],
        businesses: bizMap.get(p.id) ?? [],
      })) as ProfileRow[];
    },
  });

  const filtered = useMemo(() => {
    if (!q.trim()) return data ?? [];
    const term = q.toLowerCase();
    return (data ?? []).filter(
      (u) =>
        (u.full_name ?? "").toLowerCase().includes(term) ||
        (u.email ?? "").toLowerCase().includes(term) ||
        (u.phone ?? "").includes(term) ||
        (u.cpf ?? "").includes(term),
    );
  }, [data, q]);

  const grantAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Admin atribuído"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Admin removido"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const blockFn = useServerFn(blockUser);
  const deleteFn = useServerFn(deleteUser);

  const blockMut = useMutation({
    mutationFn: async ({ userId, until }: { userId: string; until: string | null }) =>
      blockFn({ data: { userId, until } }),
    onSuccess: (_d, v) => {
      toast.success(v.until ? "Usuário bloqueado" : "Bloqueio removido");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (userId: string) => deleteFn({ data: { userId } }),
    onSuccess: () => {
      toast.success("Usuário excluído");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const promptBlockUser = (u: ProfileRow) => {
    const isBlocked = u.blocked_until && new Date(u.blocked_until) > new Date();
    if (isBlocked) {
      if (confirm(`Remover bloqueio de ${u.full_name ?? u.email}?`)) {
        blockMut.mutate({ userId: u.id, until: null });
      }
      return;
    }
    const days = prompt(`Bloquear usuário por quantos dias? (deixe vazio para 7)`, "7");
    if (days === null) return;
    const n = Number(days || 7);
    if (!Number.isFinite(n) || n <= 0) return toast.error("Número inválido");
    const until = new Date(Date.now() + n * 86_400_000).toISOString();
    blockMut.mutate({ userId: u.id, until });
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar por nome, e-mail, CPF ou telefone…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-sm"
      />
      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : !filtered.length ? (
        <Card className="p-8 text-center text-muted-foreground">Nenhum usuário.</Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((u) => {
            const isAdmin = u.roles.includes("admin");
            return (
              <Card key={u.id} className="p-3 flex items-center gap-3">
                <div className="size-10 rounded-full bg-muted grid place-items-center overflow-hidden shrink-0">
                  {u.selfie_url ? (
                    <img src={u.selfie_url} alt="selfie" className="size-full object-cover" />
                  ) : u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="size-full object-cover" />
                  ) : (
                    <User className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{u.full_name ?? "Sem nome"}</p>
                    {isAdmin && (
                      <Badge variant="secondary" className="gap-1">
                        <ShieldCheck className="h-3 w-3" />Admin
                      </Badge>
                    )}
                    {u.blocked_until && new Date(u.blocked_until) > new Date() && (
                      <Badge variant="destructive" className="gap-1">
                        <Ban className="h-3 w-3" />Bloqueado até {new Date(u.blocked_until).toLocaleDateString("pt-BR")}
                      </Badge>
                    )}
                    {!u.profile_completed && <Badge variant="outline">Cadastro incompleto</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {u.email ?? "—"} · {u.phone ? formatPhoneBR(u.phone) : "sem tel."} · CPF {u.cpf ? formatCPF(u.cpf) : "—"}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                  <Button size="sm" variant="outline" onClick={() => setAcceptancesFor(u)}>
                    <FileCheck className="h-4 w-4 mr-1" /> Aceites
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(u)}>
                    <Pencil className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  {isAdmin ? (
                    <Button size="sm" variant="outline" onClick={() => { if (confirm("Remover admin?")) revokeAdmin.mutate(u.id); }}>
                      <ShieldOff className="h-4 w-4 mr-1" /> Remover admin
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => grantAdmin.mutate(u.id)}>
                      <ShieldCheck className="h-4 w-4 mr-1" /> Tornar admin
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => promptBlockUser(u)}>
                    <Ban className="h-4 w-4 mr-1" />
                    {u.blocked_until && new Date(u.blocked_until) > new Date() ? "Desbloquear" : "Bloquear"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm(`Excluir permanentemente ${u.full_name ?? u.email}? Esta ação não pode ser desfeita.`)) {
                        deleteMut.mutate(u.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <EditUserDialog
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={() => qc.invalidateQueries({ queryKey: ["admin-users"] })}
      />
      <UserAcceptancesDialog
        user={acceptancesFor}
        onClose={() => setAcceptancesFor(null)}
      />
    </div>
  );
}

function EditUserDialog({
  user,
  onClose,
  onSaved,
}: {
  user: ProfileRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    cpf: "",
    rg: "",
    birth_date: "",
  });
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        cpf: user.cpf ?? "",
        rg: user.rg ?? "",
        birth_date: user.birth_date ?? "",
      });
      setSelfieUrl(null);
      if (user.selfie_url) {
        if (/^https?:\/\//i.test(user.selfie_url)) {
          setSelfieUrl(user.selfie_url);
        } else {
          supabase.storage
            .from("user-selfies")
            .createSignedUrl(user.selfie_url, 60 * 10)
            .then(({ data }) => setSelfieUrl(data?.signedUrl ?? null))
            .catch(() => setSelfieUrl(null));
        }
      }
    }
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.replace(/\D/g, "") || null,
          cpf: form.cpf.replace(/\D/g, "") || null,
          rg: form.rg.trim() || null,
          birth_date: form.birth_date || null,
        })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Usuário atualizado");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
        </DialogHeader>
        {user && (
          <div className="space-y-3">
            {selfieUrl && (
              <div className="flex justify-center">
                <img src={selfieUrl} alt="Selfie" className="size-24 rounded-full object-cover border" />
              </div>
            )}
            <div>
              <Label htmlFor="fn">Nome completo</Label>
              <Input id="fn" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="em">E-mail</Label>
                <Input id="em" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="ph">Telefone</Label>
                <Input id="ph" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cp">CPF</Label>
                <Input
                  id="cp"
                  value={formatCPF(form.cpf)}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                />
              </div>
              <div>
                <Label htmlFor="rg">RG</Label>
                <Input id="rg" value={form.rg} onChange={(e) => setForm({ ...form, rg: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="bd">Data de nascimento</Label>
              <Input id="bd" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground">
              ID do usuário: <span className="font-mono">{user.id}</span>
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserAcceptancesDialog({
  user,
  onClose,
}: {
  user: ProfileRow | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["user-acceptances", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: accs, error } = await supabase
        .from("policy_acceptances")
        .select("id,policy_slug,context,accepted_at,ip_address,user_agent,business_id,claim_id")
        .eq("user_id", user!.id)
        .order("accepted_at", { ascending: false });
      if (error) throw error;
      const slugs = Array.from(new Set((accs ?? []).map((r: any) => r.policy_slug)));
      const titleMap = new Map<string, string>();
      if (slugs.length) {
        const { data: pols } = await supabase
          .from("policies")
          .select("slug,title")
          .in("slug", slugs);
        (pols ?? []).forEach((p: any) => titleMap.set(p.slug, p.title));
      }
      return { rows: accs ?? [], titleMap };
    },
  });

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aceites de políticas — {user?.full_name ?? user?.email}</DialogTitle>
          <DialogDescription>
            Registros de aceite com data, hora, IP e dispositivo.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground py-4">Carregando…</p>
        ) : !data || data.rows.length === 0 ? (
          <p className="text-muted-foreground py-4">Nenhum aceite registrado.</p>
        ) : (
          <ul className="divide-y">
            {data.rows.map((r: any) => (
              <li key={r.id} className="py-3 text-sm space-y-1">
                <div className="flex justify-between gap-2 flex-wrap">
                  <p className="font-medium">
                    {data.titleMap.get(r.policy_slug) ?? r.policy_slug}
                  </p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(r.accepted_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Contexto: <span className="font-mono">{r.context}</span>
                  {r.business_id ? " · empresa" : ""}
                  {r.claim_id ? " · reivindicação" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  IP: <span className="font-mono">{r.ip_address ?? "—"}</span>
                </p>
                {r.user_agent && (
                  <p className="text-xs text-muted-foreground break-words">
                    Dispositivo: <span className="font-mono">{r.user_agent}</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

