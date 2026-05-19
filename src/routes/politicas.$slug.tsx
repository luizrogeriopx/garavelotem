import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";

export const Route = createFileRoute("/politicas/$slug")({
  component: PolicyPage,
});

function PolicyPage() {
  const { slug } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["policy", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policies")
        .select("title,summary,content,updated_at,is_active")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data || !data.is_active) throw notFound();
      return data;
    },
  });

  if (isLoading) {
    return <div className="container py-10 text-muted-foreground">Carregando…</div>;
  }
  if (error || !data) {
    return (
      <div className="container py-10">
        <Card className="p-8 text-center">
          <h1 className="text-xl font-semibold">Política não encontrada</h1>
          <Link to="/" className="text-primary underline">Voltar ao início</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8 px-4 sm:px-6 space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
      <div className="flex items-center gap-2">
        <FileText className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">{data.title}</h1>
      </div>
      {data.summary && <p className="text-muted-foreground">{data.summary}</p>}
      <Card className="p-6">
        <article className="whitespace-pre-wrap text-sm leading-relaxed">{data.content}</article>
        <p className="text-xs text-muted-foreground mt-6">
          Atualizado em {new Date(data.updated_at).toLocaleDateString("pt-BR")}
        </p>
      </Card>
    </div>
  );
}
