import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function CustomCssInjector() {
  const [css, setCss] = useState("");

  useEffect(() => {
    let active = true;
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "custom_css")
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.value) setCss(data.value);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!css) return null;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
