import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/politicas")({
  component: AdminPoliciesPage,
});

const CONTEXTS = [
  { key: "signup", label: "Cadastro de usuário" },
  { key: "business", label: "Cadastro de empresa" },
  { key: "claim", label: "Reivindicação de empresa" },
];

type Editing = {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  is_required: boolean;
  required_for: string[];
  sort_order: number;
  is_active: boolean;
};

const empty: Editing = {
  slug: "",
  title: "",
  summary: "",
  content: "",
  is_required: false,
  required_for: [],
  sort_order: 0,
  is_active: true,
};

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

function AdminPoliciesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Editing | null>(null);

  const { data: policies, isLoading } = useQuery({
    queryKey: ["admin-policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (e: Editing) => {
      if (!e.slug.trim()) throw new Error("Informe o slug");
      if (!e.title.trim()) throw new Error("Informe o título");
      const payload = {
        slug: e.slug.trim(),
        title: e.title.trim(),
        summary: e.summary.trim() || null,
        content: e.content,
        is_required: e.is_required,
        required_for: e.required_for,
        sort_order: e.sort_order,
        is_active: e.is_active,
      };
      if (e.id) {
        const { error } = await supabase.from("policies").update(payload).eq("id", e.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("policies").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Política salva.");
      qc.invalidateQueries({ queryKey: ["admin-policies"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("policies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Política removida.");
      qc.invalidateQueries({ queryKey: ["admin-policies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Políticas e Termos</h2>
        </div>
        <Button onClick={() => setEditing({ ...empty })}>
          <Plus className="size-4" /> Nova política
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : (
        <div className="grid gap-3">
          {policies?.map((p: any) => (
            <Card key={p.id} className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{p.title}</h3>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.slug}</code>
                  {!p.is_active && <Badge variant="secondary">Inativa</Badge>}
                  {p.is_required && <Badge>Obrigatória</Badge>}
                  {Array.isArray(p.required_for) && p.required_for.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      em: {p.required_for.join(", ")}
                    </span>
                  )}
                </div>
                {p.summary && <p className="text-sm text-muted-foreground">{p.summary}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing({
                  id: p.id, slug: p.slug, title: p.title, summary: p.summary ?? "",
                  content: p.content ?? "", is_required: p.is_required,
                  required_for: p.required_for ?? [], sort_order: p.sort_order,
                  is_active: p.is_active,
                })}>
                  <Pencil className="size-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => {
                  if (confirm(`Remover "${p.title}"?`)) remove.mutate(p.id);
                }}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar política" : "Nova política"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Título *</Label>
                  <Input
                    value={editing.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setEditing({
                        ...editing,
                        title,
                        slug: editing.id ? editing.slug : slugify(title),
                      });
                    }}
                  />
                </div>
                <div>
                  <Label>Slug (URL) *</Label>
                  <Input
                    value={editing.slug}
                    onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>Resumo</Label>
                <Input value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} />
              </div>
              <div>
                <Label>Conteúdo</Label>
                <Textarea
                  rows={16}
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Ativa</p>
                    <p className="text-xs text-muted-foreground">Aparece publicamente</p>
                  </div>
                  <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Obrigatória</p>
                    <p className="text-xs text-muted-foreground">Exige aceite em formulários</p>
                  </div>
                  <Switch checked={editing.is_required} onCheckedChange={(v) => setEditing({ ...editing, is_required: v })} />
                </div>
              </div>
              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-medium">Exigida nos contextos:</p>
                {CONTEXTS.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={editing.required_for.includes(c.key)}
                      onCheckedChange={(v) => {
                        const set = new Set(editing.required_for);
                        if (v) set.add(c.key); else set.delete(c.key);
                        setEditing({ ...editing, required_for: Array.from(set) });
                      }}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
              <div>
                <Label>Ordem de exibição</Label>
                <Input
                  type="number"
                  value={editing.sort_order}
                  onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={() => editing && save.mutate(editing)} disabled={save.isPending}>
              {save.isPending && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
