import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import * as Icons from "lucide-react";
import { Plus, Pencil, Trash2, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { runCategoryMigration, runBusinessAllocation } from "@/lib/migrate-categories.functions";

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
      toast.success("Sucesso", {
        description: "A categoria foi salva corretamente.",
        icon: <CheckCircle2 className="size-4" />
      });
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error("Falha ao salvar", {
      description: e.message,
      icon: <AlertCircle className="size-4" />
    }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria removida", {
        icon: <Trash2 className="size-4" />
      });
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (e: Error) => toast.error("Não foi possível excluir", {
      description: e.message,
      icon: <AlertCircle className="size-4" />
    }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={async () => {
            if (confirm("Deseja executar a migração/atualização de categorias e subcategorias agora?")) {
              const loadingId = toast.loading("Migrando categorias...");
              try {
                const res = await runCategoryMigration();
                if (res.success) {
                  toast.success("Categorias migradas com sucesso!", { id: loadingId });
                  qc.invalidateQueries({ queryKey: ["admin-categories"] });
                } else {
                  toast.error("Erro desconhecido na migração.", { id: loadingId });
                }
              } catch (err: any) {
                toast.error("Erro na migração: " + err.message, { id: loadingId });
              }
            }
          }}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Sincronizar Categorias
        </Button>
        <Button 
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10"
          onClick={async () => {
            if (confirm("Deseja analisar e alocar as empresas existentes nas subcategorias mais apropriadas agora?")) {
              const loadingId = toast.loading("Alocando empresas...");
              try {
                const res = await runBusinessAllocation();
                if (res.success) {
                  toast.success(`Sucesso! ${res.successCount} empresas organizadas nas subcategorias.`, { id: loadingId });
                } else {
                  toast.error("Erro ao alocar empresas.", { id: loadingId });
                }
              } catch (err: any) {
                toast.error("Erro na alocação: " + err.message, { id: loadingId });
              }
            }
          }}
        >
          <Sparkles className="h-4 w-4 mr-1" />
          Organizar Empresas (Subcategorias)
        </Button>
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
              <div className="h-10 w-10 rounded-lg flex items-center justify-center text-lg text-white" style={{ background: c.color || "hsl(var(--muted))" }}>
                {(() => {
                  const Map = Icons as unknown as Record<string, Icons.LucideIcon>;
                  const Ico = c.icon && Map[c.icon];
                  if (Ico) return <Ico className="h-5 w-5" />;
                  return <span>{c.icon || "🏷️"}</span>;
                })()}
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
