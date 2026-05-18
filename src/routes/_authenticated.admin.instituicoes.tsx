import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { Plus, Trash2, Pencil, Landmark } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/instituicoes")({
  component: AdminInstitutionsPage,
});

const KINDS = [
  { value: "posto_saude", label: "Posto de saúde" },
  { value: "hospital", label: "Hospital" },
  { value: "cartorio", label: "Cartório" },
  { value: "delegacia", label: "Delegacia" },
  { value: "conselho_tutelar", label: "Conselho tutelar" },
  { value: "bombeiros", label: "Bombeiros" },
  { value: "escola", label: "Escola" },
  { value: "prefeitura", label: "Prefeitura" },
  { value: "outros", label: "Outros" },
];

type FormData = {
  id?: string;
  name: string;
  kind: string;
  description: string;
  address: string;
  neighborhood: string;
  phone: string;
  whatsapp: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
};

const empty: FormData = {
  name: "", kind: "outros", description: "", address: "", neighborhood: "Setor Garavelo",
  phone: "", whatsapp: "", image_url: "", is_active: true, sort_order: 0,
};

function AdminInstitutionsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>(empty);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-institutions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_institutions")
        .select("*")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (f: FormData) => {
      const payload = {
        name: f.name.trim(),
        kind: f.kind as any,
        description: f.description.trim() || null,
        address: f.address.trim() || null,
        neighborhood: f.neighborhood.trim() || null,
        phone: f.phone.trim() || null,
        whatsapp: f.whatsapp.replace(/\D/g, "") || null,
        image_url: f.image_url || null,
        is_active: f.is_active,
        sort_order: f.sort_order ?? 0,
      };
      if (f.id) {
        const { error } = await supabase.from("public_institutions").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("public_institutions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Instituição salva");
      qc.invalidateQueries({ queryKey: ["admin-institutions"] });
      qc.invalidateQueries({ queryKey: ["home-institutions"] });
      setOpen(false);
      setForm(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("public_institutions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removida");
      qc.invalidateQueries({ queryKey: ["admin-institutions"] });
      qc.invalidateQueries({ queryKey: ["home-institutions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("public_institutions").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-institutions"] });
      qc.invalidateQueries({ queryKey: ["home-institutions"] });
    },
  });

  const startNew = () => { setForm(empty); setOpen(true); };
  const startEdit = (row: any) => {
    setForm({
      id: row.id,
      name: row.name ?? "",
      kind: row.kind ?? "outros",
      description: row.description ?? "",
      address: row.address ?? "",
      neighborhood: row.neighborhood ?? "",
      phone: row.phone ?? "",
      whatsapp: row.whatsapp ?? "",
      image_url: row.image_url ?? "",
      is_active: !!row.is_active,
      sort_order: row.sort_order ?? 0,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Postos de saúde, cartórios, delegacias, conselho tutelar e outros serviços públicos.</p>
        <Button onClick={startNew}><Plus className="h-4 w-4 mr-1" /> Nova instituição</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : !data?.length ? (
        <Card className="p-8 text-center text-muted-foreground">Nenhuma instituição cadastrada.</Card>
      ) : (
        <div className="grid gap-3">
          {data.map((i: any) => (
            <Card key={i.id} className="p-4 flex gap-3 items-center">
              {i.image_url ? (
                <img src={i.image_url} alt={i.name} className="size-14 rounded-xl object-cover bg-muted" />
              ) : (
                <div className="size-14 rounded-xl bg-muted grid place-items-center"><Landmark className="size-5 text-muted-foreground" /></div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">{i.name}</p>
                  <Badge variant="outline">{KINDS.find((k) => k.value === i.kind)?.label ?? i.kind}</Badge>
                  {!i.is_active && <Badge variant="secondary">Inativa</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {i.neighborhood ?? "—"} · {i.phone ?? i.whatsapp ?? "sem contato"}
                </p>
              </div>
              <Switch checked={i.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: i.id, is_active: v })} />
              <Button size="icon" variant="ghost" onClick={() => startEdit(i)}><Pencil className="size-4" /></Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Excluir?")) remove.mutate(i.id); }}>
                <Trash2 className="size-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar instituição" : "Nova instituição"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={3} maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Foto</Label>
              <ImageUpload
                value={form.image_url}
                onChange={(url) => setForm({ ...form, image_url: url })}
                bucket="business-assets"
                pathPrefix="institutions"
                label="foto"
                aspect="aspect-video"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input placeholder="62999999999" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={200} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Bairro</Label>
                <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Ativa (visível na home)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate(form)} disabled={!form.name.trim() || save.isPending}>
              {form.id ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
