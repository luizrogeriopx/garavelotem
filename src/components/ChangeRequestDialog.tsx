import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type FieldDef = { key: string; label: string; placeholder?: string };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  targetType: "profile" | "business";
  businessId?: string;
  title: string;
  description: string;
  fields: FieldDef[];
};

export function ChangeRequestDialog({
  open,
  onOpenChange,
  targetType,
  businessId,
  title,
  description,
  fields,
}: Props) {
  const { user } = useAuth();
  const [values, setValues] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login");
      const changes: Record<string, string> = {};
      for (const f of fields) {
        const v = (values[f.key] ?? "").trim();
        if (v) changes[f.key] = v;
      }
      if (Object.keys(changes).length === 0) {
        throw new Error("Informe ao menos um campo a alterar");
      }
      const { error } = await supabase.from("change_requests").insert({
        user_id: user.id,
        target_type: targetType,
        business_id: businessId ?? null,
        changes,
        reason: reason.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação enviada. Nossa equipe irá analisar.");
      setValues({});
      setReason("");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <Label>{f.label}</Label>
              <Input
                placeholder={f.placeholder ?? "Novo valor (deixe vazio se não alterar)"}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <Label>Motivo / observações</Label>
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Conte por que precisa dessa alteração"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending && <Loader2 className="size-4 animate-spin" />}
            Enviar solicitação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
