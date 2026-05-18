import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, ShieldOff, User } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles, error: pe }, { data: roles, error: re }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, avatar_url, created_at").order("created_at", { ascending: false }),
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
      return (profiles ?? []).map((p: any) => ({ ...p, roles: roleMap.get(p.id) ?? [] }));
    },
  });

  const filtered = useMemo(() => {
    if (!q.trim()) return data ?? [];
    const term = q.toLowerCase();
    return (data ?? []).filter((u) => (u.full_name ?? "").toLowerCase().includes(term) || (u.phone ?? "").includes(term));
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
      <Input placeholder="Buscar por nome ou telefone…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
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
                <div className="size-10 rounded-full bg-muted grid place-items-center overflow-hidden">
                  {u.avatar_url ? <img src={u.avatar_url} alt="" className="size-full object-cover" /> : <User className="size-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{u.full_name ?? "Sem nome"}</p>
                    {isAdmin && <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" />Admin</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.phone ?? "—"} · {u.id.slice(0, 8)}</p>
                </div>
                {isAdmin ? (
                  <Button size="sm" variant="outline" onClick={() => { if (confirm("Remover admin?")) revokeAdmin.mutate(u.id); }}>
                    <ShieldOff className="h-4 w-4 mr-1" /> Remover admin
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => grantAdmin.mutate(u.id)}>
                    <ShieldCheck className="h-4 w-4 mr-1" /> Tornar admin
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
