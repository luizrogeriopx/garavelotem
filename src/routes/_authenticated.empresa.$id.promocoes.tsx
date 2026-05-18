import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Pencil, Tag, Loader2 } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { ImageUpload } from "@/components/ui/image-upload";

export const Route = createFileRoute("/_authenticated/empresa/$id/promocoes")({
  component: PromotionsPage,
});

type Promo = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  original_price_cents: number | null;
  price_cents: number | null;
  discount_percent: number | null;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
};

function PromotionsPage() {
  const { id: businessId } = Route.useParams();
  const qc = useQueryClient();

  const { data: business } = useQuery({
    queryKey: ["business", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from("businesses").select("id, name").eq("id", businessId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: promos, isLoading } = useQuery({
    queryKey: ["promotions", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Promo[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("promotions").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotions", businessId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Promoção removida");
      qc.invalidateQueries({ queryKey: ["promotions", businessId] });
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/conta" className="text-sm text-muted-foreground inline-flex items-center gap-1">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
      <div className="flex items-center justify-between gap-4 mt-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-highlight">Promoções</p>
          <h1 className="font-display font-extrabold text-2xl text-brand">{business?.name || "Carregando..."}</h1>
        </div>
        <PromoDialog businessId={businessId}>
          <Button className="bg-highlight hover:bg-highlight/90 text-highlight-foreground rounded-full">
            <Plus className="size-4" /> Nova promoção
          </Button>
        </PromoDialog>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && promos?.length === 0 && (
          <Card className="p-8 text-center">
            <Tag className="size-10 mx-auto text-muted-foreground" />
            <p className="font-semibold mt-3">Nenhuma promoção criada ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Crie ofertas e cupons para atrair clientes.</p>
          </Card>
        )}
        {promos?.map((p) => (
          <Card key={p.id} className="p-4 flex gap-3">
            {p.image_url ? (
              <img src={p.image_url} alt={p.title} className="size-20 rounded-xl object-cover bg-muted" />
            ) : (
              <div className="size-20 rounded-xl bg-muted grid place-items-center">
                <Tag className="size-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold truncate">{p.title}</p>
                {p.discount_percent && (
                  <Badge className="bg-highlight text-highlight-foreground hover:bg-highlight">-{p.discount_percent}%</Badge>
                )}
                {!p.is_active && <Badge variant="outline">Inativa</Badge>}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">{p.description}</p>
              <div className="flex items-center gap-3 mt-2 text-sm">
                {p.price_cents != null && <span className="font-bold text-brand">{formatBRL(p.price_cents)}</span>}
                {p.original_price_cents != null && (
                  <span className="text-xs line-through text-muted-foreground">{formatBRL(p.original_price_cents)}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Switch
                checked={p.is_active}
                onCheckedChange={(v) => toggleActive.mutate({ id: p.id, is_active: v })}
              />
              <div className="flex gap-1">
                <PromoDialog businessId={businessId} promo={p}>
                  <Button size="icon" variant="ghost" className="size-8"><Pencil className="size-4" /></Button>
                </PromoDialog>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive"
                  onClick={() => { if (confirm("Excluir esta promoção?")) remove.mutate(p.id); }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PromoDialog({ businessId, promo, children }: { businessId: string; promo?: Promo; children: React.ReactNode }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: promo?.title ?? "",
    description: promo?.description ?? "",
    image_url: promo?.image_url ?? "",
    price: promo?.price_cents != null ? (promo.price_cents / 100).toString() : "",
    original_price: promo?.original_price_cents != null ? (promo.original_price_cents / 100).toString() : "",
    discount_percent: promo?.discount_percent?.toString() ?? "",
    ends_at: promo?.ends_at ? promo.ends_at.slice(0, 10) : "",
    is_active: promo?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Informe um título");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        business_id: businessId,
        title: form.title.trim().slice(0, 120),
        description: form.description.trim().slice(0, 500) || null,
        image_url: form.image_url || null,
        price_cents: form.price ? Math.round(parseFloat(form.price) * 100) : null,
        original_price_cents: form.original_price ? Math.round(parseFloat(form.original_price) * 100) : null,
        discount_percent: form.discount_percent ? Math.min(99, parseInt(form.discount_percent)) : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        is_active: form.is_active,
      };
      if (promo) {
        const { error } = await supabase.from("promotions").update(payload).eq("id", promo.id);
        if (error) throw error;
        toast.success("Promoção atualizada");
      } else {
        const { error } = await supabase.from("promotions").insert(payload);
        if (error) throw error;
        toast.success("Promoção criada");
      }
      qc.invalidateQueries({ queryKey: ["promotions", businessId] });
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{promo ? "Editar promoção" : "Nova promoção"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="t">Título *</Label>
            <Input id="t" value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="d">Descrição</Label>
            <Textarea id="d" rows={3} maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="img">URL da imagem</Label>
            <Input id="img" placeholder="https://..." value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="orig">De (R$)</Label>
              <Input id="orig" type="number" step="0.01" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="price">Por (R$)</Label>
              <Input id="price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="disc">% off</Label>
              <Input id="disc" type="number" min="0" max="99" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="end">Válido até</Label>
            <Input id="end" type="date" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium text-sm">Ativa</p>
              <p className="text-xs text-muted-foreground">Promoções inativas não aparecem no site</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="bg-brand text-brand-foreground">
            {saving && <Loader2 className="size-4 animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
