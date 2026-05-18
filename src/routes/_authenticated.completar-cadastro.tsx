import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SelfieCapture } from "@/components/SelfieCapture";
import {
  formatCPF, formatPhoneBR, isValidCPF, onlyDigits,
} from "@/lib/br-validation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/completar-cadastro")({
  component: CompleteProfilePage,
});

function CompleteProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({
    full_name: "",
    birth_date: "",
    cpf: "",
    rg: "",
    email: "",
    phone: "",
    selfie_url: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.profile_completed) {
        navigate({ to: "/conta" });
        return;
      }
      setF({
        full_name: data?.full_name ?? user.user_metadata?.full_name ?? "",
        birth_date: data?.birth_date ?? "",
        cpf: data?.cpf ? formatCPF(data.cpf) : "",
        rg: data?.rg ?? "",
        email: data?.email ?? user.email ?? "",
        phone: data?.phone ? formatPhoneBR(data.phone) : "",
        selfie_url: data?.selfie_url ?? "",
      });
    })();
  }, [user, navigate]);

  const set = <K extends keyof typeof f>(k: K, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cpfDigits = onlyDigits(f.cpf);
    if (!isValidCPF(cpfDigits)) {
      toast.error("CPF inválido. Verifique os dígitos.");
      return;
    }
    if (!f.full_name.trim() || !f.birth_date || !f.rg.trim() || !f.email.trim() || !f.phone.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (!f.selfie_url) {
      toast.error("Tire uma foto pela câmera para concluir.");
      return;
    }
    // Idade mínima 16 anos
    const birth = new Date(f.birth_date);
    const age = (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (isNaN(age) || age < 16) {
      toast.error("Idade mínima de 16 anos.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: f.full_name.trim(),
          birth_date: f.birth_date,
          cpf: cpfDigits,
          rg: f.rg.trim(),
          email: f.email.trim(),
          phone: onlyDigits(f.phone),
          selfie_url: f.selfie_url,
          profile_completed: true,
        })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Cadastro concluído!");
      navigate({ to: "/conta" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar";
      if (msg.includes("profiles_cpf_key") || msg.toLowerCase().includes("duplicate")) {
        toast.error("Esse CPF já está cadastrado em outra conta.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <p className="text-[11px] font-bold uppercase tracking-widest text-highlight">Verificação</p>
      <h1 className="font-display font-extrabold text-2xl text-brand">Complete seu cadastro</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Precisamos confirmar alguns dados antes de você usar o app.
      </p>

      <Card className="p-5 mt-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <Label>Foto (tirada na hora) *</Label>
            <SelfieCapture value={f.selfie_url} onChange={(u) => set("selfie_url", u)} />
          </div>

          <div>
            <Label htmlFor="name">Nome completo *</Label>
            <Input id="name" required value={f.full_name} onChange={(e) => set("full_name", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bd">Data de nascimento *</Label>
              <Input id="bd" type="date" required value={f.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="rg">RG *</Label>
              <Input id="rg" required value={f.rg} onChange={(e) => set("rg", e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="cpf">CPF *</Label>
            <Input id="cpf" required inputMode="numeric" placeholder="000.000.000-00"
              value={f.cpf} onChange={(e) => set("cpf", formatCPF(e.target.value))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="em">E-mail *</Label>
              <Input id="em" type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ph">Telefone *</Label>
              <Input id="ph" required placeholder="(62) 99999-9999"
                value={f.phone} onChange={(e) => set("phone", formatPhoneBR(e.target.value))} />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full rounded-full bg-brand text-brand-foreground font-semibold">
            {loading && <Loader2 className="size-4 animate-spin" />}
            Concluir cadastro
          </Button>
        </form>
      </Card>
    </div>
  );
}
