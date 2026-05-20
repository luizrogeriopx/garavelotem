import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

const DEFAULTS = {
  pwa_name: "Garavelo Tem",
  pwa_short_name: "Garavelo Tem",
  pwa_description: "O guia comercial completo do Setor Garavelo.",
  pwa_theme_color: "#0B2545",
  pwa_background_color: "#0B2545",
  pwa_icon_url:
    "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/680fa4cf-cb95-416c-8f69-2ed500c45153/id-preview-1d3445ca--51a9a3b4-67ba-4af7-a2dc-904b06772fac.lovable.app-1779062112250.png",
};

export const Route = createFileRoute("/api/public/manifest")({
  server: {
    handlers: {
      GET: async () => {
        const settings = { ...DEFAULTS };
        try {
          const { data } = await (getSupabase().from("app_settings") as any)
            .select("key,value")
            .like("key", "pwa_%");
          if (data) {
            for (const row of data as Array<{ key: string; value: string }>) {
              if (row.value && row.key in settings) {
                (settings as any)[row.key] = row.value;
              }
            }
          }
        } catch (e) {
          // fall through to defaults
        }

        const manifest = {
          name: settings.pwa_name,
          short_name: settings.pwa_short_name,
          description: settings.pwa_description,
          theme_color: settings.pwa_theme_color,
          background_color: settings.pwa_background_color,
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: settings.pwa_icon_url,
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: settings.pwa_icon_url,
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        };

        return new Response(JSON.stringify(manifest), {
          status: 200,
          headers: {
            "Content-Type": "application/manifest+json",
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});
