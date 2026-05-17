import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Plus, Store, CheckCircle2, Clock, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/conta")({
  component: AccountPage,
});

function AccountPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: businesses, isLoading } = useQuery({
    queryKey: ["my-businesses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, slug, status, logo_url, is_verified")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-highlight">Minha conta</p>
          <h1 className="font-display font-extrabold text-2xl text-brand">Olá, {user?.user_metadata?.full_name || user?.email}</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={async () => { await signOut(); navigate({ to: "/" }); }}
        >
          <LogOut className="size-4" /> Sair
        </Button>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display font-bold text-lg">Minhas empresas</h2>
        <Button asChild size="sm" className="bg-highlight hover:bg-highlight/90 text-highlight-foreground rounded-full">
          <Link to="/minha-empresa">
            <Plus className="size-4" /> Cadastrar empresa
          </Link>
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && businesses?.length === 0 && (
          <Card className="p-6 text-center">
            <Store className="size-10 mx-auto text-muted-foreground" />
            <p className="font-semibold mt-3">Você ainda não cadastrou nenhuma empresa</p>
            <p className="text-sm text-muted-foreground mt-1">Comece agora e apareça para milhares de moradores do Garavelo.</p>
            <Button asChild className="mt-4 rounded-full bg-brand text-brand-foreground">
              <Link to="/minha-empresa">Cadastrar minha empresa</Link>
            </Button>
          </Card>
        )}
        {businesses?.map((b) => (
          <Card key={b.id} className="p-4 flex items-center gap-3">
            <div className="size-12 rounded-xl bg-muted overflow-hidden grid place-items-center">
              {b.logo_url ? <img src={b.logo_url} alt={b.name} className="size-full object-cover" /> : <Store className="size-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold truncate">{b.name}</p>
                <StatusBadge status={b.status} />
              </div>
              <p className="text-xs text-muted-foreground truncate">/{b.slug}</p>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/minha-empresa">Editar</Link>
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1"><CheckCircle2 className="size-3" /> Aprovada</Badge>;
  if (status === "rejected") return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 gap-1"><XCircle className="size-3" /> Recusada</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 gap-1"><Clock className="size-3" /> Em análise</Badge>;
}
