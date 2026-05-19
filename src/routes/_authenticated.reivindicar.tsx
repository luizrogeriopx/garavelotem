import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Search, ShieldCheck } from "lucide-react";
import {
  formatCPF,
  formatCNPJ,
  formatPhoneBR,
  isValidCPF,
  isValidCNPJ,
  onlyDigits,
} from "@/lib/br-validation";

export const Route = createFileRoute("/_authenticated/reivindicar")({
  component: ClaimBusinessPage,
});

type EntityType = "pf" | "pj";

function ClaimBusinessPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [businessId, setBusinessId] = useState<string>("");
  const [entityType, setEntityType] = useState<EntityType>("pf");
  const [fullName, setFullName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");

  const { data: businesses } = useQuery({
    queryKey: ["claim-businesses-search", search],
    queryFn: async () => {
      let q = supabase
        .from("businesses")
        .select("id,name,slug,city,neighborhood")
        .eq("status", "approved")
        .order("name")
        .limit(20);
      if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: myClaims } = useQuery({
    queryKey: ["my-claims", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_claims")
        .select("id,status,created_at,admin_note,business_id")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const ids = Array.from(new Set(data.map((c) => c.business_id)));
      const { data: bizs } = await supabase
        .from("businesses")
        .select("id,name,slug")
        .in("id", ids);
      const map = new Map((bizs ?? []).map((b) => [b.id, b]));
      return data.map((c) => ({ ...c, businesses: map.get(c.business_id) ?? null }));
    },
  });

  const selected = useMemo(
    () => businesses?.find((b) => b.id === businessId),
    [businesses, businessId],
  );

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login");
      if (!businessId) throw new Error("Selecione a empresa");
      if (!fullName.trim()) throw new Error("Informe seu nome completo");
      if (!phone.trim()) throw new Error("Informe um telefone");
      if (!email.trim()) throw new Error("Informe um e-mail");
      if (entityType === "pf") {
        if (!isValidCPF(cpf)) throw new Error("CPF inválido");
      } else {
        if (!legalName.trim()) throw new Error("Informe a razão social");
        if (!isValidCNPJ(cnpj)) throw new Error("CNPJ inválido");
      }
      const { error } = await supabase.from("business_claims").insert({
        business_id: businessId,
        user_id: user.id,
        entity_type: entityType,
        full_name: fullName.trim(),
        legal_name: entityType === "pj" ? legalName.trim() : null,
        cpf: entityType === "pf" ? onlyDigits(cpf) : null,
        cnpj: entityType === "pj" ? onlyDigits(cnpj) : null,
        phone: onlyDigits(phone),
        whatsapp: whatsapp ? onlyDigits(whatsapp) : null,
        email: email.trim(),
        message: message.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação enviada! Aguarde análise.");
      qc.invalidateQueries({ queryKey: ["my-claims"] });
      setBusinessId("");
      setFullName("");
      setLegalName("");
      setCpf("");
      setCnpj("");
      setPhone("");
      setWhatsapp("");
      setMessage("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-6 text-primary" />
          <h1 className="text-2xl font-bold">Reivindicar empresa</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          É dono de uma empresa já cadastrada na plataforma? Solicite a propriedade da página enviando seus dados pessoais e da empresa. Nossa equipe irá analisar e responder.
        </p>
      </div>

      <Card className="p-6 space-y-5">
        <div className="space-y-2">
          <Label>Buscar empresa</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Digite o nome da empresa"
              className="pl-9"
            />
          </div>
          <Select value={businessId} onValueChange={setBusinessId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a empresa" />
            </SelectTrigger>
            <SelectContent>
              {businesses?.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                  {b.neighborhood ? ` — ${b.neighborhood}` : ""}
                </SelectItem>
              ))}
              {businesses && businesses.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground">Nenhuma empresa encontrada</div>
              )}
            </SelectContent>
          </Select>
          {selected && (
            <p className="text-xs text-muted-foreground">
              Selecionada: <strong>{selected.name}</strong>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Tipo de pessoa</Label>
          <Select value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pf">Pessoa Física</SelectItem>
              <SelectItem value="pj">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          {entityType === "pj" && (
            <div className="space-y-2">
              <Label>Razão social</Label>
              <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
            </div>
          )}
          {entityType === "pf" ? (
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value={cnpj} onChange={(e) => setCnpj(formatCNPJ(e.target.value))} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={phone} onChange={(e) => setPhone(formatPhoneBR(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp (opcional)</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(formatPhoneBR(e.target.value))} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Justificativa / informações adicionais</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Conte por que você é o legítimo dono desta empresa"
              rows={4}
            />
          </div>
        </div>

        <Button
          onClick={() => submit.mutate()}
          disabled={submit.isPending}
          className="w-full sm:w-auto"
        >
          {submit.isPending && <Loader2 className="size-4 animate-spin" />}
          Enviar solicitação
        </Button>
      </Card>

      {myClaims && myClaims.length > 0 && (
        <Card className="p-6 space-y-3">
          <h2 className="font-semibold">Minhas solicitações</h2>
          <ul className="divide-y">
            {myClaims.map((c: any) => (
              <li key={c.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <Link
                    to="/empresa/$slug"
                    params={{ slug: c.businesses?.slug ?? "" }}
                    className="font-medium hover:underline"
                  >
                    {c.businesses?.name ?? "Empresa"}
                  </Link>
                  {c.admin_note && (
                    <p className="text-xs text-muted-foreground mt-1">Nota: {c.admin_note}</p>
                  )}
                </div>
                <Badge
                  variant={
                    c.status === "approved"
                      ? "default"
                      : c.status === "rejected"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {c.status === "approved"
                    ? "Aprovada"
                    : c.status === "rejected"
                    ? "Rejeitada"
                    : "Pendente"}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
