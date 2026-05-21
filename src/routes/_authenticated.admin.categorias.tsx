import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import * as Icons from "lucide-react";
import { Plus, Pencil, Trash2, CheckCircle2, AlertCircle, RefreshCw, Sparkles, ChevronDown, ChevronUp, GitMerge, PlusCircle, AlertTriangle } from "lucide-react";
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

type Subcategory = {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  sort_order: number | null;
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const empty: Partial<Category> = { name: "", slug: "", icon: "", color: "", sort_order: 0 };

function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [editingSub, setEditingSub] = useState<Partial<Subcategory> | null>(null);
  const [mergingSub, setMergingSub] = useState<Subcategory | null>(null);
  const [targetMergeSubId, setTargetMergeSubId] = useState<string>("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: subcategories, isLoading: isSubsLoading } = useQuery({
    queryKey: ["admin-subcategories-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subcategories").select("*").order("sort_order");
      if (error) throw error;
      return data as Subcategory[];
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

  const saveSub = useMutation({
    mutationFn: async (s: Partial<Subcategory>) => {
      const payload = {
        name: s.name!,
        slug: s.slug || slugify(s.name!),
        category_id: s.category_id!,
        sort_order: s.sort_order !== undefined && s.sort_order !== null ? Number(s.sort_order) : null,
      };
      if (s.id) {
        const { error } = await supabase.from("subcategories").update(payload).eq("id", s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subcategories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Sucesso", {
        description: "A subcategoria foi salva corretamente.",
        icon: <CheckCircle2 className="size-4" />
      });
      qc.invalidateQueries({ queryKey: ["admin-subcategories-all"] });
      setEditingSub(null);
    },
    onError: (e: Error) => toast.error("Falha ao salvar subcategoria", {
      description: e.message,
      icon: <AlertCircle className="size-4" />
    }),
  });

  const removeSub = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subcategories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Subcategoria removida", {
        icon: <Trash2 className="size-4" />
      });
      qc.invalidateQueries({ queryKey: ["admin-subcategories-all"] });
    },
    onError: (e: Error) => toast.error("Não foi possível excluir", {
      description: e.message,
      icon: <AlertCircle className="size-4" />
    }),
  });

  const mergeSub = useMutation({
    mutationFn: async ({ sourceId, targetId, targetCategoryId }: { sourceId: string; targetId: string; targetCategoryId: string }) => {
      // 1. Atualizar todas as empresas na subcategoria antiga para a nova subcategoria
      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          subcategory_id: targetId,
          category_id: targetCategoryId
        })
        .eq("subcategory_id", sourceId);
      
      if (updateError) throw updateError;

      // 2. Excluir a subcategoria de origem
      const { error: deleteError } = await supabase
        .from("subcategories")
        .delete()
        .eq("id", sourceId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      toast.success("Mesclagem concluída", {
        description: "As empresas foram transferidas e a subcategoria de origem foi removida.",
        icon: <CheckCircle2 className="size-4" />
      });
      qc.invalidateQueries({ queryKey: ["admin-subcategories-all"] });
      setMergingSub(null);
      setTargetMergeSubId("");
    },
    onError: (e: Error) => toast.error("Erro ao mesclar", {
      description: e.message,
      icon: <AlertCircle className="size-4" />
    }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 flex-wrap">
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
                  qc.invalidateQueries({ queryKey: ["admin-subcategories-all"] });
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

      {/* Dialog para Cadastrar/Editar Subcategoria */}
      <Dialog open={!!editingSub} onOpenChange={(o) => !o && setEditingSub(null)}>
        {editingSub && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSub.id ? "Editar subcategoria" : "Nova subcategoria"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nome *</Label>
                <Input 
                  value={editingSub.name ?? ""} 
                  onChange={(e) => setEditingSub({ 
                    ...editingSub, 
                    name: e.target.value, 
                    slug: editingSub.id ? editingSub.slug : slugify(e.target.value) 
                  })} 
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input 
                  value={editingSub.slug ?? ""} 
                  onChange={(e) => setEditingSub({ ...editingSub, slug: e.target.value })} 
                />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input 
                  type="number" 
                  value={editingSub.sort_order ?? 0} 
                  onChange={(e) => setEditingSub({ ...editingSub, sort_order: Number(e.target.value) })} 
                />
              </div>
              <div>
                <Label>Categoria Principal *</Label>
                <Select 
                  value={editingSub.category_id} 
                  onValueChange={(val) => setEditingSub({ ...editingSub, category_id: val })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSub(null)}>Cancelar</Button>
              <Button 
                onClick={() => saveSub.mutate(editingSub)} 
                disabled={!editingSub.name || !editingSub.category_id || saveSub.isPending}
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Dialog para Mesclar Subcategoria */}
      <Dialog open={!!mergingSub} onOpenChange={(o) => !o && setMergingSub(null)}>
        {mergingSub && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mesclar Subcategoria: {mergingSub.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 rounded-lg text-xs flex gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <span className="font-semibold block mb-0.5">Aviso importante:</span>
                  Esta ação irá transferir todas as empresas associadas à subcategoria <strong>{mergingSub.name}</strong> para a subcategoria de destino escolhida abaixo. Após a transferência, a subcategoria <strong>{mergingSub.name}</strong> será permanentemente excluída.
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subcategoria de Destino *</Label>
                <Select 
                  value={targetMergeSubId} 
                  onValueChange={setTargetMergeSubId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a subcategoria de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.map((cat) => {
                      const catSubs = subcategories?.filter(s => s.category_id === cat.id && s.id !== mergingSub.id) || [];
                      if (catSubs.length === 0) return null;
                      
                      return (
                        <SelectGroup key={cat.id}>
                          <SelectLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
                            {cat.name}
                          </SelectLabel>
                          {catSubs.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                          <SelectSeparator />
                        </SelectGroup>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMergingSub(null)}>Cancelar</Button>
              <Button 
                variant="destructive"
                disabled={!targetMergeSubId || mergeSub.isPending}
                onClick={() => {
                  const targetSub = subcategories?.find(s => s.id === targetMergeSubId);
                  if (targetSub) {
                    mergeSub.mutate({
                      sourceId: mergingSub.id,
                      targetId: targetMergeSubId,
                      targetCategoryId: targetSub.category_id
                    });
                  }
                }}
              >
                <GitMerge className="h-4 w-4 mr-1" /> Confirmar e Mesclar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : !data?.length ? (
        <Card className="p-8 text-center text-muted-foreground">Nenhuma categoria.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.map((c) => {
            const isExpanded = !!expandedCategories[c.id];
            const subs = subcategories?.filter(s => s.category_id === c.id) || [];
            
            return (
              <Card key={c.id} className="p-4 flex flex-col gap-3 transition-all duration-200">
                <div className="flex items-center gap-3 w-full">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center text-lg text-white shrink-0" style={{ background: c.color || "hsl(var(--muted))" }}>
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
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-muted-foreground hover:text-foreground flex gap-1 items-center px-2 h-8"
                    onClick={() => toggleCategory(c.id)}
                  >
                    <span className="text-xs font-medium">{subs.length} sub</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 animate-in fade-in" /> : <ChevronDown className="h-4 w-4 animate-in fade-in" />}
                  </Button>

                  <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8 shrink-0" onClick={() => { if (confirm("Excluir categoria?")) remove.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
                
                {isExpanded && (
                  <div className="border-t pt-3 mt-1 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subcategorias</span>
                      <Button 
                        variant="link" 
                        className="text-primary hover:text-primary/80 h-auto p-0 text-xs flex items-center gap-1 font-medium decoration-transparent hover:decoration-transparent"
                        onClick={() => setEditingSub({ name: "", slug: "", category_id: c.id, sort_order: 0 })}
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> Add Subcategoria
                      </Button>
                    </div>
                    
                    {isSubsLoading ? (
                      <p className="text-xs text-muted-foreground italic">Carregando...</p>
                    ) : subs.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-2">Nenhuma subcategoria cadastrada.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {subs.map((s) => (
                          <div key={s.id} className="flex items-center justify-between bg-muted/40 hover:bg-muted/70 px-2 py-1.5 rounded-md text-sm transition-colors border border-transparent hover:border-muted-foreground/10">
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-foreground text-xs">{s.name}</span>
                              <span className="text-[10px] text-muted-foreground ml-2">/{s.slug} · ordem {s.sort_order ?? 0}</span>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 hover:bg-muted rounded-full"
                                title="Editar"
                                onClick={() => setEditingSub(s)}
                              >
                                <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                              </Button>
                              
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 hover:bg-muted rounded-full"
                                title="Mesclar com outra subcategoria"
                                onClick={() => {
                                  setMergingSub(s);
                                  setTargetMergeSubId("");
                                }}
                              >
                                <GitMerge className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                              </Button>
                              
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 hover:bg-destructive/10 rounded-full"
                                title="Excluir"
                                onClick={() => {
                                  if (confirm(`Tem certeza que deseja excluir a subcategoria "${s.name}"?`)) {
                                    removeSub.mutate(s.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

