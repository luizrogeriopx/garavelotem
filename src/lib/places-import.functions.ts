import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

function getKeys() {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GOOGLE_MAPS_API_KEY =
    process.env.GOOGLE_MAPS_API_KEY_1 || process.env.GOOGLE_MAPS_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");
  if (!GOOGLE_MAPS_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY não configurada");
  return { LOVABLE_API_KEY, GOOGLE_MAPS_API_KEY };
}

function formatGooglePlacesError(status: number, body: string) {
  try {
    const parsed = JSON.parse(body) as {
      error?: { status?: string; message?: string; details?: Array<{ reason?: string; metadata?: { activationUrl?: string } }> };
    };
    const activationUrl = parsed.error?.details?.find((detail) => detail.metadata?.activationUrl)?.metadata?.activationUrl;
    const reason = parsed.error?.details?.find((detail) => detail.reason)?.reason;
    if (status === 403 && reason === "API_KEY_SERVICE_BLOCKED") {
      return [
        "A chave do Google Maps está bloqueando o uso da Places API (New).",
        "No Google Cloud, abra a chave de API usada na conexão e, em 'Restrições de API', adicione/permita 'Places API (New)' (places.googleapis.com).",
        "Confirme também que a Places API (New) está ativada e que o billing está habilitado no mesmo projeto da chave.",
      ].join(" ");
    }
    if (status === 403 && parsed.error?.status === "PERMISSION_DENIED") {
      return [
        "Places API (New) não está ativa na chave/projeto do Google Maps conectado.",
        "Ative a Places API (New) no Google Cloud, confirme que a cobrança está habilitada e aguarde alguns minutos.",
        activationUrl ? `Link de ativação: ${activationUrl}` : null,
      ]
        .filter(Boolean)
        .join(" ");
    }
  } catch {
    // Keep the fallback below when Google returns non-JSON errors.
  }
  return `Google Places falhou [${status}]: ${body}`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

type PlaceResult = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  location?: { latitude: number; longitude: number };
  primaryTypeDisplayName?: { text?: string };
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  rating?: number;
  userRatingCount?: number;
  addressComponents?: Array<{ longText: string; shortText: string; types: string[] }>;
};

export const searchPlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      query: z.string().min(2).max(200),
      lat: z.number().optional(),
      lng: z.number().optional(),
      radiusKm: z.number().min(0.5).max(50).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { LOVABLE_API_KEY, GOOGLE_MAPS_API_KEY } = getKeys();

    const body: Record<string, unknown> = {
      textQuery: data.query,
      languageCode: "pt-BR",
      regionCode: "BR",
      maxResultCount: 20,
    };
    if (data.lat && data.lng) {
      body.locationBias = {
        circle: {
          center: { latitude: data.lat, longitude: data.lng },
          radius: (data.radiusKm ?? 5) * 1000,
        },
      };
    }

    const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri,places.location,places.primaryTypeDisplayName,places.regularOpeningHours,places.rating,places.userRatingCount,places.addressComponents",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(formatGooglePlacesError(res.status, txt));
    }
    const json = (await res.json()) as { places?: PlaceResult[] };
    const places = json.places ?? [];

    // Check which already exist
    const ids = places.map((p) => p.id);
    const { data: existing } = ids.length
      ? await supabaseAdmin.from("businesses").select("google_place_id").in("google_place_id", ids)
      : { data: [] as { google_place_id: string | null }[] };
    const existingSet = new Set((existing ?? []).map((e) => e.google_place_id));

    return {
      results: places.map((p) => {
        const neighborhood =
          p.addressComponents?.find((c) => c.types.includes("sublocality") || c.types.includes("sublocality_level_1"))
            ?.longText ?? null;
        return {
          place_id: p.id,
          name: p.displayName?.text ?? "Sem nome",
          address: p.formattedAddress ?? null,
          phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
          website: p.websiteUri ?? null,
          lat: p.location?.latitude ?? null,
          lng: p.location?.longitude ?? null,
          category_hint: p.primaryTypeDisplayName?.text ?? null,
          neighborhood,
          hours: p.regularOpeningHours?.weekdayDescriptions ?? [],
          rating: p.rating ?? null,
          rating_count: p.userRatingCount ?? null,
          already_imported: existingSet.has(p.id),
        };
      }),
    };
  });

const ImportItem = z.object({
  place_id: z.string(),
  name: z.string().min(1),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  short_description: z.string().nullable().optional(),
});

export const importPlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ items: z.array(ImportItem).min(1).max(50) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    let imported = 0;
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const item of data.items) {
      // Skip duplicates
      const { data: dup } = await supabaseAdmin
        .from("businesses")
        .select("id")
        .eq("google_place_id", item.place_id)
        .maybeSingle();
      if (dup) {
        skipped.push(item.name);
        continue;
      }

      // Generate unique slug
      const base = slugify(item.name) || "empresa";
      let slug = base;
      let n = 1;
      while (true) {
        const { data: ex } = await supabaseAdmin
          .from("businesses")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (!ex) break;
        n += 1;
        slug = `${base}-${n}`;
        if (n > 50) break;
      }

      const { error } = await supabaseAdmin.from("businesses").insert({
        name: item.name,
        slug,
        google_place_id: item.place_id,
        address: item.address ?? null,
        phone: item.phone ?? null,
        whatsapp: item.phone ?? null,
        neighborhood: item.neighborhood ?? null,
        lat: item.lat ?? null,
        lng: item.lng ?? null,
        category_id: item.category_id ?? null,
        short_description: item.short_description ?? null,
        city: "Aparecida de Goiânia",
        state: "GO",
        entity_type: "pf",
        status: "pending",
        is_verified: false,
        owner_id: null,
      });
      if (error) {
        errors.push(`${item.name}: ${error.message}`);
      } else {
        imported += 1;
      }
    }

    return { imported, skipped, errors };
  });
