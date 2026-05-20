import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, Tag, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/promocoes")({
  component: AdminPromosPage,
});

function AdminPromosPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("id, title, description, image_url, price_cents, original_price_cents, discount_percent, is_active, created_at, business_id, businesses(name, slug, status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("promotions").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-promotions"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Promoção removida");
      qc.invalidateQueries({ queryKey: ["admin-promotions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  if (!data?.length) return <Card className="p-8 text-center text-muted-foreground">Nenhuma promoção cadastrada.</Card>;

  return (
    <div className="grid gap-3">
      {data.map((p: any) => (
        <Card key={p.id} className="p-4 flex gap-3">
          {p.image_url ? (
            <img src={p.image_url} alt={p.title} className="size-20 rounded-xl object-cover bg-muted" />
          ) : (
            <div className="size-20 rounded-xl bg-muted grid place-items-center"><Tag className="size-6 text-muted-foreground" /></div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold truncate">{p.title}</p>
              {p.discount_percent && <Badge>-{p.discount_percent}%</Badge>}
              {!p.is_active && <Badge variant="outline">Inativa</Badge>}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-1">
              Empresa: {p.businesses?.name ?? <span className="text-destructive">sem empresa</span>}
              {p.businesses?.status && p.businesses.status !== "approved" && ` · ${p.businesses.status}`}
            </p>
            <div className="flex items-center gap-3 mt-2 text-sm">
              {p.price_cents != null && <span className="font-bold">{formatBRL(p.price_cents)}</span>}
              {p.original_price_cents != null && <span className="text-xs line-through text-muted-foreground">{formatBRL(p.original_price_cents)}</span>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Switch checked={p.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: p.id, is_active: v })} />
            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-destructive"
              onClick={() => { if (confirm("Excluir esta promoção?")) remove.mutate(p.id); }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
