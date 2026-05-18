import { Card } from "@/components/ui/card";
import { Landmark, Phone, MessageCircle, MapPin } from "lucide-react";

export type InstitutionCardData = {
  id: string;
  name: string;
  kind: string;
  description: string | null;
  address: string | null;
  neighborhood: string | null;
  phone: string | null;
  whatsapp: string | null;
  image_url: string | null;
};

const KIND_LABELS: Record<string, string> = {
  posto_saude: "Posto de saúde",
  hospital: "Hospital",
  cartorio: "Cartório",
  delegacia: "Delegacia",
  conselho_tutelar: "Conselho tutelar",
  bombeiros: "Bombeiros",
  escola: "Escola",
  prefeitura: "Prefeitura",
  outros: "Serviço público",
};

export function InstitutionCard({ i }: { i: InstitutionCardData }) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="aspect-[5/3] bg-muted relative">
        {i.image_url ? (
          <img src={i.image_url} alt={i.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full grid place-items-center"><Landmark className="size-8 text-muted-foreground" /></div>
        )}
        <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-brand text-brand-foreground px-2 py-0.5 rounded-full">
          {KIND_LABELS[i.kind] ?? i.kind}
        </span>
      </div>
      <div className="p-3 flex-1 flex flex-col gap-2">
        <p className="font-semibold leading-tight line-clamp-2">{i.name}</p>
        {i.description && <p className="text-xs text-muted-foreground line-clamp-2">{i.description}</p>}
        {(i.address || i.neighborhood) && (
          <p className="text-xs text-muted-foreground flex items-start gap-1">
            <MapPin className="size-3 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{[i.address, i.neighborhood].filter(Boolean).join(" · ")}</span>
          </p>
        )}
        <div className="mt-auto flex gap-2 pt-1">
          {i.phone && (
            <a href={`tel:${i.phone}`} className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold bg-muted hover:bg-muted/70 rounded-full py-2">
              <Phone className="size-3" /> Ligar
            </a>
          )}
          {i.whatsapp && (
            <a href={`https://wa.me/55${i.whatsapp}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold bg-[#25D366] text-white rounded-full py-2">
              <MessageCircle className="size-3" /> WhatsApp
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
