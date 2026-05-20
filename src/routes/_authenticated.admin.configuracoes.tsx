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
import { Send, Loader2, Mail, Bell } from "lucide-react";

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
        p_link: form.link || null,
        p_send_email: form.sendEmail,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notificações enviadas com sucesso!");
      setForm({ ...form, title: "", content: "", link: "", sendEmail: false });
    },
    onError: (e: Error) => toast.error(e.message),
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
