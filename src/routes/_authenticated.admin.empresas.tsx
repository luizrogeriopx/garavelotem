import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, ExternalLink, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/empresas")({
  component: AdminBusinessesPage,
});

type Status = "pending" | "approved" | "rejected";

function AdminBusinessesPage() {
  const [tab, setTab] = useState<Status>("pending");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-businesses", tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, slug, status, logo_url, is_verified, neighborhood, city, whatsapp, created_at")
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

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList>
          <TabsTrigger value="pending"><Clock className="h-4 w-4 mr-1" />Pendentes</TabsTrigger>
          <TabsTrigger value="approved"><CheckCircle2 className="h-4 w-4 mr-1" />Aprovadas</TabsTrigger>
          <TabsTrigger value="rejected"><XCircle className="h-4 w-4 mr-1" />Recusadas</TabsTrigger>
        </TabsList>
      </Tabs>

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
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{b.name}</p>
                    {b.is_verified && <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" />Verificada</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {b.neighborhood ? `${b.neighborhood} · ` : ""}{b.city} · {b.whatsapp ?? "sem WhatsApp"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/empresa/$slug" params={{ slug: b.slug }}>
                    <ExternalLink className="h-4 w-4 mr-1" />Ver
                  </Link>
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
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
