import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/empresa/$id/posts")({
  component: PostsPage,
});

type Post = { id: string; image_url: string; caption: string | null; created_at: string };

function PostsPage() {
  const { id: businessId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");

  const { data: business } = useQuery({
    queryKey: ["business-meta", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, owner_id, plans(slug)")
        .eq("id", businessId)
        .single();
      if (error) throw error;
      return data as { id: string; name: string; owner_id: string; plans: { slug: string } | null };
    },
  });

  const { data: posts, isLoading } = useQuery({
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

  const createPost = useMutation({
    mutationFn: async () => {
      if (!imageUrl) throw new Error("Envie uma imagem.");
      const { error } = await supabase
        .from("business_posts")
        .insert({ business_id: businessId, image_url: imageUrl, caption: caption.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post publicado");
      setOpen(false);
      setImageUrl("");
      setCaption("");
      qc.invalidateQueries({ queryKey: ["business-posts", businessId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("business_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-posts", businessId] }),
  });

  const isPro = business?.plans?.slug === "pro";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/conta" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-3">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
      <p className="text-[11px] font-bold uppercase tracking-widest text-highlight">Comerciante</p>
      <h1 className="font-display font-extrabold text-2xl text-brand">Posts — {business?.name}</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Publique fotos no feed da sua empresa. Os clientes podem curtir e comentar.
      </p>

      {!isPro && business && (
        <Card className="p-4 mt-4 bg-yellow-50 border-yellow-200">
          <p className="text-sm">
            O feed é exclusivo do plano <strong>Pro</strong>.{" "}
            <Link to="/planos" search={{ businessId }} className="underline font-semibold">
              Faça upgrade
            </Link>
          </p>
        </Card>
      )}

      <div className="mt-6 flex justify-between items-center">
        <h2 className="font-display font-bold">Suas publicações</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={!isPro} className="rounded-full bg-brand text-brand-foreground">
              <Plus className="size-4" /> Novo post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo post</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Imagem *</Label>
                <ImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  bucket="business-assets"
                  pathPrefix={`${user?.id}/posts`}
                  label="post"
                  aspect="aspect-square"
                />
              </div>
              <div>
                <Label>Legenda</Label>
                <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={2000} rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createPost.mutate()} disabled={createPost.isPending || !imageUrl}>
                {createPost.isPending && <Loader2 className="size-4 animate-spin" />} Publicar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {posts?.map((p) => (
          <Card key={p.id} className="overflow-hidden relative group">
            <img src={p.image_url} alt="" className="w-full aspect-square object-cover" />
            {p.caption && <p className="p-2 text-xs line-clamp-2">{p.caption}</p>}
            <button
              onClick={() => deletePost.mutate(p.id)}
              className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition"
              aria-label="Excluir"
            >
              <Trash2 className="size-4" />
            </button>
          </Card>
        ))}
        {posts?.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground col-span-full">Nenhum post ainda.</p>
        )}
      </div>
    </div>
  );
}
