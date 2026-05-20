import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Send, Loader2, Mail, Bell, AlertCircle, Smartphone, Save, Image as ImageIcon, Upload, X } from "lucide-react";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  component: AdminConfigPage,
});

function AdminConfigPage() {
  const [form, setForm] = useState({
    target: "all",
    title: "",
    content: "",
    link: "",
    sendEmail: false,
  });

  const sendNotification = useMutation({
    mutationFn: async () => {
      if (!form.title || !form.content) throw new Error("Preencha o título e o conteúdo.");
      
      const { error } = await supabase.rpc("send_mass_notification", {
        p_target: form.target,
        p_title: form.title,
        p_content: form.content,
        p_link: form.link || "",
        p_send_email: form.sendEmail,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notificações enviadas", {
        description: "Os usuários selecionados foram alertados.",
        icon: <Send className="size-4" />
      });
      setForm({ ...form, title: "", content: "", link: "", sendEmail: false });
    },
    onError: (e: Error) => toast.error("Falha no envio", {
      description: e.message,
      icon: <AlertCircle className="size-4" />
    }),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-brand">Configurações e Alertas</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie a plataforma e comunique-se com os usuários.</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Send className="size-5 text-brand" />
          <h2 className="font-bold">Notificação em Massa</h2>
        </div>

        <form 
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            sendNotification.mutate();
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Público Alvo</Label>
              <Select 
                value={form.target} 
                onValueChange={(v) => setForm({ ...form, target: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  <SelectItem value="merchants">Apenas Comerciantes</SelectItem>
                  <SelectItem value="users">Apenas Clientes (sem empresa)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notif-title">Título do Alerta</Label>
              <Input 
                id="notif-title"
                value={form.title} 
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Novidade no Garavelo Tem!"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notif-content">Mensagem</Label>
            <Textarea 
              id="notif-content"
              value={form.content} 
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Descreva o comunicado..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notif-link">Link (opcional)</Label>
            <Input 
              id="notif-link"
              value={form.link} 
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="Ex: /promocoes ou https://..."
            />
          </div>

          <div className="flex items-center justify-between border rounded-xl p-4 bg-muted/5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <p className="font-medium text-sm">Enviar por E-mail</p>
              </div>
              <p className="text-xs text-muted-foreground">Além do painel, os usuários receberão um e-mail.</p>
            </div>
            <Switch 
              checked={form.sendEmail} 
              onCheckedChange={(v) => setForm({ ...form, sendEmail: v })}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              type="submit" 
              className="bg-brand text-brand-foreground rounded-full px-8"
              disabled={sendNotification.isPending}
            >
              {sendNotification.isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="size-4 mr-2" />
                  Enviar Notificações
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      <PwaSettingsCard />

      <Card className="p-6 border-dashed bg-muted/5">
         <div className="text-center space-y-2">
            <p className="text-sm font-semibold">Configurações do Servidor de E-mail</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              As notificações de e-mail utilizam a infraestrutura configurada no Lovable Cloud. 
              Para ativar o envio real, certifique-se de que o domínio está verificado.
            </p>
         </div>
      </Card>
    </div>
  );
}

const PWA_KEYS = [
  "pwa_name",
  "pwa_short_name",
  "pwa_description",
  "pwa_theme_color",
  "pwa_background_color",
  "pwa_icon_url",
] as const;

type PwaForm = Record<(typeof PWA_KEYS)[number], string>;

function PwaSettingsCard() {
  const [pwa, setPwa] = useState<PwaForm>({
    pwa_name: "",
    pwa_short_name: "",
    pwa_description: "",
    pwa_theme_color: "#0B2545",
    pwa_background_color: "#0B2545",
    pwa_icon_url: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["app_settings", "pwa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key,value")
        .like("key", "pwa_%");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!data) return;
    const next = { ...pwa };
    for (const row of data as Array<{ key: string; value: string }>) {
      if ((PWA_KEYS as readonly string[]).includes(row.key)) {
        (next as any)[row.key] = row.value ?? "";
      }
    }
    setPwa(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const rows = PWA_KEYS.map((k) => ({ key: k, value: pwa[k] ?? "" }));
      const { error } = await supabase
        .from("app_settings")
        .upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("PWA atualizado", {
        description: "As novas configurações estão valendo para novas instalações.",
        icon: <Smartphone className="size-4" />,
      });
    },
    onError: (e: Error) =>
      toast.error("Falha ao salvar", {
        description: e.message,
        icon: <AlertCircle className="size-4" />,
      }),
  });

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <Smartphone className="size-5 text-brand" />
        <h2 className="font-bold">Personalização do PWA</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Defina como o app aparece quando o usuário instala o site no celular.
        Alterações afetam novas instalações — quem já instalou precisa reinstalar para ver mudanças no nome/ícone.
      </p>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pwa_name">Nome completo</Label>
            <Input
              id="pwa_name"
              value={pwa.pwa_name}
              onChange={(e) => setPwa({ ...pwa, pwa_name: e.target.value })}
              placeholder="Garavelo Tem"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwa_short_name">Nome curto (ícone)</Label>
            <Input
              id="pwa_short_name"
              value={pwa.pwa_short_name}
              onChange={(e) => setPwa({ ...pwa, pwa_short_name: e.target.value })}
              placeholder="Garavelo"
              maxLength={12}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pwa_description">Descrição</Label>
          <Textarea
            id="pwa_description"
            value={pwa.pwa_description}
            onChange={(e) => setPwa({ ...pwa, pwa_description: e.target.value })}
            rows={2}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pwa_theme_color">Cor do tema</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={pwa.pwa_theme_color}
                onChange={(e) => setPwa({ ...pwa, pwa_theme_color: e.target.value })}
                className="h-10 w-16 p-1 cursor-pointer"
                disabled={isLoading}
              />
              <Input
                id="pwa_theme_color"
                value={pwa.pwa_theme_color}
                onChange={(e) => setPwa({ ...pwa, pwa_theme_color: e.target.value })}
                placeholder="#0B2545"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwa_background_color">Cor de fundo (splash)</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={pwa.pwa_background_color}
                onChange={(e) => setPwa({ ...pwa, pwa_background_color: e.target.value })}
                className="h-10 w-16 p-1 cursor-pointer"
                disabled={isLoading}
              />
              <Input
                id="pwa_background_color"
                value={pwa.pwa_background_color}
                onChange={(e) => setPwa({ ...pwa, pwa_background_color: e.target.value })}
                placeholder="#0B2545"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <PwaIconUploader
          value={pwa.pwa_icon_url}
          backgroundColor={pwa.pwa_background_color}
          label={pwa.pwa_short_name || pwa.pwa_name}
          onChange={(url) => setPwa({ ...pwa, pwa_icon_url: url })}
          disabled={isLoading}
        />


        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            className="bg-brand text-brand-foreground rounded-full px-8"
            disabled={save.isPending || isLoading}
          >
            {save.isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="size-4 mr-2" />
                Salvar PWA
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
