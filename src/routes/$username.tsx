import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageView } from "./empresa.$slug";

export const Route = createFileRoute("/$username")({
  component: UsernameBusinessPage,
});

function UsernameBusinessPage() {
  const { username } = Route.useParams();
  const normalized = username.toLowerCase();
  const { data, isLoading } = useQuery({
    queryKey: ["business-by-username", normalized],
    queryFn: async () => {
      const { data } = await supabase
        .from("businesses")
        .select("*, plans(slug)")
        .eq("username", normalized)
        .maybeSingle();
      return data;
    },
  });

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-10 text-muted-foreground">Carregando...</div>;
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display font-extrabold text-2xl text-brand">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Não existe nenhuma empresa com o endereço <span className="font-mono">/{username}</span>.
        </p>
        <Link to="/" className="inline-block mt-6 text-sm font-semibold text-brand underline">
          Voltar para a página inicial
        </Link>
      </div>
    );
  }

  return <BusinessPageView business={data} />;
}
