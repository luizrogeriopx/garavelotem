import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type MyBusiness = {
  id: string;
  name: string;
  slug: string;
  username: string | null;
  logo_url: string | null;
  is_platform: boolean;
};

export function useMyBusinesses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-businesses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,slug,username,logo_url,is_platform")
        .eq("owner_id", user!.id)
        .eq("status", "approved");
      if (error) throw error;
      return (data ?? []) as MyBusiness[];
    },
  });
}
