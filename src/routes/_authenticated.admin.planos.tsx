import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/planos")({
  component: AdminPlansPage,
});

type Plan = {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  features: string[];
  is_featured: boolean;
};

type Editing = {
  id?: string;
  name: string;
  slug: string;
  price_cents: number;
  featuresText: string;
  is_featured: boolean;
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const empty: Editing = { name: "", slug: "", price_cents: 0, featuresText: "", is_featured: false };

function AdminPlansPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Editing | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").order("price_cents");
      if (error) throw error;
      return (data as any[]).map((p) => ({ ...p, features: Array.isArray(p.features) ? p.features : [] })) as Plan[];
    },
  });

  const save = useMutation({
    mutationFn: async (e: Editing) => {
      const payload = {
        name: e.name,
        slug: e.slug || slugify(e.name),
        price_cents: Number(e.price_cents) || 0,
        features: e.featuresText.split("\n").map((s) => s.trim()).filter(Boolean),
        is_featured: e.is_featured,
      };
      if (e.id) {
        const { error } = await supabase.from("plans").update(payload).eq("id", e.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("plans").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Plano salvo");
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano removido");
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (p: Plan) =>
    setEditing({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price_cents: p.price_cents,
      featuresText: p.features.join("\n"),
      is_featured: p.is_featured,
    });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(empty)}><Plus className="h-4 w-4 mr-1" />Novo plano</Button>
          </DialogTrigger>
          {editing && (
            <DialogContent>
              <DialogHeader><DialogTitle>{editing.id ? "Editar plano" : "Novo plano"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome *</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} /></div>
                <div><Label>Slug</Label><Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
                <div><Label>Preço (em centavos)</Label><Input type="number" value={editing.price_cents} onChange={(e) => setEditing({ ...editing, price_cents: Number(e.target.value) })} /></div>
                <div><Label>Recursos (um por linha)</Label><Textarea rows={5} value={editing.featuresText} onChange={(e) => setEditing({ ...editing, featuresText: e.target.value })} /></div>
                <div className="flex items-center justify-between"><Label>Em destaque</Label><Switch checked={editing.is_featured} onCheckedChange={(v) => setEditing({ ...editing, is_featured: v })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={() => save.mutate(editing)} disabled={!editing.name || save.isPending}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : !data?.length ? (
        <Card className="p-8 text-center text-muted-foreground">Nenhum plano cadastrado.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.map((p) => (
            <Card key={p.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    {p.name}
                    {p.is_featured && <Star className="h-4 w-4 fill-primary text-primary" />}
                  </p>
                  <p className="text-xs text-muted-foreground">/{p.slug}</p>
                </div>
                <p className="text-lg font-bold">{p.price_cents === 0 ? "Grátis" : formatBRL(p.price_cents)}</p>
              </div>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-0.5">
                {p.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Pencil className="h-4 w-4 mr-1" />Editar</Button>
                <Button size="sm" variant="destructive" onClick={() => { if (confirm("Excluir plano?")) remove.mutate(p.id); }}><Trash2 className="h-4 w-4 mr-1" />Excluir</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
