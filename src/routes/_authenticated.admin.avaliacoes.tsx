import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/avaliacoes")({
  component: AdminReviewsPage,
});

type Row = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  user_id: string;
  business_id: string;
  admin_note: string | null;
  as_business_id: string | null;
};

function AdminReviewsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-reviews", filter],
    queryFn: async () => {
      let q = supabase
        .from("reviews")
        .select("id,rating,comment,created_at,status,user_id,business_id,admin_note,as_business_id")
        .order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
  const bizIds = Array.from(
    new Set([
      ...(rows ?? []).map((r) => r.business_id),
      ...(rows ?? []).map((r) => r.as_business_id).filter((v): v is string => !!v),
    ])
  );

  const { data: profiles } = useQuery({
    queryKey: ["admin-reviews-profiles", userIds.sort().join(",")],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,email")
        .in("id", userIds);
      return ((data ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>).reduce<
        Record<string, { full_name: string | null; email: string | null }>
      >((acc, p) => ((acc[p.id] = p), acc), {});
    },
  });

  const { data: bizs } = useQuery({
    queryKey: ["admin-reviews-bizs", bizIds.sort().join(",")],
    enabled: bizIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id,name,slug,username")
        .in("id", bizIds);
      return ((data ?? []) as Array<{ id: string; name: string; slug: string; username: string | null }>).reduce<
        Record<string, { name: string; slug: string; username: string | null }>
      >((acc, b) => ((acc[b.id] = b), acc), {});
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      note,
    }: {
      id: string;
      status: "approved" | "rejected";
      note?: string;
    }) => {
      const { error } = await supabase
        .from("reviews")
        .update({
          status,
          admin_note: note ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avaliação atualizada.");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avaliação excluída.");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s === "pending" ? "Pendentes" : s === "approved" ? "Aprovadas" : s === "rejected" ? "Rejeitadas" : "Todas"}
          </Button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {(rows ?? []).length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">Nenhuma avaliação.</p>
      )}

      <div className="space-y-3">
        {(rows ?? []).map((r) => (
          <ReviewCard
            key={r.id}
            row={r}
            biz={bizs?.[r.business_id]}
            asBiz={r.as_business_id ? bizs?.[r.as_business_id] : undefined}
            author={profiles?.[r.user_id]}
            onApprove={(note) => setStatus.mutate({ id: r.id, status: "approved", note })}
            onReject={(note) => setStatus.mutate({ id: r.id, status: "rejected", note })}
            onDelete={() => remove.mutate(r.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({
  row,
  biz,
  asBiz,
  author,
  onApprove,
  onReject,
  onDelete,
}: {
  row: Row;
  biz?: { name: string; slug: string; username: string | null };
  asBiz?: { name: string; slug: string; username: string | null };
  author?: { full_name: string | null; email: string | null };
  onApprove: (note?: string) => void;
  onReject: (note?: string) => void;
  onDelete: () => void;
}) {
  const [note, setNote] = useState(row.admin_note ?? "");
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm">
          <p className="font-semibold">{biz?.name ?? "Empresa"}</p>
          <p className="text-xs text-muted-foreground">
            por {asBiz ? `${asBiz.name} (como empresa)` : author?.full_name ?? author?.email ?? "Usuário"} ·{" "}
            {new Date(row.created_at).toLocaleString("pt-BR")}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            row.status === "pending"
              ? "bg-amber-100 text-amber-900"
              : row.status === "approved"
                ? "bg-emerald-100 text-emerald-900"
                : "bg-rose-100 text-rose-900"
          }`}
        >
          {row.status}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`size-4 ${n <= row.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
          />
        ))}
      </div>
      {row.comment && <p className="text-sm whitespace-pre-wrap">{row.comment}</p>}
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Nota interna (opcional)"
        rows={2}
      />
      <div className="flex gap-2 flex-wrap">
        {row.status !== "approved" && (
          <Button size="sm" onClick={() => onApprove(note)}>
            <Check className="size-4 mr-1" /> Aprovar
          </Button>
        )}
        {row.status !== "rejected" && (
          <Button size="sm" variant="outline" onClick={() => onReject(note)}>
            <X className="size-4 mr-1" /> Rejeitar
          </Button>
        )}
        <Button size="sm" variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4 mr-1" /> Excluir
        </Button>
      </div>
    </Card>
  );
}
