import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

type Banner = { id: string; title: string | null; image_url: string; link_url: string | null };

export function BannerCarousel() {
  const { data } = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("id,title,image_url,link_url")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
  });

  const banners = data ?? [];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (!banners.length) {
    return <div className="w-full aspect-[21/9] md:aspect-[3/1] rounded-3xl bg-muted animate-pulse" />;
  }

  return (
    <section className="relative">
      <div className="relative rounded-3xl overflow-hidden bg-brand">
        {banners.map((b, i) => (
          <a
            key={b.id}
            href={b.link_url ?? "#"}
            className={`block absolute inset-0 transition-opacity duration-700 ${
              i === idx ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <img src={b.image_url} alt={b.title ?? ""} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand/80 via-brand/20 to-transparent" />
            {b.title && (
              <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 right-4 max-w-lg">
                <span className="inline-block bg-yellow-soft text-brand text-[10px] font-black px-2 py-0.5 rounded mb-2">
                  PATROCINADO
                </span>
                <h2 className="text-brand-foreground text-xl md:text-3xl font-display font-extrabold leading-tight">
                  {b.title}
                </h2>
              </div>
            )}
          </a>
        ))}
        <div className="relative w-full aspect-[21/9] md:aspect-[3/1] pointer-events-none" />
      </div>
      {banners.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Banner ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-6 bg-highlight" : "w-2 bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
