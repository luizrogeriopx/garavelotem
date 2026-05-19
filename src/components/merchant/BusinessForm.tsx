import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { formatCNPJ, lookupCNPJ, onlyDigits } from "@/lib/br-validation";
import {
  PolicyAcceptanceList,
  usePoliciesForContext,
  recordAcceptances,
  allAccepted,
} from "@/components/site/PolicyAcceptance";
import { LocationPicker } from "@/components/merchant/LocationPicker";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function BusinessForm({ businessId }: { businessId?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [entityType, setEntityType] = useState<"pf" | "pj">("pf");
  const [cnpj, setCnpj] = useState("");
  const [legalName, setLegalName] = useState("");
  const [cnpjStatus, setCnpjStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [checkingCnpj, setCheckingCnpj] = useState(false);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const { data: requiredPolicies } = usePoliciesForContext("business");
  const [form, setForm] = useState({
    name: "",
    category_id: "",
    short_description: "",
    description: "",
    whatsapp: "",
    phone: "",
    address: "",
    neighborhood: "Setor Garavelo",
    logo_url: "",
    cover_url: "",
  });
  const [gallery, setGallery] = useState<string[]>(["", "", ""]);
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });

  // Perfil do titular (owner da empresa quando editando; senão o usuário atual)
  const [ownerIdState, setOwnerIdState] = useState<string | null>(null);
  const effectiveOwnerId = ownerIdState ?? user?.id ?? null;
  const { data: profile } = useQuery({
    queryKey: ["profile-for-business", effectiveOwnerId],
    enabled: !!effectiveOwnerId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, cpf")
        .eq("id", effectiveOwnerId!)
        .maybeSingle();
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: existing } = useQuery({
    queryKey: ["business", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase.from("businesses").select("*").eq("id", businessId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name ?? "",
        category_id: existing.category_id ?? "",
        short_description: existing.short_description ?? "",
        description: existing.description ?? "",
        whatsapp: existing.whatsapp ?? "",
        phone: existing.phone ?? "",
        address: existing.address ?? "",
        neighborhood: existing.neighborhood ?? "Setor Garavelo",
        logo_url: existing.logo_url ?? "",
        cover_url: existing.cover_url ?? "",
      });
      const g = Array.isArray(existing.gallery) ? (existing.gallery as string[]) : [];
      setGallery([g[0] ?? "", g[1] ?? "", g[2] ?? ""]);
      setEntityType((existing.entity_type as "pf" | "pj") ?? "pf");
      setCnpj(existing.cnpj ? formatCNPJ(existing.cnpj) : "");
      setLegalName(existing.legal_name ?? "");
      setOwnerIdState(existing.owner_id ?? null);
    }
  }, [existing]);

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const checkCnpj = async () => {
    setCheckingCnpj(true);
    setCnpjStatus(null);
    const result = await lookupCNPJ(cnpj);
    if (!result.ok) {
      setCnpjStatus({ ok: false, msg: result.error ?? "CNPJ inválido" });
    } else if (!result.active) {
      setCnpjStatus({ ok: false, msg: `Situação: ${result.situacao || "inativa"}` });
    } else {
      setCnpjStatus({ ok: true, msg: `Ativo • ${result.razaoSocial}` });
      if (result.razaoSocial) setLegalName(result.razaoSocial);
    }
    setCheckingCnpj(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (entityType === "pj") {
      if (!cnpjStatus?.ok) {
        toast.error("Valide o CNPJ antes de continuar.");
        return;
      }
    } else {
      if (!profile?.cpf) {
        toast.error("Complete seu cadastro pessoal (CPF) antes.");
        return;
      }
    }

    if (!businessId && !allAccepted(requiredPolicies, accepted)) {
      toast.error("Aceite todas as políticas obrigatórias para enviar.");
      return;
    }

    setLoading(true);
    try {
      const base = {
        name: form.name.trim(),
        category_id: form.category_id || null,
        short_description: form.short_description.trim() || null,
        description: form.description.trim() || null,
        whatsapp: form.whatsapp.replace(/\D/g, ""),
        phone: form.phone || null,
        address: form.address || null,
        neighborhood: form.neighborhood || null,
        logo_url: form.logo_url || null,
        cover_url: form.cover_url || null,
        gallery: gallery.filter(Boolean),
        entity_type: entityType,
        cnpj: entityType === "pj" ? onlyDigits(cnpj) : null,
        legal_name: entityType === "pj" ? legalName || null : profile?.full_name ?? null,
        cpf: entityType === "pf" ? profile?.cpf ?? null : null,
      };
      if (businessId) {
        const { error } = await supabase
          .from("businesses")
          .update(base)
          .eq("id", businessId);
        if (error) throw error;
        toast.success("Alterações salvas.");
      } else {
        const { data: inserted, error } = await supabase.from("businesses").insert({
          ...base,
          owner_id: user.id,
          slug: slugify(form.name) + "-" + Math.random().toString(36).slice(2, 6),
          status: "pending",
        }).select("id").single();
        if (error) throw error;
        if (requiredPolicies && inserted) {
          await recordAcceptances({
            userId: user.id,
            policies: requiredPolicies,
            context: "business",
            businessId: inserted.id,
          });
        }
        toast.success("Empresa enviada para análise.");
      }
      navigate({ to: "/conta" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <div className="rounded-xl border p-4 bg-muted/30">
        <Label className="font-semibold">Tipo de empresa *</Label>
        <RadioGroup
          value={entityType}
          onValueChange={(v) => setEntityType(v as "pf" | "pj")}
          className="flex flex-col sm:flex-row gap-3 mt-2"
        >
          <label className="flex items-center gap-2 cursor-pointer flex-1 rounded-lg border p-3 has-[:checked]:border-brand has-[:checked]:bg-background">
            <RadioGroupItem value="pf" id="pf" />
            <div>
              <p className="font-medium text-sm">Pessoa Física</p>
              <p className="text-xs text-muted-foreground">Usa seus dados de cadastro (CPF).</p>
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer flex-1 rounded-lg border p-3 has-[:checked]:border-brand has-[:checked]:bg-background">
            <RadioGroupItem value="pj" id="pj" />
            <div>
              <p className="font-medium text-sm">Pessoa Jurídica</p>
              <p className="text-xs text-muted-foreground">Empresa com CNPJ ativo na Receita.</p>
            </div>
          </label>
        </RadioGroup>

        {entityType === "pf" && (
          <div className="mt-3 text-sm bg-background rounded-lg p-3 border">
            <p><span className="text-muted-foreground">Titular:</span> {profile?.full_name || "—"}</p>
            <p><span className="text-muted-foreground">CPF:</span> {profile?.cpf || "—"}</p>
          </div>
        )}

        {entityType === "pj" && (
          <div className="mt-3 space-y-2">
            <Label htmlFor="cnpj">CNPJ *</Label>
            <div className="flex gap-2">
              <Input
                id="cnpj"
                required
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(e) => { setCnpj(formatCNPJ(e.target.value)); setCnpjStatus(null); }}
              />
              <Button type="button" variant="outline" onClick={checkCnpj} disabled={checkingCnpj || !cnpj}>
                {checkingCnpj ? <Loader2 className="size-4 animate-spin" /> : "Validar"}
              </Button>
            </div>
            {cnpjStatus && (
              <p className={`text-xs flex items-center gap-1 ${cnpjStatus.ok ? "text-green-700" : "text-destructive"}`}>
                {cnpjStatus.ok ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                {cnpjStatus.msg}
              </p>
            )}
            {legalName && cnpjStatus?.ok && (
              <p className="text-xs text-muted-foreground">Razão social: {legalName}</p>
            )}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="name">Nome da empresa *</Label>
        <Input id="name" required maxLength={120} value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div>
        <Label>Categoria *</Label>
        <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
          <SelectTrigger><SelectValue placeholder="Escolha uma categoria" /></SelectTrigger>
          <SelectContent>
            {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="short">Frase curta (aparece nos cards)</Label>
        <Input id="short" maxLength={80} value={form.short_description} onChange={(e) => set("short_description", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="desc">Descrição completa</Label>
        <Textarea id="desc" rows={4} maxLength={1000} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Logo</Label>
          <ImageUpload
            value={form.logo_url}
            onChange={(url) => set("logo_url", url)}
            bucket="business-assets"
            pathPrefix={`${user?.id}/logo`}
            label="logo"
            aspect="aspect-square"
          />
        </div>
        <div>
          <Label>Capa</Label>
          <ImageUpload
            value={form.cover_url}
            onChange={(url) => set("cover_url", url)}
            bucket="business-assets"
            pathPrefix={`${user?.id}/cover`}
            label="capa"
            aspect="aspect-video"
          />
        </div>
      </div>
      <div>
        <Label>Galeria (até 3 fotos)</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Aparecem na página da sua empresa. No plano Pro, você também pode publicar posts no feed.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <ImageUpload
              key={i}
              value={gallery[i]}
              onChange={(url) => setGallery((arr) => arr.map((v, idx) => (idx === i ? url : v)))}
              bucket="business-assets"
              pathPrefix={`${user?.id}/gallery`}
              label={`foto ${i + 1}`}
              aspect="aspect-square"
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="wpp">WhatsApp *</Label>
          <Input id="wpp" required placeholder="62999999999" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="address">Endereço</Label>
        <Input id="address" maxLength={200} value={form.address} onChange={(e) => set("address", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="bairro">Bairro</Label>
        <Input id="bairro" value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
      </div>
      {!businessId && (
        <PolicyAcceptanceList
          context="business"
          accepted={accepted}
          onToggle={(slug, v) => setAccepted((s) => ({ ...s, [slug]: v }))}
        />
      )}
      <Button type="submit" disabled={loading} className="w-full rounded-full bg-brand text-brand-foreground font-semibold">
        {loading && <Loader2 className="size-4 animate-spin" />}
        {businessId ? "Salvar alterações" : "Enviar para aprovação"}
      </Button>
    </form>
  );
}
