import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Heart, MessageCircle, Send, Trash2, CornerDownRight, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { IdentityBadge } from "./IdentityBadge";
import { VerifiedBadge } from "./VerifiedBadge";
import { FollowButton } from "./FollowButton";
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
  parent_id: string | null;
};

type ProfileLite = { id: string; full_name: string | null; avatar_url: string | null };
type BizLite = {
  id: string;
  name: string;
  slug: string;
  username: string | null;
  logo_url: string | null;
};
type BizHeader = BizLite & { is_verified: boolean; plan_slug: string | null };

export function BusinessFeed({ businessId }: { businessId: string }) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: business } = useQuery({
    queryKey: ["business-header", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,slug,username,logo_url,is_verified, plans(slug)")
        .eq("id", businessId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const plan_slug = ((data as any).plans?.slug as string | undefined) ?? null;
      return { ...(data as any), plan_slug } as BizHeader;
    },
  });

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
          <PostCard key={p.id} post={p} business={business ?? null} user={user} qc={qc} />
        ))}
      </div>
    </section>
  );
}

function PostHeader({ business }: { business: BizHeader }) {
  const isPro = business.plan_slug === "pro";
  const linkProps = business.username
    ? ({ to: "/$username" as const, params: { username: business.username } } as const)
    : ({ to: "/empresa/$slug" as const, params: { slug: business.slug } } as const);
  const handle = business.username ?? business.slug;
  return (
    <div className="flex items-center gap-3 p-3">
      <Link {...linkProps} className="shrink-0">
        <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-fuchsia-600">
          <div className="size-11 rounded-full bg-card p-[2px]">
            <div className="size-full rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-semibold text-muted-foreground">
              {business.logo_url ? (
                <img src={business.logo_url} alt="" className="size-full object-cover" />
              ) : (
                <span>{business.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <div className="min-w-0 flex-1 leading-tight">
        <Link {...linkProps} className="font-semibold text-sm flex items-center gap-1 hover:underline truncate">
          <span className="truncate">{handle}</span>
          {isPro && <VerifiedBadge className="size-3.5 shrink-0" />}
        </Link>
        <Link {...linkProps} className="block text-xs text-muted-foreground truncate hover:underline">
          {business.name}
        </Link>
      </div>
      <div className="shrink-0 flex items-center gap-1">
        <FollowButton businessId={business.id} compact />
        <button className="p-1.5 text-muted-foreground hover:text-foreground" aria-label="Mais opções">
          <MoreHorizontal className="size-5" />
        </button>
      </div>
    </div>
  );
}

function relativeTime(iso: string) {
  try {
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true, locale: ptBR });
  } catch {
    return "";
  }
}

function PostCard({
  post,
  business,
  user,
  qc,
}: {
  post: Post;
  business: BizHeader | null;
  user: ReturnType<typeof useAuth>["user"];
  qc: ReturnType<typeof useQueryClient>;
}) {
  const [showComments, setShowComments] = useState(false);

  const { data: likes } = useQuery({
    queryKey: ["post-likes", post.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_likes")
        .select("user_id, as_business_id")
        .eq("post_id", post.id);
      if (error) throw error;
      return (data ?? []) as { user_id: string; as_business_id: string | null }[];
    },
  });

  const { data: commentCount } = useQuery({
    queryKey: ["post-comments-count", post.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("post_comments")
        .select("id", { count: "exact", head: true })
        .eq("post_id", post.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const liked = !!user && !!likes?.some((l) => l.user_id === user.id);
  const likeCount = likes?.length ?? 0;

  const likeUserIds = Array.from(new Set((likes ?? []).filter((l) => !l.as_business_id).map((l) => l.user_id)));
  const likeBizIds = Array.from(new Set((likes ?? []).map((l) => l.as_business_id).filter((v): v is string => !!v)));

  const { data: likeProfiles } = useQuery({
    queryKey: ["post-like-profiles", post.id, likeUserIds.sort().join(",")],
    enabled: likeUserIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", likeUserIds);
      return (data ?? []) as ProfileLite[];
    },
  });

  const { data: likeBizs } = useQuery({
    queryKey: ["post-like-bizs", post.id, likeBizIds.sort().join(",")],
    enabled: likeBizIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("businesses").select("id,name,slug,username,logo_url").in("id", likeBizIds);
      return (data ?? []) as BizLite[];
    },
  });

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

  const likers: { key: string; src: string | null; name: string }[] = [
    ...(likeBizs ?? []).map((b) => ({ key: `b-${b.id}`, src: b.logo_url, name: b.name })),
    ...(likeProfiles ?? []).map((p) => ({ key: `u-${p.id}`, src: p.avatar_url, name: p.full_name ?? "Usuário" })),
  ];
  const avatars = likers.slice(0, 5);

  return (
    <article className="bg-card rounded-2xl shadow-card overflow-hidden">
      {business && <PostHeader business={business} />}
      <img src={post.image_url} alt={post.caption ?? ""} className="w-full aspect-square object-cover bg-muted" />
      <div className="p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleLike.mutate()}
            className="flex items-center gap-1 text-sm font-semibold"
            aria-label={liked ? "Descurtir" : "Curtir"}
          >
            <Heart className={`size-5 ${liked ? "fill-red-500 text-red-500" : ""}`} />
            <span>{liked ? "Curtiu" : "Curtir"}</span>
          </button>
          <button
            onClick={() => setShowComments((s) => !s)}
            className="flex items-center gap-1 text-sm font-semibold ml-auto"
          >
            <MessageCircle className="size-5" />
            <span>{commentCount ?? 0}</span>
          </button>
        </div>
        {likers.length > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex -space-x-2 shrink-0">
              {avatars.map((a) => (
                <div key={a.key} className="size-6 rounded-full bg-muted overflow-hidden ring-2 ring-card flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                  {a.src ? (
                    <img src={a.src} alt={a.name} className="size-full object-cover" />
                  ) : (
                    <span>{a.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              ))}
            </div>
            <span className="truncate">
              Curtido por <span className="font-semibold text-foreground">{likers[0].name}</span>
              {likers.length > 1 && <> e outras {likers.length - 1}</>}
            </span>
          </div>
        )}
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
  user: ReturnType<typeof useAuth>["user"];
  qc: ReturnType<typeof useQueryClient>;
}) {
  const [text, setText] = useState("");
  const [asBizId, setAsBizId] = useState<string>("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const { data: myBizs } = useMyBusinesses();

  const { data: comments } = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_comments")
        .select("id, user_id, content, created_at, as_business_id, parent_id")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Comment[];
    },
  });

  const commentIds = (comments ?? []).map((c) => c.id);

  const { data: commentLikes } = useQuery({
    queryKey: ["post-comment-likes", postId, commentIds.sort().join(",")],
    enabled: commentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comment_likes")
        .select("comment_id,user_id")
        .in("comment_id", commentIds);
      if (error) throw error;
      return (data ?? []) as { comment_id: string; user_id: string }[];
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
        parent_id: replyTo,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      setReplyTo(null);
      qc.invalidateQueries({ queryKey: ["post-comments", postId] });
      qc.invalidateQueries({ queryKey: ["post-comments-count", postId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("post_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post-comments", postId] });
      qc.invalidateQueries({ queryKey: ["post-comments-count", postId] });
    },
  });

  const toggleCommentLike = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error("Faça login para curtir.");
      const isLiked = !!commentLikes?.some(
        (l) => l.comment_id === commentId && l.user_id === user.id
      );
      if (isLiked) {
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("comment_likes")
          .insert({ comment_id: commentId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post-comment-likes", postId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const roots = (comments ?? []).filter((c) => !c.parent_id);
  const repliesByParent = (comments ?? []).reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parent_id) {
      (acc[c.parent_id] ||= []).push(c);
    }
    return acc;
  }, {});

  const renderComment = (c: Comment, depth = 0) => {
    const biz = c.as_business_id ? bizs?.[c.as_business_id] ?? null : null;
    const prof = profiles?.[c.user_id];
    const likes = (commentLikes ?? []).filter((l) => l.comment_id === c.id);
    const isLiked = !!user && likes.some((l) => l.user_id === user.id);
    const replies = repliesByParent[c.id] ?? [];
    return (
      <div key={c.id} className={depth > 0 ? "ml-8 mt-2" : ""}>
        <div className="flex items-start gap-2 text-sm">
          <div className="flex-1 min-w-0">
            <IdentityBadge
              business={biz}
              userName={prof?.full_name ?? null}
              userAvatarUrl={prof?.avatar_url ?? null}
            />
            <p className="text-sm mt-1 ml-9">{c.content}</p>
            <div className="ml-9 mt-1 flex items-center gap-3 text-xs">
              <button
                onClick={() => toggleCommentLike.mutate(c.id)}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <Heart className={`size-3.5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                <span>{isLiked ? "Curtiu" : "Curtir"}</span>
                {likes.length > 0 && <span>· {likes.length}</span>}
              </button>
              {user && depth === 0 && (
                <button
                  onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <CornerDownRight className="size-3.5" />
                  Responder
                </button>
              )}
            </div>
          </div>
          {user?.id === c.user_id && (
            <button
              onClick={() => deleteComment.mutate(c.id)}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Excluir"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
        {replies.map((r) => renderComment(r, depth + 1))}
        {replyTo === c.id && user && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createComment.mutate();
            }}
            className="ml-8 mt-2 flex gap-2"
          >
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Responder a ${biz ? biz.name : prof?.full_name ?? "usuário"}...`}
              maxLength={1000}
              className="flex-1 text-sm rounded-full border border-input px-3 py-1.5 bg-background"
            />
            <button type="submit" disabled={!text.trim()} className="rounded-full bg-brand text-brand-foreground px-3 disabled:opacity-50">
              <Send className="size-4" />
            </button>
          </form>
        )}
      </div>
    );
  };

  return (
    <div className="mt-3 border-t border-border pt-3 space-y-2">
      {roots.map((c) => renderComment(c))}
      {roots.length === 0 && <p className="text-xs text-muted-foreground">Seja o primeiro a comentar.</p>}

      {user ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (replyTo) return;
            createComment.mutate();
          }}
          className="space-y-2 mt-2"
        >
          {!replyTo && (
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
          )}
          {(myBizs ?? []).length > 0 && !replyTo && (
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
