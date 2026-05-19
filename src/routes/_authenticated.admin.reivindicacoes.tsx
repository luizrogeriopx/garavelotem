import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { formatCPF, formatCNPJ, formatPhoneBR } from "@/lib/br-validation";

export const Route = createFileRoute("/_authenticated/admin/reivindicacoes")({
  component: AdminClaimsPage,
});

type Status = "pending" | "approved" | "rejected";

function AdminClaimsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Status>("pending");
  const [decideFor, setDecideFor] = useState<{ id: string; approve: boolean; business_id: string; user_id: string } | null>(null);
  const [note, setNote] = useState("");

  const { data: claims, isLoading } = useQuery({
    queryKey: ["admin-claims", tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_claims")
        .select("*")
        .eq("status", tab)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const businessIds = Array.from(new Set(data.map((c) => c.business_id)));
      const { data: bizs } = await supabase
        .from("businesses")
        .select("id,name,slug,owner_id")
        .in("id", businessIds);
      const bizMap = new Map((bizs ?? []).map((b) => [b.id, b]));
      return data.map((c) => ({ ...c, businesses: bizMap.get(c.business_id) ?? null }));
    },
  });

  const decide = useMutation({
    mutationFn: async () => {
      if (!decideFor || !user) return;
      const newStatus: Status = decideFor.approve ? "approved" : "rejected";
      const { error } = await supabase
        .from("business_claims")
        .update({
          status: newStatus,
          admin_note: note.trim() || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", decideFor.id);
      if (error) throw error;

      if (decideFor.approve) {
        const { error: e2 } = await supabase
          .from("businesses")
          .update({ owner_id: decideFor.user_id })
          .eq("id", decideFor.business_id);
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      toast.success("Solicitação atualizada");
      qc.invalidateQueries({ queryKey: ["admin-claims"] });
      setDecideFor(null);
      setNote("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList>
          <TabsTrigger value="pending"><Clock className="size-4" /> Pendentes</TabsTrigger>
          <TabsTrigger value="approved"><CheckCircle2 className="size-4" /> Aprovadas</TabsTrigger>
          <TabsTrigger value="rejected"><XCircle className="size-4" /> Rejeitadas</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && <p className="text-muted-foreground">Carregando…</p>}

      <div className="grid gap-3">
        {claims?.map((c: any) => (
          <Card key={c.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-semibold">{c.businesses?.name ?? "Empresa removida"}</h3>
                <p className="text-xs text-muted-foreground">
                  Enviada em {new Date(c.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <Badge variant={c.entity_type === "pj" ? "default" : "secondary"}>
                {c.entity_type === "pj" ? "Pessoa Jurídica" : "Pessoa Física"}
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <div><strong>Solicitante:</strong> {c.full_name}</div>
              {c.entity_type === "pf" ? (
                <div><strong>CPF:</strong> {c.cpf ? formatCPF(c.cpf) : "—"}</div>
              ) : (
                <>
                  <div><strong>Razão social:</strong> {c.legal_name ?? "—"}</div>
                  <div><strong>CNPJ:</strong> {c.cnpj ? formatCNPJ(c.cnpj) : "—"}</div>
                </>
              )}
              <div><strong>Telefone:</strong> {formatPhoneBR(c.phone)}</div>
              <div><strong>WhatsApp:</strong> {c.whatsapp ? formatPhoneBR(c.whatsapp) : "—"}</div>
              <div className="sm:col-span-2"><strong>E-mail:</strong> {c.email}</div>
              {c.message && (
                <div className="sm:col-span-2"><strong>Justificativa:</strong> {c.message}</div>
              )}
              {c.admin_note && (
                <div className="sm:col-span-2"><strong>Nota do admin:</strong> {c.admin_note}</div>
              )}
            </div>

            {tab === "pending" && (
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNote("");
                    setDecideFor({ id: c.id, approve: false, business_id: c.business_id, user_id: c.user_id });
                  }}
                >
                  <XCircle className="size-4" /> Rejeitar
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setNote("");
                    setDecideFor({ id: c.id, approve: true, business_id: c.business_id, user_id: c.user_id });
                  }}
                >
                  <CheckCircle2 className="size-4" /> Aprovar
                </Button>
              </div>
            )}
          </Card>
        ))}
        {!isLoading && claims && claims.length === 0 && (
          <p className="text-muted-foreground text-sm">Nenhuma solicitação neste status.</p>
        )}
      </div>

      <Dialog open={!!decideFor} onOpenChange={(o) => !o && setDecideFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decideFor?.approve ? "Aprovar reivindicação" : "Rejeitar reivindicação"}
            </DialogTitle>
            <DialogDescription>
              {decideFor?.approve
                ? "Aprovando, o usuário se tornará o dono desta empresa."
                : "Adicione uma nota explicando o motivo (opcional)."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota interna / mensagem ao solicitante"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecideFor(null)}>Cancelar</Button>
            <Button onClick={() => decide.mutate()} disabled={decide.isPending}>
              {decide.isPending && <Loader2 className="size-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
