import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { IdentityBadge } from "./IdentityBadge";
import { useMyBusinesses } from "@/hooks/use-my-businesses";

type Post = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
};

type Comment = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  as_business_id: string | null;
};

type ProfileLite = { id: string; full_name: string | null; avatar_url: string | null };
type BizLite = {
  id: string;
  name: string;
  slug: string;
  username: string | null;
  logo_url: string | null;
};

export function BusinessFeed({ businessId }: { businessId: string }) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: posts } = useQuery({
    queryKey: ["business-posts", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_posts")
        .select("id, image_url, caption, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
  });

  if (!posts || posts.length === 0) {
    return (
      <section className="mt-8">
        <h2 className="font-display font-bold text-lg text-brand">Feed</h2>
        <p className="text-sm text-muted-foreground mt-2">Nenhuma publicação ainda.</p>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="font-display font-bold text-lg text-brand">Feed</h2>
      <div className="mt-3 space-y-6">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} user={user} qc={qc} />
        ))}
      </div>
    </section>
  );
}

function PostCard({ post, user, qc }: { post: Post; user: ReturnType<typeof useAuth>["user"]; qc: ReturnType<typeof useQueryClient> }) {
  const [showComments, setShowComments] = useState(false);

  const { data: likes } = useQuery({
    queryKey: ["post-likes", post.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_likes")
        .select("user_id")
        .eq("post_id", post.id);
      if (error) throw error;
      return data;
    },
  });

  const liked = !!user && !!likes?.some((l) => l.user_id === user.id);
  const likeCount = likes?.length ?? 0;

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login para curtir.");
      if (liked) {
        const { error } = await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post-likes", post.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <article className="bg-card rounded-2xl shadow-card overflow-hidden">
      <img src={post.image_url} alt={post.caption ?? ""} className="w-full aspect-square object-cover bg-muted" />
      <div className="p-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => toggleLike.mutate()}
            className="flex items-center gap-1 text-sm font-semibold"
            aria-label={liked ? "Descurtir" : "Curtir"}
          >
            <Heart className={`size-5 ${liked ? "fill-red-500 text-red-500" : ""}`} />
            {likeCount}
          </button>
          <button
            onClick={() => setShowComments((s) => !s)}
            className="flex items-center gap-1 text-sm font-semibold"
          >
            <MessageCircle className="size-5" />
            Comentários
          </button>
        </div>
        {post.caption && <p className="mt-2 text-sm whitespace-pre-wrap">{post.caption}</p>}
        {showComments && <Comments postId={post.id} user={user} qc={qc} />}
      </div>
    </article>
  );
}

function Comments({
  postId,
  user,
  qc,
}: {
  postId: string;
  businessId: string;
  user: ReturnType<typeof useAuth>["user"];
  qc: ReturnType<typeof useQueryClient>;
}) {
  const [text, setText] = useState("");
  const [asBizId, setAsBizId] = useState<string>("");
  const { data: myBizs } = useMyBusinesses();

  const { data: comments } = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_comments")
        .select("id, user_id, content, created_at, as_business_id")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Comment[];
    },
  });

  const userIds = Array.from(new Set((comments ?? []).map((c) => c.user_id)));
  const bizIds = Array.from(
    new Set((comments ?? []).map((c) => c.as_business_id).filter((v): v is string => !!v))
  );

  const { data: profiles } = useQuery({
    queryKey: ["comments-profiles", postId, userIds.sort().join(",")],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url")
        .in("id", userIds);
      if (error) throw error;
      return ((data ?? []) as ProfileLite[]).reduce<Record<string, ProfileLite>>(
        (acc, p) => ((acc[p.id] = p), acc),
        {}
      );
    },
  });

  const { data: bizs } = useQuery({
    queryKey: ["comments-bizs", postId, bizIds.sort().join(",")],
    enabled: bizIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,slug,username,logo_url")
        .in("id", bizIds);
      if (error) throw error;
      return ((data ?? []) as BizLite[]).reduce<Record<string, BizLite>>(
        (acc, b) => ((acc[b.id] = b), acc),
        {}
      );
    },
  });

  const createComment = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login para comentar.");
      const content = text.trim();
      if (!content) return;
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: user.id,
        content,
        as_business_id: asBizId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["post-comments", postId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("post_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post-comments", postId] }),
  });

  return (
    <div className="mt-3 border-t border-border pt-3 space-y-2">
      {comments?.map((c) => {
        const biz = c.as_business_id ? bizs?.[c.as_business_id] ?? null : null;
        const prof = profiles?.[c.user_id];
        return (
          <div key={c.id} className="flex items-start gap-2 text-sm">
            <div className="flex-1 min-w-0">
              <IdentityBadge
                business={biz}
                userName={prof?.full_name ?? null}
                userAvatarUrl={prof?.avatar_url ?? null}
              />
              <p className="text-sm mt-1 ml-9">{c.content}</p>
            </div>
            {user?.id === c.user_id && (
              <button
                onClick={() => deleteComment.mutate(c.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        );
      })}
      {comments?.length === 0 && <p className="text-xs text-muted-foreground">Seja o primeiro a comentar.</p>}

      {user ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createComment.mutate();
          }}
          className="space-y-2 mt-2"
        >
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva um comentário..."
              maxLength={1000}
              className="flex-1 text-sm rounded-full border border-input px-3 py-1.5 bg-background"
            />
            <button type="submit" disabled={!text.trim()} className="rounded-full bg-brand text-brand-foreground px-3 disabled:opacity-50">
              <Send className="size-4" />
            </button>
          </div>
          {(myBizs ?? []).length > 0 && (
            <select
              value={asBizId}
              onChange={(e) => setAsBizId(e.target.value)}
              className="text-xs rounded-lg border border-input px-2 py-1 bg-background"
            >
              <option value="">Comentar como você</option>
              {(myBizs ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  Como {b.name}
                </option>
              ))}
            </select>
          )}
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">
          <Link to="/login" className="underline">Entre</Link> para comentar.
        </p>
      )}
    </div>
  );
}
