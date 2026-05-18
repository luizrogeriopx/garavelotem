import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/banners")({
  component: AdminBannersPage,
});

type Banner = {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

const empty: Partial<Banner> = { title: "", image_url: "", link_url: "", sort_order: 0, is_active: true };

function AdminBannersPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Banner> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("*").order("sort_order");
      if (error) throw error;
      return data as Banner[];
    },
  });

  const save = useMutation({
    mutationFn: async (b: Partial<Banner>) => {
      const payload = {
        title: b.title || null,
        image_url: b.image_url!,
        link_url: b.link_url || null,
        sort_order: Number(b.sort_order) || 0,
        is_active: !!b.is_active,
      };
      if (b.id) {
        const { error } = await supabase.from("banners").update(payload).eq("id", b.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banners").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Banner salvo");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner removido");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("banners").update({ is_active: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(empty)}><Plus className="h-4 w-4 mr-1" />Novo banner</Button>
          </DialogTrigger>
          {editing && (
            <DialogContent>
              <DialogHeader><DialogTitle>{editing.id ? "Editar banner" : "Novo banner"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título</Label><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                <div>
                  <Label>Imagem do banner *</Label>
                  <ImageUpload
                    value={editing.image_url}
                    onChange={(url) => setEditing({ ...editing, image_url: url })}
                    bucket="banners"
                    pathPrefix="uploads"
                    label="banner"
                    aspect="aspect-[3/1]"
                  />
                </div>
                <div><Label>Link ao clicar</Label><Input value={editing.link_url ?? ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} /></div>
                <div><Label>Ordem</Label><Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></div>
                <div className="flex items-center justify-between"><Label>Ativo</Label><Switch checked={!!editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={() => save.mutate(editing)} disabled={!editing.image_url || save.isPending}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : !data?.length ? (
        <Card className="p-8 text-center text-muted-foreground">Nenhum banner cadastrado.</Card>
      ) : (
        <div className="grid gap-3">
          {data.map((b) => (
            <Card key={b.id} className="p-4 flex flex-col sm:flex-row gap-4 items-start">
              <div className="h-20 w-32 rounded-lg bg-muted overflow-hidden shrink-0">
                <img src={b.image_url} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{b.title || "(sem título)"}</p>
                <p className="text-xs text-muted-foreground truncate">{b.link_url || "Sem link"}</p>
                <p className="text-xs text-muted-foreground">Ordem: {b.sort_order}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={b.is_active} onCheckedChange={(v) => toggle.mutate({ id: b.id, value: v })} />
                <Button size="icon" variant="outline" onClick={() => setEditing(b)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="destructive" onClick={() => { if (confirm("Excluir banner?")) remove.mutate(b.id); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
