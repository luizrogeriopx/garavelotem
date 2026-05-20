import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, MessageCircle, Share2, Clock } from "lucide-react";
import { VerifiedBadge } from "@/components/site/VerifiedBadge";
import { whatsappLink } from "@/lib/format";
import { BusinessFeed } from "@/components/site/BusinessFeed";
import { BusinessReviews } from "@/components/site/BusinessReviews";
import { FollowButton } from "@/components/site/FollowButton";

export const Route = createFileRoute("/empresa/$slug")({
  component: BusinessPage,
});

function BusinessPage() {
  const { slug } = Route.useParams();
  const { data: b } = useQuery({
    queryKey: ["business", slug],
    queryFn: async () => {
      const { data } = await supabase.from("businesses").select("*, plans(slug)").eq("slug", slug).maybeSingle();
      return data;
    },
  });

  if (!b) return <div className="max-w-4xl mx-auto px-4 py-10 text-muted-foreground">Carregando...</div>;
  return <BusinessPageView business={b} />;
}

export function BusinessPageView({ business: b }: { business: any }) {
  const hours = (b.hours ?? {}) as Record<string, unknown>;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="relative aspect-[5/2] md:aspect-[16/5] bg-muted">
        {b.cover_url && <img src={b.cover_url} alt={b.name} className="w-full h-full object-cover" />}
      </div>
      <div className="px-4 relative">
        {b.logo_url && (
          <img
            src={b.logo_url}
            alt=""
            className="size-20 rounded-2xl ring-4 ring-background object-cover bg-card -mt-10 relative"
          />
        )}
        <div className="mt-3">
          <h1 className="font-display font-extrabold text-2xl text-brand flex items-center gap-2">
            {b.name}
            {b.is_verified && <VerifiedBadge className="size-5" />}
          </h1>
          {b.neighborhood && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="size-3.5" /> {b.neighborhood}
            </p>
          )}
        </div>

        {b.short_description && <p className="mt-4 text-sm">{b.short_description}</p>}
        {b.description && <p className="mt-2 text-sm text-muted-foreground">{b.description}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
          <a
            href={whatsappLink(b.whatsapp, `Olá! Vi a ${b.name} no Garavelo Tem.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-whatsapp text-whatsapp-foreground font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 col-span-2"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
          {b.phone && (
            <a href={`tel:${b.phone}`} className="bg-card shadow-card font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2">
              <Phone className="size-4" /> Ligar
            </a>
          )}
          <button className="bg-card shadow-card font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2">
            <Share2 className="size-4" /> Compartilhar
          </button>
          <FollowButton businessId={b.id} />
        </div>

        {b.address && (
          <section className="mt-8">
            <h2 className="font-display font-bold text-lg text-brand">Endereço</h2>
            <p className="text-sm text-muted-foreground mt-1">{b.address} — {b.neighborhood}, {b.city}/{b.state}</p>
            {(() => {
              const query = encodeURIComponent(`${b.address}, ${b.neighborhood}, ${b.city} - ${b.state}`);
              const hasCoords = b.lat != null && b.lng != null;
              const ll = hasCoords ? `${b.lat},${b.lng}` : null;
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
              const wazeUrl = ll
                ? `https://waze.com/ul?ll=${ll}&navigate=yes`
                : `https://waze.com/ul?q=${query}&navigate=yes`;
              const uberUrl = ll
                ? `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${b.lat}&dropoff[longitude]=${b.lng}&dropoff[nickname]=${encodeURIComponent(b.name)}`
                : `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[nickname]=${encodeURIComponent(b.name)}&dropoff[formatted_address]=${query}`;
              const btn = "shadow-card text-sm font-semibold px-3 py-2 rounded-full inline-flex items-center justify-center gap-2 whitespace-nowrap bg-card";
              return (
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={btn}>
                    <MapPin className="size-4" /> Google Maps
                  </a>
                  <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className={btn}>
                    <MapPin className="size-4" /> Waze
                  </a>
                  <a href={uberUrl} target="_blank" rel="noopener noreferrer" className={btn}>
                    Uber
                  </a>
                </div>
              );
            })()}
          </section>
        )}

        {(() => {
          const plan = (b as any).plans?.slug;
          const gallery = (Array.isArray(b.gallery) ? (b.gallery as string[]) : []).filter(Boolean);
          return (
            <>
              {gallery.length > 0 && (
                <section className="mt-8">
                  <h2 className="font-display font-bold text-lg text-brand">Galeria</h2>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {gallery.map((url, i) => (
                      <img key={i} src={url} alt="" className="aspect-square w-full object-cover rounded-lg bg-muted" />
                    ))}
                  </div>
                </section>
              )}
              {plan === "pro" && <BusinessFeed businessId={b.id} />}
            </>
          );
        })()}

        {(() => {
          const DAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
          const DAY_LABELS: Record<string, string> = {
            sun: "Domingo", mon: "Segunda", tue: "Terça", wed: "Quarta",
            thu: "Quinta", fri: "Sexta", sat: "Sábado",
          };
          const entries = DAY_ORDER
            .filter((d) => d in hours)
            .map((d) => {
              const h = hours[d];
              let text = "";
              if (typeof h === "string") {
                text = h;
              } else if (h && typeof h === "object") {
                const o = h as { closed?: boolean; open?: string; close?: string };
                text = o.closed ? "Fechado" : `${o.open ?? ""} - ${o.close ?? ""}`;
              }
              return { d, label: DAY_LABELS[d], text };
            });
          if (entries.length === 0) return null;
          return (
            <section className="mt-8">
              <h2 className="font-display font-bold text-lg text-brand flex items-center gap-2"><Clock className="size-4" /> Horários</h2>
              <ul className="mt-2 text-sm">
                {entries.map(({ d, label, text }) => (
                  <li key={d} className="flex justify-between py-1 border-b border-border last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })()}

        <BusinessReviews businessId={b.id} />
      </div>
    </div>
  );
}
