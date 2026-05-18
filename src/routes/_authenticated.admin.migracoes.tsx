import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { formatCNPJ } from "@/lib/br-validation";

export const Route = createFileRoute("/_authenticated/admin/migracoes")({
  component: AdminMigrationsPage,
});

function AdminMigrationsPage() {
  const qc = useQueryClient();
  const { data: pending, isLoading } = useQuery({
    queryKey: ["admin-migrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, entity_type, cnpj, legal_name, migration_cnpj, migration_legal_name, migration_requested_at, owner_id")
        .eq("migration_status", "pending")
        .order("migration_requested_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const decide = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const biz = pending?.find((b) => b.id === id);
      if (!biz) throw new Error("Empresa não encontrada");
      if (approve) {
        const { error } = await supabase
          .from("businesses")
          .update({
            entity_type: "pj",
            cnpj: biz.migration_cnpj,
            legal_name: biz.migration_legal_name,
            migration_status: "approved",
            migration_cnpj: null,
            migration_legal_name: null,
          })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("businesses")
          .update({
            migration_status: "rejected",
            migration_cnpj: null,
            migration_legal_name: null,
          })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-migrations"] });
      toast.success("Solicitação processada");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/admin/empresas" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-3">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
      <h1 className="font-display font-extrabold text-2xl text-brand">Migrações PF → PJ</h1>
      <p className="text-sm text-muted-foreground mt-1">Aprove ou recuse pedidos de migração de empresas.</p>

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && !pending?.length && (
          <Card className="p-8 text-center">
            <Building2 className="size-10 mx-auto text-muted-foreground" />
            <p className="font-semibold mt-3">Nenhuma solicitação pendente</p>
          </Card>
        )}
        {pending?.map((b) => (
          <Card key={b.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{b.name}</p>
                <Badge variant="outline" className="mt-1">Atualmente: {b.entity_type === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}</Badge>
                <div className="mt-3 text-sm space-y-1">
                  <p><span className="text-muted-foreground">Novo CNPJ:</span> {b.migration_cnpj ? formatCNPJ(b.migration_cnpj) : "—"}</p>
                  <p><span className="text-muted-foreground">Razão social:</span> {b.migration_legal_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    Solicitado em {b.migration_requested_at ? new Date(b.migration_requested_at).toLocaleString("pt-BR") : "—"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  className="rounded-full bg-green-600 hover:bg-green-600/90 text-white"
                  onClick={() => decide.mutate({ id: b.id, approve: true })}
                  disabled={decide.isPending}
                >
                  {decide.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => decide.mutate({ id: b.id, approve: false })}
                  disabled={decide.isPending}
                >
                  <XCircle className="size-4" /> Recusar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
