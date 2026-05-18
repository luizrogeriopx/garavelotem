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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
    }
  }, [existing]);

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
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
      };
      if (businessId) {
        const { error } = await supabase
          .from("businesses")
          .update({ ...base, status: "pending" })
          .eq("id", businessId);
        if (error) throw error;
        toast.success("Alterações salvas. A empresa volta para análise.");
      } else {
        const { error } = await supabase.from("businesses").insert({
          ...base,
          owner_id: user.id,
          slug: slugify(form.name) + "-" + Math.random().toString(36).slice(2, 6),
          status: "pending",
        });
        if (error) throw error;
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
      <Button type="submit" disabled={loading} className="w-full rounded-full bg-brand text-brand-foreground font-semibold">
        {loading && <Loader2 className="size-4 animate-spin" />}
        {businessId ? "Salvar alterações" : "Enviar para aprovação"}
      </Button>
    </form>
  );
}
