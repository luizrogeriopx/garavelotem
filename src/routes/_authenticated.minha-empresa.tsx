import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/minha-empresa")({
  component: MyBusinessPage,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function MyBusinessPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    category_id: "",
    short_description: "",
    description: "",
    whatsapp: "",
    phone: "",
    address: "",
    neighborhood: "Setor Garavelo",
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
    queryKey: ["my-business", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (existing) {
      setForm({
        id: existing.id,
        name: existing.name ?? "",
        category_id: existing.category_id ?? "",
        short_description: existing.short_description ?? "",
        description: existing.description ?? "",
        whatsapp: existing.whatsapp ?? "",
        phone: existing.phone ?? "",
        address: existing.address ?? "",
        neighborhood: existing.neighborhood ?? "Setor Garavelo",
      });
    }
  }, [existing]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const payload = {
        owner_id: user.id,
        name: form.name,
        slug: slugify(form.name) + "-" + Math.random().toString(36).slice(2, 6),
        category_id: form.category_id || null,
        short_description: form.short_description,
        description: form.description,
        whatsapp: form.whatsapp,
        phone: form.phone,
        address: form.address,
        neighborhood: form.neighborhood,
        status: "pending" as const,
      };
      if (form.id) {
        const { error } = await supabase
          .from("businesses")
          .update({ ...payload, slug: existing!.slug })
          .eq("id", form.id);
        if (error) throw error;
        toast.success("Empresa atualizada! Aguardando nova aprovação.");
      } else {
        const { error } = await supabase.from("businesses").insert(payload);
        if (error) throw error;
        toast.success("Empresa enviada para análise. Você receberá um aviso em breve.");
      }
      navigate({ to: "/conta" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <p className="text-[11px] font-bold uppercase tracking-widest text-highlight">Comerciante</p>
      <h1 className="font-display font-extrabold text-2xl text-brand">
        {form.id ? "Editar minha empresa" : "Cadastrar minha empresa"}
      </h1>
      <p className="text-sm text-muted-foreground mt-2">
        Preencha os dados abaixo. Todo cadastro passa por aprovação manual.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <div>
          <Label htmlFor="name">Nome da empresa *</Label>
          <Input id="name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
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
          <Textarea id="desc" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
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
          <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="bairro">Bairro</Label>
          <Input id="bairro" value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
        </div>
        <Button type="submit" disabled={loading} className="w-full rounded-full bg-brand text-brand-foreground font-semibold">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {form.id ? "Salvar alterações" : "Enviar para aprovação"}
        </Button>
      </form>
    </div>
  );
}
