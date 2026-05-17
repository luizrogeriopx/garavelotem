import { Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/format";

export type BusinessCardData = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  whatsapp: string | null;
  neighborhood: string | null;
  is_verified: boolean;
};

export function BusinessCard({ b }: { b: BusinessCardData }) {
  return (
    <article className="bg-card rounded-2xl shadow-card overflow-hidden group">
      <Link to="/empresa/$slug" params={{ slug: b.slug }} className="block">
        <div className="relative aspect-[16/10] bg-muted overflow-hidden">
          {b.cover_url ? (
            <img
              src={b.cover_url}
              alt={b.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : null}
          {b.is_verified && (
            <span className="absolute top-3 right-3 bg-highlight text-highlight-foreground text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-soft">
              <BadgeCheck className="size-3" /> PRO
            </span>
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {b.logo_url && (
            <img
              src={b.logo_url}
              alt=""
              className="size-10 rounded-xl object-cover -mt-8 ring-2 ring-card shadow-card bg-card"
            />
          )}
          <div className="flex-1 min-w-0">
            <Link to="/empresa/$slug" params={{ slug: b.slug }}>
              <h3 className="font-semibold text-sm truncate flex items-center gap-1">
                {b.name}
                {b.is_verified && <BadgeCheck className="size-3.5 text-highlight" />}
              </h3>
            </Link>
            {b.short_description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{b.short_description}</p>
            )}
            {b.neighborhood && (
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="size-3" /> {b.neighborhood}
              </p>
            )}
          </div>
        </div>
        <a
          href={whatsappLink(b.whatsapp, `Olá! Vi a ${b.name} no Garavelo Tem.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-whatsapp text-whatsapp-foreground text-xs font-semibold py-2 rounded-xl active:scale-[0.98] transition-transform"
        >
          <MessageCircle className="size-4" />
          Chamar no WhatsApp
        </a>
      </div>
    </article>
  );
}
