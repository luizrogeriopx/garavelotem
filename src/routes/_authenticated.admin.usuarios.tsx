import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShieldCheck, ShieldOff, User, Pencil, Loader2, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
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
  roles: string[];
};

function AdminUsersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [acceptancesFor, setAcceptancesFor] = useState<ProfileRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles, error: pe }, { data: roles, error: re }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, phone, avatar_url, cpf, rg, birth_date, email, selfie_url, profile_completed, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pe) throw pe;
      if (re) throw re;
      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = roleMap.get(r.user_id) ?? [];
        arr.push(r.role);
        roleMap.set(r.user_id, arr);
      });
      return (profiles ?? []).map((p: any) => ({ ...p, roles: roleMap.get(p.id) ?? [] })) as ProfileRow[];
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
                  {u.avatar_url ? (
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
                    {!u.profile_completed && <Badge variant="outline">Cadastro incompleto</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {u.email ?? "—"} · {u.phone ? formatPhoneBR(u.phone) : "sem tel."} · CPF {u.cpf ? formatCPF(u.cpf) : "—"}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
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
        // selfie_url is the storage path inside the user-selfies bucket
        supabase.storage
          .from("user-selfies")
          .createSignedUrl(user.selfie_url, 60 * 10)
          .then(({ data }) => setSelfieUrl(data?.signedUrl ?? null))
          .catch(() => setSelfieUrl(null));
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
