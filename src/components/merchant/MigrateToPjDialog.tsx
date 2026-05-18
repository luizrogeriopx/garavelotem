import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { formatCNPJ, lookupCNPJ, onlyDigits } from "@/lib/br-validation";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businessId: string;
  businessName: string;
};

export function MigrateToPjDialog({ open, onOpenChange, businessId, businessName }: Props) {
  const qc = useQueryClient();
  const [cnpj, setCnpj] = useState("");
  const [legalName, setLegalName] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    setStatus(null);
    const r = await lookupCNPJ(cnpj);
    if (!r.ok) setStatus({ ok: false, msg: r.error ?? "CNPJ inválido" });
    else if (!r.active) setStatus({ ok: false, msg: `Situação: ${r.situacao || "inativa"}` });
    else {
      setStatus({ ok: true, msg: `Ativo • ${r.razaoSocial}` });
      if (r.razaoSocial) setLegalName(r.razaoSocial);
    }
    setChecking(false);
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!status?.ok) throw new Error("Valide o CNPJ antes de enviar.");
      const { error } = await supabase
        .from("businesses")
        .update({
          migration_status: "pending",
          migration_cnpj: onlyDigits(cnpj),
          migration_legal_name: legalName || null,
          migration_requested_at: new Date().toISOString(),
        })
        .eq("id", businessId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-businesses"] });
      toast.success("Solicitação enviada. Aguardando aprovação do administrador.");
      onOpenChange(false);
      setCnpj(""); setLegalName(""); setStatus(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Migrar para Pessoa Jurídica</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{businessName}</span> — informe o CNPJ. A migração depende
            de aprovação do administrador.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="mcnpj">CNPJ</Label>
            <div className="flex gap-2">
              <Input
                id="mcnpj"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(e) => { setCnpj(formatCNPJ(e.target.value)); setStatus(null); }}
              />
              <Button type="button" variant="outline" onClick={check} disabled={!cnpj || checking}>
                {checking ? <Loader2 className="size-4 animate-spin" /> : "Validar"}
              </Button>
            </div>
            {status && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${status.ok ? "text-green-700" : "text-destructive"}`}>
                {status.ok ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                {status.msg}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => submit.mutate()} disabled={!status?.ok || submit.isPending}>
            {submit.isPending && <Loader2 className="size-4 animate-spin" />}
            Solicitar migração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
