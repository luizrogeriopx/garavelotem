import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as Icons from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Cat = { id: string; name: string; slug: string; icon: string | null; color: string | null };

export function CategoryStrip() {
  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,slug,icon,color")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Cat[];
    },
  });

  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [data]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(200, el.clientWidth * 0.7), behavior: "smooth" });
  };

  const items = data ?? Array.from({ length: 8 }).map(() => null);

  return (
    <section className="relative -mx-4 px-4">
      {canLeft && (
        <button
          type="button"
          aria-label="Anterior"
          onClick={() => scrollBy(-1)}
          className="hidden sm:grid absolute left-1 top-1/2 -translate-y-1/2 z-10 size-8 place-items-center rounded-full bg-card shadow-card hover:shadow-lift"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}
      {canRight && (
        <button
          type="button"
          aria-label="Próximo"
          onClick={() => scrollBy(1)}
          className="hidden sm:grid absolute right-1 top-1/2 -translate-y-1/2 z-10 size-8 place-items-center rounded-full bg-card shadow-card hover:shadow-lift"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
      <ul
        ref={scrollerRef}
        className="flex gap-3 pb-2 overflow-x-auto no-scrollbar scroll-smooth"
      >
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
