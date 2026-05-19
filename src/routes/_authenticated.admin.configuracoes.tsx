import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";
import { DEFAULT_CLAIM_INVITE_TEMPLATE, claimInviteMessage } from "@/lib/whatsapp-claim";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const qc = useQueryClient();
  const [template, setTemplate] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["app_settings", "claim_invite_template"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "claim_invite_template")
        .maybeSingle();
      if (error) throw error;
      return data?.value ?? DEFAULT_CLAIM_INVITE_TEMPLATE;
    },
  });

  useEffect(() => {
    if (typeof data === "string") setTemplate(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "claim_invite_template", value }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mensagem salva");
      qc.invalidateQueries({ queryKey: ["app_settings", "claim_invite_template"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const preview = claimInviteMessage({
    businessUrl: "https://garavelotem.com/empresa-exemplo",
    claimUrl: "https://garavelotem.com/reivindicar",
    template,
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Mensagem de convite no WhatsApp</h2>
          <p className="text-sm text-muted-foreground">
            Esta é a mensagem padrão enviada para o WhatsApp da empresa quando você
            clica em <strong>Convite WhatsApp</strong> no painel de empresas.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Use os marcadores <code className="bg-muted px-1 rounded">{"{businessUrl}"}</code> e{" "}
            <code className="bg-muted px-1 rounded">{"{claimUrl}"}</code> — eles serão substituídos
            automaticamente pelo link da empresa e pelo link de reivindicação.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="claim-template">Texto da mensagem</Label>
          <Textarea
            id="claim-template"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={18}
            disabled={isLoading}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => save.mutate(template)} disabled={save.isPending || isLoading}>
            {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar mensagem
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setTemplate(DEFAULT_CLAIM_INVITE_TEMPLATE)}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar padrão
          </Button>
        </div>
      </Card>

      <Card className="p-6 space-y-2">
        <h3 className="font-semibold">Pré-visualização</h3>
        <p className="text-xs text-muted-foreground">
          Exemplo de como a mensagem será enviada (com links fictícios).
        </p>
        <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded">{preview}</pre>
      </Card>
    </div>
  );
}
