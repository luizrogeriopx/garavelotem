import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as Icons from "lucide-react";

export const Route = createFileRoute("/categorias/")({
  component: CategoriesPage,
  head: () => ({ meta: [{ title: "Categorias — Garavelo Tem" }] }),
});

function CategoriesPage() {
  const { data } = useQuery({
    queryKey: ["categories-full"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="font-display font-extrabold text-2xl text-brand mb-6">Categorias</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(data ?? []).map((c) => {
          const Map = Icons as unknown as Record<string, Icons.LucideIcon>;
          const Icon: Icons.LucideIcon = (c.icon && Map[c.icon]) || Icons.Tag;
          return (
            <Link
              key={c.id}
              to="/categorias/$slug"
              params={{ slug: c.slug }}
              className="bg-card rounded-2xl p-5 shadow-card flex flex-col items-center gap-2 hover:shadow-lift transition-shadow"
            >
              <div className="size-12 rounded-2xl bg-accent grid place-items-center" style={{ color: c.color ?? undefined }}>
                <Icon className="size-6" />
              </div>
              <span className="font-semibold text-sm text-brand">{c.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
