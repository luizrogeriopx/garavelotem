import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/alteracoes")({
  component: AdminChangeRequestsPage,
});

type Status = "pending" | "approved" | "rejected";

function AdminChangeRequestsPage() {
  const [tab, setTab] = useState<Status>("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-change-requests", tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("change_requests")
        .select("id, user_id, target_type, business_id, changes, reason, status, admin_note, created_at")
        .eq("status", tab)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data?.length) return [];
      const userIds = Array.from(new Set(data.map((r) => r.user_id)));
      const bizIds = Array.from(new Set(data.map((r) => r.business_id).filter(Boolean) as string[]));
      const [{ data: users }, { data: bizs }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").in("id", userIds),
        bizIds.length
          ? supabase.from("businesses").select("id, name, slug").in("id", bizIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const um = new Map((users ?? []).map((u: any) => [u.id, u]));
      const bm = new Map((bizs ?? []).map((b: any) => [b.id, b]));
      return data.map((r) => ({
        ...r,
        user: um.get(r.user_id) ?? null,
        business: r.business_id ? bm.get(r.business_id) ?? null : null,
      }));
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase
        .from("change_requests")
        .update({
          status,
          admin_note: notes[id]?.trim() || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação atualizada");
      qc.invalidateQueries({ queryKey: ["admin-change-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList>
          <TabsTrigger value="pending"><Clock className="h-4 w-4 mr-1" />Pendentes</TabsTrigger>
          <TabsTrigger value="approved"><CheckCircle2 className="h-4 w-4 mr-1" />Aprovadas</TabsTrigger>
          <TabsTrigger value="rejected"><XCircle className="h-4 w-4 mr-1" />Rejeitadas</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : !data?.length ? (
        <Card className="p-8 text-center text-muted-foreground">Nenhuma solicitação.</Card>
      ) : (
        <div className="grid gap-3">
          {data.map((r: any) => (
            <Card key={r.id} className="p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">
                  {r.target_type === "profile" ? "Dados pessoais" : "Empresa"}
                </Badge>
                {r.business && <Badge variant="secondary">{r.business.name}</Badge>}
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="text-sm">
                <p className="font-medium">{r.user?.full_name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{r.user?.email ?? r.user_id}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                {Object.entries(r.changes as Record<string, string>).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-muted-foreground">{k}:</span>
                    <span className="font-medium break-words">{v}</span>
                  </div>
                ))}
              </div>
              {r.reason && (
                <p className="text-sm text-muted-foreground italic">"{r.reason}"</p>
              )}
              {r.admin_note && (
                <p className="text-xs text-muted-foreground">Nota: {r.admin_note}</p>
              )}
              {tab === "pending" && (
                <div className="space-y-2">
                  <Textarea
                    rows={2}
                    placeholder="Nota interna / resposta (opcional)"
                    value={notes[r.id] ?? ""}
                    onChange={(e) => setNotes((s) => ({ ...s, [r.id]: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => review.mutate({ id: r.id, status: "approved" })}>
                      <CheckCircle2 className="h-4 w-4 mr-1" />Marcar aprovada
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => review.mutate({ id: r.id, status: "rejected" })}>
                      <XCircle className="h-4 w-4 mr-1" />Rejeitar
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
