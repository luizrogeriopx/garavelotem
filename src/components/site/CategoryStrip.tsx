import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as Icons from "lucide-react";

type Cat = { id: string; name: string; slug: string; icon: string | null; color: string | null };

export function CategoryStrip() {
  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,slug,icon,color")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Cat[];
    },
  });

  const items = data ?? Array.from({ length: 8 }).map((_, i) => null);

  return (
    <section className="-mx-4 px-4 overflow-x-auto no-scrollbar">
      <ul className="flex gap-3 pb-2">
        {items.map((c, i) => {
          if (!c) {
            return (
              <li key={i} className="shrink-0 w-[76px]">
                <div className="size-14 mx-auto rounded-2xl bg-muted animate-pulse" />
                <div className="h-3 mt-2 bg-muted animate-pulse rounded" />
              </li>
            );
          }
          const IconMap = Icons as unknown as Record<string, Icons.LucideIcon>;
          const Icon: Icons.LucideIcon = (c.icon && IconMap[c.icon]) || Icons.Tag;
          return (
            <li key={c.id} className="shrink-0">
              <Link
                to="/categorias/$slug"
                params={{ slug: c.slug }}
                className="flex flex-col items-center gap-2 w-[76px] group"
              >
                <div
                  className="size-14 rounded-2xl bg-surface shadow-card grid place-items-center transition-transform group-active:scale-95"
                  style={{ color: c.color ?? undefined }}
                >
                  <Icon className="size-6" />
                </div>
                <span className="text-[11px] font-semibold text-center leading-tight text-foreground">
                  {c.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
