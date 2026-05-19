import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { IdentityBadge } from "./IdentityBadge";
import { useMyBusinesses } from "@/hooks/use-my-businesses";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  user_id: string;
  as_business_id: string | null;
};

type ProfileRow = { id: string; full_name: string | null; avatar_url: string | null };
type BizRow = {
  id: string;
  name: string;
  slug: string;
  username: string | null;
  logo_url: string | null;
};

export function BusinessReviews({ businessId }: { businessId: string }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: myBizs } = useMyBusinesses();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [asBizId, setAsBizId] = useState<string>("");

  const { data: reviews } = useQuery({
    queryKey: ["reviews", businessId, user?.id ?? "anon"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id,rating,comment,created_at,status,user_id,as_business_id")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReviewRow[];
    },
  });

  const userIds = Array.from(new Set((reviews ?? []).map((r) => r.user_id)));
  const bizIds = Array.from(
    new Set((reviews ?? []).map((r) => r.as_business_id).filter((v): v is string => !!v))
  );

  const { data: profiles } = useQuery({
    queryKey: ["reviews-profiles", userIds.sort().join(",")],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url")
        .in("id", userIds);
      if (error) throw error;
      return ((data ?? []) as ProfileRow[]).reduce<Record<string, ProfileRow>>((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});
    },
  });

  const { data: bizs } = useQuery({
    queryKey: ["reviews-bizs", bizIds.sort().join(",")],
    enabled: bizIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,slug,username,logo_url")
        .in("id", bizIds);
      if (error) throw error;
      return ((data ?? []) as BizRow[]).reduce<Record<string, BizRow>>((acc, b) => {
        acc[b.id] = b;
        return acc;
      }, {});
    },
  });

  const approved = (reviews ?? []).filter((r) => r.status === "approved");
  const myReview = user ? (reviews ?? []).find((r) => r.user_id === user.id) : undefined;
  const avg =
    approved.length > 0
      ? approved.reduce((a, r) => a + r.rating, 0) / approved.length
      : null;

  const createReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login para avaliar.");
      if (rating < 1 || rating > 5) throw new Error("Selecione de 1 a 5 estrelas.");
      const payload = {
        business_id: businessId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
        status: "pending" as const,
        as_business_id: asBizId || null,
      };
      const { error } = await supabase.from("reviews").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      setRating(0);
      setComment("");
      setAsBizId("");
      toast.success("Avaliação enviada! Aguardando aprovação.");
      qc.invalidateQueries({ queryKey: ["reviews", businessId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mt-8">
      <h2 className="font-display font-bold text-lg text-brand flex items-center gap-2">
        <Star className="size-4" /> Avaliações
      </h2>

      {avg !== null && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`size-4 ${n <= Math.round(avg) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
              />
            ))}
          </div>
          <span className="font-semibold">{avg.toFixed(1)}</span>
          <span className="text-muted-foreground">({approved.length})</span>
        </div>
      )}

      {/* Formulário */}
      {user ? (
        myReview ? (
          <div className="mt-4 rounded-xl bg-muted/50 p-3 text-sm">
            {myReview.status === "pending" && (
              <p>Sua avaliação está em análise pela equipe.</p>
            )}
            {myReview.status === "approved" && (
              <p>Você já avaliou esta empresa.</p>
            )}
            {myReview.status === "rejected" && (
              <p className="text-destructive">Sua avaliação foi rejeitada pela moderação.</p>
            )}
          </div>
        ) : (
          <form
            className="mt-4 rounded-xl bg-card shadow-card p-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              createReview.mutate();
            }}
          >
            <p className="text-sm font-semibold">Deixe sua avaliação</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  aria-label={`${n} estrelas`}
                >
                  <Star
                    className={`size-6 ${
                      n <= (hover || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte como foi sua experiência (opcional)"
              maxLength={1000}
              rows={3}
              className="w-full text-sm rounded-lg border border-input px-3 py-2 bg-background"
            />
            {(myBizs ?? []).filter((b) => b.id !== businessId).length > 0 && (
              <select
                value={asBizId}
                onChange={(e) => setAsBizId(e.target.value)}
                className="text-xs rounded-lg border border-input px-2 py-1 bg-background"
              >
                <option value="">Avaliar como você mesmo</option>
                {(myBizs ?? [])
                  .filter((b) => b.id !== businessId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      Como {b.name}
                    </option>
                  ))}
              </select>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={rating === 0 || createReview.isPending}
                className="bg-brand text-brand-foreground text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-50"
              >
                Enviar avaliação
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Avaliações passam por moderação antes de aparecer publicamente. Após enviar,
              você não poderá editá-la nem removê-la.
            </p>
          </form>
        )
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          <Link to="/login" className="underline">
            Entre
          </Link>{" "}
          para deixar uma avaliação.
        </p>
      )}

      {/* Lista (somente aprovadas + a do próprio usuário, se houver) */}
      <ul className="mt-4 space-y-3">
        {(reviews ?? [])
          .filter((r) => r.status === "approved" || (user && r.user_id === user.id))
          .map((r) => {
            const biz = r.as_business_id ? bizs?.[r.as_business_id] ?? null : null;
            const prof = profiles?.[r.user_id];
            return (
              <li key={r.id} className="rounded-xl bg-card shadow-card p-3">
                <div className="flex items-center justify-between">
                  <IdentityBadge
                    business={biz}
                    userName={prof?.full_name ?? null}
                    userAvatarUrl={prof?.avatar_url ?? null}
                  />
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`size-4 ${
                          n <= r.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
                {r.status === "pending" && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Em análise (apenas você vê)
                  </p>
                )}
              </li>
            );
          })}
        {approved.length === 0 && !myReview && (
          <li className="text-sm text-muted-foreground">
            Nenhuma avaliação ainda. Seja o primeiro a avaliar.
          </li>
        )}
      </ul>
    </section>
  );
}
