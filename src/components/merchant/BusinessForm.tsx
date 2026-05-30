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
import { HoursEditor, defaultHours, normalizeHours, type WeekHours } from "@/components/merchant/HoursEditor";
import { ChangeRequestDialog } from "@/components/ChangeRequestDialog";
import { Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
    subcategory_ids: [] as string[],
    short_description: "",
    description: "",
    whatsapp: "",
    phone: "",
    address: "",
    neighborhood: "Setor Garavelo",
    logo_url: "",
    cover_url: "",
    username: "",
    instagram: "",
    facebook: "",
    youtube: "",
    tiktok: "",
    threads: "",
  });
  const [gallery, setGallery] = useState<string[]>(["", "", ""]);
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [hours, setHours] = useState<WeekHours>(defaultHours());
  const [changeReqOpen, setChangeReqOpen] = useState(false);
  const isEditing = !!businessId;

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

  const { data: subcategories } = useQuery({
    queryKey: ["subcategories", form.category_id],
    enabled: !!form.category_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("id, name")
        .eq("category_id", form.category_id)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: existing, isLoading: isLoadingBusiness, error: businessError } = useQuery({
    queryKey: ["business", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUuid = uuidRegex.test(businessId!);
      
      let query = supabase.from("businesses").select("*, plans(slug)");
      if (isUuid) {
        query = query.eq("id", businessId!);
      } else {
        query = query.eq("slug", businessId!);
      }

      const { data: business, error: bizError } = await query.maybeSingle();

      if (bizError) throw bizError;
      if (!business) return null;

      try {
        const { data: subcats, error: subcatsError } = await supabase
          .from("business_subcategories")
          .select("subcategory_id")
          .eq("business_id", business.id);

        if (subcatsError) {
          console.warn("business_subcategories query failed, falling back to subcategory_id:", subcatsError.message);
          return {
            ...business,
            business_subcategories: business.subcategory_id 
              ? [{ subcategory_id: business.subcategory_id }] 
              : []
          };
        }

        return {
          ...business,
          business_subcategories: subcats || []
        };
      } catch (err) {
        console.warn("Failed to fetch business_subcategories, falling back:", err);
        return {
          ...business,
          business_subcategories: business.subcategory_id 
            ? [{ subcategory_id: business.subcategory_id }] 
            : []
        };
      }
    },
  });

  const isPlatform = (existing as any)?.is_platform === true;
  const lockEditing = isEditing && !isPlatform;

  useEffect(() => {
    if (existing) {
      const dbSubs = (existing as any).business_subcategories;
      const subcategoryIds = Array.isArray(dbSubs) && dbSubs.length > 0
        ? dbSubs.map((bs: any) => bs.subcategory_id)
        : (existing.subcategory_id ? [existing.subcategory_id] : []);

      setForm({
        name: existing.name ?? "",
        category_id: existing.category_id ?? "",
        subcategory_ids: subcategoryIds,
        short_description: existing.short_description ?? "",
        description: existing.description ?? "",
        whatsapp: existing.whatsapp ?? "",
        phone: existing.phone ?? "",
        address: existing.address ?? "",
        neighborhood: existing.neighborhood ?? "Setor Garavelo",
        logo_url: existing.logo_url ?? "",
        cover_url: existing.cover_url ?? "",
        username: (existing as any).username ?? "",
        instagram: (existing as any).instagram ?? "",
        facebook: (existing as any).facebook ?? "",
        youtube: (existing as any).youtube ?? "",
        tiktok: (existing as any).tiktok ?? "",
        threads: (existing as any).threads ?? "",
      });
      const g = Array.isArray(existing.gallery) ? (existing.gallery as string[]) : [];
      setGallery([g[0] ?? "", g[1] ?? "", g[2] ?? ""]);
      setEntityType((existing.entity_type as "pf" | "pj") ?? "pf");
      setCnpj(existing.cnpj ? formatCNPJ(existing.cnpj) : "");
      setLegalName(existing.legal_name ?? "");
      setOwnerIdState(existing.owner_id ?? null);
      setCoords({
        lat: existing.lat != null ? Number(existing.lat) : null,
        lng: existing.lng != null ? Number(existing.lng) : null,
      });
      setHours(normalizeHours(existing.hours));
    }
  }, [existing]);

  const set = <K extends keyof typeof form>(k: K, v: any) => setForm((f) => ({ ...f, [k]: v }));

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


    if (!isPlatform) {
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
        subcategory_id: form.subcategory_ids[0] || null,
        short_description: form.short_description.trim() || null,
        description: form.description.trim() || null,
        whatsapp: form.whatsapp ? form.whatsapp.replace(/\D/g, "") : null,
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
        lat: coords.lat,
        lng: coords.lng,
        hours,
        username: form.username.trim() ? form.username.trim().toLowerCase() : null,
        instagram: form.instagram.trim() || null,
        facebook: form.facebook.trim() || null,
        youtube: form.youtube.trim() || null,
        tiktok: form.tiktok.trim() || null,
        threads: form.threads.trim() || null,
      };
      if (businessId) {
        const targetId = existing?.id || businessId;
        const { error } = await supabase
          .from("businesses")
          .update(base)
          .eq("id", targetId);
        if (error) throw error;

        // Sincroniza subcategorias na tabela associativa se ela existir
        try {
          const { error: delError } = await supabase
            .from("business_subcategories")
            .delete()
            .eq("business_id", targetId);
          
          if (delError && (delError.code === "PGRST205" || delError.message.includes("schema cache"))) {
            console.warn("business_subcategories table not found. Saved only primary subcategory.");
          } else if (delError) {
            throw delError;
          } else if (form.subcategory_ids.length > 0) {
            const relations = form.subcategory_ids.map((subId) => ({
              business_id: targetId,
              subcategory_id: subId,
            }));
            const { error: relError } = await (supabase as any).from("business_subcategories").insert(relations);
            if (relError) throw relError;
          }
        } catch (subErr) {
          console.warn("Failed to sync subcategories table:", subErr);
        }

        toast.success("Alterações salvas.");
      } else {
        const { data: inserted, error } = await supabase.from("businesses").insert({
          ...base,
          owner_id: user.id,
          slug: slugify(form.name) + "-" + Math.random().toString(36).slice(2, 6),
          status: "pending",
        }).select("id").single();
        if (error) throw error;

        if (inserted) {
          // Insere subcategorias para a nova empresa
          if (form.subcategory_ids.length > 0) {
            try {
              const relations = form.subcategory_ids.map((subId) => ({
                business_id: inserted.id,
                subcategory_id: subId,
              }));
              const { error: relError } = await (supabase as any).from("business_subcategories").insert(relations);
              if (relError && relError.code !== "PGRST205" && !relError.message.includes("schema cache")) {
                throw relError;
              }
            } catch (subErr) {
              console.warn("Failed to insert business_subcategories:", subErr);
            }
          }

          if (requiredPolicies) {
            await recordAcceptances({
              userId: user.id,
              policies: requiredPolicies,
              context: "business",
              businessId: inserted.id,
            });
          }
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

  if (isEditing && isLoadingBusiness) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 mt-6">
        <Loader2 className="size-8 animate-spin text-brand" />
        <p className="text-sm text-muted-foreground">Carregando dados da empresa...</p>
      </div>
    );
  }

  if (isEditing && !isLoadingBusiness && (!existing || businessError)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-2 border border-dashed rounded-xl bg-destructive/5 text-destructive mt-6">
        <XCircle className="size-8" />
        <p className="font-semibold text-sm">Empresa não encontrada</p>
        <p className="text-xs text-muted-foreground font-normal max-w-md text-center px-4">
          {businessError 
            ? `Erro ao carregar: ${businessError instanceof Error ? businessError.message : JSON.stringify(businessError)}` 
            : "Não foi possível carregar os dados desta empresa. Verifique se o link está correto."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <div className="rounded-xl border p-4 bg-muted/30">
        <Label className="font-semibold">Tipo de empresa *</Label>
        <RadioGroup
          value={entityType}
          onValueChange={(v) => !lockEditing && setEntityType(v as "pf" | "pj")}
          className="flex flex-col sm:flex-row gap-3 mt-2"
        >
          <label className={`flex items-center gap-2 flex-1 rounded-lg border p-3 has-[:checked]:border-brand has-[:checked]:bg-background ${lockEditing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
            <RadioGroupItem value="pf" id="pf" disabled={lockEditing} />
            <div>
              <p className="font-medium text-sm">Pessoa Física</p>
              <p className="text-xs text-muted-foreground">Usa seus dados de cadastro (CPF).</p>
            </div>
          </label>
          <label className={`flex items-center gap-2 flex-1 rounded-lg border p-3 has-[:checked]:border-brand has-[:checked]:bg-background ${lockEditing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
            <RadioGroupItem value="pj" id="pj" disabled={lockEditing} />
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
            <Label htmlFor="cnpj" className="flex items-center gap-1">
              CNPJ * {lockEditing && <Lock className="size-3 text-muted-foreground" />}
            </Label>
            <div className="flex gap-2">
              <Input
                id="cnpj"
                required
                placeholder="00.000.000/0000-00"
                value={cnpj}
                disabled={lockEditing}
                onChange={(e) => { setCnpj(formatCNPJ(e.target.value)); setCnpjStatus(null); }}
              />
              {!lockEditing && (
                <Button type="button" variant="outline" onClick={checkCnpj} disabled={checkingCnpj || !cnpj}>
                  {checkingCnpj ? <Loader2 className="size-4 animate-spin" /> : "Validar"}
                </Button>
              )}
            </div>
            {cnpjStatus && (
              <p className={`text-xs flex items-center gap-1 ${cnpjStatus.ok ? "text-green-700" : "text-destructive"}`}>
                {cnpjStatus.ok ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                {cnpjStatus.msg}
              </p>
            )}
            {legalName && (
              <p className="text-xs text-muted-foreground">Razão social: {legalName}</p>
            )}
          </div>
        )}

        {lockEditing && (
          <div className="mt-3 rounded-lg border border-dashed bg-background p-3 text-xs text-muted-foreground space-y-2">
            <p className="flex items-center gap-1">
              <Lock className="size-3" />
              Nome da empresa, CNPJ e razão social não podem ser alterados diretamente.
            </p>
            <Button type="button" size="sm" variant="outline" onClick={() => setChangeReqOpen(true)}>
              Solicitar alteração desses dados
            </Button>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="name" className="flex items-center gap-1">
          Nome da empresa * {lockEditing && <Lock className="size-3 text-muted-foreground" />}
        </Label>
        <Input id="name" required maxLength={120} value={form.name} disabled={lockEditing} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div>
        <Label>Categoria *</Label>
        <Select 
          value={form.category_id} 
          onValueChange={(v) => {
            set("category_id", v);
            set("subcategory_ids", []);
          }}
        >
          <SelectTrigger><SelectValue placeholder="Escolha uma categoria" /></SelectTrigger>
          <SelectContent>
            {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {form.category_id && subcategories && subcategories.length > 0 && (
        <div className="space-y-2">
          <Label className="font-semibold text-sm">Subcategorias *</Label>
          <p className="text-xs text-muted-foreground mb-2">Selecione todas as subcategorias que melhor se aplicam à sua empresa.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 border rounded-xl p-4 bg-muted/10 max-h-60 overflow-y-auto">
            {subcategories.map((s) => {
              const checked = form.subcategory_ids.includes(s.id);
              return (
                <div key={s.id} className="flex items-center space-x-2 py-1">
                  <Checkbox 
                    id={`sub-${s.id}`} 
                    checked={checked} 
                    onCheckedChange={(isChecked) => {
                      const updated = isChecked
                        ? [...form.subcategory_ids, s.id]
                        : form.subcategory_ids.filter((id) => id !== s.id);
                      set("subcategory_ids", updated);
                    }}
                  />
                  <Label 
                    htmlFor={`sub-${s.id}`} 
                    className="text-sm font-normal cursor-pointer select-none leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {s.name}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="short">Frase curta (aparece nos cards)</Label>
        <Input id="short" maxLength={80} value={form.short_description} onChange={(e) => set("short_description", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="desc">Descrição completa</Label>
        <Textarea id="desc" rows={4} maxLength={1000} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border rounded-xl p-4 bg-muted/10">
        <div className="sm:col-span-2">
          <Label className="font-semibold">Redes Sociais (Username ou Link)</Label>
          <p className="text-xs text-muted-foreground mb-2">Informe o link ou apenas o @usuario de suas redes sociais.</p>
        </div>
        <div>
          <Label htmlFor="instagram">Instagram</Label>
          <Input id="instagram" placeholder="@seu_perfil" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="facebook">Facebook</Label>
          <Input id="facebook" placeholder="fb.com/suapagina" value={form.facebook} onChange={(e) => set("facebook", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="tiktok">TikTok</Label>
          <Input id="tiktok" placeholder="@seu_perfil" value={form.tiktok} onChange={(e) => set("tiktok", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="youtube">YouTube</Label>
          <Input id="youtube" placeholder="youtube.com/c/seu_canal" value={form.youtube} onChange={(e) => set("youtube", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="threads">Threads</Label>
          <Input id="threads" placeholder="@seu_perfil" value={form.threads} onChange={(e) => set("threads", e.target.value)} />
        </div>
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
          <Label htmlFor="wpp">WhatsApp</Label>
          <Input id="wpp" placeholder="62999999999" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
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
      {(() => {
        const isPro = ((existing as any)?.plans?.slug) === "pro" || isPlatform;
        return (
          <div>
            <Label htmlFor="username" className="flex items-center gap-2">
              Username da empresa (URL curta)
              {!isPro && <span className="text-[10px] uppercase font-bold bg-highlight/20 text-highlight px-1.5 py-0.5 rounded">Pro</span>}
            </Label>
            <p className="text-xs text-muted-foreground mb-1">
              {isPro ? (
                <>Opcional. Letras minúsculas, números e _ (3 a 30). Sua página fica em{" "}
                <span className="font-mono">garavelotem.com/{form.username || "seu_username"}</span>.</>
              ) : (
                <>Disponível apenas para empresas no plano <strong>Pro</strong>. Faça upgrade para personalizar a URL da sua página.</>
              )}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">@</span>
              <Input
                id="username"
                placeholder="empresa"
                maxLength={30}
                disabled={!isPro}
                value={form.username}
                onChange={(e) =>
                  set("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
              />
            </div>
          </div>
        );
      })()}
      <div>
        <Label>Localização no mapa</Label>
        <LocationPicker
          lat={coords.lat}
          lng={coords.lng}
          onChange={(lat, lng) => setCoords({ lat, lng })}
        />
      </div>
      <div>
        <Label>Horário de funcionamento (opcional)</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Informe os dias e horários em que sua empresa atende. Desligue o switch nos dias fechados.
        </p>
        <HoursEditor value={hours} onChange={setHours} />
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

      {isEditing && (
        <ChangeRequestDialog
          open={changeReqOpen}
          onOpenChange={setChangeReqOpen}
          targetType="business"
          businessId={existing?.id || businessId!}
          title="Solicitar alteração de dados da empresa"
          description="Esses campos só podem ser alterados pelo administrador. Preencha o que precisa ser corrigido."
          fields={[
            { key: "name", label: "Novo nome da empresa" },
            { key: "legal_name", label: "Nova razão social" },
            { key: "cnpj", label: "Novo CNPJ" },
          ]}
        />
      )}
    </form>
  );
}
