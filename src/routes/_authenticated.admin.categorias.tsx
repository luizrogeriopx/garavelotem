import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/categorias")({
  component: AdminCategoriesPage,
});

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const empty: Partial<Category> = { name: "", slug: "", icon: "", color: "", sort_order: 0 };

function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Category> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const save = useMutation({
    mutationFn: async (c: Partial<Category>) => {
      const payload = {
        name: c.name!,
        slug: c.slug || slugify(c.name!),
        icon: c.icon || null,
        color: c.color || null,
        sort_order: Number(c.sort_order) || 0,
      };
      if (c.id) {
        const { error } = await supabase.from("categories").update(payload).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Categoria salva");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria removida");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(empty)}><Plus className="h-4 w-4 mr-1" />Nova categoria</Button>
          </DialogTrigger>
          {editing && (
            <DialogContent>
              <DialogHeader><DialogTitle>{editing.id ? "Editar categoria" : "Nova categoria"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome *</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} /></div>
                <div><Label>Slug</Label><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
                <div><Label>Ícone (lucide ou emoji)</Label><Input value={editing.icon ?? ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} /></div>
                <div><Label>Cor (hex ou token)</Label><Input value={editing.color ?? ""} onChange={(e) => setEditing({ ...editing, color: e.target.value })} placeholder="#F97316" /></div>
                <div><Label>Ordem</Label><Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></div>
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
        <Card className="p-8 text-center text-muted-foreground">Nenhuma categoria.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.map((c) => (
            <Card key={c.id} className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center text-lg" style={{ background: c.color || "hsl(var(--muted))" }}>
                {c.icon || "🏷️"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate">/{c.slug} · ordem {c.sort_order}</p>
              </div>
              <Button size="icon" variant="outline" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="destructive" onClick={() => { if (confirm("Excluir categoria?")) remove.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
