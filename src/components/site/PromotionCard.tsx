import { MessageCircle } from "lucide-react";
import { formatBRL, whatsappLink } from "@/lib/format";

export type PromotionCardData = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  original_price_cents: number | null;
  price_cents: number | null;
  discount_percent: number | null;
  businesses: { name: string; whatsapp: string | null; slug: string } | null;
};

export function PromotionCard({ p }: { p: PromotionCardData }) {
  return (
    <article className="bg-card rounded-2xl shadow-card overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {p.image_url && (
          <img src={p.image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
        )}
        {p.discount_percent ? (
          <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-black px-2 py-1 rounded-md shadow-lift">
            -{p.discount_percent}% OFF
          </span>
        ) : null}
      </div>
      <div className="p-4 flex flex-col flex-1">
        {p.businesses && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-highlight">
            {p.businesses.name}
          </span>
        )}
        <h3 className="font-semibold text-sm mt-1 line-clamp-2">{p.title}</h3>
        {(p.price_cents || p.original_price_cents) && (
          <div className="flex items-baseline gap-2 mt-2">
            {p.price_cents != null && (
              <span className="text-lg font-bold text-brand">{formatBRL(p.price_cents)}</span>
            )}
            {p.original_price_cents != null && p.original_price_cents !== p.price_cents && (
              <span className="text-xs text-muted-foreground line-through">
                {formatBRL(p.original_price_cents)}
              </span>
            )}
          </div>
        )}
        <a
          href={whatsappLink(
            p.businesses?.whatsapp,
            `Olá! Tenho interesse na promoção "${p.title}" no Garavelo Tem.`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto pt-3 w-full inline-flex items-center justify-center gap-2 bg-brand text-brand-foreground text-xs font-semibold py-2 rounded-xl active:scale-[0.98] transition-transform"
        >
          <MessageCircle className="size-4" />
          Pedir no WhatsApp
        </a>
      </div>
    </article>
  );
}
