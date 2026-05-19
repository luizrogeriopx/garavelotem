import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/politicas/")({
  component: PoliciesIndex,
});

function PoliciesIndex() {
  const { data } = useQuery({
    queryKey: ["policies-list-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policies")
        .select("slug,title,summary,sort_order")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container max-w-3xl py-8 px-4 sm:px-6 space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">Políticas e Termos</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Documentos jurídicos da plataforma Garavelo Tem.
      </p>
      <div className="grid gap-3">
        {data?.map((p) => (
          <Link key={p.slug} to="/politicas/$slug" params={{ slug: p.slug }}>
            <Card className="p-4 hover:border-primary transition">
              <h2 className="font-semibold">{p.title}</h2>
              {p.summary && <p className="text-sm text-muted-foreground mt-1">{p.summary}</p>}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
