import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const STYLE_ID = "app-custom-css";

export function CustomCssInjector() {
  useEffect(() => {
    let active = true;

    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "custom_css")
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const css = data?.value ?? "";

        let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
        if (!style) {
          style = document.createElement("style");
          style.id = STYLE_ID;
          // Insere no TOPO do <head> para carregar antes dos demais estilos
          document.head.prepend(style);
        }
        style.textContent = css;
      });

    return () => {
      active = false;
    };
  }, []);

  return null;
}
